import math
from typing import List

import cv2
import numpy as np
import skimage.draw
import skimage.measure

from src.sammie.py.modules.ModuleBase import ModuleBase
from src.sammie.py.util import imgutil


class Thinning(ModuleBase):

    previewThinnedImage = None #For Frontend: Cache of the Transparent ColorImage displaying Threshholded areas
    previewThinnedImageWithGaps = None #For Frontend: Cache of the Transparent ColorImage displaying Threshholded areas
    thinnedImageWithGaps = None #Intermediary step
    thinnedImage = None #Output: Binary file


    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.log = 'Thinning'
        self.trace('initialized')
        self.runNumber = 0

    def checkPointConnectivity(self,r1, c1, r2, c2, gr1, gc1, maxDistSquared, gr2=None, gc2=None, ):
        dist = (r1 - r2) ** 2 + (c1 - c2) ** 2
        if dist > maxDistSquared: return False, None

        # check if p2 is above the plane defined by g1 and vice versa. e.g. gradients are showing towards the respective other point
        l1 = gr1 * (r2 - r1) + gc1 * (c2 - c1)
        if l1 < 0: return False, None

        if gr2 != None and gc2 != None:
            l2 = gr2 * (r1 - r2) + gc2 * (c1 - c2)
            if l2 < 0: return False, None

        # check if gradients' angle is close enough to 180deg
        # grDist = (gr1+gr2)**2 + (gc1+gc2)**2
        # if grDist > maxGradAdditionLenSq: continue #gradients not opposing enough within boundaries

        return True, dist

    # Will join a singlePixel point with the closes non-single-pixel line creating a T shaped junction
    def joinOpenTs(self,singlePixels, gradients, ignorePoints, thinnedImage, maxGap=30):
        maxGapSqr = maxGap ** 2

        joinCoordinates = []  # 4 x num connections [r1,c1,r2,c2]
        usedPoints = []  # num connections [p1,p2,p3...]
        p1 = -1

        for r1, c1 in singlePixels:
            p1 += 1
            if p1 in ignorePoints: continue

            gr1, gc1 = gradients[p1]
            # look at all pixels within a given distance
            searchArea = thinnedImage[r1 - maxGap:r1 + maxGap + 1, c1 - maxGap:c1 + maxGap + 1]
            searchPixels = list(zip(*np.nonzero(searchArea)))
            shortestDist = None
            bestConnection = None
            for r2, c2 in searchPixels:
                if r2 == maxGap and c2 == maxGap: continue
                canConnect, distSqr = self.checkPointConnectivity(maxGap, maxGap, r2, c2, gr1, gc1, maxGapSqr)
                if canConnect:
                    if shortestDist is None or shortestDist > distSqr:
                        bestConnection = (r2 - maxGap + r1, c2 - maxGap + c1)
                        shortestDist = distSqr

            # connect with the point that is closest under the connectivity condition
            if bestConnection is not None:
                joinCoordinates += [[r1, c1, bestConnection[0], bestConnection[1]]]
                usedPoints += [p1]

        return usedPoints, joinCoordinates

    # will analyze a point wether or not it can be joined with another or with the image
    def joinOpenEnds(self,singlePixels, gradients, thinnedImage: np.ndarray, maxGap=30):

        # if needed checking for angle difference
        # maxGradAdditionLenSq = 2 * math.cos(math.radians(180 - maxAngleDev)) + 2
        mgs = maxGap ** 2
        joinPoints = []
        joinPointsCoods = []
        p1 = 0
        for r1, c1 in singlePixels:
            if p1 == len(singlePixels) - 1: continue

            for p2 in range(p1 + 1, len(singlePixels)):
                if p1 == 21 and p2 == 25:
                    k = 0
                r2, c2 = singlePixels[p2, :]

                gr1, gc1 = gradients[p1]
                gr2, gc2 = gradients[p2]

                canConnect = self.checkPointConnectivity(r1, c1, r2, c2, gr1, gc1, mgs, gr2, gc2)[0]
                if canConnect:
                    joinPoints += [[p1, p2]]
                    joinPointsCoods += [[r1, c1, r2, c2]]

            p1 += 1

        return np.array(joinPoints, dtype='uint8'), joinPointsCoods

    def getSinglePixelDirections(self, singlePixels: np.ndarray, thinnedImage: np.ndarray, backtrackingLength=5) -> np.ndarray:
        gradients = np.zeros_like(singlePixels, dtype='float')

        sp = 0
        for spr, spc in singlePixels:
            k = 0

            r = spr
            c = spc
            backtrace = [[r, c]]

            for l in range(0, backtrackingLength):

                pn = []
                # check for hor/ver neighbours, they have priority, then diagonal
                # not very efficient, but probably irrelevant for performance
                if thinnedImage[r - 1, c]: pn += [[r - 1, c]]
                if thinnedImage[r + 1, c]: pn += [[r + 1, c]]
                if thinnedImage[r, c + 1]: pn += [[r, c + 1]]
                if thinnedImage[r, c - 1]: pn += [[r, c - 1]]
                if thinnedImage[r + 1, c + 1]: pn += [[r + 1, c + 1]]
                if thinnedImage[r - 1, c + 1]: pn += [[r - 1, c + 1]]
                if thinnedImage[r + 1, c - 1]: pn += [[r + 1, c - 1]]
                if thinnedImage[r - 1, c - 1]: pn += [[r - 1, c - 1]]

                # check all steps and select first one that is not in the path yet
                for i in pn:
                    if i not in backtrace:
                        backtrace += [i]
                        r, c = i
                        break

            # backtracking is done
            # simple direction estimation as a curve through first and last point
            dr = backtrace[0][0] - backtrace[-1][0]
            dc = backtrace[0][1] - backtrace[-1][1]
            norm = math.sqrt(dr ** 2 + dc ** 2)
            gradients[sp, :] = [dr / norm, dc / norm]
            sp += 1

        return gradients

    def drawPixels(self, r1, c1, r2, c2, thinnedImage):
        rr, cc = skimage.draw.line(r1, c1, r2, c2)
        thinnedImage[rr, cc] = 1

    def closeGaps(self,thinnedImage: np.ndarray, maxGap: float) -> np.ndarray:
        self.thinnedImageWithGaps[self.thinnedImageWithGaps > 0] = 1

        thinnedImage = cv2.copyMakeBorder(thinnedImage, maxGap, maxGap, maxGap, maxGap, cv2.BORDER_CONSTANT).astype(
            'int')

        singlePixels = []
        # only search pixels that are not directly on the border of the image , those are usually cut-off cells and useless
        for r in range(int(maxGap) + 1, thinnedImage.shape[0] - maxGap - 1):
            for c in range(int(maxGap) + 1, thinnedImage.shape[1] - maxGap - 1):
                if thinnedImage[r, c] == 0: continue

                numNeighbors = np.sum(thinnedImage[r - 1:r + 2, c - 1:c + 2]) - 1
                if numNeighbors <= 1:
                    singlePixels += [[r, c]]

        singlePixels = np.array(singlePixels)

        # after identifying single pixels we go on to estimate their direction
        # by backtracking a number of pixels or until the first fork

        gradients = self.getSinglePixelDirections(singlePixels, thinnedImage)

        joinedOpenPoints, joinedOpenPointsCoords = self.joinOpenEnds(singlePixels, gradients, thinnedImage)
        processedSinglePoints = list(filter(lambda pnum: pnum in joinedOpenPoints, range(0, len(singlePixels))))

        joinedTPoints, joinedTPointsCoords = self.joinOpenTs(singlePixels, gradients, processedSinglePoints, thinnedImage)

        allJoinedPoints = joinedTPointsCoords + joinedOpenPointsCoords

        for r1, c1, r2, c2 in allJoinedPoints:
            self.drawPixels(r1, c1, r2, c2, thinnedImage)

        # remove the border
        return thinnedImage[maxGap:-maxGap, maxGap:-maxGap]

    def run(self, action, params, inputkeys,outputkeys):

        if action == 'apply':
            inputImg = self.session.getRawData(inputkeys[0]) #binaryMask with thick outlines
            timg = np.copy(inputImg).astype('uint8')
            timg[timg > 0] = 255
            self.thinnedImageWithGaps = cv2.ximgproc.thinning(timg)
            if params['maxgap'][0] > 0:
                self.thinnedImage = self.closeGaps(self.thinnedImageWithGaps,int(params['maxgap'][0]))
            else:
                self.thinnedImage = self.thinnedImageWithGaps

            self.onGeneratedData(outputkeys[0], params)
            self.previewThinnedImageWithGaps = None
            self.previewThinnedImage = None
            return self.getJSOutput(outputkeys)

    def getRawOutput(self, key: str):
        return self.thinnedImage

    def getJSOutput(self, keys: List[str]):
        #Create transparent image
        if self.previewThinnedImageWithGaps is None:
            self.previewThinnedImageWithGaps = imgutil.getTransparentMask(self.thinnedImageWithGaps, (255, 0, 0), keys[0] + '_withgaps', True)
        if self.previewThinnedImage is None:
            self.previewThinnedImage = imgutil.getTransparentMask(self.thinnedImage, (255, 0, 0), keys[0], True)

        return {'thinnedWithGaps':self.previewThinnedImageWithGaps, 'thinned':self.previewThinnedImage}
