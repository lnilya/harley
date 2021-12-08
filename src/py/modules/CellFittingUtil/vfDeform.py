import math

import numpy as np
from matplotlib import pyplot as plt
from scipy.interpolate import interpolate

from src.sammie.py.util.imgutil import setUpSubplot


#Lienar function for applying force based on a max-distance
def forceFunLin(dist,maxDist):
    ret = (maxDist - dist)/maxDist
    ret[ret < 0] = 0
    return ret

# def forceFunLin2(dist,maxDist):
#     ret = (maxDist - dist)/maxDist
#     ret[ret < 0] = 0
#     return ret

def setupPatchForEllipse(thinnedImage,r,c,subtractBorder:int = 0, overshoot:float = 0.1):
    """
        Given Ellipse coordinates r,c, cuts out the appropriate patch out of the image
        and transforms r,c coordinates such that they are within the patch coordinate system.
        @param substractBorder will be removed from row
        overshoot: % to increase patch around r,c
    """

    # r and c in original unbordered coordinate system
    r -= subtractBorder
    c -= subtractBorder

    numElRows = r.max() - r.min()
    numElCols = c.max() - c.min()

    fromR = int(r.min() - overshoot * numElRows)
    fromC = int(c.min() - overshoot * numElCols)
    toR = int(r.max() + overshoot * numElRows)
    toC = int(c.max() + overshoot * numElCols)

    r -= fromR
    c -= fromC

    return [thinnedImage[fromR:toR, fromC:toC],r,c,fromR,fromC]


def visVectorField(patch,rr,cc,uu,vv):
    """
        Visualizes the directions and magnitudes of the vectorfield given by x,y,u,v meshgrid coordinates
    """
    vfr = interpolate.interp2d(rr[0, :], cc[:, 0], uu)
    vfc = interpolate.interp2d(rr[0, :], cc[:, 0], vv)
    prs = range(0,patch.shape[0])
    pcs = range(0,patch.shape[1])
    pprs, ppcs = np.meshgrid(prs,pcs)
    vrs = vfr(prs,pcs)
    vcs = vfc(prs,pcs)
    heatmap = np.sqrt(vrs**2 + vcs**2)
    ax = setUpSubplot(1,2,'Vectorfield',['Direction','Strength'],False)
    ax[1].imshow(heatmap.transpose(),cmap='jet')

    prs = range(0, patch.shape[0],6)
    pcs = range(0, patch.shape[1],6)
    pprs, ppcs = np.meshgrid(prs, pcs)
    vrs = vfr(prs, pcs)
    vcs = vfc(prs, pcs)
    ax[0].imshow(patch,cmap='gray')
    ax[0].quiver(ppcs,pprs,-vcs,vrs,color='green')

def getBoundaryVectorfieldInPoints(forcefun, points:np.ndarray,whitePixels = None, patch = None, plot:bool = False):
    """
    Will retrieve the force each whitepixel has on an array of points in the given patch
    """

    if whitePixels is None:
        whitePixels = np.stack(np.nonzero(patch),axis=1)

    fullVectorField = np.zeros_like(points)

    for i in range(0,len(whitePixels)):
        #calculate direction and distance to white pixel
        d = points - whitePixels[i,:]
        dist = np.sqrt(d[:,0]**2 + d[:,1]**2)

        #calculate the force each pixel has according to the distance based firceFunction
        force = forcefun(dist)
        d = force * d.transpose() / dist
        d = d.transpose()

        #add onto collective vectorfield
        fullVectorField += d

    #normalize field such that the longest vector has unit length
    maxDist = np.sqrt(fullVectorField[:,0] ** 2 + fullVectorField[:,1] ** 2).max()
    fullVectorField /= maxDist
    if plot:
        if patch is not None: plt.imshow(patch,cmap='gray')
        plt.plot(points[:,1],points[:,0],'r-')
        plt.quiver(points[:,1],points[:,0],-fullVectorField[:,1],fullVectorField[:,0],color='g')
    return fullVectorField

