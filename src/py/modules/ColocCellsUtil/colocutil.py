import numpy as np

from src.py.types.CellsDataset import CellsDataset
from src.sammie.py.util import shapeutil


def identifyCellPartners(d1:CellsDataset,d2:CellsDataset):
    """Will find cells that are close to one another and match them together. While
    Datasets might be from the same image, they might not have the same cells in the same order
    so we simply look at polygons overlapping sufficiently. The colocalized area is the union between these two shapes in both images"""

    #Labeled mask with numbers corresponding to cells
    lbl1:np.ndarray = d1.getLabels()

    cellPartners = []
    for j,c in enumerate(d2.contours):
        #find a partner for a cell contour in d2, that overlaps d1
        maskPatch, dx, dy = shapeutil.getPolygonMaskPatch(c['x'], c['y'], 0)
        h, w = maskPatch.shape
        patchPixels:int = np.count_nonzero(maskPatch)
        overlapPixels:int = np.count_nonzero(lbl1[dy:dy + h,dx:dx + w][maskPatch])

        #More than 95 overlap between two areas, so these two cells go together
        if overlapPixels/patchPixels > 0.95:
            #majority of pixels in lbl1[dx:dx+w,dy:dy+h] will be of the same cell
            #we simply find the most frequent element and use this as cell index.
            i = np.bincount(lbl1[dy:dy + h,dx:dx + w].flat).argmax() - 1
            cellPartners += [(i,j)]


    return cellPartners