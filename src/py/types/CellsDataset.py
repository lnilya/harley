from typing import List, Dict, Tuple

import matplotlib.pyplot as plt
import numpy as np

from src.sammie.py.util import shapeutil, imgutil
from src.sammie.py.util.imgutil import addBorder


class CellsDataset:
    """Dataset storing the cells inside a single image and possibly foci in each of the cells."""

    ref: np.ndarray  # Reference Brightfield Image
    refShift: Tuple[int,int]  #Shift of contours in relation to brightfield image (can be set in PreProcessing Pipeline Step)
    img: np.ndarray  # Source Image for cell Images
    contours: List[Dict]  # List of Contours in the form {'x':List[float], 'y':List[float]}
    fociContours: List[
        List[np.ndarray]]  # For each cell a list of P x 2 numpy arrays, outlining the contour of the foci
    scale: float  # The dimensions of 1px in nm or None if no scale is provided

    def __init__(self, img:np.ndarray, contours:List[Dict], scale:float, refImg:np.ndarray, refShift:str, fociContours=None):
        self.img = img
        self.ref = refImg
        self.contours = contours
        self.scale = scale
        self.fociContours = fociContours
        if (self.fociContours is None):
            self.fociContours = [None] * len(self.contours)

        self.refShift = (0, 0)
        if refShift is not None and len(refShift) > 0:
            ranges = [float(r.strip()) for r in refShift.split(';')]
            self.refShift = (ranges[0], ranges[1])

    def getNumLabeledCells(self):
        """All cells that have a foci labeling array """
        if not hasattr(self, 'fociContours'): setattr(self, 'fociContours', None)
        if self.fociContours is None:
            self.fociContours = [None] * len(self.contours)
        else:
            return len([f for f in self.fociContours if f is not None])

        return 0

    def removeFociContours(self):
        if not hasattr(self, 'fociContours'): setattr(self, 'fociContours', None)
        self.fociContours = None

    def addFociContourForCell(self, cellNum: int, contours: List[np.ndarray]):
        if not hasattr(self, 'fociContours'): setattr(self, 'fociContours', None)
        if self.fociContours is None: self.fociContours = [None] * len(self.contours)

        self.fociContours[cellNum] = contours

    def getLabels(self, excludeUnlabeledCells:bool = False):
        """Label Mask where 0 is background and i>0 is otuline for cell i-1"""
        mask = np.zeros_like(self.img, dtype='int')
        for i, c in enumerate(self.contours):
            if excludeUnlabeledCells and self.fociContours[i] is None:
                continue

            maskPatch, dx, dy = shapeutil.getPolygonMaskPatch(c['x'], c['y'], 0)
            h, w = maskPatch.shape
            mask[dy:dy + h, dx:dx + w][maskPatch] = i + 1

        return mask

    def getMask(self):
        """Binary mask with all cells"""
        mask = np.zeros_like(self.img)
        for c in self.contours:
            maskPatch, dx, dy = shapeutil.getPolygonMaskPatch(c['x'], c['y'], 0)
            mask = shapeutil.addPatchOntoImage(mask, maskPatch, dy, dx, 0)
        return mask

    def similarityToDataSet(self, ds: 'CellsDataset'):
        # Similarity measure is done by creating binary masks for each dataset and measuring the overlap

        mask1 = self.getMask()
        mask2 = ds.getMask()
        total = np.count_nonzero(mask1) + np.count_nonzero(mask2)
        overlap = np.count_nonzero(mask1 * mask2) * 2

        return overlap / total

    def getFociContours(self, cells: List[int], forJS:bool = True, shift:Tuple[float,float] = None) -> List[Dict]:
        if shift is None: shift = (0,0)

        shift = np.array(shift)
        foci = []
        for i in cells:
            fc = self.fociContours[i]
            fc = [f + shift for f in fc]
            if forJS:
                fociJS = [{'x':list(f[:,1]),'y':list(f[:,0])} for f in fc]
                foci += [fociJS]
            else:
                foci += [fc]

        return foci

    def getSingleCellContours(self, cells: List[int], border: int = 3) -> List[Dict]:
        cnts = []
        for i in cells:
            cnt = self.contours[i]
            dx = np.floor(np.min(cnt['x']))
            dy = np.floor(np.min(cnt['y']))

            cnts += [{'x': (np.array(cnt['x']) + border - dx).tolist(),
                      'y': (np.array(cnt['y']) + border - dy).tolist()}]

        return cnts

    def show(self):
        plt.imshow(self.img)
        for dc in self.contours:
            plt.plot(dc['x'], dc['y'], 'y:')
        plt.show()

    def getSingleCellImagesAndContours(self, border: int = 3, normalize:bool = True) -> Tuple[List[np.ndarray], List[Dict]]:
        """Retrieves a List of single cell images from the contours and adds a
        black border if desired."""
        cellImages = []
        cellContours = []
        for i,cnt in enumerate(self.contours):
            #For some reasone it is possible to achieve a non-valid contour - so we will just ignore it here.
            # if len(cnt['x']) < 3 or len(cnt['y']) < 3:
            #     continue
            maskPatch, dx, dy = shapeutil.getPolygonMaskPatch(cnt['x'], cnt['y'], 0)
            img = self.img[dy:dy + maskPatch.shape[0], dx:dx + maskPatch.shape[1]].copy()

            try:
                minIntensity = img[maskPatch].min()
                maxIntensity = img[maskPatch].max()
            except:
                minIntensity = 0
                maxIntensity = 1
                print('Error loading cell image %d'%i)
                # self.show()

            if normalize and maxIntensity > minIntensity:
                img = (img - minIntensity) / (maxIntensity - minIntensity)

            img[maskPatch == False] = 0

            cellContour = {'x': (np.array(cnt['x']) + border - dx).tolist(),
                           'y': (np.array(cnt['y']) + border - dy).tolist()}

            if border > 0:
                img = addBorder(img, border)
            cellImages += [img]
            cellContours += [cellContour]

        return cellImages, cellContours
