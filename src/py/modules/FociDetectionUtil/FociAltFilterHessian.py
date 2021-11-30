from typing import Tuple, List, Callable

import numpy as np
import skimage.measure
import skimage.filters
from matplotlib import pyplot as plt
from numpy import ndarray
from scipy.ndimage import gaussian_laplace
from skimage.feature import peak_local_max

import src.py.util.imgutil as imgutil
from src.py.modules.FociDetectionUtil.FociAltFilterResult import FociAltFilterResult, FociMinDistGraph
from src.py.util.util import toc, tic


class FociAltFilterParams:
    # The curvature intensities can be discarded if below a threshhold. This
    # is not necessary, since low intensities would be marked by the algorihtm, but
    # it speeds it up, since fewer points are analyzed.
    hardIntensityBoundary: float

    ##The size limits of foci as limits on the lengths of major axis
    fociSizeRange: Tuple[float, float]

    # Dealing with closeby foci.
    # If foci are closeby they might be ajoinable into a single point with non-linear boundary. This setting defines what is preferred. Joining in one
    # or splitting in to. Has relevance in 2 cases:
    # 1. overlap and 2. to foci very close-by ( < 2 * sizeRange.max)
    # 'join' => For overlap: Dimmer Foci will be elimenated. For closeness: Will try to merge 2 foci
    # 'split' => For overlap: Contours will be shrunk until foci don't overlap. Often the weaker foci will become too small and might become elimenated in the process.
    #            For close-by: Will only try to merge, if eihter of the partners is too small to exist on its own.
    splitMode: str

    def __init__(self, fociSizeRange: Tuple[float, float], hardIntensityBoundary: float = 0.02, splitMode='join'):
        self.hardIntensityBoundary = hardIntensityBoundary
        self.fociSizeRange = fociSizeRange
        self.splitMode = splitMode

        # Min length of contour, before it is discarded
        self.minContourLength = fociSizeRange[0] * 2 * np.pi
        # radius of each patch, where the contour is fit.
        self.patchSize = int(fociSizeRange[1])
        # when foci are closer than this, they are considered to be mergable
        self.mergingDistanceSQ = int(fociSizeRange[1] * 2) ** 2


