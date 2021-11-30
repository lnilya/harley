import json
from typing import Tuple, List

import imageio
import numpy as np
import skimage
import src.py.util.imgutil as imgutil
from src.py.util import shapeutil
from src.py.util.util import MplColorHelper
from matplotlib import pyplot as plt


class ContourLoopsInCell:

    contours:List #list of Cx2 with outter and inner contours. inner sits inside outer.
    levels:List #list of Cx2, stores levels for inner and outer contours
    mergableContours:List #List with C elements, containining either None or indices of lists this list can be merged with.
    img:np.ndarray

    def __init__(self, cellImg):
        self.img = cellImg
        self.contours = []
        self.mergableContours = []
        self.levels = []

    def __minMaxPatchAround(self,cnt):
        rmin,rmax = int(min(cnt[:, 0]))-1, int(max(cnt[:,0])) + 1
        cmin,cmax = int(min(cnt[:, 1]))-1, int(max(cnt[:,1])) + 1

        rs = slice(max(rmin, 0), min(rmax + 1, self.img.shape[0]))
        cs = slice(max(cmin, 0), min(cmax + 1, self.img.shape[1]))
        return rs, cs, self.img[rs,cs]
    def getJSLabelingContours(self, numLevelsPerFoci:int):
        """
        Sends all contours for all foci, for the user to be able to specify the exact contour they want
        Args:
            numLevelsPerFoci (int): The number of polygons to generate for each foci, simply governs how fine the user can set the boundary.
            The absolute levels are not accounted for, so sometimes the changes are minute if max and min levels differ onyl insignificantly
        Returns:
            A JSON capable dictionary corresponding to the JS SingleCellLabelingData datatype.
        """
        res = {'foci':[]}

        if self.contours is None or len(self.contours) == 0: return res

        for i, (outer, inner) in enumerate(self.contours):
            lvl = np.linspace(self.levels[i, 1], self.levels[i, 0], numLevelsPerFoci)
            rs, cs, patch = self.__minMaxPatchAround(outer)

            checkPoint = [inner[0, :] - [rs.start, cs.start]]
            fociRes = []
            for l in lvl:
                contours = skimage.measure.find_contours(patch, l)
                for cnt in contours:
                    # plt.plot(cnt[:, 1], cnt[:, 0], 'r-')
                    isClosed = np.all(cnt[0, :] == cnt[-1, :])
                    # found contour needs to contain the inner one
                    containsInner = np.count_nonzero(skimage.measure.points_in_poly(checkPoint, cnt)) > 0
                    if not isClosed or not containsInner:
                        continue

                    fociRes += [{'x': np.around((cnt[:, 1] + cs.start), decimals=3).tolist(),
                                 'y': np.around((cnt[:, 0] + rs.start), decimals=3).tolist(),
                                 'lvl': l}]

            res['foci'] += [fociRes]

        return res

    def getJSPreviewContours(self):
        """Sends the largest and shortest contours for the user to preview the effects of parameters"""
        res = {'fociMax':[],'fociMin':[]}
        res['fociMax'] = [{'x': c[0][:, 1].tolist(), 'y': c[0][:, 0].tolist()} for c in self.contours]
        res['fociMin'] = [{'x': c[1][:, 1].tolist(), 'y': c[1][:, 0].tolist()} for c in self.contours]
        return res

    def analyzeMergableContours(self):
        # by defintion if 2 contours can be merged, the outer contours will
        # be the same since they are limited only by length and this will be the same for both peaks
        # the peaks will be noted by the inner non-overlapping contours

        self.mergableContours = [None] * len(self.contours)
        for i,c1 in enumerate(self.contours):
            for j in range(0, len(self.contours)):
                if i == j: continue
                c2 = self.contours[j]
                # simple test for same number of points first and levels first
                if len(c2[0]) == len(c1[0]) and self.levels[i][0] == self.levels[j][0]:
                    # This is a candidate, test points. Probably testing one point would be enough, room for optimization.
                    if np.count_nonzero(c1[0] != c2[0]) == 0:
                        if(self.mergableContours[i] is None):
                            self.mergableContours[i] = [j]
                        else:
                            self.mergableContours[i] += [j]

        k= 0
        # mergable now contains for each contour a set of other contours that can be merged together.

    def substractFromAllContours(self, n:float):
        ""
    def discardSeedContoursWithoutOuter(self):
        if self.levels is None or len(self.levels) == 0:
            return
        l = np.array(self.levels)
        validIDs = np.nonzero(l[:,0] > 0)[0]
        self.levels = l[validIDs]
        self.contours = [self.contours[i] for i in list(validIDs)]