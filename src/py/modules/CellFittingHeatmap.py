from typing import List

import cv2
import numpy as np

import src.py.modules.CellFittingUtil as cf
from src.py.modules.ModuleBase import ModuleBase
from src.py.util.imgutil import getPreviewHeatMap, getTransparentMask
from src.py.util import imgutil

class CellFittingOutKeys:
    heatmapKey:str
    skeletonKey:str
    def __init__(self,fromArray:List[str]):
        self.heatmapKey = fromArray[0]
        self.skeletonKey = fromArray[1]


class CellFittingHeatmap(ModuleBase):

    outKeys:CellFittingOutKeys = None

    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.log = 'CellFittingHeatmap'
        self.trace('initialized')
        self.runNumber = 0


    def run(self, action, params, inputkeys,outputkeys):
        self.outKeys = CellFittingOutKeys(outputkeys)

        if action == 'apply':
            # create a thinned image
            inputImg = self.session.getData(inputkeys[0])  # cleaned image
            timg = np.copy(inputImg).astype('uint8')
            timg[timg > 0] = 255
            skeleton = cv2.ximgproc.thinning(timg)
            fastmode = params['fastmode']
            # if fastmode:
            #     heatmap = cf.generateHeatMapFast(self.abortSignal,skeleton,tuple(params['radiusbounds']),params['minpercboundary'][0])
            # else:
            if fastmode:
                stride = 10
            else:
                stride = params['stride'][0]
            heatmap = cf.generateHeatMap(self.abortSignal, skeleton, tuple(params['radiusbounds']), params['minpercboundary'][0],stride,fastMode=fastmode)

            if self.abortSignal():
                raise RuntimeError('Aborted execution.')

            self.onGeneratedData(self.outKeys.heatmapKey,heatmap, params) #heatmap
            self.onGeneratedData(self.outKeys.skeletonKey,skeleton, params) #skeleton image

            return {'heatmap': getPreviewHeatMap(heatmap, self.outKeys.heatmapKey,True),
                       'skel': getTransparentMask(skeleton, (255,0,0), self.outKeys.skeletonKey,True)}