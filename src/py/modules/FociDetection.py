import csv
from typing import Tuple, List

import matplotlib.pyplot as plt
import numpy as np
import skimage.measure
from skimage import exposure

import src.py.exporters as exporters
from src.py.eeljsinterface import eeljs_sendProgress
from src.py.modules.FociDetectionUtil.FociAltFilter import FociAltFilter, FociAltFilterParams
from src.py.modules.FociDetectionUtil.FociAltFilterResult import FociAltFilterResult
from src.py.modules.FociDetectionUtil.FociDetectorSmudge import FociDetectorSmudgeParams, FociDetectorSmudge, \
    FociDetectorSmudgeResult
from src.py.modules.ModuleBase import ModuleBase
from src.py.util import imgutil
from src.py.util import shapeutil
from src.py.util.imgutil import getPreviewImage
from src.py.util.util import tic, toc


class FociDetectionKeys:
    inMaskImage: str
    inIntensityImage: str
    outFoci: str

    def __init__(self, inputs, outputs):
        self.inMaskImage = inputs[0]
        self.inIntensityImage = inputs[1]
        self.outFoci = outputs[0]

class SingleCellResult:

    blobs:np.ndarray     # Result of LoG detection
    cellImg:np.ndarray   # 0-1 gloat Image of Cell
    tightMask:np.ndarray # Binary Mask

    fociBasins:List[np.ndarray] # List (F) of M x 2 array of r-c-coordinates
    fociBasinMeta:np.ndarray # F x 4 Additional information for each foci: center_r, center_c, intensity, basinlevel
    acceptedFoci:np.ndarray # F x 1 binary array of user choice of acceptance
    manuallyIgnored:bool

    def __init__(self, r:FociDetectorSmudgeResult):
        self.blobs = r.blobs
        self.cellImg = r.cellImg
        self.tightMask = r.tightMask
        self.fociBasins = None
        self.fociBasinMeta = None
        self.acceptedFoci = []
        self.manuallyIgnored = False

    def getBlobsAsListOfLists(self,ts, exceptionIDs = None, scale = None):
        if exceptionIDs is None:
            validBlobs = range(0,len(self.blobs))
        else:
            validBlobs = list(filter(lambda x: x not in exceptionIDs, range(0,len(self.blobs))))

        vBlobs = self.blobs[validBlobs,:]
        filtered:np.ndarray = vBlobs[vBlobs[:,3] > ts]
        if scale is not None:
            filtered[:,0:3] *= scale #mind scale which is 1px = 40nm for example

        return filtered.tolist()


    def setIsDeleted(self, deleted:bool):
        self.manuallyIgnored = deleted

    def setAcceptedFoci(self, af):
        self.acceptedFoci = af

    def addFociFilterRes(self,r:FociAltFilterResult):
        accInd = r.getAccpetedIndices()
        self.fociBasinMeta = np.zeros((len(accInd),4))
        self.acceptedFoci = np.ones((len(accInd),),dtype='bool')
        self.fociBasins = []
        for i,aidx in enumerate(accInd):
            el = r[aidx]
            self.fociBasins += [{'x':el['cnt'][:,1].tolist(),'y':el['cnt'][:,0].tolist()}]
            self.fociBasinMeta[i,:] = [el['pos'][0],el['pos'][1],el['max'],el['level']]

    def getCSVExportData(self,scale = 1):
        if self.manuallyIgnored:
            return None

        data = []
        # ['Cell Num', 'Foci Num', 'x in px', 'y in px', 'MajorAxis in px', 'MinorAxis in px', 'Area in px^2',
            #  'peakBrightness', 'contourBrightness'])
        #1. draw accepted basins onto a canvas to use regionproperties for all kinds of analysis.
        for i,b in enumerate(self.fociBasins):
            if not self.acceptedFoci[i]: continue
            binMask,ox,oy = shapeutil.getPolygonMaskPatch(self.fociBasins[i]['x'],self.fociBasins[i]['y'])
            region = skimage.measure.regionprops(binMask.astype('int'))[0]
            data += [[
                self.fociBasinMeta[i,1] * scale,  #X
                self.fociBasinMeta[i,0] * scale,  #Y,
                region.major_axis_length * scale, #dimension
                region.minor_axis_length * scale,
                region.filled_area * scale**2, #area
                self.fociBasinMeta[i,2], #peakBrightness
                self.fociBasinMeta[i,3], #contourBrightnes
            ]]

        return data

