import random
from typing import List

import numpy as np

from src.py.types.CellsDataset import CellsDataset
from src.sammie.py.modules.ModuleBase import ModuleBase
from src.sammie.py.util.imgutil import getPreviewImage


class DatasetAlignmentKeys:
    """Convenience class to access the keys as named entities rather than in an array"""
    inDs0: str
    inDs1: str
    outAlignment: str

    def __init__(self, inputs, outputs):
        self.inDs0 = inputs[0]
        self.inDs1 = inputs[1]
        self.outAlignment = outputs[0]

class DatasetAlignment(ModuleBase):

    keys: DatasetAlignmentKeys
    batches1 :List[CellsDataset]
    batches2 :List[CellsDataset]
    alignment :List[int]

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

            #Get Batches as lists
            self.batches1:List[CellsDataset] = [d1['rawData']['data'][i] for i in d1['rawData']['data']]
            self.batches2:List[CellsDataset] = [d2['rawData']['data'][i] for i in d2['rawData']['data']]
            # self.batches2[2].contours = self.batches2[2].contours[20:30]
            # self.batches2 = self.batches2[1:2]
            # self.batches1 = self.batches1[1:2]

            #Create a similarity matrix between batches of datasets
            simMatrix = np.zeros((len(self.batches1),len(self.batches2)))
            preview1 = []
            preview2 = []
            for i,cb1 in enumerate(self.batches1):
                preview1 += [{'img':getPreviewImage(cb1.img, '%s_%d' % (self.keys.inDs0, i)),
                              'contours':cb1.contours}]
                for j,cb2 in enumerate(self.batches2):
                    if i == 0: preview2 += [{'img':getPreviewImage(cb2.img, '%s_%d' % (self.keys.inDs1, j)),
                                             'contours':cb2.contours}]
                    simMatrix[i,j] = cb1.similarityToDataSet(cb2)

            #suggest an alignment
            self.alignment = []
            for i in range(0,len(preview1)):
                j = np.argmax(simMatrix[i,:])
                #Do not suggest if overlap is less than 90%, it should actually be 100%
                if simMatrix[i,j] < 0.9: self.alignment += [-1]
                else: self.alignment += [int(j)]

            self.__addAlignedDatasetToSession(params)
            return {'similarity':simMatrix.tolist(), 'previews1':preview1, 'previews2':preview2, 'suggestedAlignment':self.alignment}

        elif action == 'align':
            self.alignment = params['alignment']
            self.__addAlignedDatasetToSession(params)
            return True

    def __addAlignedDatasetToSession(self,params):
        res = []
        for i,j in enumerate(self.alignment):
            res += [(self.batches1[i],self.batches2[j])]

        self.onGeneratedData(self.keys.outAlignment,res,params)

    def exportData(self, key: str, path: str, **args):
        #Get the data that needs to be exported
        data = self.session.getData(key)

        #Write a file with this data or postprocess it in some way
        #...

