import numpy as np

from src.sammie.py.modules.ModuleBase import ModuleBase
from src.sammie.py.util.imgutil import getPreviewImage
from src.sammie.py.util.util import parseRanges


class DVStackerKeys:
    inCellOutlines: str
    inMultiChannelDV: str
    outFlattenedImg: str

    def __init__(self, inputs, outputs):
        self.inMultiChannelDV = inputs[0]
        self.inCellOutlines = inputs[1]
        self.outFlattenedImg = outputs[0]

class DVStacker(ModuleBase):

    keys: DVStackerKeys

    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.log = 'DVStacker'
        self.trace('initialized')

    def norm(self,v, newMax=1, newType='uint16'):
        v = (v - v.min()) / (v.max() - v.min())
        v *= newMax
        return v.astype(newType)

    def run(self, action, params, inputkeys,outputkeys):
        self.keys = DVStackerKeys(inputkeys, outputkeys)
        if action == 'apply':
            # params['channel']
            inputImg = self.session.getData(self.keys.inMultiChannelDV) #multichannel DV
            cellOutlines = self.session.getData(self.keys.inCellOutlines) #cell outlines

            #extract the zstack in correct channel
            if len(inputImg.shape) == 4:
                if(int(params['channel']) >= inputImg.shape[0]):
                    raise RuntimeError('Cannot use channel %d since image only has channels: %s.'%(int(params['channel']),str(list(range(0,inputImg.shape[0])))))
                inputImg = inputImg[int(params['channel'])]

            #create list out of desired z planes
            zranges = range(0,inputImg.shape[0])
            if len(params['zstacks']) > 0:
                zranges = parseRanges(params['zstacks'],True)

            zranges = np.array(zranges)
            zranges = zranges[zranges >= 0]
            zranges = zranges[zranges < inputImg.shape[0]]
            if len(zranges) == 0:
                raise RuntimeError('Selected Z Planes are not in the range 0-%d of the image.'%inputImg.shape[0])
            #generate the stacked image
            if params['stacking'] == 'max':
                stackedImg = np.max(inputImg[zranges,:,:], axis=0)
            elif params['stacking'] == 'mean':
                stackedImg = np.mean(inputImg[zranges,:,:], axis=0)
            stackedImg = np.array(stackedImg)  # remove the numpy in arc type

            borderR = (cellOutlines.ref.shape[0] - stackedImg.shape[0])>>1
            borderC = (cellOutlines.ref.shape[1] - stackedImg.shape[1])>>1

            if(borderR > 0):
                simg = np.zeros((stackedImg.shape[0] + borderR * 2, stackedImg.shape[1]), dtype=stackedImg.dtype)
                simg[borderR:-borderR, :] = stackedImg
                stackedImg = simg
            elif(borderR < 0):
                stackedImg = stackedImg[borderR:-borderR,:]

            if(borderC > 0):
                simg = np.zeros((stackedImg.shape[0], stackedImg.shape[1] + borderC * 2), dtype=stackedImg.dtype)
                simg[:,borderC:-borderC] = stackedImg
                stackedImg = simg
            elif(borderC < 0):
                stackedImg = stackedImg[:,borderC:-borderC]

            #generate preview for stacked image
            stackPreview = getPreviewImage(self.norm(stackedImg,1,'float'),self.keys.outFlattenedImg)

            #add data to pipeline
            self.onGeneratedData(self.keys.outFlattenedImg,stackedImg, params)

            #generate Previews for ZStack Images
            previews = []
            for i,zimg in enumerate(inputImg):
                previews += [getPreviewImage(self.norm(zimg,1,'float'), self.keys.inMultiChannelDV+'_z'+str(i))]

            return {'z':previews, 'stack':stackPreview}


