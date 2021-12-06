import pickle
from typing import Tuple

import numpy as np

from src.py.loaders.fileloaders import LoaderResult
from src.sammie.py.util.imgutil import getPreviewImage


def __generateModelPreview(allImages, previewGridSize):
    # Create preview image consisting of the first cells in dataset
    samples = range(0, min(previewGridSize[0] * previewGridSize[1], len(allImages)))

    imgs = [allImages[s] for s in samples]

    #pick largest image size, will be square, so only one value
    maxDim = 0
    for img in imgs:
        if img.shape[0] > maxDim: maxDim = img.shape[0]
        if img.shape[1] > maxDim: maxDim = img.shape[1]

    #create image that will be generated
    p = np.zeros((maxDim*previewGridSize[0],maxDim*previewGridSize[1]))
    for j,img in enumerate(imgs):
        offR = (maxDim - img.shape[0]) >> 1
        offC = (maxDim - img.shape[1]) >> 1
        r,c = np.unravel_index(j,previewGridSize)
        sliceR = slice(r*maxDim + offR,r*maxDim + offR + img.shape[0])
        sliceC = slice(c*maxDim + offC,c*maxDim + offC + img.shape[1])
        p[sliceR,sliceC] = img

    return p


def loadModel(asPreview:bool, pipekey:str, filePath:str):
    with open(filePath, 'rb') as handle:
        data = pickle.load(handle)

    preview = getPreviewImage(__generateModelPreview(data['data'].imgs, (2,2)), pipekey, True)
    # {'model': self.model, 'data': self.session.getData(self.keys.inTrainingData),
    #     'labels': self.session.getData(self.keys.inLabels)}
    return LoaderResult(data, preview['url'], {'Trained on Cells': len(data['data'].imgs), 'Generalization Score':'%.2f%%'%(100*data['cvscore'])})
