from typing import Tuple, List

import numpy as np

from src.py.types.CellsDataset import CellsDataset
from src.sammie.py.util import shapeutil
from src.sammie.py.util.imgutil import makeSemiTransparent, getPreviewImage, joinChannels, norm, addBorder


def getColocImages(d1:CellsDataset,d2:CellsDataset, partners:List[Tuple[int,int]],key:str, color:List[Tuple[int,int,int]], border:int = 3):
    """Preview Images are generated as the overlap area of the two cell images and exported as semi transparent masks"""
    allImgs = []
    for p1,p2 in partners:
        maskPatch1, dx1, dy1 = shapeutil.getPolygonMaskPatch(d1.contours[p1]['x'], d1.contours[p1]['y'], 0)
        maskPatch2, dx2, dy2 = shapeutil.getPolygonMaskPatch(d1.contours[p2]['x'], d1.contours[p2]['y'], 0)

        dx = min(dx1,dx2)
        dy = min(dy1,dy2)
        w = max(dx1 + maskPatch1.shape[1],dx2 + maskPatch2.shape[1])
        h = max(dy1 + maskPatch1.shape[0],dy2 + maskPatch2.shape[0])

        #Intensity images for each cell individually
        img1 = np.copy(d1.img[dy:h,dx:w])
        img2 = np.copy(d2.img[dy:h,dx:w])
        img1[maskPatch1 == False] = 0
        img2[maskPatch2 == False] = 0
        if border > 0:
            img1 = addBorder(img1,border)
            img2 = addBorder(img2,border)

        mixColor = tuple(map(sum, zip(color[0], color[1])))
        imgMix = norm(img1) * norm(img2)
        mix = getPreviewImage(imgMix,'%s_m_%d'%(key,p1),True,mixColor,False)

        allImgs += [(getPreviewImage(img1,'%s_0_%d'%(key,p1),True,color[0],True), # CHANNEL 1
                     getPreviewImage(img2,'%s_1_%d'%(key,p1),True,color[1],True), #CHANNEL 2
                     mix, #COLOC ONLY IMAGE
                     joinChannels('%s_j_%d' % (key, p1), img1, color[0], img2, color[1], True) #MIXED IMAGE
                     )]

    return allImgs


def identifyCellPartners(d1:CellsDataset,d2:CellsDataset):
    """Will find cells that are close to one another and match them together. While
    Datasets might be from the same image, they might not have the same cells in the same order
    so we simply look at polygons overlapping sufficiently. The colocalized area is the union between these two shapes in both images"""

    #Labeled mask with numbers corresponding to cells
    lbl1:np.ndarray = d1.getLabels(True)

    cellPartners = []
    for j,c in enumerate(d2.contours):

        #Check if cell is labeled in dataset 2
        if d2.fociContours[j] is None: continue

        #find a partner for a cell contour in d2, that overlaps d1
        maskPatch, dx, dy = shapeutil.getPolygonMaskPatch(c['x'], c['y'], 0)
        h, w = maskPatch.shape
        patchPixels:int = np.count_nonzero(maskPatch)
        overlapPixels:int = np.count_nonzero(lbl1[dy:dy + h,dx:dx + w][maskPatch])

        #More than 90 overlap between two areas, so these two cells go together
        if overlapPixels/patchPixels > 0.90:
            #majority of pixels in lbl1[dx:dx+w,dy:dy+h] will be of the same cell
            #we simply find the most frequent element and use this as cell index.
            i = np.bincount(lbl1[dy:dy + h,dx:dx + w].flat).argmax() - 1
            cellPartners += [(i,j)]


    return cellPartners