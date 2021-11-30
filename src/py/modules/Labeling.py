from typing import Tuple

import numpy as np
import skimage.measure
import src.py.exporters as exporters
from src.py.modules.FociCandidatesUtil.FociCandidateData import FociCandidateData
from src.py.modules.LabelingUtil.LabelingResult import LabelingResult
from src.py.modules.LabelingUtil.TrainingData import TrainingData
from src.py.modules.ModuleBase import ModuleBase
from src.py.util import imgutil

class LabelingKeys:
    inFoci:str
    inCandidateParameters:str
    outLabels:str
    outTrainingData:str

    def __init__(self, inputs, outputs):
        self.inFoci = inputs[0]
        self.inCandidateParameters = inputs[1]
        self.outLabels = outputs[0]
        self.outTrainingData = outputs[1]

class Labeling(ModuleBase):

    fullDataset: FociCandidateData
    trainingData: TrainingData
    labelingResult: LabelingResult
    keys: LabelingKeys

    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.log = 'Labeling'
        self.fullDataset = None
        self.trace('initialized')

    def unpackParams(self,border,intensityRange):
        #unpack and possibly parse/cast all parameters
        return border[0],intensityRange

    def run(self, action, params, inputkeys,outputkeys):
        self.keys = LabelingKeys(inputkeys, outputkeys)

        if action == 'labelCell':
            #Called when a cell was labeled will grow the training data
            cell = params['cell']
            userFoci = params['result']['foci']
            userSplits = params['result']['splits']
            labelingFoci = params['result']['labelingFoci']

            cellImg = self.fullDataset.images[cell]
            numCellsInTrainingData = len(self.trainingData.imgs)

            #Add new cell to trainind data
            self.trainingData.addCell(cellImg,labelingFoci,False)

            #process splits and userFoci into final format
            userFoci = self.trainingData.transformUserSplits(numCellsInTrainingData, userFoci, userSplits)

            #Add new cell to labelingset
            self.labelingResult.addCell(userFoci)

            #update model with new data
            self.onGeneratedData(self.keys.outTrainingData,self.trainingData,params)
            self.onGeneratedData(self.keys.outLabels,self.labelingResult,params)

            #return an object that simply changes as data is being generated, to indicate change to UI
            return {'numCells':numCellsInTrainingData+1}

        elif action == 'getCellFoci':
            #Retrieves data for a single cell that the user can label

            #get the parameters and images specified
            self.fullDataset = self.session.getData(self.keys.inFoci)
            datasetParams = self.session.getParams(self.keys.inCandidateParameters)

            #Generate all the contours (and send progress)
            labellingData = self.fullDataset.extractLabellingContour(params['cell'],datasetParams['fociSize'],datasetParams['granularity'][0],20)

            #When restarting again, the training data needs to be reset as it grows as cells get labeled
            if params['reset']:
                self.trainingData = TrainingData()
                self.labelingResult = LabelingResult()

            #Extract the format needed for labeling
            return labellingData

    def exportData(self, key: str, path: str, **args):
        #Example for exporting, allexporters are inside exporters package
        exporters.exportBinaryImage(path, self.session.getData(key))
