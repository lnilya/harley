import math
from typing import Tuple, Callable

import cv2
import numpy as np
import scipy.ndimage
import skimage.measure
from scipy import ndimage
from scipy.interpolate import interpolate
from scipy.optimize import curve_fit
from skimage.feature import peak_local_max

from src.py.eeljsinterface import eeljs_sendProgress
from src.py.util.imgutil import setUpSubplot
import matplotlib.pyplot as plt

##FITTING FUNCTIONS

def poly(x, offset, a,b,c,d):
    return offset + a * x + b * x**2 + c * x**3 + d * x**4

def elFit(x, a, b,d):
    return a*b / np.sqrt(b*b*np.cos(x+d)**2 + a*a*np.sin(x+d)**2)
    # return b / np.sqrt(1 - (e*np.cos(x+d))**2 )

def sinFit(x, ampl, offset,freqOfset):
    return offset + ampl * np.cos((x - freqOfset))

##REP POINT PICKING FUNCTIONS

def pickNearestMeanAng(poi,angmax,angmin):
    poi_r = poi[np.argmin(poi[:, 0]), :]  # point with smallest radius in slice
    poi_t = (angmax + angmin) / 2  # center angle of bin
    return [poi_r[0], poi_t]

def pickNearest(poi,angmax,angmin):
    return poi[np.argmin(poi[:, 0]), :]  # point with smallest radius in slice

def pickMean(poi,angmax,angmin):
    poi_r = np.mean(poi[:, 0])
    poi_t = np.mean(poi[:, 1])
    return [poi_r,poi_t]  # point with smallest radius in slice

def findMaximaInHeatmap(heatmap:np.ndarray, threhshold = 0.1, maskSize = 3, minDist = 45):
    singlePixels = []
    maxMap = np.zeros_like(heatmap,dtype='bool')

    #finding local maxima as pixels that are talles inside a maskSize window
    for r in range(0,heatmap.shape[0]):
        for c in range(0,heatmap.shape[1]):
            if heatmap[r,c] <= threhshold: continue
            # if(heatmap[r - maskSize:r + maskSize + 1, c - maskSize:c + maskSize + 1].min() == 0):
            #     continue
            mv = heatmap[r-maskSize:r+maskSize+1, c-maskSize:c+maskSize+1].max()
            if(heatmap[r,c] == mv):
                maxMap[r,c] = True

    #extract single points and errors
    lbls = skimage.measure.label(maxMap,False)
    pos = np.zeros((lbls.max(),2))
    peakQuality = np.zeros((lbls.max(),1))
    for i in range(1,lbls.max()+1):
        nz = np.nonzero(lbls == i)
        pos[i-1,:] = np.mean(nz, axis=1)
        peakQuality[i-1] = heatmap[nz[0][0],nz[1][0]]

    minDist = minDist ** 2
    acceptedPoints = []
    #from these single points analyze nearest neighbours and kick out the ones with bigger error
    for i,p in enumerate(pos):
        q = peakQuality[i]
        dxy = (pos - p) ** 2
        sqdist = dxy[:, 1] + dxy[:, 0]
        neighbourIndices = np.nonzero(sqdist < minDist)
        tallest = True
        for n in neighbourIndices[0]:
            if n == i: continue
            if q < peakQuality[n]:
                tallest = False
                break
        if tallest:
            acceptedPoints.append(i)

    return [maxMap,pos.astype('int'),peakQuality,acceptedPoints]


def transformErrorsToScore(errs:np.ndarray):
    errs[errs == -1] = errs.max() * 1.1  # simply a value worse than max to ensure
    validPos = errs >= 0
    invalidPos = errs < 0
    minError = errs[validPos].min()
    maxError = errs.max()
    errs[validPos] = 1 - (errs[validPos] - minError) / (maxError - minError)
    errs[invalidPos] = 0
    return errs

#We dilate the skeleton so we get away at least rad away from it. Other areas will not be relevant
def makeProximityMask(skelImg, rad, minRad, fastmode = True):

    if fastmode:
        #Fastmodes creates a map of distance to skeleton and takes the absolute maxima
        #of this. Then it allows for scanning in a small area around these points
        #Reduces imensely the amount of scanned area, but it might lead to unscanned areas for noisy images.

        dt = ndimage.distance_transform_edt(skelImg == False)
        g = peak_local_max(dt, min_distance=minRad)

        binMask = np.zeros_like(skelImg).astype('bool')

        #remove Border points
        nonborder = np.logical_and(g[:,0] > minRad,g[:,1] > minRad)
        nonborder = np.logical_and(nonborder,g[:,0] < skelImg.shape[0] - minRad)
        nonborder = np.logical_and(nonborder,g[:,1] < skelImg.shape[1] - minRad)
        g = g[nonborder]
        accepted = []
        borderAroundCenters = minRad >> 1
        for peak in g:
            r,c = peak
            #too far away from border
            if dt[r,c] > rad: continue
            rs = slice(max(r - borderAroundCenters, 0), min(r + borderAroundCenters + 1, skelImg.shape[0]))
            cs = slice(max(c - borderAroundCenters, 0), min(c + borderAroundCenters + 1, skelImg.shape[1]))
            binMask[rs,cs] = True
            accepted += [peak]

        return binMask #, np.array(accepted)
    else:
        #Dilation method scans everywhere around the skeleton in rad radius

        binMask = scipy.ndimage.binary_dilation(skelImg,iterations=rad,structure=np.ones((3,3)))
        b = int(minRad)
        #cut off the border, since we cant have cells so close to the border anyway
        binMask[0:b,:] = False
        binMask[:,0:b] = False
        binMask[-minRad:,:] = False
        binMask[:,-minRad:] = False

    return binMask



