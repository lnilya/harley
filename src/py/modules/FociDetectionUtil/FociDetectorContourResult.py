import json
from typing import Tuple, List

import imageio
import numpy as np
import skimage
import src.py.util.imgutil as imgutil
from src.py.util import shapeutil
from src.py.util.util import MplColorHelper
from matplotlib import pyplot as plt


class FociDetectorContourResult:

    contours:List #list of Cx2 with outter and inner contours. inner sits inside outer.
    levels:List #list of Cx2, stores levels for inner and outer contours
    mergableContours:List #List with C elements, containining either None or indices of lists this list can be merged with.
    img:np.ndarray

    def __init__(self,img):
        self.img = img
        self.contours = None
        self.mergableContours = None
        self.levels = None

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
                    if np.count_nonzero(self.contours[2][0] != self.contours[3][0]) == 0:
                        if(self.mergableContours[i] is None):
                            self.mergableContours[i] = [j]
                        else:
                            self.mergableContours[i] += [j]

        k= 0
        # mergable now contains for each contour a set of other contours that can be merged together.

    def discardSeedContoursWithoutOuter(self):
        l = np.array(self.levels)
        validIDs = np.nonzero(l[:,0] > 0)[0]
        self.levels = l[validIDs]
        self.contours = [self.contours[i] for i in list(validIDs)]

    def exportClassificationData(self, path:str, filename:str, dataset:str, granularity:int = 10):
        jsonData = {'foci':self.getJSONContours(granularity),
                    'w':self.img.shape[1],
                    'h':self.img.shape[0],
                    'dataset':dataset}
        imageio.imsave(path + filename + '.png',self.img)
        with open(path + filename + '.json', 'w') as outfile:
            json.dump(jsonData, outfile)
        #store image
        imageio.imsave(path + filename + '.png',self.img)

    def minMaxPatchAround(self,cnt):
        rmin,rmax = int(min(cnt[:, 0]))-1, int(max(cnt[:,0])) + 1
        cmin,cmax = int(min(cnt[:, 1]))-1, int(max(cnt[:,1])) + 1

        rs = slice(max(rmin, 0), min(rmax + 1, self.img.shape[0]))
        cs = slice(max(cmin, 0), min(cmax + 1, self.img.shape[1]))
        return rs, cs, self.img[rs,cs]


    def getJSONContours(self, granularity:int = 10, debug = False):
        allFoci = []
        for i,(outer,inner) in enumerate(self.contours):
            lvl = np.linspace(self.levels[i,1],self.levels[i,0],granularity)
            rs,cs,patch = self.minMaxPatchAround(outer)

            checkPoint = [inner[0,:] - [rs.start,cs.start]]
            if debug:
                plt.imshow(patch,cmap='gray')
                plt.plot(outer[:, 1] - cs.start, outer[:, 0] - rs.start, 'b-')
                plt.plot(inner[:, 1] - cs.start, inner[:, 0] - rs.start, 'b-')
            fociRes = []
            for l in lvl:
                contours = skimage.measure.find_contours(patch, l)
                for cnt in contours:
                    # plt.plot(cnt[:, 1], cnt[:, 0], 'r-')
                    isClosed = np.all(cnt[0, :] == cnt[-1, :])
                    #found contour needs to contain the inner one
                    containsInner = np.count_nonzero(skimage.measure.points_in_poly(checkPoint, cnt)) > 0
                    if not isClosed or not containsInner :
                        if debug: plt.plot(cnt[:, 1], cnt[:, 0], 'r:')
                        continue


                    fociRes += [{'x':np.around((cnt[:,1] + cs.start),decimals=2).tolist(),
                                 'y':np.around((cnt[:,0] + rs.start),decimals=2).tolist(),
                                 'lvl':l}]
                    if debug: plt.plot(cnt[:, 1], cnt[:, 0], 'g:')

            allFoci += [fociRes]

        return allFoci
        #parse the fociRes