# Retrieves a subpixel vectorfield for white/boundary pixels in a patch of the thinned image.
# returns 2 meshgrid coordinates and 2 vectorfield components (same as quiver coordinates)
# now position can be found by interpolation or just nearest neighbor.
def getBoundaryVectorfield(forcefun, patch, stepsize = 0.25, plot:bool = False):
    vfrs = np.linspace(0,patch.shape[0],int(patch.shape[0]*stepsize))
    vfcs = np.linspace(0,patch.shape[1],int(patch.shape[1]*stepsize))
    #vector field subpixel grid
    rr,cc = np.meshgrid(vfrs,vfcs)

    fullVectorFieldR = np.zeros_like(rr)
    fullVectorFieldC = np.zeros_like(cc)

    #list of all white pixels in patch
    wprs,wpcs = np.nonzero(patch)

    for i in range(0,len(wprs)):
        #position of white pixel
        wpr = wprs[i]
        wpc = wpcs[i]

        #calculate direction and distance to white pixel
        dr = (rr - wpr)
        dc = (cc - wpc)
        dist = np.sqrt(dr**2 + dc**2)

        #calculate the force each pixel has according to the distance based firceFunction
        force = forcefun(dist)
        dr = force*dr/dist
        dc = force*dc/dist

        #add onto collective vectorfield
        fullVectorFieldR += dr
        fullVectorFieldC += dc

    #normalize field such that the longest vector has unit length
    maxDist = np.sqrt(fullVectorFieldR ** 2 + fullVectorFieldC ** 2).max()
    fullVectorFieldR /= maxDist
    fullVectorFieldC /= maxDist

    #plot
    if plot:
        plt.imshow(patch,cmap='jet')
        plt.quiver(cc,rr,-fullVectorFieldC,fullVectorFieldR,color='g')
    return [rr,cc,fullVectorFieldR,fullVectorFieldC]


def getBoundaryForDeformFactor(elPTraj,totalDist,trajPos:np.ndarray):
    """
    For a given trajectory of points (KxNx2) and trajPositions(T elements, 0-1)
    will retrieve the resulting trajectories as TxNx2 array.
    """
    stepsToEval = np.interp(trajPos, totalDist, range(0, len(totalDist)))
    res = np.zeros((len(trajPos),elPTraj.shape[1],elPTraj.shape[2]))
    for i,s in enumerate(stepsToEval):
        pFrom = math.floor(s)
        pTo = math.ceil(s)
        if pTo == pFrom:
            res[i,:,:] = elPTraj[pTo,:,:]
        else:
            fac = stepsToEval[i] - pFrom
            el = elPTraj[pTo,:, :] * fac + elPTraj[pFrom,:, :] * (1-fac)
            res[i,:,:] = el

    #return a 2D array if we are only looking at a single trajPos
    if len(trajPos) == 1:
        return res[0,:,:]

    #return a 3D array for each Traj Pos
    return res

def visBoundaryTrajectory(patch,elPTraj,totalDist):
    trajPos = np.linspace(0,1,6)
    stepsToEval = np.interp(trajPos,totalDist,range(0,len(totalDist)))
    trajPosStr = ['v = ' + str(x) for x in trajPos]
    ax = setUpSubplot(2,3,'Trajectory',trajPosStr,False)
    for i,a in enumerate(ax):
        a.imshow(patch,cmap='gray')
        pFrom = math.floor(stepsToEval[i])
        pTo = math.ceil(stepsToEval[i])
        if pTo == pFrom:
            a.plot(elPTraj[:,1,pTo],elPTraj[:,0,pTo],'r-')
        else:
            fac = stepsToEval[i] - pFrom
            el = elPTraj[:, :, pTo] * fac + elPTraj[:, :, pFrom] * (1-fac)
            a.plot(el[:,1],el[:,0],'r-')