class ContourPatch:
    def __init__(self, img, r, c, size):
        self.r = r
        self.c = c
        self.size = size
        rs = slice(r - size, r + size + 1)
        cs = slice(c - size, c + size + 1)
        self.patch = img[rs, cs]
        self.pmax = self.patch[size, size]  # maximum value is the value of the point, not the abs max value
        self.pmin = self.patch[self.patch > 0].min()

    def getOffset(self):
        return ((self.r - self.size), (self.c - self.size))

    def pntToLocalCoords(self, p):
        pntLocalR = p[0] - (self.r - self.size)
        pntLocalC = p[1] - (self.c - self.size)
        return [pntLocalR, pntLocalC]

    def contourToLocalCoords(self, cnt):
        cnt[:, 0] -= self.r - self.size
        cnt[:, 1] -= self.c - self.size
        return cnt

    def contourToAbsoluteCoords(self, cnt):
        if cnt is None:
            k = 0
        cnt[:, 0] += self.r - self.size
        cnt[:, 1] += self.c - self.size
        return cnt

    def getContourAtLevel(self, lvl):
        conditions = [self.__conditionClosed(), self.__conditionPointIncuded(self.size, self.size)]
        return self.__optContour([lvl], conditions)

    # Lowers a contour in current patch until both points are included.
    def lowerContourUntilPointsMerge(self, maxLvl, pnts, debug = False):
        # maxLvl is the highest contour level of all points, lvl can't be higher than this, only lower

        pntsLocal = pnts - [(self.r - self.size), (self.c - self.size)]

        # condition is only that both points are included
        conditions = [self.__conditionClosed()]
        for p in pntsLocal: conditions += [self.__conditionPointIncuded(p[0], p[1])]
        # start at
        return self.__optContour(np.linspace(self.pmin, maxLvl, 20), conditions, True,debug)

    # Raises contour in this patch from curLevel until pnt is not a member
    # pnt is given in absolute image coordinates
    def raiseContourUntilPointNotContained(self, curLevel, pnt):

        pntLocalR = pnt[0] - (self.r - self.size)
        pntLocalC = pnt[1] - (self.c - self.size)
        conditions = [self.__conditionClosed(), self.__conditionPointIncuded(self.size, self.size)
            , self.__conditionPointNotIncuded(pntLocalR, pntLocalC)]

        return self.__optContour(np.array([curLevel, self.pmax]), conditions)

    def __conditionPointNotIncuded(self, pr, pc):
        return lambda cnt: np.count_nonzero(skimage.measure.points_in_poly([[pr, pc]], cnt)) == 0

    def __conditionPointIncuded(self, pr, pc):
        return lambda cnt: np.count_nonzero(skimage.measure.points_in_poly([[pr, pc]], cnt)) > 0

    def __conditionClosed(self):
        return lambda cnt: np.all(cnt[0, :] == cnt[-1, :])

    def __optContour(self, levels: np.ndarray, conditions: List[Callable], linearOpt: bool = False, debug = False):
        # Finds the longest contour, that meets the given conditions
        bestLevel = 1
        bestContour = None

        if debug:
            ax = imgutil.displayImageGrid([self.patch],['Optimizing Contours'])

        # start at topmost level -> smallest contour
        # We assume that this should always be a "hit". Then go stepsize down
        # if hit again, repeat, if not go back and try again with decreased stepsize
        # if linearOpt is used we do not use the dynamic algorithm, but just linearly pick the best option in linearOpt
        # this is only necessary when merging points, since then the condition that the topmost level is always a hit, is not true.
        if linearOpt:
            k = 0
        if len(levels) > 1:
            curBounds = [min(levels), max(levels)]
            # since stepsize is halfed everytime, we get 2**range, range should be bit-depth of image
            ir = range(0, 8) if not linearOpt else range(0, len(levels))
            for i in ir:
                if linearOpt: lvl = levels[i]
                else: lvl = (curBounds[1] + curBounds[0]) / 2
                res = skimage.measure.find_contours(self.patch, lvl)
                miss = False
                for cnt in res:
                    cond = [x(cnt) for x in conditions]
                    miss = not all(cond)
                    loptin = (linearOpt and (not miss) and (lvl < bestLevel))

                    if debug: ax[0].plot(cnt[:,1],cnt[:,0], 'g-' if not miss else 'r-')
                    if loptin:
                        bestContour = cnt
                        bestLevel = lvl
                        break
                    elif not linearOpt and not miss:
                        bestContour = cnt
                        break

                if miss:
                    curBounds[0] = lvl
                else:
                    curBounds[1] = lvl

            if not linearOpt: bestLevel = curBounds[1]
        else:
            # Now optimal level has been found, pick the contour
            bestLevel = levels[0]
            res = skimage.measure.find_contours(self.patch, bestLevel)
            for cnt in res:
                cond = [x(cnt) for x in conditions]
                if not all(cond):
                    continue
                else:
                    bestContour = cnt
                    break


        return bestContour, bestLevel, self.pmax / bestLevel

    # Finds the longest closed contour containing the center point
    def findBiggestClosedContour(self, debug = False):
        levels = np.linspace(self.pmin, self.pmax, 30)
        conditions = [self.__conditionClosed(), self.__conditionPointIncuded(self.size, self.size)]
        return self.__optContour(levels, conditions,debug=debug)


