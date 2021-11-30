import math
from typing import Tuple, List

import cv2
import numpy as np
import scipy
import skimage.measure
import skimage.filters
from matplotlib import pyplot as plt
from numpy import ndarray
from scipy.ndimage import gaussian_laplace
from scipy.spatial import distance_matrix
from skimage.exposure import histogram
from skimage.feature import peak_local_max
from skimage.feature._hessian_det_appx import _hessian_matrix_det
from skimage.measure._regionprops import RegionProperties
from skimage.segmentation import active_contour, watershed
from scipy.interpolate import interpolate
from src.py.util.imgutil import displayImageGrid, setUpSubplot, addBorder
from src.py.util.util import tic, toc
from scipy import ndimage as ndi


class FociDetectorSmudgeResult:
    blobs: ndarray  # Nx4 array for r,c,rad,intensity coordinates of blobs
    tightMask: ndarray
    cellImg: ndarray
    basins:List[ndarray] #mask overlays containing basins, for ease of use.
    basinCoords:List[ndarray] #List of {x:[...],y:[...]} representing basin boundaries for each foci

    def __init__(self, blobs, mask,cellImg):
        self.blobs = blobs
        self.tightMask = mask
        self.cellImg = cellImg
        self.basinCoords = []
        self.basins = []

    def getBlobsAsListOfLists(self,ts, exceptionIDs = None, scale = None):
        if exceptionIDs is None:
            validBlobs = range(0,len(self.blobs))
        else:
            validBlobs = list(filter(lambda x: x not in exceptionIDs, range(0,len(self.blobs))))

        vBlobs = self.blobs[validBlobs,:]
        filtered:ndarray = vBlobs[vBlobs[:,3] > ts]
        if scale is not None:
            filtered[:,0:3] *= scale #mind scale which is 1px = 40nm for example

        return filtered.tolist()

class FociDetectorSmudgeParams:
    sigmaRange: Tuple[float, float, int]  # Sigmas for detection

    # For cells with a background signal the boundary of the cell itself will produce a high curvature
    # along the boundary, especially for big sigmas, since the boundary itself appears as a "blob" when looking at
    # high curvature. To deminish this effect, we can tighten the mask to the background signal and
    # then smudge the image from that tightened boundary. This produces better results
    enableSmudge: bool

    curvatureMethod: str  # doh or log

    # Smudging Parameters

    # number of pixels to erode into the image to get tighter to the boundary
    # The tightening is not always perfect, so eroding by a set amount of pixels into mask creates
    # a better smudging, since smudging needs to sit at peaks of curvature
    erodeIntoMask: int
    smudgeDecrease: float  # decrease in intensity with every dilation step. Keep close to 1

    # Detection Parameters

    # if 2 blobs overlap and the radius of one is overlapped by more than this factor
    # the weaker(intensity) blob will be elimenated
    localPeaksOverlap: float  # overlap of radiae of blobs that is allowed for blobs to be detected

    #During smudging the initial contour gets the average value of the mean of a few pixels around the point
    contourIntensityMask: int

    def __init__(self, sigmaRange: Tuple[float, float, int], erodeIntoMask=1, smudgeDecrease: float = 1, localPeaksOverlap=0.5, contourIntensityMask:int = 3, enableSmudge:bool = True, curvMethod:str = 'log'):
        self.curvatureMethod = curvMethod
        self.sigmaRange = sigmaRange
        self.erodeIntoMask = erodeIntoMask
        self.smudgeDecrease = smudgeDecrease
        self.localPeaksOverlap = localPeaksOverlap
        self.enableSmudge = enableSmudge
        self.contourIntensityMask = contourIntensityMask


