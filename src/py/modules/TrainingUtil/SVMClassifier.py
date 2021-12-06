import random
from typing import Callable, List

import numpy as np
from sklearn import svm
from sklearn.model_selection import GridSearchCV

from src.py.modules.LabelingUtil.LabelingResult import LabelingResult
from src.py.modules.LabelingUtil.TrainingData import TrainingData
from src.py.modules.TrainingUtil.DataNormalizers import NormalizerInterface
from src.sammie.py.util import util
from src.py.util.modelutil import getCutoffLevel


class SVMClassifierParams:
    crossFolds:int = 6
    normalizer:NormalizerInterface #normalizer,whitener etc.
    scoreFunction:Callable
    def __init__(self, norm, score):
        self.normalizer = norm;
        self.scoreFunction = score

class SVMClassifier:

    def __init__(self,data:TrainingData, qr:LabelingResult,params:SVMClassifierParams):
        self.params = params

        #get the features and labels for the model
        self.trainSource = qr
        self.features = data.getFlatFeatures()
        self.classes = np.array(qr.getFociClasses())

        #Normalize data
        self.features = self.params.normalizer.reset(np.array(self.features))

    def predict(self, data:TrainingData)->LabelingResult:
        """Predicts the whole dataset and returns res as QuantificationResult for comparisons"""

        util.tic()
        feat = self.params.normalizer.scale(data.getFlatFeatures())
        fociPerCell = data.getFociPerCell()

        cellPredictions = self.model.predict(feat)
        contourChoices = []

        cnt = 0
        for cell,fpc in enumerate(fociPerCell):  # loop through all cells
            p = cellPredictions[cnt:cnt+fpc]
            # find cutoffs
            cutoffs = []
            for i,pred in enumerate(p):
                if not pred: cutoffs += [-1]
                else:
                    cutoffs += [getCutoffLevel(data.contourLevels[cell][i], data.contours[cell][i])[1]]

            contourChoices += [cutoffs]
            cnt += fpc
        qr = LabelingResult(list(range(0,len(data.imgs))),contourChoices,True)
        util.toc('Model done predicting dataset')
        return qr

    def getTrainingCurve(self, repeats:int = 20):
        numFoci = len(self.features)
        trainingSetSize = np.linspace(int(numFoci * 0.1), int(numFoci * 0.9), 30, dtype='int')
        results = np.zeros((len(trainingSetSize), repeats))

        for j, ss in enumerate(trainingSetSize):
            reps = [self.trainSubsetModel(ss) for r in range(0, repeats)]
            results[j, :] = reps

        std = np.std(results, axis=1)
        mean = np.mean(results, axis=1)

        return std,mean,trainingSetSize

    def trainSubsetModel(self, subsetsize:int):
        #Split into training and test size, make sure, that trainingset contains both classes
        allSamples = set(range(0, len(self.features)))
        while True:
            # split samples into test and training sets
            trainingSet = set(random.sample(allSamples, subsetsize))
            testSet = list(allSamples - trainingSet)
            trainingSet = list(trainingSet)

            # train Model on Trainingdata
            numPos = np.count_nonzero(self.classes[trainingSet])

            # we only have one class and cannot really run the classifier, happens for very small foci classes.
            if (numPos != 0 and numPos != len(self.classes[trainingSet])): break

        model = svm.SVC(C=self.model.C, gamma=self.model.gamma)
        model.fit(self.features[trainingSet], self.classes[trainingSet])
        testError = self.params.scoreFunction(model, self.features, self.classes)
        return testError

    def trainModel(self ):
        self.model = svm.SVC()
        self.model.fit(self.features, self.classes)

        cvError = self.getModelError({})
        testError = self.params.scoreFunction(self.model, self.features, self.classes)

        return cvError, testError

    def hyperTrainModel(self):
        util.tic()
        print('Starting Hyper Training for Model')
        param_grid = {'C': np.logspace(-1,4,15),
                      'gamma':np.logspace(-8,1,40)}

        gcv = GridSearchCV(svm.SVC(),
                           param_grid,
                           # n_iter=50,
                           scoring=self.params.scoreFunction,
                           verbose=True,
                           cv=self.params.crossFolds,
                           refit=False,
                           n_jobs=8)

        #Find a better hyperparameter set
        gcv.fit(self.features, self.classes)

        #train the model
        self.model = svm.SVC(**gcv.best_params_)
        self.model.fit(self.features, self.classes)

        cvMCCUnoptimized = self.getModelError({})
        cvMCC = self.getModelError(gcv.best_params_)
        testError = self.params.scoreFunction(self.model,self.features,self.classes)
        util.toc('[SVM] Trained model CV: %.2f->%.2f Test: %.2f'%(cvMCCUnoptimized,cvMCC,testError))
        if cvMCC < cvMCCUnoptimized:
            #do not use parameters, since things got worse after search
            self.model = svm.SVC(**gcv.best_params_)
            self.model.fit(self.features, self.classes)

        return cvMCC

    def getCVModelErrorForCurModel(self):
        return self.getModelError({'C':self.model.C,'gamma':self.model.gamma})

    #Evaluate the SVM Crossvalidation Error for a set of parameters
    def getModelError(self, svmParams, crossFolds:int = None):
        if crossFolds is None:
            crossFolds = self.params.crossFolds
        trainSets, testSets = self.__getCrossFoldSets(len(self.features), crossFolds)
        errors = np.zeros((len(trainSets),))
        for i in range(0, len(trainSets)):
            svmDefaults = {'kernel': 'rbf', 'C': 1, 'gamma': 'scale', 'probability': False}
            svmDefaults.update(svmParams)
            clf = svm.SVC(**svmDefaults)
            #train model on training set
            clf.fit(self.features[trainSets[i]], self.classes[trainSets[i]])
            #evaluate on test set
            errors[i] = self.params.scoreFunction(clf,self.features[testSets[i]],self.classes[testSets[i]])

        return np.mean(errors,axis=0)

    def __getCrossFoldSets(self, num: int, cv: int = 5):
        dsize = int(num / cv)
        testSets = []
        trainingSets = []
        all = set(range(0, num))
        for i in range(0, cv):
            ts = list(range(i * dsize, (i + 1) * dsize))
            testSets += [ts]
            trainingSets += [list(all - set(ts))]

        return trainingSets, testSets