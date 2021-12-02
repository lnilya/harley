from typing import Tuple

import numpy as np
import skimage.measure
import src.py.exporters as exporters
from src.py.modules.ModuleBase import ModuleBase
from src.py.util import imgutil

class __NAME__Keys:
    inSomeInputKey: str
    outSomeOutputKey: str

    def __init__(self, inputs, outputs):
        self.inSomeInputKey = inputs[0]
        self.outSomeOutputKey = outputs[0]

class __NAME__(ModuleBase):

    keys: __NAME__Keys

    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.log = '__NAME__'
        self.trace('initialized')

    def unpackParams(self,border,intensityRange):
        #unpack and possibly parse/cast all parameters
        return border[0],intensityRange

    def run(self, action, params, inputkeys,outputkeys):
        self.keys = __NAME__Keys(inputkeys, outputkeys)
        border, intensityRange = self.unpackParams(**params)

        if action == 'apply':

            inputImg = self.session.getData(self.keys.inSomeInputKey) #binaryMask
            self.onGeneratedData(self.keys.outSomeOutputKey, inputImg, params)

            return {'demoResult':'Somethign for JS'}

    def exportData(self, key: str, path: str, **args):
        #Example for exporting, allexporters are inside exporters package
        exporters.exportBinaryImage(path, self.session.getData(key))
