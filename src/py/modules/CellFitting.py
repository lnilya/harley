from typing import List

import cv2
import matplotlib.pyplot as plt
import numpy as np
import pickle
import src.py.modules.CellFittingUtil as cf
from src.sammie.py.eeljsinterface import eeljs_sendProgress
from src.py.exporters.filexporters import exportBinaryImage
from src.py.modules.CellFittingUtil.DetectedCells import DetectedCells
from src.sammie.py.modules.ModuleBase import ModuleBase
from src.sammie.py.util import shapeutil
from src.sammie.py.util.imgutil import getPreviewHeatMap, setUpSubplot


class CellFittingKeys:
    inScoremap: str
    inSrcImg: str
    inSkeleton: str
    outEllipses: str

    def __init__(self, inputs, outputs):
        self.inScoremap = inputs[0]
        self.inSkeleton = inputs[1]
        self.inSrcImg = inputs[2]
        self.outEllipses = outputs[0]


class CellFitting(ModuleBase):
    detectedPolygonOutlines: List[dict]
    keys: CellFittingKeys
    threshholdedHeatmap = None  # Grayscale float heatmap 0-1

    acceptedPoints = None  # Mx1 array of accepted point indices
    acceptedEllipses = None  # Mx1 array of accepted Ellipse indices
    detectedCells:DetectedCells

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.log = 'CellFitting'
        self.trace('initialized')
        self.runNumber = 0
        self.lastParams = {}

    def showDebugPlots(self, params):
        raw_image = self.session.getData(self.keys.inSrcImg)
        # Load the heatmap
        heatmap = self.session.getData(self.keys.inScoremap)  # scoremap
        heatmapParams = self.session.getParams(self.keys.inScoremap)

        # obtained thinned image for ellipse reconstruction
        skelImg = self.session.getRawData(self.keys.inSkeleton)
        maxRad = heatmapParams['radiusbounds'][1]
        skelImg = cv2.copyMakeBorder(skelImg, maxRad, maxRad, maxRad, maxRad,
                                     cv2.BORDER_CONSTANT)

        # Detect the Maxima
        maxMap, pos, errs, ap = cf.findMaximaInHeatmap(heatmap, params['minconfidence'][0], params['masksize'][0],
                                                       params['mindist'][0])

        ax = setUpSubplot(2, 2, 'Heatmap', ['Heatmap', 'Peaks', 'Original', 'Accepted'])
        ax[0].imshow(heatmap)
        ax[1].imshow(maxMap, cmap='gray')
        ax[2].imshow(raw_image, cmap='gray')
        ax[2].scatter(pos[:, 1], pos[:, 0])
        for i, err in enumerate(errs):
            ax[2].annotate('%.2f' % (err * 100), (pos[i, 1], pos[i, 0]), fontsize=8, c='r')

        ax[3].imshow(skelImg)
        ax[3].scatter(pos[ap, 1] + maxRad, pos[ap, 0] + maxRad, c='r', marker='x')
        for num, i in enumerate(pos[ap, :]):
            x, y, a, b, rot = cf.analyzePatch(skelImg, i + maxRad, tuple(heatmapParams['radiusbounds']), 0,
                                              heatmapParams['minpercboundary'][0], returnEllipse=True)
            ax[3].plot(x, y, 'r-')
            ax[3].annotate('%d' % (ap[num]), (pos[ap[num], 1], pos[ap[num], 0]), fontsize=8, c='r')

        plt.show()



    def exportData(self, key: str, path: str, type:str, **args):

        if type == 'png':
            heatmap = self.session.getData(self.keys.inScoremap)
            resImg = np.zeros_like(heatmap,dtype='uint8')
            for ap in self.acceptedEllipses:
                el = self.detectedPolygonOutlines[ap]
                maskPatch,dx,dy = shapeutil.getPolygonMaskPatch(el['x'], el['y'], 1)
                resImg = shapeutil.addPatchOntoImage(resImg, maskPatch.astype('uint8'), dy, dx)

            return exportBinaryImage(path, resImg.astype('bool'))

        elif type == 'mask':
            raw_image = self.session.getData(self.keys.inSrcImg)
            with open(path, 'wb') as handle:
                pickle.dump({
                    'ref': np.array(raw_image),
                    'cells': [self.detectedPolygonOutlines[ap] for ap in self.acceptedEllipses]
                },handle,protocol=pickle.HIGHEST_PROTOCOL)

            return True


    def run(self, action, params, inputkeys, outputkeys):

        self.keys = CellFittingKeys(inputkeys, outputkeys)

        if action == 'selectEllipses':
            self.acceptedEllipses = params['accepted']
            return True
        if action == 'apply':

            # Load the heatmap
            heatmap = self.session.getData(self.keys.inScoremap)  # scoremap
            heatmapParams = self.session.getParams(self.keys.inScoremap)

            # obtained thinned image for ellipse reconstruction
            skelImg = self.session.getData(self.keys.inSkeleton)
            maxRad = heatmapParams['radiusbounds'][1]
            skelImg = cv2.copyMakeBorder(skelImg, maxRad, maxRad, maxRad, maxRad,
                                         cv2.BORDER_CONSTANT)

            # Threshhold Heatmap
            self.threshholdedHeatmap = np.copy(heatmap)
            self.threshholdedHeatmap[heatmap < params['minconfidence'][0]] = 0

            # Detect the Maxima
            maxMap, allPoints, peakQuality, self.acceptedPoints = cf.findMaximaInHeatmap(heatmap,
                                                                                              params['minconfidence'][
                                                                                                  0],
                                                                                              params['masksize'][0],
                                                                                              params['mindist'][0])


            self.detectedCells = DetectedCells(skelImg, self.session.getData(self.keys.inSrcImg),
                                               allPoints + maxRad, tuple(heatmapParams['radiusbounds']),
                                               heatmapParams['minpercboundary'][0], self.abortSignal, eeljs_sendProgress)

            self.detectedPolygonOutlines = self.detectedCells.getCellPolygons(params['snapping'][0])
            if self.abortSignal():
                return None

            self.acceptedEllipses = np.copy(self.acceptedPoints)
            self.onGeneratedData(self.keys.outEllipses,self.detectedCells, params)

            return {'heatmap': getPreviewHeatMap(self.threshholdedHeatmap, self.keys.inScoremap + '_Threshholded', True),
                    'maxima': self.detectedPolygonOutlines,
                    'accepted': self.acceptedPoints}