from typing import List, Optional

import cv2
import numpy as np
import skimage.measure
from skimage.measure._regionprops import RegionProperties

from src.py.modules.FociDetectionUtil.MaskShrink import MaskShrinkParams, MaskShrink
from src.sammie.py.modules.ModuleBase import ModuleBase
from src.sammie.py.util import shapeutil
import src.py.exporters as exporters

class MaskTighteningKeys:
    inMask: str
    inDenoisedImage: str
    outTightenedCells: str

    def __init__(self, inputs, outputs):
        self.inMask = inputs[0]
        self.inDenoisedImage = inputs[1]
        self.outTightenedCells = outputs[0]

class MaskTightening(ModuleBase):

    keys: MaskTighteningKeys
    userAcceptedContours: List[int]

    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.log = 'MaskTightening'
        self.trace('initialized')

    def unpackParams(self,border,intensityRange,alpha,beta,gamma,iterations, shrink):
        return border[0],intensityRange,alpha[0]/100,beta[0]/100,gamma[0]/100,iterations[0],shrink

    def run(self, action, params, inputkeys,outputkeys):
        self.keys = MaskTighteningKeys(inputkeys, outputkeys)
        if action == 'select':
            self.userAcceptedContours = params['accepted']
            return True
        elif action == 'apply':

            border,intensityRange,a,b,g,iter,shrink = self.unpackParams(**params)

            
            mask = np.copy(self.session.getData(self.keys.inMask)) #binaryMask
            inputImg = self.session.getData(self.keys.inDenoisedImage) #binaryMask

            #generate untightened polygons
            labels = skimage.measure.label(mask)
            regions = skimage.measure.regionprops(labels)
            
            #filter out the unusable regions
            acceptedRegions = []
            for i, r in enumerate(regions):
                accepted = True
                meanIntensity = np.mean(inputImg[r.slice[0], r.slice[1]])
                meanIntensity = np.mean(inputImg[r.slice[0], r.slice[1]])
                if r.bbox[0] < border or r.bbox[2] > (mask.shape[0] - border) or r.bbox[1] < border or r.bbox[
                    3] > (mask.shape[1] - border):
                    accepted = False
                elif meanIntensity < intensityRange[0] or meanIntensity > intensityRange[1]:
                    accepted = False

                if accepted:
                    acceptedRegions += [i]

            #generate tightened bounds
            msp = MaskShrinkParams(a,b,g,iter)
            ms = MaskShrink(msp)


            origContours = []
            tightContours = []
            tightContoursRaw = []

            if not shrink:
                for r in acceptedRegions:
                    reg = regions[r]
                    contour = cv2.findContours(reg.filled_image.astype('uint8') * 255, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)[0][0]
                    origContours += [self.__contourToList(contour[:, 0, :],reg)]
                tightContours = origContours
                tightContoursRaw = origContours
            else:
                for r in acceptedRegions:
                    reg = regions[r]
                    #original Contours
                    contour = cv2.findContours(reg.filled_image.astype('uint8') * 255, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)[0][0]
                    origContours += [self.__contourToList(contour[:, 0, :],reg)]

                    imgSlice = np.copy(inputImg[reg.slice[0], reg.slice[1]])
                    mask, cpxnew = ms.run(imgSlice, reg.filled_image, False)

                    tightContoursRaw += [self.__contourToList(np.copy(cpxnew), reg,None)]
                    tightContours += [self.__contourToList(cpxnew, reg)]

            self.userAcceptedContours = list(range(0,len(tightContours)))
            self.onGeneratedData(self.keys.outTightenedCells, tightContoursRaw, params)

            return {'original':origContours,'tight':tightContours}

    def __contourToList(self,cpx,reg:RegionProperties, subsample:Optional[int] = 30):

        if subsample is not None:
            subsample = int(len(cpx) / subsample)
            if subsample < 1: subsample = 1
            cpx = cpx[::subsample, :]

        cpx[:, 1] += reg.bbox[0]
        cpx[:, 0] += reg.bbox[1]
        cpx = cpx.astype('float')
        return {'x': list(cpx[:, 0]), 'y': list(cpx[:, 1])}

    def exportData(self,key:str, path:str,**args):
        tightContourList = self.session.getData(key)
        inputImg = self.session.getData(self.keys.inDenoisedImage)  # binaryMask
        resImg = np.zeros_like(inputImg, dtype='uint8')

        for i in self.userAcceptedContours:
            cnt = tightContourList[i]
            maskPatch,dx,dy = shapeutil.getPolygonMaskPatch(cnt['x'], cnt['y'], 0)
            resImg = shapeutil.addPatchOntoImage(resImg, maskPatch.astype('uint8'), dy, dx, 0)

        return exporters.exportBinaryImage(path, resImg.astype('bool'))