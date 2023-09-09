import pickle
from typing import List, Set, Tuple, Dict

import matplotlib.pyplot as plt
import numpy as np
from attr import asdict
from shapely.geometry import Polygon
from skimage.measure._regionprops import RegionProperties
import skimage.measure

from src.py.aggregators.focidataset import resetFociInCellSet, addFocusToCellSet
from src.py.modules.FociCandidatesUtil.FociCandidateData import FociCandidateData
from src.py.modules.FociDetectionUtil.fdu_types import FociInfo
from src.py.modules.LabelingUtil.TrainingData import TrainingData
from src.py.util.modelutil import getCutoffLevel
from src.sammie.py.eeljsinterface import eeljs_sendProgress
from src.sammie.py.modules.ModuleBase import ModuleBase
from src.sammie.py.util import imgutil
from src.sammie.py.util.imgutil import norm
from src.sammie.py.util.shapeutil import getPolygonMaskPatch
import xlsxwriter as xls
from itertools import chain

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
    userSelectedFociPerCell: List[List[int]] # refers to allFoci,fociBrightness
    cellsInExport: Set[int]
    allFoci:List[Dict] #x,y arrays
    fociBrightness:List[Dict] #mean, drop

    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.log = 'FociDetectionParams'
        self.dataLoaded = False
        self.trace('initialized')

    def unpackParams(self,sizeadjustment,portion,**other):
        return sizeadjustment[0],portion[0]

    def run(self, action, params, inputkeys,outputkeys):
        self.keys = FociDetectionParamsKeys(inputkeys, outputkeys)
        if action == 'applyselect':
            self.cellsInExport = set(params['cells'])
            self.userSelectedFociPerCell = params['foci']
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

            # print('Current APC',self.allPossibleContourSelections[0])
            #MAKE SIZE ADJUSTMENT & MERGE IF NECESSARY
            self.tic()
            # get the polygon data for all foci of given size
            self.allFoci = [] #polygon data in JS format
            self.fociBrightness = [] #brightness data
            self.fociContourSlections = []
            for c in self.cellInidices:

                cc = self.allPossibleContourSelections[c].copy()
                # if c == 0: print('INITIAL CC',cc)

                #make size adjustment
                for f, lvl in enumerate(cc):
                    # get areas of all contours of this focus
                    areas = np.array([Polygon(cnt).area for cnt in self.trainingData.contours[c][f]])
                    desiredArea = areas[lvl] * sizeAdjustment
                    adjustedLevel = np.argmin(np.abs(areas - desiredArea))

                    # if c == 0: print('LEVELS (%d)'%adjustedLevel, np.abs(areas - desiredArea))

                    cc[f] = adjustedLevel

                #Merge if necessary
                cc = self.trainingData.mergeContours(c,cc)

                self.fociContourSlections += [cc]

                # if c == 0: print('ADJUSTED AND MERGED CC',cc)

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
                    brightnessInCell += [self.extractFociStats(cnt, cellImg, lvlBrightness, self.normalizationFactors[c])]

                self.allFoci += [fociInCell]
                self.fociBrightness += [brightnessInCell]

            self.toc('JS conversion')

            #parse to JS FORMAT
            res = []
            for fba in self.fociBrightness:
                res += [[asdict(fi) for fi in fba]]

            #Generate an output that will go to javascript for displaying on the UI side
            return {'foci':self.allFoci,
                    'fociData':res}

    def extractFociStats(self, cnt:np.ndarray, img:np.ndarray, lvl:float, normFactor:Tuple[float, float]):
        binMaskOuter, offx, offy = getPolygonMaskPatch(cnt[:, 1],
                                                       cnt[:, 0], 0)

        regionArr = None
        if min(binMaskOuter.shape) > 0:
            regionArr:List[RegionProperties] = skimage.measure.regionprops(binMaskOuter.astype('int'),
                                                               img[offy:offy + binMaskOuter.shape[0],
                                                               offx:offx + binMaskOuter.shape[1]])

        area = Polygon(cnt).area
        nmin, nmax = normFactor
        #If regions are very small, the binary mask won't have any pixels and regionprops will be empty.
        if (regionArr is None or len(regionArr) == 0):
            return FociInfo(area,(0,0),(0,0),(lvl,lvl*(nmax - nmin) + nmin),1)
        else:
            region:RegionProperties = regionArr[0]

        meanIntensityRaw = (region.mean_intensity * (nmax - nmin)) + nmin
        maxIntensityRaw = (region.max_intensity * (nmax - nmin)) + nmin
        return FociInfo(area,(region.max_intensity,maxIntensityRaw),
                        (region.mean_intensity,meanIntensityRaw),
                        (lvl,lvl*(nmax - nmin) + nmin),
                        255 if lvl == 0 else region.max_intensity/lvl)

    def __exportXLSX(self, key:str, path:str,**args):

        scale = args['1px'] if '1px' in args else 1

        scale = float(scale)

        wb = xls.Workbook(path)

        #Will contain stats on the whole dataset
        numCells = len(self.cellsInExport)
        cellsWithFoci = 0
        histData = []
        for i, c in enumerate(list(self.cellsInExport)):
            nf = len(self.userSelectedFociPerCell[c])
            histData += [nf]
            if nf > 0: cellsWithFoci += 1

        wss = wb.add_worksheet('Summary')
        wsf = wb.add_worksheet('Foci Per Cell')

        ws = wb.add_worksheet('Foci Details')
        ws.set_column(2, 7, 15)
        ws.write_row(0,0,['Cells that do not have foci, have no entries here. Brightness levels(0-1) are unnormalized.'])
        if scale != 1:
            ws.write_row(1,0,['Cell', 'Focus', 'Area in nm^2',
                         'Peak Raw Brightness', 'Avg Raw Brightness', 'Contour Raw Brightness'])
        else:
            ws.write_row(1,0,['Cell', 'Focus', 'Area in px^2',
                         'Peak Raw Brightness', 'Avg Raw Brightness', 'Contour Raw Brightness'])

        r = 2
        avgIntensityPerCell = []
        avgAreaPerCell = []

        for i, c in enumerate(list(self.cellsInExport)):

            avgIntensity = []
            avgArea = []
            for idx,fnum in enumerate(self.userSelectedFociPerCell[c]):
                brightnessData:FociInfo = self.fociBrightness[c][fnum]
                ws.write_row(r,0,brightnessData.getCSVRow(i,idx,scale))
                avgArea += [brightnessData.pxarea * (scale ** 2)]
                avgIntensity += [brightnessData.mean[1]]

                r += 1

            avgIntensityPerCell += [avgIntensity]
            avgAreaPerCell += [avgArea]


        #Get Average Intensities/Areas of all Foci
        avgIntensityTotal = np.mean(list(chain.from_iterable(avgIntensityPerCell)))
        avgAreaTotal = np.mean(list(chain.from_iterable(avgAreaPerCell)))

        wss.set_column(0, 1, 22)
        wss.write_row(1, 0, ['Total Cells', numCells])
        wss.write_row(2, 0, ['Cells with Foci', cellsWithFoci])
        wss.write_row(3, 0, ['Cells without Foci', numCells - cellsWithFoci])
        wss.write_row(4, 0, ['% of cells with foci', '%.2f%%' % (100 * cellsWithFoci / numCells)])
        wss.write_row(5, 0, ['Avg Foci per Cell', np.mean(histData)])

        unit = 'px'
        if scale != -1: unit = 'nm'

        wss.write_row(6, 0, ['Avg Foci area in %s²'%unit, float('%.3f'%(avgAreaTotal))])
        wss.write_row(7, 0, ['Avg Raw Foci Brightness', float('%.3f'%avgIntensityTotal)])

        wsf.set_column(0, 1, 12)
        wsf.set_column(2, 3, 20)
        wsf.write_row(1, 0, ['Cell Number', 'Foci in Cell','Avg Raw Foci Brightness','Avg Foci Area in %s²'%unit])
        for cellnum, numFoci in enumerate(histData):
            if numFoci > 0:
                ic = float('%.3f'%np.mean(avgIntensityPerCell[cellnum]))
                ac = float('%.3f'%(np.mean(avgAreaPerCell[cellnum])))
                wsf.write_row(cellnum + 2, 0, [cellnum, numFoci,ic,ac])
            else:
                wsf.write_row(cellnum + 2, 0, [cellnum, numFoci])

        wb.close()

    def __exportDataSetWithLabels(self, key: str, path: str, **args):
        # Get the raw contents of the inital dataset file
        data = self.session.getData(self.keys.inDataset)

        rawPickle = data['rawData']
        convertFun = data['convertIndex']


        resetFociInCellSet(rawPickle)
        for i, c in enumerate(list(self.cellsInExport)):
            # Gather all foci in this cell
            cc = self.fociContourSlections[c]
            selFoci = self.userSelectedFociPerCell[c]
            fociInCell = []
            for f, lvl in enumerate(cc):
                if f not in selFoci: continue
                fociInCell += [self.trainingData.contours[c][f][lvl]]

            # Get the location of the cell in dataset
            batchNum, cellNumInBatch = convertFun(c)
            addFocusToCellSet(rawPickle, batchNum, cellNumInBatch, fociInCell)

        with open(path, 'wb') as handle:
            pickle.dump(rawPickle, handle, protocol=pickle.HIGHEST_PROTOCOL)

    def exportData(self, key: str, path: str, type:str, **args):
        #Get the data that needs to be exported
        data = self.session.getData(key)
        if type =='xlsx' :
            self.__exportXLSX(key,path,**args)
        elif type =='cells' :
            self.__exportDataSetWithLabels(key,path,**args)

        #Write a file with this data or postprocess it in some way
        #...

