from typing import List

import numpy as np

from src.py.types.CellsDataset import CellsDataset
from src.sammie.py.modules.ModuleBase import ModuleBase
from src.sammie.py.util.imgutil import getPreviewImage


class DatasetAlignmentKeys:
    """Convenience class to access the keys as named entities rather than in an array"""
    inDs0: str
    inDs1: str
    # outSomeOutputKey: str

    def __init__(self, inputs, outputs):
        self.inDs0 = inputs[0]
        self.inDs1 = inputs[1]
        # self.outSomeOutputKey = outputs[0]

class DatasetAlignment(ModuleBase):

    keys: DatasetAlignmentKeys

    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.log = 'DatasetAlignment'
        self.trace('initialized')

    def unpackParams(self,paramName1,paramName2,**other):
        """unpack and possibly parse/cast all parameters coming from JS. The parameters from JS are defined in the params.tsx file of the respective step.
        The arrive as a dictionary on the py side and sometimes need some parsing. In any way this function provides a simple method to extract
        these parameters as named variables rather than using params['paramName1'] you can run it through this function."""
        #
        #respective
        return paramName1[0],paramName2

    def run(self, action, params, inputkeys,outputkeys):
        self.keys = DatasetAlignmentKeys(inputkeys, outputkeys)

        if action == 'preload':

            #get the input that this step is working on
            d1 = self.session.getData(self.keys.inDs0)
            d2 = self.session.getData(self.keys.inDs1)

            #Create a similarity matrix between batches of datasets
            batches1:List[CellsDataset] = d1['rawData']['data']
            batches2:List[CellsDataset] = d2['rawData']['data']

            simMatrix = np.zeros((len(batches1),len(batches2)))
            preview1 = []
            preview2 = []
            for i,cb1 in enumerate(batches1):
                preview1 += [getPreviewImage(batches1[cb1].img,'%s_%d'%(self.keys.inDs0,i))]
                for j,cb2 in enumerate(batches2):
                    if i == 0: preview2 += [getPreviewImage(batches2[cb2].img,'%s_%d'%(self.keys.inDs1,j))]
                    simMatrix[i,j] = batches1[cb1].similarityToDataSet(batches2[cb2])


            return {'similarity':simMatrix.tolist(), 'previews1':preview1, 'previews2':preview2}

        elif action == 'apply':
            return {}

    def exportData(self, key: str, path: str, **args):
        #Get the data that needs to be exported
        data = self.session.getData(key)

        #Write a file with this data or postprocess it in some way
        #...