def generateHeatMapFast(abortSig:Callable[[],bool], skelImg:np.ndarray, radRange:Tuple[int,int], minPercentageBoundary):
    candidates = makeProximityMask(skelImg,radRange[1],radRange[0],True)
    skelImg = cv2.copyMakeBorder(skelImg, radRange[1], radRange[1], radRange[1], radRange[1], cv2.BORDER_CONSTANT)
    candidates += radRange[1] # because of border
    heatmap = np.ones_like(skelImg) * -1
    numPoints = len(candidates)
    for i,c in enumerate(candidates):
        err, mb = analyzePatch(skelImg, (c[0], c[1]), radRange, 0, minPercentageBoundary)
        heatmap[c[0],c[1]] = err #get a score to be able to exclude them later, make sure minPercentageBoundary is met
        progress = i / numPoints
        if abortSig is not None:
            eeljs_sendProgress(progress)
        if abortSig is not None and abortSig():
            return None

    heatmap = heatmap[radRange[1]:-radRange[1], radRange[1]:-radRange[1]]
    heatmap = transformErrorsToScore(heatmap)
    return heatmap


def generateHeatMap(abortSig:Callable[[],bool], skelImg:np.ndarray, radRange:Tuple[int,int], minPercentageBoundary,stride, interpolation = 'linear', fastMode = False):

    suppressionMask = makeProximityMask(skelImg,radRange[1],radRange[0],fastMode)
    skelImg = cv2.copyMakeBorder(skelImg, radRange[1], radRange[1], radRange[1], radRange[1], cv2.BORDER_CONSTANT)

    maxR = skelImg.shape[0]-radRange[1]
    maxC = skelImg.shape[1]-radRange[1]
    progress = 0

    #Generate points where to evaluate the
    analyzedRs = range(0,skelImg.shape[0],stride)
    analyzedCs = range(0,skelImg.shape[1],stride)
    rr, cc = np.meshgrid(analyzedRs,analyzedCs)
    downscaledHeatmap = np.ones((len(analyzedRs), len(analyzedCs))) * -1
    numPoints = rr.shape[0] * rr.shape[1]
    donePoints = 0
    for p in range(0,len(rr)):
        rs = rr[p]
        cs = cc[p]
        for pp in range(0,len(rs)):
            donePoints += 1
            r = rs[pp]
            c = cs[pp]
            if r <= radRange[1] or c <= radRange[1] or r >= maxR or c >= maxC:
                continue
            elif suppressionMask[r-radRange[1],c-radRange[1]]:
                err, mb = analyzePatch(skelImg,(r,c),radRange,0,minPercentageBoundary)
                downscaledHeatmap[pp,p] = err
            else:
                continue

            #Listen to abort signal and cancel execution
            if abortSig is not None and abortSig():
                return None

        progress = donePoints / numPoints
        if abortSig is not None:
            eeljs_sendProgress(progress)
        else:
            print('Progress: %.2f%%'%(progress*100))

    # transform errors to 0-1 score
    downscaledHeatmap = transformErrorsToScore(downscaledHeatmap)

    # no interpolation needed if stride is 1 and we dont leave anything out
    if stride == 1:
        downscaledHeatmap = downscaledHeatmap[radRange[1]:-radRange[1], radRange[1]:-radRange[1]]
        return downscaledHeatmap

    #get interpolation for strided heatmap
    f = interpolate.interp2d(analyzedCs, analyzedRs, downscaledHeatmap, kind=interpolation)

    #create full heatmap out of interpolation
    heatmap = f(range(0,skelImg.shape[1]),range(0,skelImg.shape[0]))

    #for non-linear interpolation we need to rescale to make sure we are 0-1 still
    if interpolation != 'linear':
        heatmap[heatmap < 0] = 0
        heatmap = heatmap / heatmap.max()

    heatmap = heatmap[radRange[1]:-radRange[1], radRange[1]:-radRange[1]]


    return heatmap



