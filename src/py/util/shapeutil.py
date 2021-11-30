import math

import cv2
import numpy as np
from matplotlib.path import Path

from src.py.modules.CellFittingUtil.radApprox import elFit


def addPatchOntoImage(img,patch,sr,sc,contourThickness = 3):

    allContour = None
    addPatch = np.copy(patch).astype('uint8')
    #find contour pixels, removign one layer at a time, and remove them from patch
    for i in range(0,contourThickness):
        contour = cv2.findContours(addPatch,cv2.RETR_TREE,cv2.CHAIN_APPROX_NONE)[0][0]
        curContour = contour[:, 0, :]
        if(allContour is None):
            allContour = curContour
        else:
            allContour = np.concatenate((allContour,curContour))
        addPatch[curContour[:,1],curContour[:,0]] = 0
        patch[curContour[:,1],curContour[:,0]] = 2

    h,w = patch.shape

    #positive numbers for cutting away
    cutLeft = -1*min(sc,0)
    cutTop = -1*min(sr,0)
    cutRight = -1*min(0,(img.shape[1]) - sc-w)
    cutBottom = -1*min(0,(img.shape[0]) - sr-h)

    imgSliceR = slice(sr+cutTop,sr+h-cutBottom)
    imgSliceC = slice(sc+cutLeft,sc+w-cutRight)
    patchSliceR = slice(cutTop,h-cutBottom)
    patchSliceC = slice(cutLeft,w-cutRight)

    #for now use XOR to ensure we do not have any overlaps
    img[imgSliceR,imgSliceC] += patch[patchSliceR,patchSliceC]
    img[img > 1] = 0
    return img

def getPolygonMaskPatch(x,y,borderSize=1):
    x = np.array(x)
    y = np.array(y)

    dim = np.ceil(np.array([max(y) - min(y), max(x) - min(x)])).astype('uint8')
    dim += borderSize*2
    offX = math.floor(min(x))
    offY = math.floor(min(y))
    x -= min(x)
    y -= min(y)

    elPath = Path(np.stack((x,y),axis=1))

    xx, yy = np.meshgrid(range(0, dim[1]), range(0, dim[0]))
    allCoords = np.stack([xx.ravel(), yy.ravel()], axis=1)
    binMask = np.reshape(elPath.contains_points(allCoords), dim)

    # maybe cut away empty corners
    return binMask,offX,offY

def getEllipseMaskPatch(*ellipseParams,borderSize = 1)->np.ndarray:
    """
    Returns a binary image depicting the ellipse, given its parameters, a,b,d (for polar coordinates)
    """
    #Padding around, not to mix pixels.
    slp = np.linspace(0, math.pi * 2, 100)
    slpr = elFit(slp, *ellipseParams)
    x = slpr * np.cos(slp)
    y = slpr * np.sin(slp)
    return getPolygonMaskPatch(x,y,borderSize)

def contourLength(c):
    dif = (c - np.array([*c[1:, :], c[0, :]])) ** 2
    return np.sum(np.sqrt(dif[:, 0] + dif[:, 1]))