from typing import Tuple, List, Dict

import matplotlib.pyplot as plt
import numpy as np
from numpy import ndarray

import src.py.modules.CellFittingUtil as cf
import src.py.util.imgutil as imgutil


class DetectedCells:
    """
    Class Stores data for all detected Ellipses and uses deformation Algorithm to obtain their fits to borders
    Also contains debugging possibilities and such.
    """
    numEllipseBoundaryPoints = 60 #number of points of the approximated polygon
    numTrajSteps = 10 #number of trajectory steps
    pointInfluenceRange = 20
    trajStepSize = 4

    #Image Data
    skelImgWithBorder: ndarray #uint8 array that is 0 or 255, no borders
    srcImg: ndarray #float or any imshow image for the actual lightfield
    patches:List[Tuple[ndarray,int,int,ndarray]] #List of [image-patch:booleanarray, rdif,cdif, whitepixelcoordinates:Nx2 array]

    #Algorithm Parameters
    radBounds:Tuple[int,int]
    minPercBoundary:float

    #Ellipse Data (M = cell, N = num boundary points on each cell, K = num steps in trajectory paths)
    ellipseCenters:ndarray # M x 2 array of centers inside the _BORDERED_ Image
    ellipseCoords:ndarray # M x N x 2 array of ellipse Coordinates inside the _BORDERED_ Image
    ellipseParams:ndarray # M x 3 array of ellipse parameters a,b,rotation
    ellipseDeformTrajectories:ndarray # M x K x N x 2 storing trajectories for each point on a cell boundary as it gets deformed
    ellipseTrajectoryDistortion:ndarray # M x T Distortion for each cell after step t
    elRange:range #Range 0..numPoints for quick access in loops


    def __init__(self, skelImgWithBorder:np.ndarray, lightfieldImg:np.ndarray, ellipseCentersInBorderedImage:np.ndarray, radBounds:Tuple[int, int], minPercBoundary:float, abortSignal = None, progress = None):

        #These are for execution inside a thread to abort and indicate progress
        self.progressFun = progress
        self.abortSignal = abortSignal
        if progress is None: self.progressFun = self.__blankProgress
        if abortSignal is None: self.abortSignal = self.__blankAbort



        if skelImgWithBorder.dtype == 'bool':
            self.skelImg = skelImgWithBorder.astype('uint8') * 255
        elif skelImgWithBorder.dtype == 'uint8':
            self.skelImg = np.copy(skelImgWithBorder)
            self.skelImg[self.skelImg > 50] = 255

        self.srcImg = lightfieldImg
        self.ellipseCenters = ellipseCentersInBorderedImage

        self.radBounds = radBounds
        self.minPercBoundary = minPercBoundary
        self.elRange = range(0,len(self.ellipseCenters))

        self.ellipseCoords = np.zeros((len(self.ellipseCenters),self.numEllipseBoundaryPoints, 2))
        self.ellipseParams = np.zeros((len(self.ellipseCenters),3))
        self.ellipseDeformTrajectories = np.zeros((len(self.ellipseCenters),3))
        self.patches = None

        #calculate the ellipse polygon and parametric representation for eachpoint
        for i, p in enumerate(self.ellipseCenters):
            x,y,a,b,r = cf.analyzePatch(skelImgWithBorder, p, self.radBounds, 0,
                                              self.minPercBoundary, returnEllipse=True, numEllipseBoundaryPoints = self.numEllipseBoundaryPoints)

            self.ellipseCoords[i, :, 1] = x
            self.ellipseCoords[i, :, 0] = y
            self.ellipseParams[i, :] = [a,b,r]

    def __blankAbort(self): return False
    def __blankProgress(self,f): pass

    def forceFun(self,dist):
        ret = self.pointInfluenceRange - dist
        ret[ret < 0] = 0
        ret[ret > 0] = 1
        return ret
        #linear
        ret = (self.pointInfluenceRange - dist) / self.pointInfluenceRange
        ret[ret < 0] = 0
        return ret

    def showVectorFieldInPatch(self,patchNum:int):
        if self.patches is None: self.__generatePatches()
        pimg = self.patches[patchNum][0]
        rr,cc,fullVectorFieldR,fullVectorFieldC = cf.getBoundaryVectorfield(self.forceFun,pimg,stepsize=0.2)
        cf.visVectorField(pimg,rr,cc,fullVectorFieldR,fullVectorFieldC)

    def plotPatches(self,patchNums:List[int]):

        if self.patches is None: self.__generatePatches()
        if self.abortSignal(): return

        imgs = [self.patches[x][0] for x in patchNums]
        rs = [self.patches[x][1] for x in patchNums]
        cs = [self.patches[x][2] for x in patchNums]
        titles = ['Patch #%d' % x for x in patchNums]
        axes = imgutil.displayImageGrid(imgs,titles,windowTitle='Cell Patches Debug', callShow=False)
        for i,ax in enumerate(axes):
            if i >= len(imgs): break
            #plot original ellipse
            ax.plot(cs[i],rs[i],'r-')

            cell = patchNums[i]
            #plot deformations ellipse

            res = cf.getBoundaryForDeformFactor(self.ellipseDeformTrajectories[cell,:,:,:],
                                          self.ellipseTrajectoryDistortion[cell,:],
                                          np.linspace(0,1,3))

            ax.plot(res[0,:,1],res[0,:,0],'r-')
            ax.plot(res[1,:,1],res[1,:,0],'y--')
            ax.plot(res[2,:,1],res[2,:,0],'g-')

        plt.show()

    def debugPatchTrajectory(self,patchNum:int):
        patch, r, c,fr,fc = cf.setupPatchForEllipse(self.skelImg, self.ellipseCoords[patchNum, :, 0], self.ellipseCoords[patchNum, :, 1], 0,0.1)
        wp = np.stack(np.nonzero(patch), axis=1)
        elP = np.stack((r, c), axis=1)

        cf.defineBoundaryPointTrajectories2(self.forceFun, patch, elP, wp,True, numSteps=self.numTrajSteps,maxStepSize=self.trajStepSize)
        plt.show()

    def __generatePatches(self):
        self.progressFun(0)
        numP = len(self.ellipseCenters)
        self.ellipseTrajectoryDistortion = np.zeros((numP,self.numTrajSteps+1))
        self.ellipseDeformTrajectories = np.zeros((numP,
                                                   self.numTrajSteps+1,
                                                   self.numEllipseBoundaryPoints,
                                                   2))
        self.patches = []

        for i,p in enumerate(self.ellipseCenters):
            patch, r, c,fr,fc = cf.setupPatchForEllipse(self.skelImg, self.ellipseCoords[i, :, 0], self.ellipseCoords[i, :, 1], 0, 0.1)
            elP = np.stack((r,c),axis=1)
            nwp = np.stack(np.nonzero(patch),axis=1)
            self.patches += [(patch,fr,fc,nwp)]

            #generate trajectories for each patch
            elPTraj, totalDistortion = cf.defineBoundaryPointTrajectories2(self.forceFun, patch, elP,nwp,
                                                                          False,numSteps=self.numTrajSteps,maxStepSize=self.trajStepSize)
            self.ellipseDeformTrajectories[i,:,:,:] = elPTraj
            self.ellipseTrajectoryDistortion[i,:] = totalDistortion

            self.progressFun(i/numP)
            if self.abortSignal():
                return None


    def getCellPolygons(self,snappingFactor:float)->List[Dict]:
        """
        Returns polygons for the detected cells in image coordinates, snapped to their respective outlines by the snappingfactor [0;1]
        Snapping 1 will snapp fully to boundary, while 0 will keep it an ellipse
        Returns a list of dicts [{x:number[],y:number[]},{...},...]
        """
        if self.patches is None: self.__generatePatches()
        if self.abortSignal(): return None

        res = []
        for i in self.elRange:
            pos = cf.getBoundaryForDeformFactor(self.ellipseDeformTrajectories[i, :, :, :],
                                                self.ellipseTrajectoryDistortion[i, :],
                                                np.array([snappingFactor]))
            pos += np.array([self.patches[i][1],self.patches[i][2]]) #move to image coordinate system
            pos -= self.radBounds[1] #remove border influence

            res += [{'x':list(pos[:,1]),'y':list(pos[:,0])}]

        return res



    def getParametricEllipseArrayJS(self)->List[Dict]:
        """
        Retrieves a list of {x,y,a,b,rot} dicts representing each ellipse parametrically
        """
        ret = []
        for i in self.elRange:
            ret += [{'x': float(self.ellipseCenters[i,1] - self.radBounds[1]),
                                  'y': float(self.ellipseCenters[i,0] - self.radBounds[1]),
                                  'a': self.ellipseParams[i,0],
                                  'b': self.ellipseParams[i,1],
                                  'rot': self.ellipseParams[i,2]}]
        return ret