class FociDetectorSmudge:
    __params: FociDetectorSmudgeParams
    debugTitle: str

    def __init__(self, params: FociDetectorSmudgeParams):
        self.__params = params
        self.debugTitle = 'Foci Detector'

    def __norm(self, v):
        return (v - v.min()) / (v.max() - v.min())

    def __closeGapsInMask(self, mask):
        r = skimage.measure.label(mask)
        reg = skimage.measure.regionprops(r)

        # take biggest region
        maxArea = -1
        bestBlob = None
        for i, r in enumerate(reg):
            if r.area > maxArea:
                maxArea = r.area
                bestBlob = r

        # contour = cv2.findContours(bestBlob.filled.astype('uint8') * 255, cv2.RETR_TREE, cv2.CHAIN_APPROX_NONE)[0][0]
        newMask = np.zeros_like(mask)
        newMask[bestBlob.slice[0], bestBlob.slice[1]] = bestBlob.filled_image
        return newMask

    def __otsu(self, img, mask):
        """
        Otsus threshhold for pixels inside the mask
        Args:
            img ():
            mask ():

        Returns:

        """
        counts, bin_centers = histogram(img[mask].ravel(), 255, source_range='image')
        counts = counts.astype('float')

        weight1 = np.cumsum(counts)
        weight2 = np.cumsum(counts[::-1])[::-1]
        # class means for all possible thresholds
        mean1 = np.cumsum(counts * bin_centers) / weight1
        mean2 = (np.cumsum((counts * bin_centers)[::-1]) / weight2[::-1])[::-1]

        # Clip ends to align class 1 and class 2 variables:
        # The last value of ``weight1``/``mean1`` should pair with zero values in
        # ``weight2``/``mean2``, which do not exist.
        variance12 = weight1[:-1] * weight2[1:] * (mean1[:-1] - mean2[1:]) ** 2

        idx = np.argmax(variance12)
        threshold = bin_centers[idx]

        return threshold

    def __tightenMaskOtsu(self, img: ndarray, mask: ndarray):
        """
        Retrieves a tightened mask using otsu threshhold
        Returns: A tightened binary mask
        """
        otsuThreshhold = self.__otsu(img, mask)
        newMask = np.logical_and(mask, img > otsuThreshhold)
        return self.__closeGapsInMask(newMask)

    def __smudgeBoundary(self, patch, mask, mode: str = 'whitemean'):

        # erode mask a little bit to get into the boundary more
        mask = scipy.ndimage.binary_erosion(mask, iterations=self.__params.erodeIntoMask)
        numRows = mask.shape[0]
        numCols = mask.shape[1]
        patch = np.copy(patch) #add a border for inital contour intensity computation

        patch[mask == False] = 0

        # contour are boundary pixels inside the mask
        contour = cv2.findContours(mask.astype('uint8') * 255, cv2.RETR_TREE, cv2.CHAIN_APPROX_NONE)[0][0]
        # contour pixels
        cpx = contour[:, 0, :]
        cr = cpx[:, 1]
        cc = cpx[:, 0]
        contourArea = np.zeros_like(patch)

        # image of contour with patchvalues
        # inital contour intensity computation. Each pixel on contour is average of a small mask around this point
        for i in range(0, len(cr)):
            r = cr[i]
            c = cc[i]
            # contourArea[r, c] = np.sum(patch[r - 1:r + 2, c - 1:c + 2]) / np.count_nonzero( patch[r - 1:r + 2, c - 1:c + 2])
            contourArea[r, c] = patch[r, c]
            # patch[r, c] = contourArea[r, c]

        maxDilate = max(patch.shape)

        for d in range(0, maxDilate):
            # image with a new outline
            nm = scipy.ndimage.binary_dilation(mask, iterations=1)
            dilatedArea = np.logical_xor(nm, mask)
            mask = nm
            # next contour
            ncr, ncc = np.nonzero(dilatedArea)

            if len(ncr) == 0:
                break
            dilatedArea = dilatedArea.astype('float32')
            # go through all pixels and grab a value of the contour
            for i in range(0, len(ncr)):
                r = ncr[i]
                c = ncc[i]

                rs = slice(max(r - 1, 0), min(r + 2, numRows))
                cs = slice(max(c - 1, 0), min(c + 2, numCols))
                if mode == 'whitemean':
                    nnz = np.count_nonzero(contourArea[rs, cs])
                    if nnz == 0: dilatedArea[r, c] = 0
                    else: dilatedArea[r, c] = self.__params.smudgeDecrease * np.sum(contourArea[rs, cs]) / nnz
                elif mode == 'max':
                    dilatedArea[r, c] = np.max(contourArea[rs, cs]) * self.__params.smudgeDecrease
                elif mode == 'mean':
                    dilatedArea[r, c] = np.mean(contourArea[rs, cs]) * self.__params.smudgeDecrease
                elif mode == 'min':
                    dilatedArea[r, c] = np.min(contourArea[rs, cs]) * self.__params.smudgeDecrease

                if dilatedArea[r,c] == np.nan or math.isnan(dilatedArea[r,c]):
                    k = 0

            patch += dilatedArea
            contourArea = dilatedArea

        return patch

    def __smudgeImageForSig(self, img, mask, sig: float, debug=False):
        """
        Different experiment in smudging, slower not better
        Args:
            img ():
            mask ():
            sig ():
            debug ():

        Returns:

        """

        # add a border for easier handling and ensuring that the boundary will always remain circular
        b = math.ceil(sig * 2)
        img = cv2.copyMakeBorder(img, b, b, b, b, cv2.BORDER_CONSTANT)
        erodedMask = cv2.copyMakeBorder(mask.astype('uint8') * 255, b, b, b, b, cv2.BORDER_CONSTANT)

        # erode mask a little bit to get into the boundary more
        erodedMask = scipy.ndimage.binary_erosion(erodedMask, iterations=self.__params.erodeIntoMask)
        erodedMask = erodedMask.astype('uint8') * 255
        cpinit = cv2.findContours(erodedMask, cv2.RETR_TREE, cv2.CHAIN_APPROX_NONE)[0][0][:, 0, :]
        if debug:
            shifts = []
            r = np.linspace(0, 0.9, 30)

        # METHOD 1: for each additional point find the nearest borderpoint

        newMask = scipy.ndimage.binary_dilation(erodedMask > 0, iterations=b).astype('uint8') * 255
        intensityAlongOldBoundary = img[cpinit[:, 1], cpinit[:, 0]]
        smoothIntensity = 0.1 * scipy.ndimage.gaussian_filter1d(intensityAlongOldBoundary, sig, mode='wrap')
        distFun = lambda x: 1 - x / ((1.4141 * b) ** 2)

        newCoords = np.array(np.nonzero(newMask - erodedMask)).transpose()

        newCoords = np.flip(newCoords, axis=1)  # to xy coordinates as boundary

        for i, n in enumerate(newCoords):
            d = cpinit - n
            allDist = np.sum(d ** 2, axis=1)
            ocp = int(np.argmin(allDist))
            mod = distFun(allDist[ocp])  # 1 at old boundary, 0 at new
            img[n[1], n[0]] = mod * intensityAlongOldBoundary[ocp] + (1 - mod) * smoothIntensity[ocp]

        # METHOD 2:
        # perform b eorsion steps, to get far away from the original boundary for the LoG to have no effect on it anymore
        # for i in range(0,b):
        #     # contour of currentBoundary
        #     cpold = cv2.findContours(erodedMask, cv2.RETR_TREE, cv2.CHAIN_APPROX_NONE)[0][0][:, 0, :]
        #     intensityAlongOldBoundary = img[cpold[:,1],cpold[:,0]]
        #     if debug:
        #         pos = np.floor(r * len(cpold)).astype('int')
        #         shifts += [cpold[pos,:]]
        #
        #     #dilate mask to create a new outer boundary
        #     erodedMask = scipy.ndimage.binary_dilation(erodedMask>0, iterations=1).astype('uint8') * 255
        #     cpnew = cv2.findContours(erodedMask, cv2.RETR_TREE, cv2.CHAIN_APPROX_NONE)[0][0][:, 0, :]
        #
        #     mapping = np.zeros((len(cpnew)))
        #     #find nearest point of old boundary in new boundary
        #     for i,n in enumerate(cpnew):
        #         d = cpold - n
        #         mapping[i] = np.argmin(np.sum(d**2, axis=1))
        #     mapping = mapping.astype('int')
        #     intensityAlongNewBoundary = intensityAlongOldBoundary[mapping]
        #
        #     #interpolate value of old boundary onto new boundary
        #     # intensityAlongNewBoundary = np.interp(np.linspace(0,len(cpold),len(cpnew)),range(0,len(cpold)),intensityAlongOldBoundary)
        #     img[cpnew[:,1],cpnew[:,0]] = intensityAlongNewBoundary * 0.9
        #

        if debug:
            setUpSubplot(1, 1, windowTitle=self.debugTitle + ' - Smudging Paths')
            plt.figure()
            plt.imshow(img)
            if len(shifts) > 0:
                shifts = np.array(shifts)
                for i, r in enumerate(r):
                    s = shifts[:, i, :]
                    plt.plot(s[:, 0], s[:, 1], 'r-')

            plt.plot(cpinit[:, 0], cpinit[:, 1], 'y:')

        return img[b:-b, b:-b]

    def __prunePeaks(self, peaks, mask):
        """
        Prunes peaks by measuring their overlap and given sufficient overlap
        removes the weaker of the peaks.
        Args:
            peaks (): N x 4 array of r,c,radius,intensity coordinates
            mask (): binary mask, peaks outside of it will be discarded

        Returns:
            a new array with overlapping peaks removed

        """

        # sort peaks by value, descending
        peaks = peaks[np.argsort(peaks[:, 3])[::-1], :]
        numPeaks = len(peaks)

        # discard local_maxima outside of boundary
        peakAccepted = mask[peaks[:,0].astype('int'),peaks[:,1].astype('int')]

        # find overlapping Peaks by starting at strongest peak and elimenating
        # weaker overlapping peaks
        for i in range(0, numPeaks):
            if not peakAccepted[i]: continue
            ri = peaks[i, 2]
            vi = peaks[i, 3]
            for j in range(i + 1, numPeaks):
                if not peakAccepted[j]: continue

                rj = peaks[j, 2]
                vj = peaks[j, 3]
                dist = peaks[i, 0:2] - peaks[j, 0:2]
                dist = np.sqrt(dist[0] ** 2 + dist[1] ** 2)
                if dist >= ri + rj: continue

                overlap = dist - ri - rj
                # check for sufficient overlap for elimenation
                if overlap < 0 or (overlap/min(ri,rj)) > self.__params.localPeaksOverlap:
                    # reject the weaker peak
                    if vi > vj:
                        peakAccepted[j] = False
                    else:
                        peakAccepted[i] = False

        return peaks[peakAccepted]


    def __detectContourFoci(self, img, mask, target = 0.8, maxSize:int = 20, minSize=3, debug=True):
        img = np.copy(img)
        img[mask == False] = 0
        fpsize = (minSize+1)
        if(fpsize%2 == 0): fpsize += 1
        maxima = peak_local_max(img, exclude_border = False, threshold_abs=0, footprint=np.ones((fpsize,fpsize)))

        #add the values
        intensities = (2**16 * img[maxima[:, 0], maxima[:, 1]]).astype('int')
        maxima = np.stack((maxima[:, 0], maxima[:, 1],intensities ), axis=1)
        #sort descending by intensity
        maxima = maxima[np.argsort(maxima[:, 2])[::-1], :]

        #get point distances
        # dist = distance_matrix(maxima,maxima,p=1)
        maxRad = maxSize
        foci = []
        border = maxRad
        bimg = addBorder(img,border)
        elimenationMask = np.zeros_like(bimg,dtype='int')
        #go from most probable points to lower points
        for i,p in enumerate(maxima):
            r,c,v = p
            if( r== 88 and c == 53):
                k = 0
            r += border
            c += border
            v = float(v) / 2**16 #norm back 0-1

            #this point has been already filled up by a foci with a higher max
            if elimenationMask[r,c] > 0 : continue

            #we want a dilation that goes adopts pixels from maxvalue to targetvalue, creating a blob around this maximum

            patch = bimg[r-maxRad:r+maxRad+1,c-maxRad:c+maxRad+1]
            boundMask = patch > v * target
            if np.count_nonzero(boundMask[0,:]) > 0 or np.count_nonzero(boundMask[-1,:]) > 0 or np.count_nonzero(boundMask[:,0]) > 0 or np.count_nonzero(boundMask[:,-1]) > 0:
                print('#%d discarded too diffuse' % i)
                continue

            # boundMask = np.logical_and(boundMask,elimenationMask[r-maxRad:r+maxRad+1,c-maxRad:c+maxRad+1] == 0)


            activePixels = [[maxRad,maxRad]]
            blob = np.zeros_like(patch, dtype=bool)
            blob[maxRad,maxRad] = True
            #Grow blob
            while len(activePixels) > 0:

                ar,ac = activePixels.pop()

                if ar > 0 and boundMask[ar-1,ac] and patch[ar,ac] >= patch[ar-1,ac] and not blob[ar-1,ac]:
                    blob[ar-1,ac] = True
                    activePixels += [[ar-1,ac]]
                if ac > 0 and boundMask[ar,ac-1] and patch[ar,ac] >= patch[ar,ac-1] and not blob[ar,ac-1]:
                    blob[ar,ac-1] = True
                    activePixels += [[ar,ac-1]]
                if ac < maxRad*2 and boundMask[ar,ac+1] and patch[ar,ac] >= patch[ar,ac+1] and not blob[ar,ac+1]:
                    blob[ar,ac+1] = True
                    activePixels += [[ar,ac+1]]
                if ar < maxRad*2 and boundMask[ar+1,ac] and patch[ar,ac] >= patch[ar+1,ac] and not blob[ar+1,ac]:
                    blob[ar+1,ac] = True
                    activePixels += [[ar+1,ac]]

            overlap = np.logical_and(blob,elimenationMask[r - maxRad:r + maxRad + 1, c - maxRad:c + maxRad + 1])
            if(np.count_nonzero(overlap) > 0):
                print('#%d discarded overlap'%i)
                continue

            lbl = skimage.measure.label(blob)

            # distance = ndi.distance_transform_edt(boundMask)
            # distance[distance < 0] = 0
            # mask = np.zeros(distance.shape, dtype=bool)
            # coords = peak_local_max(distance, footprint=np.ones((3, 3)), labels=boundMask)
            # mask[tuple(coords.T)] = True
            # markers, _ = ndi.label(mask)
            # lbl = watershed(-distance, markers, mask=boundMask)
            rps = skimage.measure.regionprops(lbl)
            corrReg = rps[0]
            #find region that contains the starting point
            # for i,region in enumerate(rps):
            #     if (lbl == i+1)[maxRad,maxRad]:
            #         corrReg = region
            #         break
            # else:
            #     k = 0
            #     continue

            #discard if correct region touches the boundary
            # if corrReg.bbox[0] == 0 or corrReg.bbox[1] == 0 or corrReg.bbox[2] == mask.shape[0] or corrReg.bbox[3] == mask.shape[1]:
            #     continue
            if corrReg.bbox[2]-corrReg.bbox[0] > maxSize or corrReg.bbox[3]-corrReg.bbox[1] > maxSize:
                print('#%d too big'%i)
                continue
            elif corrReg.bbox_area < minSize**2:
                print('#%d too small'%i)
                continue
            else:
                print('#%d used'%i)
                ebefore = np.copy(elimenationMask[r - maxRad:r + maxRad + 1, c - maxRad:c + maxRad + 1])
                #Foci detected. Eliminate other maxima withing this corrReg

                elimenationMask[r-maxRad+corrReg.bbox[0]:r-maxRad+corrReg.bbox[2],
                                c-maxRad+corrReg.bbox[1]:c-maxRad+corrReg.bbox[3]][corrReg.filled_image] = i+1
                # if i == 566:
                ax = displayImageGrid([patch, boundMask, blob,ebefore,elimenationMask[r - maxRad:r + maxRad + 1, c - maxRad:c + maxRad + 1] ],
                                      ['Patch','Bounds','Blob','E Before','E After'])
                [axx.plot(maxRad,maxRad,'rx') for axx in ax]
                k = 0

        bimg = bimg[border:-border,border:-border]
        elimenationMask = elimenationMask[border:-border,border:-border]

        ax = displayImageGrid([bimg,elimenationMask],cmaps='gray')
        ax[0].plot(maxima[:,1],maxima[:,0],'mx')

        #pruning of maxima by minSize
        #if 2 maxima are closer than minSize, the weaker is elimenated


        ax = setUpSubplot(1,2,'ContourFoci',['Maxima'])
        ax[0].imshow(img,cmap='gray')
        ax[0].plot(maxima[:,1],maxima[:,0],'mx')
        contours = []
        acceptedMaxima = []
        elimenatedMaxima = []
        # for i,m in maxima:
        #     patch =
        #     ln = skimage.measure.find_contours(patch, targetValue)


    def __growBlobToContourLine(self, img, r:RegionProperties, target = 0.5, maxGrowth = 0.5, debug=False):
        maxValue = img[r.slice[0],r.slice[1]].max()
        targetValue = maxValue * target

        cnt = cv2.findContours(r.filled_image.astype('uint8') * 255, cv2.RETR_TREE, cv2.CHAIN_APPROX_NONE)[0][0][:, 0,:]

        b = int((max(r.bbox[2] - r.bbox[0],r.bbox[3] - r.bbox[1]))*maxGrowth)
        patch = img[r.bbox[0]-b:r.bbox[2]+b,r.bbox[1]-b:r.bbox[3]+b]
        analyzedRs = range(0,patch.shape[0])
        analyzedCs = range(0,patch.shape[1])
        rr,cc = np.meshgrid(analyzedRs,analyzedCs)

        # ln = skimage.measure.find_contours(patch, targetValue)

        plt.figure()
        plt.imshow(patch,cmap='gray')
        # contours = plt.contour(cc,rr,patch.T,levels=[maxValue*0.2,maxValue*0.5,maxValue*0.6,maxValue*0.7,maxValue*0.8],colors=list('kmrbg'))
        contours = plt.contour(cc,rr,patch.T,levels=[targetValue],colors=list('kmrbg'))
        plt.plot(cnt[:, 0] +b , cnt[:, 1] +b, 'y:')
        # validContours = []
        # for cnt in ln[0]:
        #     d = cnt[0,:] - cnt[-1,:]
        #     if (d[0]**2 + d[1]**2) < 1:
        #         validContours += [cnt]
        #
        # return validContours

        #move each contour point along gradient direction


    def __detectBlobs(self, img, mask, debug=False):
        """
        Looks for peaks in the image given the sigma range using the blob_log function.
        Returns:
            The localmaxima array of [r,c,radius] and an array of the value of each Peak
            both sorted descending
        """
        sigmaList = np.linspace(*self.__params.sigmaRange)

        if self.__params.curvatureMethod == 'log':
            gl_images = [-gaussian_laplace(img, s) * s ** 2 for s in sigmaList]
        elif self.__params.curvatureMethod == 'doh':
            gl_images = [skimage.feature.hessian_matrix_det(img, s) for s in sigmaList]

        globalPeaks = None
        for i, glimg in enumerate(gl_images):

            # detect peaks for a single sigma inside the mask
            peaks = peak_local_max(glimg, exclude_border = False, labels=mask.astype('int'))
            if (len(peaks) == 0): continue


            # get values and radiae for these peaks
            vals = glimg[peaks[:, 0], peaks[:, 1]]
            sigmas = np.ones_like(vals) * sigmaList[i]
            peaks = peaks.astype('float')
            peaks = np.insert(peaks, 2, sigmas, axis=1)
            peaks = np.insert(peaks, 3, vals, axis=1)

            # append peaks to list
            if globalPeaks is None:
                globalPeaks = peaks
            else:
                globalPeaks = np.concatenate((globalPeaks, peaks))

        if globalPeaks is None:
            return []

        globalPeaks = self.__prunePeaks(globalPeaks, mask)

        # for glimg in gl_images: glimg[mask == False] = 0
        if debug:
            glImgSq = []
            peaks = []
            for i, gimg in enumerate(gl_images):
                gimgSq = gimg
                gimgSq[mask == False] = 0
                glImgSq += [gimgSq]
                # detect local peaks
                peaks += [peak_local_max(gimg, exclude_border = False, threshold_abs=0, footprint=np.ones((3, 3)))]
                # pick out global peaks that have this sigma

            ax = displayImageGrid(glImgSq, sigmaList, cmaps='gray',
                                  windowTitle=self.debugTitle + ' - LoG**2 for different Sigmas', vmin=0,
                                  vmax=np.max(glImgSq))

        return globalPeaks

    def run(self, img: ndarray, mask: ndarray, debug: bool = False,
            windowTitle: str = 'Foci Detector') -> FociDetectorSmudgeResult:
        self.debugTitle = windowTitle

        # normalize iamge such that portion of mask is 0-1
        minIntensity = img[mask].min()
        print('Norm: %.3f - %.3f'%(minIntensity,img.max()))
        img = (img - minIntensity) / (img.max() - minIntensity)
        img[mask == False] = 0

        # Tightening now happens in MaskShrink.py
        tightMask = mask

        # smuding along tightened mask
        # sm = self.__smudgeImageForSig(img,tightMask,4,False)

        smudgedImg = img
        if self.__params.enableSmudge:
            smudgedImg = self.__smudgeBoundary(img, tightMask)

        # detect blobs from skimage.feature.blob_log
        blobs = self.__detectBlobs(smudgedImg, tightMask, debug)

        if debug:
            contour = cv2.findContours(tightMask.astype('uint8') * 255, cv2.RETR_TREE, cv2.CHAIN_APPROX_NONE)[0][0]
            cpx = contour[:, 0, :]
            gRaw = skimage.filters.sobel(img, mask)
            gSmudged = skimage.filters.sobel(smudgedImg, mask)
            ax = displayImageGrid([img, smudgedImg, img, gRaw, gSmudged],
                                  ['Img and Tight Contour', 'Smudged', 'Res', 'Grad Raw', 'Grad Smudged'], callShow=False,
                                  windowTitle=windowTitle)
            ax[0].plot(cpx[:, 0], cpx[:, 1], 'y:')
            ax[3].plot(cpx[:, 0], cpx[:, 1], 'y:')
            ax[4].plot(cpx[:, 0], cpx[:, 1], 'y:')
            t = 0.15
            for i, b in enumerate(blobs):
                r, c, rad, strength = b
                if strength < t:
                    ci = plt.Circle((c, r), rad, color='r', linewidth=1, fill=False)
                else:
                    ci = plt.Circle((c, r), rad, color='g', linewidth=1, fill=False)
                    ax[2].annotate('#%d (%.2f)' % (i + 1, strength), (c, r), fontsize=8, c='g')

                ax[2].add_patch(ci)

        return FociDetectorSmudgeResult(blobs, tightMask, img)
