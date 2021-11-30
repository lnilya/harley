from typing import Tuple, List

import numpy as np
import skimage
import skimage.filters
from matplotlib import pyplot as plt
from skimage.segmentation import watershed
from scipy import ndimage as ndi
import src.py.util.imgutil as imgutil
from src.py.modules.FociDetectionUtil.FociDetectorContourResult import FociDetectorContourResult
from src.py.util import shapeutil
from src.py.util.imgutil import addBorder
from src.py.util.shapeutil import getPolygonMaskPatch, addPatchOntoImage
from src.py.util.util import MplColorHelper


class FociDetectorContourParams:
    #Average size of Foci, 2x0 Array
    fociSize:np.ndarray

    #Normalization of image colors: 'unit' => 0-1
    normMethod:str

    def __init__(self, size = [2,8] , normMethod:str = 'unit' ):
        self.fociSize = np.array(size)
        self.normMethod = normMethod
    def getFociAreaBounds(self):
        return np.pi * self.fociSize**2

    def getFociLenBounds(self):
        return self.fociSize * np.pi * 2

class FociDetectorContour:

    def __init__(self,params:FociDetectorContourParams):
        self.__params = params
        self.debugTitle = 'FociDetectorContour'

    def __normImg(self,img,mask):
        if(self.__params.normMethod == 'unit'):
            minIntensity = img[mask].min()
            img = (img - minIntensity) / (img.max() - minIntensity)
            img[mask == False] = 0
        return img

    def __isPointInContour(self,p, cnt):
        return np.count_nonzero(skimage.measure.points_in_poly([p], cnt)) > 0

    def __plotResult(self,img, res:FociDetectorContourResult, mask):
        mch = MplColorHelper('jet', 0, 1)
        curv = skimage.filters.l(skimage.filters.sobel(img,mask))
        ax = imgutil.displayImageGrid([curv, img],['Image','Contours'],windowTitle=self.debugTitle)
        for i, (outer,seed) in enumerate(res.contours):
            if res.mergableContours[i] is not None:
                ax[0].plot(seed[:, 1], seed[:, 0], color=mch.get_rgb(0.4))
                ax[1].plot(seed[:, 1], seed[:, 0], color=mch.get_rgb(0.4))
            else:
                ax[0].plot(seed[:, 1], seed[:, 0], color=mch.get_rgb(0.8))
                ax[1].plot(seed[:, 1], seed[:, 0], color=mch.get_rgb(0.8))

            ax[0].plot(outer[:, 1], outer[:, 0], color=mch.get_rgb(0.2))
            ax[1].plot(outer[:, 1], outer[:, 0], color=mch.get_rgb(0.2))

    def __splitBlobsTopology(self,img, result:FociDetectorContourResult, contourIdx:int, debug = False):
        #somewhat ineffcient


        #generate binary mask to split
        outerMask,ox,oy = getPolygonMaskPatch(result.contours[contourIdx][0][:,1],result.contours[contourIdx][0][:,0],0)
        markers = np.zeros_like(outerMask,dtype='int')
        mask2 = np.ones_like(outerMask,dtype='bool')

        allInner = result.mergableContours[contourIdx] + [contourIdx]
        #generate starter markers from the inner contours
        k = 1
        for k,innerIdx in enumerate(allInner):
            c = np.mean(result.contours[innerIdx][1], axis=0)
            cr,cc = int(c[0]),int(c[1])
            markers[cr - oy,cc - ox] = k+1
            mask2[cr - oy,cc - ox] = False

        # distance transform wrt to the basin centers.
        distance = ndi.distance_transform_edt(mask2)
        distance[outerMask == False] = -1
        distance[distance == -1] = distance.max()

        # watershed
        labels = watershed(distance, markers)
        labels[outerMask == False] = 0

        k = 0


    def run(self, img, mask, debug = False):
        img = self.__normImg(img,mask)

        #add a small border to avoid contours lying on the edge and not being detected properly
        img = addBorder(img,1)

        level = np.linspace(img.max(), img.min(), 100)
        lenBounds = self.__params.getFociLenBounds()

        result = FociDetectorContourResult(img)

        #finding all closed contours
        for i, l in enumerate(level):
            #find all Contours that are closed at this level
            res = skimage.measure.find_contours(img, l)
            for cnt in res:
                #closed?
                if not np.all(cnt[0, :] == cnt[-1, :]): continue
                #too short or too long?
                len = shapeutil.contourLength(cnt)
                if lenBounds[0] > len or len > lenBounds[1]: continue

                #found the first contour
                if result.contours is None:
                    result.contours = [[None, cnt]]  # outer,inner/seed
                    result.levels = [[-1,l]]
                else:
                    foundSeeds = False
                    #check which seed contours this larger contour includes
                    for i, (outer,inner) in enumerate(result.contours):
                        if self.__isPointInContour(inner[0, :], cnt):
                            result.contours[i] = [cnt,inner]
                            result.levels[i][0] = l
                            foundSeeds = True
                    if not foundSeeds:
                        #this is a new contour, it isnt contained in any other, so add it as a new seed
                        result.contours += [[None, cnt]]
                        result.levels += [[-1,l]]

        result.discardSeedContoursWithoutOuter()
        result.analyzeMergableContours()
        # self.__splitBlobsTopology(img,result,2)
        if debug:
            mask = addBorder(mask,1).astype('bool')
            self.__plotResult(img,result,mask)

        return result