class FociDetection(ModuleBase):

    individualThreshholds: List[float]
    individualExceptions: List
    keys: FociDetectionKeys

    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.log = 'FociDetection'
        self.trace('initialized')

    def unpackParams(self,fociRadius,detMethod,brightnessThreshold,minFociBrightness,splitmode,**irrelevantParameters):
        #increase sigma by 1 px per step appx.
        sigSteps = int((fociRadius[1] - fociRadius[0]))

        #unpack and possibly parse/cast all parameters
        return (fociRadius[0],fociRadius[1],sigSteps),detMethod,brightnessThreshold[0],minFociBrightness[0],splitmode

    def __getRegions(self, img, mask):
        labels = skimage.measure.label(mask)
        regions = skimage.measure.regionprops(labels)
        return regions

    def __generatePreviews(self, res:List[SingleCellResult]):
        js = []
        for i,cell in enumerate(res):
            foci = []
            if len(cell.blobs) > 0 : foci = cell.blobs.tolist()

            pimg = getPreviewImage(cell.cellImg,self.keys.outFoci + '_c'+str(i))
            js += [{'foci':foci,
                    'basins':cell.fociBasins,
                    'basinmeta':cell.fociBasinMeta.tolist() if cell.fociBasinMeta is not None else [],
                    'img':pimg}]

        return js

    def run(self, action, params, inputkeys,outputkeys):
        self.keys = FociDetectionKeys(inputkeys, outputkeys)

        if action == 'excludeBasin':
            cidx = params['cellnum']

            finalResults: List[SingleCellResult] = self.session.getData(self.keys.outFoci)
            finalResults[cidx].setAcceptedFoci(params['accepted'])
            finalResults[cidx].setIsDeleted(params['deleted'])
            self.onGeneratedData(self.keys.outFoci, finalResults, params)

            return True

        elif action == 'adjustThreshholds':
            #for curvature method
            self.individualThreshholds = params['ts']
            self.individualExceptions = params['exceptions']

        elif action == 'apply':
            sigmaRange, detMethod, brightnessThreshold,minFociBrightness,splitmode = self.unpackParams(**params)

            intensityImage = self.session.getData(self.keys.inIntensityImage) #binaryMask
            if params['useSqrt'] and detMethod == 'brightness':
                intensityImage = np.sqrt(intensityImage)

            maskImage = self.session.getData(self.keys.inMaskImage) #binaryMask
            fds = FociDetectorSmudgeParams(sigmaRange= sigmaRange,enableSmudge=False)
            fd = FociDetectorSmudge(fds)

            cells = self.__getRegions(intensityImage,maskImage)

            results:List[SingleCellResult] = []
            ffp = FociAltFilterParams((sigmaRange[0], sigmaRange[1]),0.01,splitmode)
            brightnessFilter = FociAltFilter(ffp)

            for i,c in enumerate(cells):
                res = fd.run(intensityImage[c.slice[0],c.slice[1]],c.filled_image)
                srr = SingleCellResult(res)
                if detMethod == 'brightness':
                    #select foci above the needed value
                    # accBlobs,accBasins = brightnessFilter.run(np.copy(res.cellImg),res.tightMask,res.blobs)
                    res = brightnessFilter.run(np.copy(res.cellImg),res.tightMask,res.blobs)
                    srr.addFociFilterRes(res)

                results += [srr]

                if self.abortSignal(): return None
                eeljs_sendProgress(float(i) / len(cells))

            self.individualThreshholds = [params['fociThreshold'][0]] * len(cells)
            self.individualExceptions = [[]] * len(cells)
            self.onGeneratedData(self.keys.outFoci, results, params)

            return self.__generatePreviews(results)

    def exportData(self, key: str, path: str, **args):
        res:List[SingleCellResult] = self.session.getData(key)
        p = self.session.getParams(key)
        inputParams = self.session.getParams(self.keys.inIntensityImage)
        scale = None
        if 'meta' in inputParams and '__1px' in inputParams['meta']:
            scale = inputParams['meta']['__1px']
        with open(path, 'w', newline='') as csvfile:
            wr = csv.writer(csvfile, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)

            if(p['detMethod'] == 'curvature'):
                if scale is not None: wr.writerow(['Cell Num', 'Foci Num', 'x in µm', 'y in µm','radius in µm','score','comment'])
                else: wr.writerow(['Cell Num', 'Foci Num', 'x', 'y','radius','score','comment'])

                for i,r in enumerate(res):
                    if self.individualThreshholds[i] < 0:
                        wr.writerow([i] + ['']*5 + ['Ignored'])
                        continue
                    blobs = r.getBlobsAsListOfLists(self.individualThreshholds[i],self.individualExceptions[i],scale)
                    if len(blobs) == 0:
                        wr.writerow([i] + [''] * 5 + ['No Foci Detected'])
                    else:
                        for j,b in enumerate(blobs):
                            wr.writerow([i,j] + b + [''])
            elif(p['detMethod'] == 'brightness'):
                if scale is not None: wr.writerow(['Cell Num', 'Foci Num','x in µm','y in µm', 'MajorAxis in µm', 'MinorAxis in µm', 'Area in µm^2','peakBrightness','contourBrightness','Comment'])
                else: wr.writerow(['Cell Num', 'Foci Num','x in px','y in px', 'MajorAxis in px', 'MinorAxis in px', 'Area in px^2','peakBrightness','contourBrightness','Comment'])

                for i,cell in enumerate(res):

                    blobs = cell.getCSVExportData(scale)
                    if blobs is not None: #will be none if manually ignored
                        for j,b in enumerate(blobs):
                            wr.writerow([i,j] + b)
                        if len(blobs) == 0:
                            wr.writerow([i]+['']*8 + ['No Foci Detected'])

                    else:
                        wr.writerow([i]+['']*8 + ['Ignored'])
