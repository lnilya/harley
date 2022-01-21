from typing import Tuple

import numpy as np
import skimage
import skimage.filters
import src.sammie.py.util.imgutil as imgutil
from src.py.modules.FociCandidatesUtil.ContourLoopsInCell import ContourLoopsInCell
from src.sammie.py.util import shapeutil
from src.sammie.py.util.util import MplColorHelper


class ContourLoopDetectorParams:
    #Average size of Foci, 2x0 Array
    lenBounds:np.ndarray

    def __init__(self, lenBounds:Tuple[int,int] , granularity:int = 100 ):
        """
        Parameters for Contour Loop detection
        Args:
            lenBounds (Tuple(int,int)): Desired circumference of inner loop and outer loop
            granularity (int): Contour Loops are analyzed by first finding all contours at this many levels and then picking out closed loops.
            Not overly critical but governs how close the shortest and longest contours will be to the desired size
        """
        self.lenBounds = np.array(lenBounds)
        self.granularity = granularity

    def getFociAreaBounds(self):
        return np.pi * self.lenBounds ** 2

#Finds loops of closed conoturs within a given range
class ContourLoopDetector:

    def __init__(self,params:ContourLoopDetectorParams):
        self.__params = params
        self.debugTitle = 'ContourLoopDetector'

    def __isPointInContour(self,p, cnt):
        return np.count_nonzero(skimage.measure.points_in_poly([p], cnt)) > 0

    def run(self, cellImg, debug = False)->ContourLoopsInCell:

        level = np.linspace(cellImg.max(), cellImg.min(), self.__params.granularity)

        result = ContourLoopsInCell(cellImg)

        #finding all closed contours
        for i, l in enumerate(level):
            #find all Contours that are closed at this level
            res = skimage.measure.find_contours(cellImg, l)
            for cnt in res:
                #closed?
                if not np.all(cnt[0, :] == cnt[-1, :]): continue
                #too short or too long?
                len = shapeutil.contourLength(cnt)
                if self.__params.lenBounds[0] > len or len > self.__params.lenBounds[1]: continue

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



        if debug:
            self.__plotResult(cellImg, result)

        return result