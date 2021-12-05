import csv
from typing import Tuple, List, Set

import numpy as np
import skimage.measure
from shapely.geometry import Polygon
from skimage.measure._regionprops import RegionProperties

import src.py.exporters as exporters
from src.py.eeljsinterface import eeljs_sendProgress
from src.py.modules.FociCandidatesUtil.FociCandidateData import FociCandidateData
from src.py.modules.LabelingUtil import LabelingResult
from src.py.modules.LabelingUtil.TrainingData import TrainingData
from src.py.modules.ModuleBase import ModuleBase
from src.py.modules.TrainingUtil.SVMClassifier import SVMClassifier
from src.py.util import imgutil
from src.py.util.imgutil import addBorder, getPreviewImage
from src.py.util.shapeutil import getPolygonMaskPatch


class FociDetectionModelKeys:
    inModel: str
    inDataset: str
    outFoci: str

    def __init__(self, inputs, outputs):
        self.inModel = inputs[0]
        self.inDataset = inputs[1]
        self.outFoci = outputs[0]

class FociDetectionModel(ModuleBase):

    keys: FociDetectionModelKeys
    classifier: SVMClassifier
    trainingData: TrainingData
    cells: Set
    loadedPortion:float
    cellsInExport: Set
    result: LabelingResult
    dataLoaded:bool

    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
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

        elif action == 'apply':

            sizeAdjustment,portion = self.unpackParams(**params)

            if not self.dataLoaded or self.loadedPortion != portion:
                self.loadedPortion = portion
                model = self.session.getData(self.keys.inModel) #binaryMask
                self.classifier = model['model']

                #Prepare dataset

                #get all images
                allCells: List[np.ndarray] = self.session.getData(self.keys.inDataset)['imgs']  # List of images with cells

                #pick a portion of dataset
                nc = int(len(allCells) * self.loadedPortion/100.0)
                if nc < 1: nc  = 1
                if nc > len(allCells)-1: nc  = len(allCells)-1
                allCells = allCells[0:nc]

                # add a border to prevent problems with contours landing outside of image
                allCells = [addBorder(i, 3) for i in allCells]

                self.cells = set(range(0,len(allCells)))
                self.cellsInExport = set(range(0,len(allCells)))

                #Generate the contour loops candidates
                fociData = FociCandidateData(allCells)
                fociData.extractContours(model['extractionparams']['fociSize'],
                                              model['extractionparams']['granularity'][0],
                                         progressMsg='1/2 Extracting Contour Candidates')

                #Create a full list of all contours for all foci in all cells in dataset
                self.trainingData:TrainingData = TrainingData()
                for i in self.cells:
                    cnt = fociData.extractLabellingContour(i,model['extractionparams']['fociSize'],
                                              model['extractionparams']['granularity'][0])
                    #Add the cells to the training set and extract features
                    self.trainingData.addCell(allCells[i], cnt['foci'])
                    eeljs_sendProgress(i/len(self.cells),'2/2 Extracting Foci Features')


                #Predict the foci using the model
                eeljs_sendProgress(-1,'Classifying Foci')
                self.result = self.classifier.predict(self.trainingData)

                # generate preview Images for all cells
                self.previews = [getPreviewImage(img, self.keys.outFoci + '_%d' % i) for i, img in enumerate(allCells)]

                self.dataLoaded = True


            #Adjust sizes
            adjustedChoices = self.getFociWithSizeAdjustment(sizeAdjustment)

            #get the polygon data for the selected foci
            allFoci = []
            for c in self.cells:
                cc = adjustedChoices[c]
                fociInCell = []
                for f, lvl in enumerate(cc):
                    if lvl == -1: continue
                    #get the contour at predicted level
                    cnt = self.trainingData.contours[c][f][lvl]
                    fociInCell += [{'x': np.around((cnt[:, 1]), decimals=3).tolist(),
                                    'y': np.around((cnt[:, 0]), decimals=3).tolist()}]

                allFoci += [fociInCell]

            self.onGeneratedData(self.keys.outFoci, adjustedChoices, params)

            return {'imgs': self.previews, 'foci':allFoci}

    def getFociWithSizeAdjustment(self,adjFactor:float):
        adjustedChoices = []
        for c in self.cells:
            cc = self.result.contourChoices[c]
            cc2 = [-1] * len(cc)

            for f, lvl in enumerate(cc):
                if lvl == -1: continue

                #get areas of all contour of this focus
                areas = np.array([Polygon(c).area for c in self.trainingData.contours[c][f]])
                #calculate the desired area
                desiredArea = areas[lvl] * adjFactor
                cc2[f] = np.argmin(np.abs(areas - desiredArea))

            adjustedChoices += [cc2]

        return adjustedChoices

    def exportData(self, key: str, path: str, **args):
        scale = args['1px'] if '1px' in args else 1

        with open(path, 'w', newline='') as csvfile:
            wr = csv.writer(csvfile, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
            #write header
            if scale != 1:
                wr.writerow( ['Cell', 'Focus', 'x in nm', 'y in nm', 'Area in nm^2',
                     'peakBrightness','meanBrightness', 'contourBrightness'])
            else:
                wr.writerow( ['Cell', 'Focus', 'x in px', 'y in px', 'Area in px^2',
                     'peakBrightness','meanBrightness', 'contourBrightness'])

            adjustedFociChoices = self.session.getData(self.keys.outFoci)

            for i,c in enumerate(list(self.cellsInExport)):
                cc = adjustedFociChoices[c]
                nf = 0
                for f, lvl in enumerate(cc):
                    if lvl == -1: continue
                    binMaskOuter, offx, offy = getPolygonMaskPatch(self.trainingData.contours[c][f][lvl][:, 1], self.trainingData.contours[c][f][lvl][:, 0], 0)
                    region:RegionProperties = skimage.measure.regionprops(binMaskOuter.astype('int'),
                                                            self.trainingData.imgs[c][offy:offy + binMaskOuter.shape[0],
                                                            offx:offx + binMaskOuter.shape[1]])[0]

                    area = Polygon(self.trainingData.contours[c][f][lvl]).area
                    center = self.trainingData.getFociCenters(c,[f])
                    wr.writerow([i,nf,center[0,1] * scale,center[0,0] * scale,
                                 area * (scale**2),
                                 region.max_intensity,
                                 region.mean_intensity,
                                 self.trainingData.contourLevels[c][f][lvl]])

                    nf += 1
