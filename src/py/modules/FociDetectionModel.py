import csv
import pickle
from typing import List, Set, Dict, Tuple
from itertools import chain

import matplotlib.pyplot as plt
import numpy as np
import skimage.measure
from shapely.geometry import Polygon
from skimage.measure._regionprops import RegionProperties

from src.py.aggregators.focidataset import addFocusToCellSet, resetFociInCellSet
from src.sammie.py.eeljsinterface import eeljs_sendProgress
from src.py.modules.FociCandidatesUtil.FociCandidateData import FociCandidateData
from src.py.modules.LabelingUtil import LabelingResult
from src.py.modules.LabelingUtil.TrainingData import TrainingData
from src.sammie.py.modules.ModuleBase import ModuleBase
from src.py.modules.TrainingUtil.SVMClassifier import SVMClassifier
from src.sammie.py.util.imgutil import addBorder, getPreviewImage, norm
from src.py.util.modelutil import getCutoffLevel
from src.sammie.py.util.shapeutil import getPolygonMaskPatch
import xlsxwriter as xls


class FociDetectionModelKeys:
    inModel: str
    inDataset: str
    outFoci: str

    def __init__(self, inputs, outputs):
        self.inModel = inputs[0]
        self.inDataset = inputs[1]
        self.outFoci = outputs[0]