class FociAltFilterHessian:

    def __init__(self, params: FociAltFilterParams, title: str = 'Foci Filter'):
        self.__params = params
        self.debugTitle = title

    def __patchAround(self, r, c, rad, img):
        rs, cs = self.__minMaxPatchAround(r, c, rad, img)
        return img[rs, cs]

    def __minMaxPatchAround(self, r, c, rad, patch):
        rs = slice(max(r - rad, 0), min(r + rad + 1, patch.shape[0]))
        cs = slice(max(c - rad, 0), min(c + rad + 1, patch.shape[1]))
        return rs, cs

    def __filterLocalMaxima(self, img, blobs, debug=False):
        #blobs contains r,c,rad,curvature

        bcopy = []
        for i, blobLine in enumerate(blobs):
            r, c, rad = blobLine[0:3].astype('int')
            lm = self.__getAllLocalMaxAround(img, r, c, rad)
            for newPoint in lm:
                bcopy += [[newPoint[0],newPoint[1],rad,blobLine[3]]]

        #sorting remains the same, new points will inheirt their rad and curvature from parent.
        bcopy = np.array(bcopy)


        # since points shifted, they might shift to even same location and "merge"
        # find those that are too close to one another and elimenate the fainter one.
        minDist = 1 + (self.__params.fociSizeRange[0] * 2)

        elimenate = []
        for i in range(0, len(bcopy)):
            pi = bcopy[i,:]
            vi = img[int(pi[0]), int(pi[1])]
            for j in range(i + 1, len(bcopy)):
                pj = bcopy[j,:]
                dist = (pi[0] - pj[0]) ** 2 + (pi[1] - pj[1]) ** 2
                if dist < minDist:
                    vj = img[int(pj[0]), int(pj[1])]
                    if vi > vj:
                        elimenate += [j]
                    else:
                        elimenate += [i]

        newBlobs = list(set(range(0,len(bcopy))) - set(elimenate))
        bcopy = bcopy[newBlobs]
        if debug:
            ax = imgutil.displayImageGrid([img] * 2, windowTitle='Local Max Filter', titles=['Before Local Max', 'Accepted'])
            ax[0].plot(blobs[:,1], blobs[:,0], 'rx')
            ax[1].plot(bcopy[:,1], bcopy[:,0], 'gx')
            for i, b in enumerate(blobs):
                ci = plt.Circle((b[1], b[0]), b[2], color='m', linewidth=1, fill=False)
                ax[1].add_patch(ci)

        return bcopy

    def __mergeNeighbours(self, neighbours: FociMinDistGraph, img, result: FociAltFilterResult, debug=False):
        if neighbours is None: return
        removedPoints = []
        n = neighbours.shiftEdge()
        while n:
            masterIdx = n[0]
            slaveIdx = n[1]

            debug = masterIdx == 9 and slaveIdx == 17

            # attempt to merge 2 closeby foci
            r0, r1 = result[n[0]], result[n[1]]

            # swap so that the "master" point is r0, that is the point that absorbs r1 if merge is successful
            if (r0['max'] < r1['max']):
                masterIdx, slaveIdx = n[1], n[0]
                r0, r1 = r1, r0

            #Check if point with lower level contains point with higher level. This can happen when 3 points might all be mergable into one contour.
            #int he first run 2 points are merged, in the next one the point is already included. Due to working with windows of certain size
            #they might not be mergable, but they are.
            #TODO: At some point contour detection should not be constrained by the patch size.
            #maybe use some sort of local marching starting around the point
            containment = skimage.measure.points_in_poly([r1['pos']], r0['cnt'])
            mergeSlave = np.count_nonzero(containment) > 0


            # center is the middle between points
            if not mergeSlave:
                newCenter = ((r0['pos'] + r1['pos']) / 2).astype('int')
                cp = ContourPatch(img, newCenter[0], newCenter[1], self.__params.patchSize)

                bestContour, bestLevel, __dropoff = cp.lowerContourUntilPointsMerge(min(r0['max'], r1['max']),
                                                                                            np.array([r0['pos'], r1['pos']]),debug)

                if debug:
                    ax = imgutil.displayImageGrid([cp.patch, cp.patch],
                                                  windowTitle='Merge between %d and %d' % (masterIdx, slaveIdx))
                    cnt0, cnt1 = cp.contourToLocalCoords(np.copy(r0['cnt'])), cp.contourToLocalCoords(np.copy(r1['cnt']))
                    p0, p1 = cp.pntToLocalCoords(r0['pos']), cp.pntToLocalCoords(r1['pos'])
                    # plot start
                    if bestContour is not None:
                        ax[0].set_title('Before merging')
                    else:
                        ax[0].set_title('Could not be merged')

                    ax[0].plot([p0[1], p1[1]], [p0[0], p1[0]], 'rx')
                    ax[0].plot(cnt0[:, 1], cnt0[:, 0], 'm-')
                    ax[0].plot(cnt1[:, 1], cnt1[:, 0], 'm-')
                    if bestContour is not None:
                        # plot result
                        ax[1].set_title('After Merging')
                        if masterIdx == n[0]:
                            ax[1].plot(p0[1], p0[0], 'rx')
                        else:
                            ax[1].plot(p1[1], p1[0], 'rx')
                        ax[1].plot(bestContour[:, 1], bestContour[:, 0], 'm-')

            if mergeSlave:
                removedPoints += [slaveIdx]
                neighbours.disconnetNode(slaveIdx)
                if debug: print('Point %d is contained inside %d'%(slaveIdx,masterIdx))

            elif not mergeSlave and bestContour is not None:
                # merge is possible, the slave is marked for removal, master is changed
                removedPoints += [slaveIdx]
                neighbours.disconnetNode(slaveIdx)
                result.updatedEl(masterIdx, cp.contourToAbsoluteCoords(bestContour), bestLevel, result[masterIdx]['max'])
            else:
                # merge is not possible
                neighbours.removeEdge(masterIdx, slaveIdx)
                if debug:
                    print('Points %d and %d could not be joined' % (masterIdx, slaveIdx))

            # step to next candidate join
            n = neighbours.shiftEdge()

        # Remove the merged points
        if len(removedPoints) > 0:
            result.discardElements(removedPoints)

    def __dealWithOverlap(self, overlaps, img, result: FociAltFilterResult, debug=False):

        discarded = []
        # Method2 : Raise contours of higher focus to not include the lower one
        if self.__params.splitMode == 'split':
            for i, j in overlaps:
                ri = result[i]
                rj = result[j]
                r_i, c_i = ri['pos']
                r_j, c_j = rj['pos']

                c = ContourPatch(img, r_i, c_i, self.__params.patchSize)
                newCnt, newLevel, dropoff = c.raiseContourUntilPointNotContained(ri['level'],(r_j, c_j))

                c2 = ContourPatch(img, r_j, c_j, self.__params.patchSize)
                newCnt2, newLevel2, dropoff2 = c2.getContourAtLevel(newLevel)

                # Show Debug
                if debug:
                    ax = imgutil.displayImageGrid([c.patch])
                    if newCnt is not None:
                        ax[0].set_title('Contours %.2f/%.2f -> %.2f' % (ri['level'], rj['level'], newLevel))

                        ax[0].plot(newCnt[:, 1], newCnt[:, 0], 'g-')

                        newCnt2l = c.contourToLocalCoords(c2.contourToAbsoluteCoords(np.copy(newCnt2)))
                        ax[0].plot(newCnt2l[:, 1], newCnt2l[:, 0], 'g-')
                        origi = c.contourToLocalCoords(np.copy(ri['cnt']))
                        origj = c.contourToLocalCoords(np.copy(rj['cnt']))
                        ax[0].plot(origi[:, 1], origi[:, 0], 'y:')
                        ax[0].plot(origj[:, 1], origj[:, 0], 'b:')

                        pj = c.pntToLocalCoords([r_j, c_j])
                        pi = c.pntToLocalCoords([r_i, c_i])
                        ax[0].plot(pi[1], pi[0], 'yx')
                        ax[0].plot(pj[1], pj[0], 'bx')

                # reassign contour variable

                if newCnt is not None:
                    result.updatedEl(i, c.contourToAbsoluteCoords(newCnt), newLevel, dropoff * newLevel)
                else: discarded += [i]

                if newCnt2 is not None:
                    result.updatedEl(j, c2.contourToAbsoluteCoords(newCnt2), newLevel2, dropoff2 * newLevel2)
                else: discarded += [j]

        elif self.__params.splitMode == 'join':
            # Method1 : discard dimmer foci
            for i, j in overlaps:
                ri = result[i]
                rj = result[j]
                if ri['max'] > rj['max']: discarded += [j]
                else: discarded += [i]

        result.discardElements(discarded)

        return result

    def __buildNeighbourGraph(self, result: FociAltFilterResult, debug: bool = False) -> FociMinDistGraph:
        accIdx = result.getAccpetedIndices()
        neighbours = []
        for i in range(0, len(accIdx) - 1):
            r = result[accIdx[i]]
            # Calculate distance to all other points, that havent been scanned yet
            pnts = result.getPoints(accIdx[i + 1:])
            dist = (pnts[:, 0] - r['pos'][0]) ** 2 + (pnts[:, 1] - r['pos'][1]) ** 2
            n = np.flatnonzero(dist < self.__params.mergingDistanceSQ)
            # add to neighbour list and store intensity of highest peak along
            for mergeNeighbour in n:
                nidx = mergeNeighbour + i + 1
                neighbours += [[accIdx[i], accIdx[nidx], max(r['max'], result[nidx]['max'])]]

        if debug and len(neighbours) > 0:
            print('Found Neighbours: ', neighbours)

        if len(neighbours) == 0: return None

        neighbours = np.array(neighbours)
        order = np.argsort(neighbours[:, 2])[::-1]  # sort descending by max intensity of their neighbour
        neighbours = neighbours[order, 0:2].astype('int')  # remove the intensity which was a sorting key.
        return FociMinDistGraph(neighbours.tolist())

    def __findOverlappingBasins(self, result: FociAltFilterResult):
        intersections = []
        accIdx = result.getAccpetedIndices()
        for i in range(0, len(accIdx) - 1):
            r = result[accIdx[i]]
            pnts = result.getPoints(accIdx[i + 1:])
            containment = skimage.measure.points_in_poly(pnts[:, 0:2], r['cnt'])
            containment = np.nonzero(containment)[0]
            if (len(containment) > 0):
                containment += i + 1  # correct indices
                for j in containment:
                    intersections += [[accIdx[i], accIdx[j]]]

        # return a list of pairs with indices of intersecting basins.
        # the nature of closed contourlines is such, that one contourline will necessarily contain the other
        return intersections

    def __getContourCurves(self, img, mask, result: FociAltFilterResult, debug=False):
        ax = imgutil.displayImageGrid([None] * result.numAccpetedIndices(), windowTitle='Local Max Filter',
                                      cmaps='gray') if debug else []
        # print('BEFORE ACCEPTED INDICES: ', result.getAccpetedIndices())
        # Objective is to build the longest, _closed_ contourline within a fixed radius
        # if no closed closed contour can be found the blob is discarded
        # if resulting contour is smaller than the circumference resulting from the minimal radius, blob is discarded as well.

        for i, ac in enumerate(result.getAccpetedIndices()):
            f = result[ac]
            r, c = f['pos']

            fp = ContourPatch(img, r, c, self.__params.patchSize)
            cnt, lvl, dropoff = fp.findBiggestClosedContour()

            if debug:
                ax[i].imshow(fp.patch, cmap='gray', vmax=1, vmin=0)
                if cnt is not None:
                    ax[i].set_title('Dropoff: %.2f' % dropoff)
                    ax[i].plot(cnt[:, 1], cnt[:, 0], 'g-')
                else:
                    ax[i].set_title('No closed Contour')

            if cnt is not None:
                # This is a valid foci and is added to list, but possibly too short.
                # However we keep the foci that are too short, because they might be able to merge into their neighbor.
                result.updatedEl(ac, fp.contourToAbsoluteCoords(cnt), lvl, fp.pmax)
                if debug: print('CONTOUR for %d updated (%d) ' % (i, len(cnt)))
            else:
                if debug: print('CONTOUR for %d discarded' % (i))
                result.discardElements([ac])

        # print('ACCEPTED INDICES: ', result.getAccpetedIndices())
        if debug:
            ax = imgutil.displayImageGrid([img], cmaps='gray' , windowTitle='Contours Before Split/Merge or Filter')
            for i in result.getAccpetedIndices():
                b = result[i]
                ax[0].plot(b['cnt'][:, 1], b['cnt'][:, 0], 'y-')
                ax[0].plot(b['pos'][1], b['pos'][0], 'yx')
                ax[0].annotate('%d'%i,(b['pos'][1], b['pos'][0]), color='y')

        return result

    def __getLocalMaxAround(self, img, r, c, numSteps):
        # get a > point in numSteps vicinity, that is maximal

        rs, cs = self.__minMaxPatchAround(r, c, int(numSteps), img)
        patch = img[rs, cs]

        # largest value in patch
        maxVal = patch.max() - 0.00001

        pos = peak_local_max(patch, min_distance=1, threshold_abs=maxVal, exclude_border=False,
                             num_peaks=1)
        if (len(pos) > 0):
            pos[0, 0] += rs.start
            pos[0, 1] += cs.start
        return pos

    def __getAllLocalMaxAround(self, img, r, c, numSteps):
        # gets all local maxima inside a window around r,c, ensuring they are not closer
        # than min foci size

        rs, cs = self.__minMaxPatchAround(r, c, int(numSteps), img)
        patch = img[rs, cs]
        pos = peak_local_max(patch, min_distance=1 + int(self.__params.fociSizeRange[0]*2), exclude_border=False )

        if (len(pos) > 0):
            pos[:, 0] += rs.start
            pos[:, 1] += cs.start

        return pos

    def getHessianContourAround(self,img,mask,r,c,sig,ax):
        # hess = skimage.feature.hessian_matrix_det(img, sig)
        hess = -gaussian_laplace(img, 1)
        hess[mask == False] = 0

        cp = ContourPatch(hess,int(r),int(c),self.__params.patchSize)
        localMax = peak_local_max(cp.patch,num_peaks = 1)
        localMax = cp.contourToAbsoluteCoords(localMax)

        if len(localMax) == 0:
            return None, None

        cp = ContourPatch(hess,localMax[0,0],localMax[0,1],self.__params.patchSize)


        # cnt,x,y = cp.getContourAtLevel(0.001)
        cnt,x,y = cp.findBiggestClosedContour()
        ax.imshow(cp.patch)
        ax.plot(self.__params.patchSize,self.__params.patchSize,'mx')
        if cnt is not None:

            imgutil.plotContour(ax,cnt, 'r:')
            cnt = cp.contourToAbsoluteCoords(cnt)
            return cnt,localMax

        return None,localMax

    def run(self, img: ndarray, mask: ndarray, blobs: ndarray, debug=False):
        if debug:
            print('Cell num blobs:%d, intBoundary:%.4f, sizeRange:%.2f-%.2f' % (
                len(blobs), self.__params.hardIntensityBoundary, self.__params.fociSizeRange[0],
                self.__params.fociSizeRange[1]))

        blobs = blobs[blobs[:, 3] > self.__params.hardIntensityBoundary]
        if debug:
            print('Reduced blobs:%d' % (len(blobs)))
        # self.__params.patchSize *= 2
        # add borders to the image for easier processing
        b = int(self.__params.patchSize) + 1
        img = imgutil.addBorder(img, b, 0)
        mask = imgutil.addBorder(mask, b, 0)
        blobs[:, 0:2] += b

        #TEST:
        allContours = []
        allPoints = []
        ax = imgutil.setUpSubplot(3,3,'Hessian Blobs',list(range(0,10)))
        for i in range(0,len(ax)):
            b = blobs[i,:]
            c,p = self.getHessianContourAround(img,mask,b[0],b[1],b[2],ax[i])
            allContours += [c]
            allPoints += [p]

        ax = imgutil.displayImageGrid([img])
        for i,c in enumerate(allContours):
            p = allPoints[i]
            ax[0].plot(blobs[i,1],blobs[i,0],'rx')
            ax[0].annotate(str(i),(blobs[i,1],blobs[i,0]),color='r',fontsize=9)
            if p is not None:
                ax[0].plot(p[0,1],p[0,0],'g.')

            if c is not None:
                ax[0].plot(c[:,1],c[:,0],'g-')

        return
        blobs = self.__filterLocalMaxima(img, blobs, debug)
        result = FociAltFilterResult(blobs)

        result = self.__getContourCurves(img, mask, result, debug)

        # deal with overlaps
        overlaps = self.__findOverlappingBasins(result)
        result = self.__dealWithOverlap(overlaps, img, result, debug)

        #merge points, if splitmode requires it
        if self.__params.splitMode == 'join':
            neighbours = self.__buildNeighbourGraph(result, debug)
            self.__mergeNeighbours(neighbours, img, result, True)

        #remove points that are too small to make it (they had the chance to be joined)
        removedIndices = result.elimenateContoursWithLengthBelow(self.__params.minContourLength)
        if debug:
            print('Removed foci/indices due to size constraint: ', removedIndices)

        # remove border
        result.substractBorder(b)
        img = img[b:-b, b:-b]

        if debug:
            ax = imgutil.setUpSubplot(2,2,'Result ' + self.debugTitle)
            result.plotDiscardedResult(img,ax[0])
            result.plotResult(img,'')

        return result
