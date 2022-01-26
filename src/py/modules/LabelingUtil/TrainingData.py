from math import sqrt

import numpy as np
from typing import List

import skimage
from matplotlib.axes import Axes
from shapely.geometry import Polygon, Point
import matplotlib.pyplot as plt
from skimage.measure._regionprops import RegionProperties

from src.sammie.py.util import imgutil

#Class responsible for loading the TrainingData. = > Human labels and images of cells.
#Can also pickle everything for easier/faster loading next time.
from src.py.util.modelutil import getCutoffLevel
from src.sammie.py.util.shapeutil import getPolygonMaskPatch


class TrainingData:

    #N = Num images, M = num available contours per focis,
    imgs: List[np.ndarray] #N - List of images of cells as 0-1 normed grayscale numpy array
    contours: List[List[List[np.ndarray]]] # NxFxMxKx2 For each cell N and foci F, give a set of M contours as K x 2 numpy array coordinates
    contourLevels: List[List[List[float]]] #NxFxM For each cell N and foci F and conotur M give its grayscale value
    features: List[List[np.ndarray]] #NxFxM For each cell N and foci F and conotur M give its grayscale value

    def __init__(self):
        self.imgs = []
        self.features = []
        self.contours = []
        self.contourLevels = []

    def mergeContours(self,cellNum:int, levelIDs:List[int])->List[int]:
        """For a given cell and a set of chosen contours at level given by levelIDs will look if
        any of the contours can be merged. i.e. if there is a smaller (or equal) contour contained in another contour
        Returns the new levelIDs array, with -1 placed where a contour has been merge"""

        #No overlap if only one focus
        if len(levelIDs) <= 1: return levelIDs

        #Extract the contours in question
        cnts = [self.contours[cellNum][fociNum][fociLevel] for fociNum,fociLevel in enumerate(levelIDs) if fociLevel != -1]
        #Transform to shapely polygons
        poly:List[Polygon] = [Polygon(focus) for focus in cnts]

        newLevelIDs = levelIDs.copy();
        #Check for overlaps in these contours
        for i,p1 in enumerate(poly):
            for j,p2 in enumerate(poly):

                if j <= i: continue
                if newLevelIDs[i] == -1 or newLevelIDs[j] == -1: continue #one partner already elimenated

                #intersection is enough, since for closed contour loops it implies bigger contains smaller
                if p1.intersection(p2).area > 0:
                    if p1.area >= p2.area: #elimate p2
                        newLevelIDs[j] = -1
                    else: #elimate p1
                        newLevelIDs[i] = -1

        return newLevelIDs

    def getFociCenters(self,cellNum:int,fociNum:List[int]):
        contours = self.contours[cellNum]
        pos = np.zeros((len(fociNum),2))
        for i,f in enumerate(fociNum):
            cnt = contours[f][0]
            pos[i,:] = np.mean(cnt,axis = 0)

        return pos
    def identifySplitPartner(self,cellNum:int, fociNum:int):
        """For a given foci will look through other foci in cell and find those that overlap at a certain level"""
        levels = self.contourLevels[cellNum]
        contours = self.contours[cellNum]
        #find center of this focus
        fociCenter = np.mean(contours[fociNum][0],axis=0)
        c = Point(fociCenter)
        matches = []
        #Go through all foci and check if their outer contours contain the center
        for i in range(0,len(contours)):
            if i == fociNum: continue
            p = Polygon(contours[i][-1])
            if p.contains(c):
                matches += [i]

        return matches

    def showCell(self,cellNum:int,ax:Axes):
        img = self.imgs[cellNum]
        levels = self.contourLevels[cellNum]
        contours = self.contours[cellNum]
        ax.imshow(img,cmap='gray')
        for i in range(0,len(levels)):
            partners = self.identifySplitPartner(cellNum,i)
            c = 'g'
            if len(partners) > 0: c = 'b'
            imgutil.plotContour(ax, contours[i][0], c + '-')
            imgutil.plotContour(ax, contours[i][-1], c + ':')

    def extractCellFeatures(self,img, allLevels: List[List[float]], allContourSet: List[List[np.ndarray]]):

        """Extracts the features from the foci of a single cell"""

        imCenterRows, imCenterCols = img.shape[0] / 2, img.shape[1] / 2
        res = []
        for i, levels in enumerate(allLevels):
            contourSet = allContourSet[i]
            ff = self.__extractFociFeatures(img, levels, contourSet)

            # normalized distance to center
            r, c = np.mean(contourSet[0], axis=0)
            dr = abs(imCenterRows - r) / imCenterRows
            dc = abs(imCenterCols - c) / imCenterCols

            # add Cell-dependant features
            ff += [
                i / len(allLevels),  # brightness ranking inside the cell
                sqrt(dr ** 2 + dc ** 2)  # normalized distance to the center
            ]
            res += [ff]

        return res

    def __extractFociFeatures(self,img, levels: List[float], contourSet: List[np.ndarray]):
        b, cl = getCutoffLevel(np.array(levels), contourSet)

        # get foci mask
        binMaskOuter, offx, offy = getPolygonMaskPatch(contourSet[cl][:, 1], contourSet[cl][:, 0], 0)

        # get image region and analyze it, sometimes contour will be very slim and not capture any pixels.
        regCenter = None
        if min(binMaskOuter.shape) > 0:
            regCenter = skimage.measure.regionprops(binMaskOuter.astype('int'),
                                                                  img[offy:offy + binMaskOuter.shape[0],
                                                                  offx:offx + binMaskOuter.shape[1]])

        #A case that may happen with very very small narrow contour lopps (due to user settings) that contain
        #less than one pixel across, meaning that close to no pixels constitute the focus
        #Because of rounding errors the mask becomes all 0 and there is no area to analyze
        #in that case we simply return a 0 vector.
        if(regCenter is None or len(regCenter) == 0):
            return [0]*10
        else:
            regCenter = regCenter[0]
        # Feature vector
        return [
            regCenter.max_intensity / img.max(),
            regCenter.mean_intensity / img.max(),
            regCenter.min_intensity / img.max(),
            regCenter.area,
            regCenter.eccentricity,
            regCenter.solidity,
            regCenter.filled_area / (img.shape[0] * img.shape[1]),  # size in relation to whole cell
            levels[-1] / levels[0],
            b / levels[0],
            levels[0] - levels[-1],  # levels range
        ]

    def addCell(self,img:np.ndarray, foci, debug:bool = False, extractFeatures:bool = True ):
        self.imgs += [img]
        cnts = [[np.column_stack((cnt['y'], cnt['x'])) for cnt in f] for f in foci]
        lvls = [[cnt['lvl'] for cnt in f] for f in foci]
        self.contours += [cnts]
        self.contourLevels += [lvls]
        if debug:
            plt.imshow(img,'gray')
            for c in cnts:
                imgutil.plotContour(plt, c[0])
                imgutil.plotContour(plt, c[-1], 'r-')


        #extract the features for new cell and add to dataset
        if(extractFeatures):
            self.features += [self.extractCellFeatures(img, lvls, cnts)]

    def getFociPerCell(self):
        cells = range(0,len(self.features))
        return [len(self.features[c]) for c in cells]

    def getFlatFeatures(self):
        flatFeatures = []
        for f in self.features: flatFeatures += f
        return np.array(flatFeatures)

    def getCellsInLoadedDataset(self,cells:List[int]):
        imgs = [self.imgs[c] for c in cells]
        contours = [self.contours[c] for c in cells]
        levels = [self.contourLevels[c] for c in cells]

        return imgs, contours, levels


    def transformUserSplits(self, cellNum:int, contourChoices, splits):
        for hs in splits:  # all foci that were split
            partner = self.identifySplitPartner(cellNum, hs)  # get the split partners

            # Brightness Level the user chose for this to-be-split foci
            lvl = self.contourLevels[cellNum][hs][contourChoices[hs]]

            for p in partner:
                # brightness level of the partner focus
                lvlp = self.contourLevels[cellNum][p]
                # we need to find the index closest to lvl in the lvlp array, they will be close but usually not equal
                newChoice = np.argmin(np.abs(np.array(lvlp) - lvl))
                # add the additional contourchoice
                contourChoices[p] = newChoice

        return contourChoices