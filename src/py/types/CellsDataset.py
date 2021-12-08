from typing import List, Dict

import numpy as np

from src.sammie.py.util import shapeutil


class CellsDataset:
    """Dataset storing single cell images"""

    img:np.ndarray #Source Image for cell Images
    contours:List[Dict] #List of Contours in the form {'x':List[float], 'y':List[float]}
    scale:float #The dimensions of 1px in nm or None if no scale is provided

    def __init__(self, img,contours,scale):
        self.img = img
        self.contours = contours
        self.scale = scale

    def getSingleCellImages(self)->List[np.ndarray]:
        """Retrieves a List of single cell images from the contours"""
        cellImages = []
        for cnt in self.contours:
            maskPatch, dx, dy = shapeutil.getPolygonMaskPatch(cnt['x'], cnt['y'], 0)
            img = self.img[dy:dy+maskPatch.shape[0],dx:dx+maskPatch.shape[1]]
            minIntensity = img[maskPatch].min()
            maxIntensity = img[maskPatch].max()
            img = (img - minIntensity) / (maxIntensity - minIntensity)
            img[maskPatch == False] = 0

            cellImages += [img]

        return cellImages