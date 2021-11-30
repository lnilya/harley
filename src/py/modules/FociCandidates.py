from typing import Tuple, List

import numpy as np
import skimage.measure
import src.py.exporters as exporters
from src.py.modules.FociCandidatesUtil.FociCandidateData import FociCandidateData
from src.py.modules.ModuleBase import ModuleBase
from src.py.util import imgutil
from src.py.util.imgutil import getPreviewImage, addBorder


class FociCandidatesKeys:
    inCells: str
    outFoci: str
    outCandidateParameters: str

    def __init__(self, inputs, outputs):
        self.inCells = inputs[0]
        self.outFoci = outputs[0]
        self.outCandidateParameters = outputs[1]

class FociCandidates(ModuleBase):

    fociData: FociCandidateData
    keys: FociCandidatesKeys

    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.log = 'FociCandidates'
        self.trace('initialized')

    def unpackParams(self,fociSize, granularity, cellNum):
        #unpack and possibly parse/cast all parameters
        return fociSize,granularity[0], cellNum

    def run(self, action, params, inputkeys,outputkeys):
        self.keys = FociCandidatesKeys(inputkeys, outputkeys)

        if action == 'generateImages':
            allCells:List[np.ndarray] = self.session.getData(self.keys.inCells) #List of images with cells

            #add a border to prevent problems with contours landing outside of image
            allCells = [addBorder(i,3) for i in allCells]

            self.fociData = FociCandidateData(allCells)

            #generate preview Images for all cells
            previews = [getPreviewImage(img, self.keys.outFoci + '_%d' % i) for i, img in enumerate(allCells)]

            self.onGeneratedData(self.keys.outFoci, self.fociData, params)
            return previews

        elif action == 'apply':
            fociSize,granularity,cellNum = self.unpackParams(**params)

            ss = self.fociData.extractSingleContour(fociSize,granularity,cellNum)

            #we do not pass any data here, since the only relevant thing are the parameters.
            self.onGeneratedData(self.keys.outCandidateParameters, [], params)

            return ss.getJSPreviewContours()

    def exportData(self, key: str, path: str, **args):
        #Example for exporting, allexporters are inside exporters package
        exporters.exportBinaryImage(path, self.session.getData(key))
