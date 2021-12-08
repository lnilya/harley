from typing import Tuple

import numpy as np
import skimage.measure

from src.sammie.py.modules.ModuleBase import ModuleBase
from src.sammie.py.util import imgutil


class CellDetection(ModuleBase):

    previewDetectedCellImages = None #For Frontend: Cache of the Transparent ColorImage displaying Threshholded areas
    previewCellChoice = None #For Frontend: array of indices of accepted cells
    previewCellBorder = None #For Frontend: array of indices of border cells
    detectedCells = None #Output: List of RegionProps


    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.log = 'CellDetection'
        self.trace('initialized')
        self.runNumber = 0

    def floodFillCells(self,thinnedImg):
        curFill = 2
        filledImage = np.copy(thinnedImg)
        for r in range(0, thinnedImg.shape[0]):
            for c in range(0, thinnedImg.shape[1]):
                if filledImage[r, c] != 0: continue
                mask = skimage.morphology.flood(thinnedImg, (r, c), connectivity=1)
                filledImage[mask] = curFill
                curFill += 1

        # remove boundaries
        filledImage[filledImage == 1] = 0

        return filledImage

    def filterCells(self,params,thinnedInputImg):
        filledBlobs = self.floodFillCells(thinnedInputImg)

        solidity: Tuple[float, float] = params['solidity']
        size: Tuple[float, float] = params['size']

        filledBlobs = skimage.measure.label(filledBlobs)

        allBlobs = np.copy(filledBlobs)
        rprops = skimage.measure.regionprops(filledBlobs)

        allCells = [] #List of RegionProperties

        for r, region in enumerate(rprops):
            r += 1
            print('#', r, 'size: ', region.filled_image.shape, 'solid:',region.solidity)
            reject = False
            # reject by size
            minRegionDim = min(region.filled_image.shape)
            maxRegionDim = max(region.filled_image.shape)
            if minRegionDim < size[0] or maxRegionDim > size[1]: reject = True

            if region.solidity < solidity[0] or region.solidity > solidity[1]: reject = True

            # reject by area difference
            if region.solidity < solidity[0] or region.solidity > solidity[1]: reject = True

            print('Rejected', reject)
            if reject:
                filledBlobs[filledBlobs == r] = 0

            isBorder = False
            if 0 in region.bbox or thinnedInputImg.shape[1] in region.bbox or thinnedInputImg.shape[0] in region.bbox:
                isBorder = True

            #We identify background by a blob that is simply bigger than a 1/2 of the image h or w
            if maxRegionDim < (thinnedInputImg.shape[1] * 0.5) and maxRegionDim < (thinnedInputImg.shape[0] * 0.5):
                allCells.append({'region':region,'accepted':(not reject) and (not isBorder), 'border':isBorder})

        return allCells

    def run(self, action, params, inputkeys,outputkeys):

        if action == 'apply':
            inputImg = self.session.getRawData(inputkeys[0]) #thinned Image
            self.detectedCells = self.filterCells(params,inputImg)
            self.previewDetectedCellImages = None
            self.onGeneratedData(outputkeys[0], params)
            return self.getJSOutput(outputkeys[0])

    def getRawOutput(self, key: str):
        return self.detectedCells

    def getJSOutput(self, key: str):
        #Create transparent image
        if self.previewDetectedCellImages is None:
            self.previewDetectedCellImages = []
            self.previewCellChoice = []
            self.previewCellBorder = []
            for i,c in enumerate(self.detectedCells):
                region = c['region']
                cell = imgutil.getTransparentMask(region['filled_image'], (255, 0, 0), key + '_' + str(i), True)
                self.previewDetectedCellImages.append({'x':region.bbox[1],'y':region.bbox[0],'img':cell})
                if c['accepted']: self.previewCellChoice.append(i)
                if c['border']: self.previewCellBorder.append(i)

        return {'blobs':self.previewDetectedCellImages, 'border':self.previewCellBorder, 'accepted': self.previewCellChoice}
