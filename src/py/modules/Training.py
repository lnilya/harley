import pickle
from typing import Tuple

import numpy as np
import skimage.measure
import src.py.exporters as exporters
from src.py.modules.FociCandidatesUtil.FociCandidateData import FociCandidateData
from src.py.modules.LabelingUtil.LabelingResult import LabelingResult
from src.py.modules.LabelingUtil.TrainingData import TrainingData
from src.py.modules.ModuleBase import ModuleBase
from src.py.modules.TrainingUtil.DataNormalizers import DataWhitenerNorm
from src.py.modules.TrainingUtil.SVMClassifier import SVMClassifier, SVMClassifierParams
from src.py.modules.TrainingUtil.scoringFunctions import mcc
from src.py.util import imgutil

class TrainingKeys:
    inLabels: str
    inTrainingData: str
    outModel: str

    def __init__(self, inputs, outputs):
        self.inLabels = inputs[0]
        self.inTrainingData = inputs[1]
        self.inCandidateParameters = inputs[2]

        self.outModel = outputs[0]

class Training(ModuleBase):

    keys: TrainingKeys
    model:SVMClassifier
    lastCVScore: float

    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.log = 'Training'
        self.trace('initialized')

    def unpackParams(self,border,intensityRange):
        #unpack and possibly parse/cast all parameters
        return border[0],intensityRange

    def run(self, action, params, inputkeys,outputkeys):
        self.keys = TrainingKeys(inputkeys, outputkeys)

        if action == 'hypertrain':
            #trains the model on the trainingset
            pass
        elif action == 'train':

            #Load data and labels
            trainingData:TrainingData = self.session.getData(self.keys.inTrainingData)
            labels:LabelingResult = self.session.getData(self.keys.inLabels)

            #train the basic model
            svmParams = SVMClassifierParams(DataWhitenerNorm(),mcc)
            self.model = SVMClassifier(trainingData,labels,svmParams)
            self.lastCVScore, testCorrelation = self.model.trainModel()

            self.onGeneratedData(self.keys.outModel,self.model,params)

            trainCurve = None
            if params['trainingCurve']:
                trainCurve = self.__generateCVCurve()

            return {'cv':self.lastCVScore, 'test':testCorrelation, 'traincurve':trainCurve}

    def __generateCVCurve(self):
        s,m,x = self.model.getTrainingCurve()
        return {'mean':m.tolist(),'std':s.tolist(),'x':x.tolist()}

    def exportData(self, key: str, path: str, **args):

        #Save model and training set
        with open(path, 'wb') as handle:
            data = {'model':self.model,
                    'data':self.session.getData(self.keys.inTrainingData),
                    'cvscore':self.lastCVScore,
                    'extractionparams':self.session.getParams(self.keys.inCandidateParameters),
                    'labels':self.session.getData(self.keys.inLabels)}
            pickle.dump(data, handle, protocol=pickle.HIGHEST_PROTOCOL)
