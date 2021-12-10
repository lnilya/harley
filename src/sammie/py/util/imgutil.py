import math
import os
from typing import Tuple, List, Union

import cv2
import imageio
import numpy as np
from matplotlib import pyplot as plt
from matplotlib.axes import Axes
from numpngw import write_png
from numpy import ndarray

from src.sammie.py import settings
from src.sammie.py import eelutil


def meshgridForImage(img: ndarray, spacing=1):
    """
    Defines meshgrid coordinates on an image. if spacing is 1 we get a meshgrid of the pixels, for bigger values subsampling or supersmapling for smallervalues respectively.
    """
    rr, cc = np.meshgrid(np.linspace(0, img.shape[0] - 1, int(img.shape[0] / spacing)),
                         np.linspace(0, img.shape[1] - 1, int(img.shape[1] / spacing)))
    return rr, cc


# Will convert a grayscale float [0-1] image into an RGB image with the given colormap. See
# matplotlib colormaps for cmap parameter values

def norm(img: np.ndarray, range: Tuple = (0, 1), newtype=None):
    img = (img - img.min()) / (img.max() - img.min())
    img = (img + range[0]) * (range[1] - range[0])
    if newtype is not None:
        img = img.astype(newtype)

    return img


def getPreviewHeatMap(img: np.ndarray, key: str, force: bool = True, cmap: str = 'jet'):
    cm = plt.get_cmap(cmap)
    # Apply the colormap like a function to any array:
    colored_image = cm(img)
    colored_image = (colored_image[:, :, :3] * 255).astype(np.uint8)
    return getPreviewImage(colored_image, key, force)


# Will retrieve the JS preview image url for a given array and key.
# will not resave if force is set to false and the preview image is already available.
def getPreviewImage(img: np.ndarray, key: str, force: bool = True, inColor:Tuple[int,int,int] = None, normalize:bool = False):
    relPath = os.path.join(settings.TMP_FOLDER, key + '.jpg')
    absPath = eelutil.getFilePath(relPath)

    if normalize:
        img = norm(img)

    if inColor:
        nimg = np.zeros((img.shape[0],img.shape[1],3),'uint8')
        nimg[:,:,0] = (inColor[0] * img).astype('uint8')
        nimg[:,:,1] = (inColor[1] * img).astype('uint8')
        nimg[:,:,2] = (inColor[2] * img).astype('uint8')
        img = nimg

    if not os.path.exists(absPath) or force:
        imageio.imsave(absPath, img)

    return {
        'url': eelutil.getFileURL(relPath, force),
        'w': img.shape[1],
        'h': img.shape[0]
    }

def joinChannels(key:str, intensity1:np.ndarray, col1: Tuple[int,int,int], intensity2:np.ndarray, col2: Tuple[int,int,int], normalizeIntensityImage:bool = True):

    if normalizeIntensityImage:
        intensity1 = norm(intensity1,(0,1))
        intensity2 = norm(intensity2,(0,1))

    colImg = np.zeros((intensity1.shape[0],intensity1.shape[1],3),dtype='float')
    colImg[:, :, 0] = intensity1*col1[0] + intensity2*col2[0]
    colImg[:, :, 1] = intensity1*col1[1] + intensity2*col2[1]
    colImg[:, :, 2] = intensity1*col1[2] + intensity2*col2[2]

    colImg[colImg < 0] = 0
    colImg[colImg > 255] = 255

    return  getPreviewImage(colImg.astype('uint8'),key)


def makeSemiTransparent(intensityImg:np.ndarray, fillColor: Tuple[int,int,int], key:str, normalizeIntensityImage:bool = True):
    """uses the intensity image as an alpha channel and fills the image with the fillColor"""
    if normalizeIntensityImage:
        intensityImg = norm(intensityImg,(0,255),'uint8')

    colImg = np.zeros((intensityImg.shape[0],intensityImg.shape[1],4),dtype='uint8')
    colImg[:, :, 0] = fillColor[0]
    colImg[:, :, 1] = fillColor[1]
    colImg[:, :, 2] = fillColor[2]
    colImg[:, :, 3] = intensityImg

    relPath = os.path.join(settings.TMP_FOLDER, key + '.png')
    absPath = eelutil.getFilePath(relPath)

    write_png(absPath, colImg)

    return {
        'url': eelutil.getFileURL(relPath, True),
        'w': colImg.shape[0],
        'h': colImg.shape[1]
    }

def getTransparentMask(binaryMask: np.ndarray, fillColor: Tuple, key: str, force: bool = False):
    relPath = os.path.join(settings.TMP_FOLDER, key + '.png')
    absPath = eelutil.getFilePath(relPath)

    if binaryMask.dtype != np.dtype('bool'):
        binaryMask = binaryMask.astype('bool')

    if not os.path.exists(absPath) or force:
        mask = np.zeros((binaryMask.shape[0], binaryMask.shape[1], 3), dtype='uint8')
        mask[:, :, 0] = (binaryMask * fillColor[0]).astype('uint8')
        mask[:, :, 1] = (binaryMask * fillColor[1]).astype('uint8')
        mask[:, :, 2] = (binaryMask * fillColor[2]).astype('uint8')
        write_png(absPath, mask, transparent=(0, 0, 0))

    return {
        'url': eelutil.getFileURL(relPath, force),
        'w': binaryMask.shape[0],
        'h': binaryMask.shape[1]
    }


