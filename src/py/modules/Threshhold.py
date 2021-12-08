import numpy as np
import skimage.filters
from skimage import exposure

from src.py.exporters.filexporters import exportBinaryImage
from src.sammie.py.modules.ModuleBase import ModuleBase
from src.sammie.py.util import imgutil


class Threshhold(ModuleBase):

    runNumber: int #Used to create multiple preview images of consecutive steps, so that UI can show previos images


    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.log = 'Threshhold'
        self.trace('initialized')
        self.runNumber = 0


    #Will generate a logical mask based on threshholding values
    def getBinaryMask(self, img:np.ndarray, min:float, max:float, invert:bool):
        m1 = img < min
        m2 = img > max

        #Will take strong whites and dark blacks
        if invert:
            return np.logical_or(m1, m2)

        #Will exclude strong whites and dark blacks
        return np.logical_not(np.logical_or(m1, m2))

    def run(self, action, params, inputkeys,outputkeys):

        if action == 'apply':
            self.tic()
            inputImg = self.session.getData(inputkeys[0]) #float, 0-1

            #add additional smoothing if needed
            if params['src'] == 'grad':
                grad = skimage.filters.sobel(inputImg)
                inputImg = skimage.filters.gaussian(grad,params['smoothing'][0])
                inputImg = imgutil.norm(inputImg)
            if params['src'] == 'frangi':
                blackRidges = params['ridgecol'] == 'black'
                s = params['smoothing'][0]
                inputImg = skimage.filters.frangi(inputImg,sigmas=(s,s,1),black_ridges=blackRidges)
                #we use SQRT for the threhshold to be a little bit closer to the range of the others
                inputImg = imgutil.norm(inputImg)
                inputImg = exposure.equalize_adapthist(inputImg, clip_limit=0.03)
                # inputImg = np.sqrt(imgutil.norm(inputImg))

            if params['ttype'] == 'band':
                self.trace('Threshholding band:%.2f - %.2f'%(params['innerband'][0],params['innerband'][1]))
                tImage = self.getBinaryMask(inputImg, params['innerband'][0], params['innerband'][1], False)
            elif params['ttype'] == 'whiteorblack':
                self.trace('Threshholding outside band:%.2f - %.2f'%(params['outerband'][0],params['outerband'][1]))
                tImage = self.getBinaryMask(inputImg, params['outerband'][0], params['outerband'][1], True)

            preview = imgutil.getTransparentMask(tImage, (255, 0, 0), outputkeys[0] + str(self.runNumber), True)
            self.runNumber = (self.runNumber + 1) % 2

            self.onGeneratedData(outputkeys[0], tImage, params)

            self.toc('Threshholding')

            return preview

    def exportData(self, key: str, path: str, **args):
        exportBinaryImage(path, self.session.getData(key))





