from typing import Tuple

import numpy as np
import skimage.measure

from src.py.modules.ModuleBase import ModuleBase
from src.py.util import imgutil


class BlobRemoval(ModuleBase):

    previewCleanedImage = None #For Frontend: Cache of the Transparent ColorImage displaying Threshholded areas
    cleanedImage = None #Output: Binary file


    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.log = 'BlobRemoval'
        self.trace('initialized')
        self.runNumber = 0


    #Will remove blobs based on various parameters inside params
    def removeBlobs(self,binMask:np.ndarray,params):
        solidity:Tuple[float,float] = params['sb_solidity']
        eccentricity:Tuple[float,float] = params['sb_eccentricity']
        minArea:int = params['sb_area'][0]
        minBboxDim:int = params['sb_size'][0]

        res = skimage.measure.label(binMask, 0, connectivity=2)
        rprops = skimage.measure.regionprops(res)

        for r, region in enumerate(rprops):
            r += 1
            # print('#', r, '--', region.filled_image.shape)
            reject = False

            # reject by bbox dim
            minRegionDim = min(region.filled_image.shape)
            if minRegionDim <  minBboxDim: reject = True

            # reject by size
            if region.area <= minArea: reject = True

            # reject by eccentricty
            if region.eccentricity <= eccentricity[0] or region.eccentricity >= eccentricity[1]: reject = True

            # reject by convexAreaRatio
            if region.solidity < solidity[0] or region.solidity > solidity[1]: reject = True

            if reject:
                binMask[res == r] = False

        return binMask

    def run(self, action, params, inputkeys,outputkeys):

        if action == 'apply':
            inputImg = self.session.getData(inputkeys[0]) #binaryMask

            cleanedImage = inputImg
            if params['removeblobs']:
                cleanedImage = self.removeBlobs(np.copy(inputImg),params)

            ret = imgutil.getTransparentMask(cleanedImage,(255,0,0),outputkeys[0], True)
            self.onGeneratedData(outputkeys[0], cleanedImage,params)

            return ret