def getContourOfMask(binMask: ndarray, offset=(0, 0)):
    contour = cv2.findContours(binMask.astype('uint8') * 255, cv2.RETR_TREE, cv2.CHAIN_APPROX_NONE)[0][0][:, 0, :]
    contour[:, 0] += offset[1]
    contour[:, 1] += offset[0]
    return contour


def plotContour(ax: Axes, cnt, style='y:', offset=(0, 0)):
    ax.plot(cnt[:, 1] + offset[1], cnt[:, 0] + offset[0], style)


def plotContourOfMask(ax: Axes, binMask: ndarray, style='y:', offset=(0, 0)):
    cnt = cv2.findContours(binMask.astype('uint8') * 255, cv2.RETR_TREE, cv2.CHAIN_APPROX_NONE)
    contour = cnt[0][0][:, 0, :]
    ax.plot(contour[:, 0] + offset[1], contour[:, 1] + offset[0], style)


# Displays a number of images in a grid
def displayImageGrid(images: List, titles: List = None, dim: Tuple[int, int] = None, cmaps: Union[List, str] = None,
                     callShow: bool = False, windowTitle: str = None, fullW: bool = False, fullH: bool = False, bgCol = None,
                     **addtImshowArgs) -> List[Axes]:
    if dim is None:
        r = math.floor(math.sqrt(len(images)))
        c = math.floor(math.sqrt(len(images)))
        if (r * c < len(images)): c += 1
        if (r * c < len(images)): r += 1
        dim = (r, c)

    fig, ax = plt.subplots(dim[0], dim[1])

    if bgCol is not None:
        fig.patch.set_facecolor(bgCol)

    plt.tight_layout()
    fig.set_size_inches(18.5 if fullW else 6, 10 if fullH else 4.5)
    if windowTitle is not None:
        fig.canvas.manager.set_window_title(windowTitle)

    ax = np.ravel(ax)
    [x.axis('off') for x in ax]  # switch of all axis
    for idx, img in enumerate(images):
        if img is not None:
            if cmaps is None:
                cm = 'gray'
            elif isinstance(cmaps, str):
                cm = cmaps
            else:
                cm = cmaps[idx]
            ax[idx].imshow(img, cmap=cm, **addtImshowArgs)
            # ax[idx].imshow(img,cmap=cm)

        if titles is not None:
            ax[idx].set_title(str(titles[idx]))

    if callShow:
        plt.show()
    plt.tight_layout()
    return ax


def getPlotRowsColsForNumObj(obj: int, colsVsRows: int = 2):
    r = c = 1
    incR = colsVsRows
    # increase c colsVsRows times more often than r, so that the ratio tilts towards more columns than rows.
    while r * c < obj:
        if incR > 0:
            c += 1
            incR -= 1
        else:
            r += 1
            incR = colsVsRows

    return r, c


def setUpSubplot(rows: int = None, columns: int = None, windowTitle: str = None, axisTitles: List = None, showAxis=True,
                 fullW: bool = False, fullH: bool = False, bgCol=None) -> List[Axes]:
    fig, ax = plt.subplots(rows, columns)
    if bgCol is not None:
        fig.patch.set_facecolor(bgCol)
    if windowTitle is not None:
        fig.canvas.manager.set_window_title(windowTitle)

    # flatten axis object, makes it easier to handle
    if (rows + columns > 2):
        ax = ax.ravel()
    else:
        ax = [ax]

    # display titles if desired
    if axisTitles is not None:
        for i, a in enumerate(ax):
            if (i >= len(axisTitles)): break
            a.set_title(axisTitles[i])

    # display axises if desired
    if showAxis is False:
        [a.axis('off') for a in ax]


    elif isinstance(showAxis, list):
        for i, a in enumerate(ax):
            if showAxis[i]: continue
            a.axis('off')

    # size of widow
    fig.set_size_inches(18.5 if fullW else 6, 10 if fullH else 4.5)
    plt.tight_layout()
    return ax


def addBorder(img:np.ndarray,b,val = 0):
    bimg = np.ones((img.shape[0]+b*2,img.shape[1]+b*2),dtype=img.dtype) * val
    bimg[b:-b,b:-b] = img
    return bimg


def groupedBarPlot(groups:np.ndarray,ax:Axes = None, colors:List[str] = None, xticks:List[str] = None, barWidth:float = 1,
                   barDist:float = 0.25, groupDist:float = 2,wTitle:str = None):
    """
    Makes a grouped bar plot with G groups and V values each
    Args:
        groups (numpy): G x V array
        ax (): where to plot to
        colors (): Colors if not specified default are used
        xticks (): labels on x-axis if desired
        barWidth (): width of bars
        barDist (): distance between bars of same group
        groupDist (): distance between groups

    Returns:
    """

    if ax is None:
        ax = setUpSubplot(1,1,windowTitle=wTitle)[0]

    numGroups = groups.shape[0]
    numBars = groups.shape[1]
    if colors is None:
        colors = [None] * numBars

    grDist = (numBars*(barWidth+barDist) - barDist + groupDist)
    x = np.array([i*grDist for i in range(0,numGroups)])
    for i in range(0,numBars):
        ax.bar(x + (i*(barWidth+barDist)),groups[:,i], width=barWidth, color=colors[i])

    grWidth = (barWidth+barDist) * numBars - barDist + groupDist
    off = ((barWidth+barDist) * numBars - barDist - barWidth)/2
    if xticks is not None:
        xpos = [grWidth * i + off for i in range(0,len(xticks))]
        ax.set_xticks(xpos)
        ax.set_xticklabels(xticks)