def analyzePatch(skelImg:np.ndarray, pos:Tuple[int,int], radRange:Tuple[int,int], repPointMode=0, minPercOfBoundary:float = 0.8, numPolarBins = None, wtitle:str = 'Patch Analysis', debug:bool = False, returnEllipse:bool = False,
                 numEllipseBoundaryPoints:int=90):

    # we simply set the number of bins to a "reasonable" number spaced every 10 pixels on maximum periphery of approximated cell.
    #algorithm seems to be rather independent of this
    numPolarBins = int(2 * math.pi * radRange[1] / 10)

    pickFun = pickNearest
    if repPointMode == 0: pickFun = pickNearest
    elif repPointMode == 1: pickFun = pickNearestMeanAng
    elif repPointMode == 2: pickFun = pickMean

    #cut out a patch of the binary image
    patch = skelImg[pos[0] - radRange[1]:pos[0] + radRange[1],pos[1] - radRange[1]:pos[1] + radRange[1]]

    #transform white pixels into polar coordinates around the center
    y,x = np.nonzero(patch)
    y = y - patch.shape[0]/2
    x = x - patch.shape[1]/2
    r = np.sqrt(x**2 + y**2)
    t = np.arctan2(y,x)

    #filter out points that are below or above the radius Range
    inRadius = np.logical_and(r>=radRange[0],r<=radRange[1])
    r = r[inRadius]
    t = t[inRadius]

    #obtain pointset as an Nx2 array in polar coordinates around center
    allBoundaryPoints = np.array([r,t]).transpose()

    #Now we bin the polar axis and pick out a single points to represent the boundary.
    bins = np.linspace(-math.pi,math.pi,numPolarBins)[1:]
    bmin = -math.pi
    selBoundaryPoints = []
    missingBins = 0
    for bmax in bins:
        #extract points of interest
        poi = allBoundaryPoints[np.logical_and(allBoundaryPoints[:,1] >=bmin, allBoundaryPoints[:,1] <= bmax)]
        #if there are no points at this angle, we ignore that fraction of boundary
        if len(poi) > 0:
            selBoundaryPoints.append(pickFun(poi,bmax,bmin))
        else:
            missingBins += 1
        bmin = bmax

    #check if too many bins are missing, in that case not enough boundary can be detected and we discard
    #this point. Error returned is -1
    if 1-(missingBins / numPolarBins) < minPercOfBoundary:
        return [-1,(missingBins / numPolarBins)]

    #ppf contains all selected boundary points, through which to fit the curve
    selBoundaryPoints = np.array(selBoundaryPoints)

    #translate selected points back into cartesian coordinates
    x = selBoundaryPoints[:,0] * np.cos(selBoundaryPoints[:,1]) + patch.shape[1]/2
    y = selBoundaryPoints[:,0] * np.sin(selBoundaryPoints[:,1]) + patch.shape[0]/2

    if not debug:
        popt, pcov = curve_fit(elFit, selBoundaryPoints[:, 1], selBoundaryPoints[:, 0])
        selEstimatePoints = elFit(selBoundaryPoints[:,1], *popt)
        if returnEllipse:
            # return popt
            # if needed returns a plottable x-y array:
            slp = np.linspace(-math.pi, math.pi, numEllipseBoundaryPoints)
            slpr = elFit(slp, *popt)
            x = slpr * np.cos(slp) + pos[1]
            y = slpr * np.sin(slp) + pos[0]
            return [x,y,*popt]
        #calculate sum of squares error
        return [np.sum((selBoundaryPoints[:,0] - selEstimatePoints)**2)/len(selEstimatePoints),1-(missingBins / numPolarBins)]

    if debug:
        ax = setUpSubplot(1,2,wtitle,['Original','Polar'])
        ax[0].imshow(patch, cmap='gray')
        ax[0].scatter(x, y, c='red', marker='x')
        ax[1].scatter(t, r,marker='.')
        ax[1].scatter(selBoundaryPoints[:, 1], selBoundaryPoints[:, 0], c='red', marker='x')
        #curvefit a sine curve to the points we found for the periphery
        fits = ['ellipse']
        cols = ['y-']
        fitFun = [elFit]
        # fits = ['el','sin','poly_4']
        # cols = ['b-','g-','m-']
        # fitFun = [elFit,sinFit,poly]
        slp = np.linspace(-math.pi, math.pi, numEllipseBoundaryPoints)
        for i,ff in enumerate(fitFun):
            # start = time.time()
            popt,pcov = curve_fit(ff, selBoundaryPoints[:,1], selBoundaryPoints[:,0])
            # end = time.time()
            # print('Optimizing with %s: %dms' %(fits[i],end - start))
            slpr = ff(slp, *popt)
            x = slpr * np.cos(slp) + patch.shape[1] / 2
            y = slpr * np.sin(slp) + patch.shape[0] / 2
            ax[1].plot(slp, slpr, cols[i])
            ax[0].plot(x, y, cols[i])

        ax[1].legend(fits + ['all','sel'])

    return [-1,1-(missingBins / numPolarBins)]
