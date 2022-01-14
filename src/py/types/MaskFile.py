from typing import Dict, List, Optional, Tuple

import cv2
import skimage.measure
from attr import define,field, Factory
import numpy as np
from skimage.measure._regionprops import RegionProperties
import matplotlib.pyplot as plt
from src.sammie.py.util.shapeutil import getPolygonMaskPatch


@define
class MaskFile:

    #Reference Image or binary Mask Image
    ref:np.ndarray

    #Cell outlines as Dicts {x:List[float], y:List[float]}
    cells:List[Dict] = field(default=Factory(list))

    def getShiftedCopy(self,shift:Tuple[int,int], ignoreIfNoShift:bool = True)->'MaskFile':
        if shift[0] == 0 and shift[1] == 0 and ignoreIfNoShift: return self

        copy = MaskFile(self.ref,[])
        copy.cells = [{'x':c['x'].copy(),'y':c['y'].copy()} for c in self.cells]
        for c in copy.cells:
            c['x'] = [dc + shift[0] for dc in c['x']]
            c['y'] = [dc + shift[1] for dc in c['y']]

        return copy

    def getCellSelection(self,accepted:List[int])->List[Dict]:
        return [self.cells[i] for i in accepted]

    def filterRegions(self,inputImg:np.ndarray, intensityRange:Tuple[float,float],intensityRangeMax:Tuple[float,float], border:int)->List[int]:
        acceptedRegions = []
        """Filters Regions by intensity and proximity to Border"""
        for i,c in enumerate(self.cells):
            patch,offx,offy = getPolygonMaskPatch(c['x'],c['y'],0)

            #If the shape is out of bounds. This can happen if user sets the shift parameter such
            #that cell outline start to shift outside of image.
            if offx < 0 or offy < 0 or offx > inputImg.shape[1] or offy > inputImg.shape[0]:
                continue

            bbox = [offy, offx, offy+patch.shape[0], offx + patch.shape[1]]
            imgPortion = inputImg[offy:offy+patch.shape[0], offx:offx+patch.shape[1]]
            maxIntensity = np.max(imgPortion)
            meanIntensity = np.mean(imgPortion)
            accepted = True

            if bbox[0] < border or bbox[2] > (self.ref.shape[0] - border) or bbox[1] < border or bbox[
                3] > (self.ref.shape[1] - border):
                accepted = False
            elif meanIntensity < intensityRange[0] or meanIntensity > intensityRange[1]:
                accepted = False
            elif maxIntensity < intensityRangeMax[0] or maxIntensity > intensityRangeMax[1]:
                accepted = False

            if accepted: acceptedRegions += [i]

        return acceptedRegions

    def getPreviewImg(self):
        """If ref image is NOT a binary mask, will take the ref iamge and draw red squares to mask the detected cell centers."""
        cp = self.ref.copy()
        primg = np.dstack((cp,cp,cp))

        dotrad = 6
        for c in self.cells:
            mc = int(np.mean(c['x']))
            mr = int(np.mean(c['y']))
            primg[mr-dotrad:mr+dotrad+1,mc-dotrad:mc+dotrad+1,:] = [1,0,0] #red dot

        return primg


    def extractCellOutlinesFromMaskImage(self):
        """If ref image is a binary mask, this extracts the outlines as {x:..,y:...} Dictionaries."""
        labels = skimage.measure.label(self.ref)
        regions = skimage.measure.regionprops(labels)
        self.cells = []
        for r in regions:
            if r.area < 4: continue #sometimes artifacts in image create small 1 px blobs for some reason, ignore those.
            contour = cv2.findContours(r.filled_image.astype('uint8') * 255, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)[0][0]
            self.cells += [self.__contourToList(contour[:, 0, :],r)]

    def __contourToList(self,cpx,reg:RegionProperties, subsample:Optional[int] = 30):
        """Transforms the contours coming from openCV into x-y-Dicts. and subsamples if desired"""
        if subsample is not None:
            subsample = int(len(cpx) / subsample)
            if subsample < 1: subsample = 1
            cpx = cpx[::subsample, :]

        cpx[:, 1] += reg.bbox[0]
        cpx[:, 0] += reg.bbox[1]
        cpx = cpx.astype('float')
        if(len(cpx[:, 0]) == 1):
            k = 0
        return {'x': list(cpx[:, 0]), 'y': list(cpx[:, 1])}