def defineBoundaryPointTrajectories2(forceFun, patch,elP,patchWhitePixels:np.ndarray = None, plot:bool = False , numSteps = 10, maxStepSize = 5):
    """
    Same as defineBoundaryPointTrajectories but will not use the vectorfield, but rather estimate
    point distortion at each point of ellipse at a time.
    NOTE: estimating and normalizing the whole vectorfield gives different absolute strength of it, compared to only estimating the
    vf in points of the ellipse, since normalization in the latter case will happen for just the ellipse outlines. In that case things like stepsize might need to be changed.
    """
    elPTraj = np.zeros((numSteps + 1, elP.shape[0], 2))
    elPTraj[0, :, :] = elP
    totalDistortion = [0]
    for i in range(0, numSteps):
        dif = getBoundaryVectorfieldInPoints(forceFun,elPTraj[i, :, :], patchWhitePixels, patch, False)
        elPTraj[i + 1, :, :], dist = deformEllipsePixels(elPTraj[i, :, :], maxStepSize,
                                                         dif, patch, False)


        totalDistortion += [dist[2]]

    totalDistortion = np.cumsum(totalDistortion)
    totalDistortion /= totalDistortion[-1]
    if plot:
        ax = setUpSubplot(1, 2, 'Ellipse Deformation', ['Cumulated Normed Distortion', 'Ellipse Before and After'])
        ax[1].imshow(patch, cmap='gray')
        #plot trajectory for a few points along boundary
        for i in np.linspace(0, len(elP) - 1, int(len(elP) / 3)):
            p = math.floor(i)
            ax[1].plot(elPTraj[:, p,1], elPTraj[:, p,0], 'y--')
        ax[1].plot(elPTraj[0, :, 1], elPTraj[0, :, 0], 'r-')
        ax[1].plot(elPTraj[-1, :,1], elPTraj[-1, :, 0], 'g-')

        ax[0].plot(range(0, len(totalDistortion)), totalDistortion)
        ax[0].set_xlabel('step')

    return elPTraj, totalDistortion

def defineBoundaryPointTrajectories(patch,elP,vfrs, vfcs, vfpr,vfpc, plot:bool = False , numSteps = 10, maxStepSize = 5,patchWhitePixels:np.ndarray = None):
    """
    elP: ndarray N x 2
    Will deform an ellipse given by points elP slowly over numSteps and maxStepsize decreasing.
    Will return 1. elPTraj numsteps x N x 2 array of all points along distortion path
    and 2. a numsteps long array with the cumsum of total distortion. for approximating how much distortion is happening when

    To estimate distortion we need the vectorfield i.e. the influence of each white pixel onto a pixel of boundary. This can be fully calculated in advance and given
    by vfrs, vfcs (R/C x 1) arrays of rows and cols where field is known and vfpr and vfpc (R x C) with values for each R,C combination. These might be subpixel values that are
    used for nearest neighbor estimation.
    However calculating the vectorfield for the whole patch is rather slow. so if we pass None the vectorfields in each point are estimated as needed.
    however we need to do this every time a point is moved while using the precalculated vectorfield is faster. This totally depends on how many
    points are calculated n how many trajectory steps.
    """


    elPTraj = np.zeros((numSteps+1,elP.shape[0],2))
    elPTraj[0,:,:] = elP
    totalDistortion = [0]
    for i in range(0, numSteps):
        dif = np.zeros_like(elPTraj[i,:,:])
        # we find the nearest known vectorfield point for each point
        # and approximate the vectorfield in point p, by nearest neighbor
        for i in range(1, len(elP)):
            fr = np.argmin(np.abs(vfrs - elP[i, 0]))
            fc = np.argmin(np.abs(vfcs - elP[i, 1]))
            dif[i, :] = [vfpr[fc, fr], vfpc[fc, fr]]

        elPTraj[i+1,:,:], dist = deformEllipsePixels(elPTraj[i,:,:], maxStepSize * ((numSteps - i) / numSteps), vfrs, vfcs, vfpr, vfpc, patch, False)
        totalDistortion += [dist[2]]

    totalDistortion = np.cumsum(totalDistortion)
    totalDistortion /= totalDistortion[-1]
    if plot:
        ax = setUpSubplot(1,2,'Ellipse Deformation',['Cumulated Normed Distortion','Ellipse Before and After'])
        ax[1].imshow(patch,cmap='gray')
        # ax[1].plot(c, r, 'r-')
        ax[1].plot(elPTraj[:, 1,0], elPTraj[:, 0,0], 'r-')
        ax[1].plot(elPTraj[:, 1,-1], elPTraj[:, 0,-1], 'b-')
        for i in np.linspace(0,len(elP)-1,int(len(elP)/3)):
            p = math.floor(i)
            ax[1].plot(elPTraj[p, 1,:], elPTraj[p, 0,:], 'y--')

        ax[0].plot(range(0,len(totalDistortion)),totalDistortion)
        ax[0].set_xlabel('step')

    return elPTraj, totalDistortion


