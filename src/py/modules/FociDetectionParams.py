from typing import List, Set, Tuple

import matplotlib.pyplot as plt
import numpy as np
from shapely.geometry import Polygon
from skimage.measure._regionprops import RegionProperties
import skimage.measure

from src.py.modules.FociCandidatesUtil.FociCandidateData import FociCandidateData
from src.py.modules.LabelingUtil.TrainingData import TrainingData
from src.py.util.modelutil import getCutoffLevel
from src.sammie.py.eeljsinterface import eeljs_sendProgress
from src.sammie.py.modules.ModuleBase import ModuleBase
from src.sammie.py.util import imgutil
from src.sammie.py.util.imgutil import norm
from src.sammie.py.util.shapeutil import getPolygonMaskPatch


class FociDetectionParamsKeys:
    """Convenience class to access the keys as named entities rather than in an array"""
    inFoci: str
    inCandidateParameters: str
    outFoci: str

    def __init__(self, inputs, outputs):
        self.inDataset = inputs[0]
        self.inFociCandidates = inputs[1]
        self.inCandidateParameters = inputs[2]
        self.outFoci = outputs[0]

class FociDetectionParams(ModuleBase):

    keys: FociDetectionParamsKeys
    dataLoaded: bool
    loadedPortion: float
    userSelectedFociPerCell: List[List[int]]
    cellsInExport: Set

    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.log = 'FociDetectionParams'
        self.dataLoaded = False
        self.trace('initialized')

    def unpackParams(self,sizeadjustment,portion,**other):
        return sizeadjustment[0],portion[0]

    def run(self, action, params, inputkeys,outputkeys):
        self.keys = FociDetectionParamsKeys(inputkeys, outputkeys)

        #This is a stub and simply displays best practices on how to structure this function. Feel free to change it
        if action == 'changefociselectio':
            self.userSelectedFociPerCell = params['foci']
            d = self.session.getData(self.keys.outFoci)
            self.onGeneratedData(self.keys.outFoci, {'foci': d['foci'], 'selection': self.userSelectedFociPerCell},
                                 params)
        elif action == 'excludecell':
            self.cellsInExport = set(params['cells'])
            return True

        elif action == 'apply':

            #Parse Parameters out of the dictionary arriving from JS
            sizeAdjustment,portion = self.unpackParams(**params)

            # Will extract loops again
            if not self.dataLoaded or self.loadedPortion != portion:
                self.loadedPortion = portion

                self.allCellImages: List[np.ndarray] = self.session.getData(self.keys.inDataset)['imgs']  # List of images with cells

                # pick a portion of dataset
                nc = int(len(self.allCellImages) * self.loadedPortion / 100.0)
                if nc < 1: nc = 1
                if nc > len(self.allCellImages): nc = len(self.allCellImages)
                self.allCellImages = self.allCellImages[0:nc]

                self.normalizationFactors = [(cimg.min(), cimg.max()) for cimg in self.allCellImages]
                self.allCellImages = [norm(cimg) for cimg in self.allCellImages]
                self.cellInidices = set(range(0, len(self.allCellImages)))

                #generate unnormalized images
                self.tic()
                fociParams = self.session.getParams(self.keys.inCandidateParameters)
                fociData:FociCandidateData = FociCandidateData(self.allCellImages)
                fociData.extractContours(self.abortSignal,
                                         fociParams['fociSize'],
                                         fociParams['granularity'][0],
                                         progressMsg='1/2 Extracting Contour Candidates')
                self.toc('Loop Extraction')

                #Use the TrainingData class, but without extracting the features
                # Create a full list of all contours for all foci in all cells in dataset
                self.trainingData: TrainingData = TrainingData()
                self.allPossibleContourSelections = []
                self.tic()
                for c in self.cellInidices:
                    cnt = fociData.extractLabellingContour(c,
                                                           fociParams['fociSize'],
                                                           fociParams['granularity'][0],)
                    # Add the cells to the training set
                    self.trainingData.addCell(self.allCellImages[c], cnt['foci'],extractFeatures=False)
                    # Make size predictions
                    allContoursInCell = self.trainingData.contours[c]
                    sel = []
                    for f, cnt in enumerate(allContoursInCell):
                        sel += [getCutoffLevel(self.trainingData.contourLevels[c][f], cnt)[1]]

                    self.allPossibleContourSelections += [sel]

                    eeljs_sendProgress(c / len(self.cellInidices), '2/2 Calculating Foci Sizes')
                    if self.abortSignal():
                        raise RuntimeError('Aborted execution.')

                self.toc('area prediction')
                self.dataLoaded = True

            #MAKE SIZE ADJUSTMENT & MERGE IF NECESSARY
            self.tic()
            # get the polygon data for all foci of given size
            self.allFoci = [] #polygon data in JS format
            self.fociBrightness = [] #brightness data
            for c in self.cellInidices:

                cc = self.allPossibleContourSelections[c]

                #make size adjustment
                for f, lvl in enumerate(cc):
                    # get areas of all contours of this focus
                    areas = np.array([Polygon(cnt).area for cnt in self.trainingData.contours[c][f]])
                    desiredArea = areas[lvl] * sizeAdjustment
                    adjustedLevel = np.argmin(np.abs(areas - desiredArea))
                    cc[f] = adjustedLevel

                #Merge if necessary
                cc = self.trainingData.mergeContours(c,cc)

                cellImg = self.allCellImages[c]

                #create JS format of contours
                fociInCell = []
                brightnessInCell = []
                for f, lvl in enumerate(cc):
                    if lvl == -1: continue
                    # get the contour at adjusted level
                    cnt = self.trainingData.contours[c][f][lvl]
                    lvlBrightness = self.trainingData.contourLevels[c][f][lvl]

                    fociInCell += [{'x': np.around((cnt[:, 1]), decimals=3).tolist(),
                                    'y': np.around((cnt[:, 0]), decimals=3).tolist()}]
                    brightnessInCell += [self.extractBrightnessData(cnt,cellImg,lvlBrightness,self.normalizationFactors[c])]

                self.allFoci += [fociInCell]
                self.fociBrightness += [brightnessInCell]

            self.toc('JS conversion')
            #Generate an output that will go to javascript for displaying on the UI side
            return {'foci':self.allFoci,
                    'fociData':self.fociBrightness}
    def extractBrightnessData(self,cnt:np.ndarray, img:np.ndarray,lvl:float, normFactor:Tuple[float,float]):
        binMaskOuter, offx, offy = getPolygonMaskPatch(cnt[:, 1],
                                                       cnt[:, 0], 0)
        region: RegionProperties = skimage.measure.regionprops(binMaskOuter.astype('int'),
                                                               img[offy:offy + binMaskOuter.shape[0],
                                                               offx:offx + binMaskOuter.shape[1]])[0]
        nmin, nmax = normFactor
        meanIntensityRaw = (region.mean_intensity * (nmax - nmin)) + nmin
        return {
            'mean':[region.mean_intensity,meanIntensityRaw],
            'drop':255 if lvl == 0  else region.max_intensity/lvl
        }



    def exportData(self, key: str, path: str, **args):
        #Get the data that needs to be exported
        data = self.session.getData(key)

        #Write a file with this data or postprocess it in some way
        #...

