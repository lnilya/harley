from typing import List, Dict, Tuple

import numpy as np

from src.sammie.py.util import shapeutil
from src.sammie.py.util.imgutil import addBorder


class CellsDataset:
    """Dataset storing the cells inside a single image and possibly foci in each of the cells."""

    img:np.ndarray #Source Image for cell Images
    contours:List[Dict] #List of Contours in the form {'x':List[float], 'y':List[float]}
    fociContours:List[List[np.ndarray]] #For each cell a list of P x 2 numpy arrays, outlining the contour of the foci
    scale:float #The dimensions of 1px in nm or None if no scale is provided

    def __init__(self, img,contours,scale, fociContours = None):
        self.img = img
        self.contours = contours
        self.scale = scale
        self.fociContours = fociContours
        if(self.fociContours is None):
            self.fociContours = [None]*len(self.contours)

    def getNumLabeledCells(self):
        """All cells that have a foci labeling array """
        if not hasattr(self,'fociContours'): setattr(self, 'fociContours', None)
        if self.fociContours is None: self.fociContours = [None]*len(self.contours)
        else:
            return len([f for f in self.fociContours if f is not None])

        return 0

    def removeFociContours(self):
        if not hasattr(self,'fociContours'): setattr(self, 'fociContours', None)
        self.fociContours = None

    def addFociContourForCell(self, cellNum:int, contours:List[np.ndarray]):
        if not hasattr(self,'fociContours'): setattr(self, 'fociContours', None)
        if self.fociContours is None: self.fociContours = [None]*len(self.contours)

        self.fociContours[cellNum] = contours

    def getSingleCellImagesAndContours(self, border:int = 3)->Tuple[List[np.ndarray],List[Dict]]:
        """Retrieves a List of single cell images from the contours and adds a
        black border if desired."""
        cellImages = []
        cellContours = []
        for cnt in self.contours:
            maskPatch, dx, dy = shapeutil.getPolygonMaskPatch(cnt['x'], cnt['y'], 0)
            img = self.img[dy:dy+maskPatch.shape[0],dx:dx+maskPatch.shape[1]]
            minIntensity = img[maskPatch].min()
            maxIntensity = img[maskPatch].max()
            img = (img - minIntensity) / (maxIntensity - minIntensity)
            img[maskPatch == False] = 0

            cellContour = {'x':(np.array(cnt['x']) + border - dx).tolist(),
                           'y':(np.array(cnt['y']) + border - dy).tolist()}

            if border > 0:
                img = addBorder(img,border)
            cellImages += [img]
            cellContours += [cellContour]

        return cellImages,cellContours