def deformEllipsePixels(elP, stepSize:float, dif:np.ndarray, patch = None, plot = False, resample:bool = True):
    """
    Moves a set of points(Nx2) along the directions described in dif(Nx2) (directions are normed 0-1)
    resample if set to true resulting boundary points will be linearly resampled along the boudnary, such
    that they remain equidistant to one another - this should create a somewhat smoother boundary
    but costs time.
    """
    dif *= stepSize

    #move elllipse
    elPNew = elP - dif

    #ensure first and last point move ins ame direction as middle between them, to maintain closeness
    lastPoint = (elPNew[0,:] + elPNew[-1,:])/2
    elPNew[0,:] = lastPoint
    elPNew[-1,:] = lastPoint

    #determine overall distortion
    #first we find the normal at point P as mean of the lines between P;P-1 and P;P+1
    #the point different along the normal is the distortion we measure for each point
    difPrev = elP - np.array([*elP[1:,:], elP[0,:]])
    normPrev = np.array([-difPrev[:, 1], difPrev[:, 0]]).transpose()
    difNext = np.array([elP[-1,:],*elP[0:-1,:]]) - elP
    normNext = np.array([-difNext[:, 1], difNext[:, 0]]).transpose()

    #create normal for point
    norm = (normNext + normPrev)/2

    #project distortion onto normal (normalize by normal length)
    distortionPerPoint = np.sum(norm * dif,axis=1) / np.sqrt(norm[:,0]**2 + norm[:,1]**2)
    distortionPerPoint[np.argwhere(np.isnan(distortionPerPoint))] = 0

    maxDistortion = np.max(np.abs(distortionPerPoint))
    meanDistortion = np.mean(np.abs(distortionPerPoint))
    totalDistortion = np.sum(np.abs(distortionPerPoint))

    if resample:
        #we resample elPNew such that the points are equidistant along the boundary.
        #1. get distance traveled along boundary dtab
        dif = elPNew - np.array([*elPNew[1:,:], elPNew[0,:]])
        dtab = np.sqrt(dif[:,0]**2 + dif[:,1]**2)
        dtab[-1] = dtab[0]
        dtab = np.cumsum(dtab)
        #2 resample x and y coordinates
        ir = np.interp(np.linspace(0,dtab[-1],len(elPNew)),
                                dtab,elPNew[:,0])
        ic = np.interp(np.linspace(0,dtab[-1],len(elPNew)),
                                dtab,elPNew[:,1])

        elPNew[:,0] = ir
        elPNew[:,1] = ic



    if plot:
        plt.imshow(patch,cmap='gray')
        plt.plot(elP[:,1],elP[:,0],'r-')
        plt.quiver(elP[:,1],elP[:,0],-dif[:,1],dif[:,0],color='g')
        plt.plot(elPNew[:,1],elPNew[:,0],'b-')
        plt.plot(elPNew[:,1],elPNew[:,0],'yx')
        plt.scatter(elP[:, 1], elP[:, 0], 20 * distortionPerPoint ** 2)
        # plt.plot(nC[-1],nR[-1],'xg')
        # plt.plot(nC[0],nR[0],'oy')
        # plt.plot(npc,npr,'dm')

    return elPNew,[maxDistortion,meanDistortion,totalDistortion]