from typing import List, Optional

import cv2
import numpy as np
import skimage.measure
from skimage.measure._regionprops import RegionProperties

from src.py.modules.FociDetectionUtil.MaskShrink import MaskShrinkParams, MaskShrink
from src.sammie.py.modules.ModuleBase import ModuleBase
from src.sammie.py.util import shapeutil, imgutil
import src.py.exporters as exporters
from src.sammie.py.util.imgutil import getPreviewImage
from src.sammie.py.util.shapeutil import getPolygonMaskPatch


class CellSelectionKeys:
    inMask: str
    inDenoisedImage: str
    outTightenedCells: str

    def __init__(self, inputs, outputs):
        self.inMask = inputs[0]
        self.inDenoisedImage = inputs[1]
        self.outTightenedCells = outputs[0]

class CellSelection(ModuleBase):

    keys: CellSelectionKeys
    userAcceptedContours: List[int]

    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.log = 'CellSelection'
        self.trace('initialized')

    def unpackParams(self,border, intensityRange,intensityRangeMax, alpha,beta,gamma,iterations, shrink,shift):
        s = [0, 0]
        if shift is not None and len(shift) > 0:
            ranges = [float(r.strip()) for r in shift.split(';')]
            if len(ranges) != 2: raise RuntimeError('Format of Shift Parameter needs to be <Number>;<Number>')
            else: s = (ranges[0], ranges[1])

        return border[0],intensityRange, intensityRangeMax,alpha[0]/100,beta[0]/100,gamma[0]/100,iterations[0],shrink,s

    def run(self, action, params, inputkeys,outputkeys):
        self.keys = CellSelectionKeys(inputkeys, outputkeys)
        if action == 'select':
            self.userAcceptedContours = params['accepted']
            return True
        elif action == 'adjustContrast':

            adjustment = params['contrastRange']
            inputImg:np.array = self.session.getData(self.keys.inDenoisedImage)  # binaryMask
            inputImg = inputImg.copy()
            inputImg[inputImg >= adjustment[1]] = adjustment[1]
            inputImg[inputImg <= adjustment[0]] = adjustment[0]

            return getPreviewImage(inputImg,self.keys.inDenoisedImage+'_adjusted',normalize=True)

        elif action == 'apply':

            border,intensityRange,intensityRangeMax,a,b,g,iter,shrink,shift = self.unpackParams(**params)

            maskFile = self.session.getData(self.keys.inMask)
            maskFile = maskFile.getShiftedCopy(shift)
            inputImg = self.session.getData(self.keys.inDenoisedImage) #binaryMask

            #filter out the unusable regions
            acceptedRegions = maskFile.filterRegions(inputImg,intensityRange,intensityRangeMax,border)

            #generate tightened bounds
            msp = MaskShrinkParams(a,b,g,iter)
            ms = MaskShrink(msp)

            origContours = maskFile.getCellSelection(acceptedRegions)
            tightContours = []
            tightContoursRaw = []

            if not shrink:
                tightContours = origContours
                tightContoursRaw = origContours
            else:
                origContours = maskFile.getCellSelection(acceptedRegions)
                for r in acceptedRegions:
                    c = maskFile.cells[r]
                    patch, offx, offy = getPolygonMaskPatch(c['x'], c['y'], 0)
                    imgSlice = inputImg[offy:offy + patch.shape[0], offx:offx + patch.shape[1]]
                    #original Contours
                    # contour = cv2.findContours(reg.filled_image.astype('uint8') * 255, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)[0][0]
                    mask, cpxnew = ms.run(imgSlice, patch, False)

                    tightContoursRaw += [self.__contourToList(np.copy(cpxnew), [offy,offx],None)]
                    tightContours += [self.__contourToList(cpxnew, [offy,offx])]

            self.userAcceptedContours = list(range(0,len(tightContours)))
            self.onGeneratedData(self.keys.outTightenedCells, tightContoursRaw, params)

            return {'original':origContours,'tight':tightContours}

    def __contourToList(self,cpx,bbox:List[float], subsample:Optional[int] = 30):

        if subsample is not None:
            subsample = int(len(cpx) / subsample)
            if subsample < 1: subsample = 1
            cpx = cpx[::subsample, :]

        cpx[:, 1] += bbox[0]
        cpx[:, 0] += bbox[1]
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