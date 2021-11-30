import cv2

from src.py.modules.ModuleBase import ModuleBase
from src.py.util.imgutil import getPreviewImage
import src.py.exporters as exporters

class DenoiseKeys:
    inNoisyImg: str
    inDVImg: str
    outDenoisedImg: str

    def __init__(self, inputs, outputs):
        self.inNoisyImg = inputs[0]
        self.inDVImg = inputs[1]
        self.outDenoisedImg = outputs[0]

class Denoise(ModuleBase):

    keys: DenoiseKeys

    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.log = 'Denoise'
        self.trace('initialized')

    def floatToUint16(self,v):
        v = (v - v.min()) / (v.max() - v.min())
        v *= (2**16 - 1)
        return v.astype('uint16')

    def uintToFloat(self,v):
        v = v.astype('float')
        return (v - v.min()) / (v.max() - v.min())

    def floatToUint8(self,v):
        v = (v - v.min()) / (v.max() - v.min())
        v *= (2**8 - 1)
        return v.astype('uint8')

    def uint16ToUint8(self,v):
        v = v.astype('float')
        return self.floatToUint8(v/(2**16-1))

    def unpackParams(self,twindow,swindow,h):
        return twindow[0],swindow[0],h[0]

    def run(self, action, params, inputkeys,outputkeys):
        self.keys = DenoiseKeys(inputkeys, outputkeys)
        if action == 'apply':
            inputImg = self.session.getData(self.keys.inNoisyImg) #binaryMask

            twindow,swindow,h = self.unpackParams(**params)
            if h <= 0.1:
                denoisedImage = self.uintToFloat(inputImg)
            else:
                #TODO: Denoising currently moves 16 => 8 Bits, which is a bit of an information loss.
                denoisedImage = cv2.fastNlMeansDenoising(self.uint16ToUint8(inputImg), None, h, twindow, swindow)
                denoisedImage = self.uintToFloat(denoisedImage)

            self.onGeneratedData(self.keys.outDenoisedImg, denoisedImage, params)

            return getPreviewImage(denoisedImage,self.keys.outDenoisedImg)

    def exportData(self,key:str, path:str,**args):
        denoisedImg = self.session.getData(key)

        dvImg = self.session.getData(self.keys.inDVImg)
        pxScale = dvImg.Mrc.header.d[1]

        metaData = {'scale':'%.4f'%pxScale}

        exporters.exportGrayScaleImage(path,denoisedImg,metaData=metaData)

