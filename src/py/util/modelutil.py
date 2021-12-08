from typing import List

import numpy as np
from shapely.geometry import Polygon

from src.sammie.py.util import imgutil


def getCutoffLevel(levels:np.ndarray, contours:List[np.ndarray], debug:bool = False):
    # compute area of the polygons
    area = np.array([Polygon(c).area for c in contours])
    areasq = np.sqrt(area)

    #resample for numerical differentiation
    #The resampling should not be higher than length of levels, to not lead to piecewise linear problems, with no curvature.
    radiusAppx = np.linspace(areasq.min(),areasq.max(),len(levels))
    intensity = np.interp(radiusAppx,areasq,levels)
    #determine gradient numerically
    intensityGradient = np.gradient(np.gradient(intensity))
    #determine optimal "radius"
    bestRad = np.argmax(intensityGradient)

    #And from there the best contour level form given array.
    nearestLevel = np.argmin(np.abs(areasq - radiusAppx[bestRad]))

    #or in absoolute terms
    optimalLevel = np.interp(radiusAppx[bestRad], radiusAppx, intensity)

    if debug:
        ax = imgutil.setUpSubplot(1, 3, axisTitles=['Intensity (Inverted Area)', 'Sec. Der. of Intensity', 'Original Area Function'])
        ax[2].plot(levels,area,'r-')
        ax[0].plot(radiusAppx,intensity,'r-')
        ax[1].plot(radiusAppx,intensityGradient,'r-')
        ax[1].plot(radiusAppx[bestRad],intensityGradient[bestRad],'bd')
        return  optimalLevel, nearestLevel, radiusAppx, intensity, intensityGradient

    return  optimalLevel, nearestLevel