class FociDetectionModel(ModuleBase):

    userSelectedFociPerCell: List[List[int]]
    modelFociPerCell: List[List[int]]
    keys: FociDetectionModelKeys
    classifier: SVMClassifier
    trainingData: TrainingData
    cellContours: List[Dict]
    cellInidices: Set
    loadedPortion:float
    cellsInExport: Set
    normalizationFactors: List[Tuple[float,float]] #min and max values of original image, before normalization
    result: LabelingResult
    allPossibleContourSelections: List[List[int]] #Cell x Foci => selected contour level
    dataLoaded:bool

    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.userSelectedFociPerCell = []
        self.modelSelectedFociPerCell = []
        self.log = 'FociDetectionModel'
        self.trace('initialized')
        self.dataLoaded = False

    def unpackParams(self,sizeadjustment,portion,**other):
        #unpack and possibly parse/cast all parameters
        return sizeadjustment[0],portion[0]

    def run(self, action, params, inputkeys,outputkeys):
        self.keys = FociDetectionModelKeys(inputkeys, outputkeys)

        if action == 'excludecell':
            #exclude cell from export
            self.cellsInExport = set(params['cells'])

            return True

        elif action == 'changefociselection':
            self.userSelectedFociPerCell = params['foci']
            d = self.session.getData(self.keys.outFoci)
            self.onGeneratedData(self.keys.outFoci, {'foci': d['foci'], 'selection': self.userSelectedFociPerCell},params)
        elif action == 'apply':

            sizeAdjustment,portion = self.unpackParams(**params)

            if not self.dataLoaded or self.loadedPortion != portion:
                self.loadedPortion = portion
                model = self.session.getData(self.keys.inModel) #binaryMask
                self.classifier = model['model']

                #Prepare dataset

                #get all images
                allCellImages: List[np.ndarray] = self.session.getData(self.keys.inDataset)['imgs']  # List of images with cells

                #normalize images and store the normalization factors
                self.normalizationFactors = [(cimg.min(),cimg.max()) for cimg in allCellImages]
                allCellImages = [norm(cimg) for cimg in allCellImages]

                self.cellContours = self.session.getData(self.keys.inDataset)['contours']  # List of images with cells

                #pick a portion of dataset
                nc = int(len(allCellImages) * self.loadedPortion/100.0)
                if nc < 1: nc  = 1
                if nc > len(allCellImages): nc  = len(allCellImages)
                allCellImages = allCellImages[0:nc]

                self.cellInidices = set(range(0, len(allCellImages)))
                self.cellsInExport = set(range(0,len(allCellImages)))

                #Generate the contour loops candidates
                fociData = FociCandidateData(allCellImages)
                fociData.extractContours(self.abortSignal, model['extractionparams']['fociSize'],
                                              model['extractionparams']['granularity'][0],
                                         progressMsg='1/2 Extracting Contour Candidates')

                #Create a full list of all contours for all foci in all cells in dataset
                self.trainingData:TrainingData = TrainingData()
                for i in self.cellInidices:
                    cnt = fociData.extractLabellingContour(i,model['extractionparams']['fociSize'],
                                              model['extractionparams']['granularity'][0])
                    #Add the cells to the training set and extract features
                    self.trainingData.addCell(allCellImages[i], cnt['foci'])
                    eeljs_sendProgress(i / len(self.cellInidices), '2/2 Extracting Foci Features')
                    if self.abortSignal():
                        raise RuntimeError('Aborted execution.')

                #Make predictions for all foci, for the user to be able to select it
                self.allPossibleContourSelections = []
                for c in self.cellInidices:
                    allContoursInCell = self.trainingData.contours[c]
                    sel = []
                    for f,cnt in enumerate(allContoursInCell):
                        sel += [getCutoffLevel(self.trainingData.contourLevels[c][f],cnt)[1]]
                    self.allPossibleContourSelections += [sel]
                    if self.abortSignal():
                        raise RuntimeError('Aborted execution.')

                #Predict the foci using the model, but don't merge contours before adjusting size
                eeljs_sendProgress(-1,'Classifying Foci')
                self.result = self.classifier.predict(self.trainingData)

                #Create datastructure containing an array of foci indices per cell
                self.userSelectedFociPerCell = []
                for c in self.cellInidices:
                    self.userSelectedFociPerCell += [[i for i, cc in enumerate(self.result.contourChoices[c]) if cc != -1]]

                self.modelSelectedFociPerCell = [k.copy() for k in self.userSelectedFociPerCell]

                # generate preview Images for all cells
                self.previews = [getPreviewImage(img, self.keys.outFoci + '_%d' % i) for i, img in enumerate(allCellImages)]

                self.dataLoaded = True


            #Adjust sizes for ALL choices
            adjustedChoices = self.getFociWithSizeAdjustment(sizeAdjustment)

            merges = {}
            #after size adjustment some foci might have merged, we want to unselect those.
            #They won't get selected again if user increases the size though
            for i,c in enumerate(self.cellInidices):
                choices = adjustedChoices[c]
                for k, c in enumerate(choices):
                    if c == -1 and k in self.userSelectedFociPerCell[i]:
                        self.userSelectedFociPerCell[i].remove(k)
                        if not c in merges: merges[c] = 0
                        merges[c] += 1

            #get the polygon data for all possible foci
            allFoci = []
            for c in self.cellInidices:
                cc = adjustedChoices[c]
                fociInCell = []
                for f, lvl in enumerate(cc):
                    #get the contour at predicted level
                    cnt = self.trainingData.contours[c][f][lvl]
                    fociInCell += [{'x': np.around((cnt[:, 1]), decimals=3).tolist(),
                                    'y': np.around((cnt[:, 0]), decimals=3).tolist()}]

                allFoci += [fociInCell]

            self.onGeneratedData(self.keys.outFoci, {
                'foci':adjustedChoices,
                'selection':self.userSelectedFociPerCell
            }, params)

            return {'imgs': self.previews,
                    'foci':allFoci,
                    'merges': merges,
                    'cellsInExport':list(self.cellsInExport),
                    'contours': self.cellContours,
                    'modelSelection':self.modelSelectedFociPerCell,
                    'selection':self.userSelectedFociPerCell}

    def getFociWithSizeAdjustment(self,adjFactor:float):
        adjustedChoices = []
        for c in self.cellInidices:
            # cc = self.result.contourChoices[c]
            cc = self.allPossibleContourSelections[c]
            cc2 = [-1] * len(cc)

            for f, lvl in enumerate(cc):
                if lvl == -1: continue

                #get areas of all contour of this focus
                areas = np.array([Polygon(c).area for c in self.trainingData.contours[c][f]])
                #calculate the desired area
                desiredArea = areas[lvl] * adjFactor
                cc2[f] = np.argmin(np.abs(areas - desiredArea))

            # adjustedChoices += [cc2]
            adjustedChoices += [self.trainingData.mergeContours(c,cc2)]

        return adjustedChoices

    def __exportXLSX(self, key:str, path:str,**args):

        scale = args['1px'] if '1px' in args else 1

        d = self.session.getData(self.keys.outFoci)
        adjustedFociChoices = d['foci']
        selectedChoices = d['selection']

        wb = xls.Workbook(path)

        #Will contain stats on the whole dataset
        numCells = len(self.cellsInExport)
        cellsWithFoci = 0
        histData = []
        for i, c in enumerate(list(self.cellsInExport)):
            nf = len(selectedChoices[c])
            histData += [nf]
            if nf > 0: cellsWithFoci += 1

        wss = wb.add_worksheet('Summary')
        wsf = wb.add_worksheet('Foci Per Cell')

        ws = wb.add_worksheet('Foci Details')
        ws.set_column(2, 7, 15)
        ws.write_row(0,0,['Cells that do not have foci, have no entries here.'])
        if scale != 1:
            ws.write_row(1,0,['Cell', 'Focus', 'x in nm', 'y in nm', 'Area in nm^2',
                         'peakBrightness', 'meanBrightness', 'contourBrightness'])
        else:
            ws.write_row(1,0,['Cell', 'Focus', 'x in px', 'y in px', 'Area in px^2',
                         'peakBrightness', 'meanBrightness', 'contourBrightness'])

        r = 2
        avgIntensityPerCell = []
        avgAreaPerCell = []

        for i, c in enumerate(list(self.cellsInExport)):
            cc = adjustedFociChoices[c]
            selFoci = selectedChoices[c]
            nf = 0
            avgIntensity = []
            avgArea = []
            for f, lvl in enumerate(cc):
                if f not in selFoci: continue
                binMaskOuter, offx, offy = getPolygonMaskPatch(self.trainingData.contours[c][f][lvl][:, 1],
                                                               self.trainingData.contours[c][f][lvl][:, 0], 0)
                region: RegionProperties = skimage.measure.regionprops(binMaskOuter.astype('int'),
                                                                       self.trainingData.imgs[c][
                                                                       offy:offy + binMaskOuter.shape[0],
                                                                       offx:offx + binMaskOuter.shape[1]])[0]

                maxIntensity = region.max_intensity
                meanIntensity = region.mean_intensity
                contourIntensity = self.trainingData.contourLevels[c][f][lvl]
                nmin,nmax = self.normalizationFactors[c]

                maxIntensity = (maxIntensity*(nmax - nmin)) + nmin
                meanIntensity = (meanIntensity*(nmax - nmin)) + nmin
                contourIntensity = (contourIntensity*(nmax - nmin)) + nmin

                area = Polygon(self.trainingData.contours[c][f][lvl]).area
                center = self.trainingData.getFociCenters(c, [f])
                avgArea += [area * (scale**2)]
                avgIntensity += [meanIntensity]
                ws.write_row(r,0,[i, nf,
                             float('%.3f'%(center[0, 1] * scale)),
                             float('%.3f'%(center[0, 0] * scale)),
                             float('%.2f'%(area * (scale ** 2))),
                             float('%.3f'%maxIntensity),
                             float('%.3f'%meanIntensity),
                             float('%.3f'%contourIntensity)])
                r += 1
                nf += 1
            avgIntensityPerCell += [avgIntensity]
            avgAreaPerCell += [avgArea]


        #Get Average Intensities/Areas of all Foci
        avgIntensityTotal = np.mean(list(chain.from_iterable(avgIntensityPerCell)))
        avgAreaTotal = np.mean(list(chain.from_iterable(avgAreaPerCell)))

        wss.set_column(0, 0, 22)
        wss.set_column(0, 1, 15)
        wss.write_row(1, 0, ['Total Cells', numCells])
        wss.write_row(2, 0, ['Cells with Foci', cellsWithFoci])
        wss.write_row(3, 0, ['Cells without Foci', numCells - cellsWithFoci])
        wss.write_row(4, 0, ['% of cells with foci', '%.2f%%' % (100 * cellsWithFoci / numCells)])
        wss.write_row(5, 0, ['Avg Foci per Cell', np.mean(histData)])

        unit = 'px'
        if scale != -1: unit = 'nm'

        wss.write_row(6, 0, ['Avg Foci area in %s²'%unit, float('%.3f'%(avgAreaTotal))])
        wss.write_row(7, 0, ['Avg Foci Mean Brightness', float('%.3f'%avgIntensityTotal)])

        wsf.set_column(0, 1, 12)
        wsf.set_column(2, 3, 20)
        wsf.write_row(1, 0, ['Cell Number', 'Foci in Cell','Avg Foci Mean Brightness','Avg Foci Area in %s²'%unit])
        for cellnum, numFoci in enumerate(histData):
            if numFoci > 0:
                ic = float('%.3f'%np.mean(avgIntensityPerCell[cellnum]))
                ac = float('%.3f'%(np.mean(avgAreaPerCell[cellnum])))
                wsf.write_row(cellnum + 2, 0, [cellnum, numFoci,ic,ac])
            else:
                wsf.write_row(cellnum + 2, 0, [cellnum, numFoci])

        wb.close()

    def __exportDataSetWithLabels(self,key:str,path:str,**args):
        #Get the raw contents of the inital dataset file
        data = self.session.getData(self.keys.inDataset)

        rawPickle = data['rawData']
        convertFun = data['convertIndex']

        #Get the foci and cell selections
        d = self.session.getData(self.keys.outFoci)
        adjustedFociChoices = d['foci']
        selectedChoices = d['selection']

        resetFociInCellSet(rawPickle)
        for i, c in enumerate(list(self.cellsInExport)):
            #Gather all foci in this cell
            cc = adjustedFociChoices[c]
            selFoci = selectedChoices[c]
            fociInCell = []
            for f, lvl in enumerate(cc):
                if f not in selFoci: continue
                fociInCell += [self.trainingData.contours[c][f][lvl]]

            #Get the location of the cell in dataset
            batchNum,cellNumInBatch = convertFun(c)
            addFocusToCellSet(rawPickle,batchNum,cellNumInBatch,fociInCell)

        with open(path, 'wb') as handle:
            pickle.dump(rawPickle, handle, protocol=pickle.HIGHEST_PROTOCOL)

    def exportData(self, key: str, path: str, type:str, **args):
        if type == 'xlsx':
            self.__exportXLSX(key,path,**args)
        elif type == 'cells':
            self.__exportDataSetWithLabels(key,path,**args)

