import inspect
import pickle
from random import random
from typing import Tuple, Optional

import numpy as np

from src.py.loaders.fileloaders import LoaderResult
from src.py.types.CellsDataset import CellsDataset
from src.sammie.py.util.imgutil import getPreviewImage


def __generateDataSetPreview(allImages, previewGridSize):
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

def loadCells(asPreview:bool, pipekey:str, filePath:str,previewGridSize:Tuple[int,int] = (3,3))->Optional[LoaderResult]:
    print('[loadCells]: %s from %s'%(pipekey,filePath))

    with open(filePath, 'rb') as handle:
        curData = pickle.load(handle)

    #check if new attributes were added to the dataset

    #Merge all batch images into a single one
    allImages = []
    allContours = []
    cellToBatch = []
    cellToIdxInBatch = []
    labeledCells:int = 0
    for i in curData['data']:
        cdi:CellsDataset = curData['data'][i]
        labeledCells += cdi.getNumLabeledCells()
        imgs,cnts = cdi.getSingleCellImagesAndContours(3)
        allImages += imgs
        allContours += cnts
        cellToBatch += [i] * len(imgs) #conversion to retrieve batch number from cell number
        cellToIdxInBatch += list(range(0,len(imgs)))

    #Converts the index of a cell in the flat array, to batchnumber + index inside batch
    convertIndex = lambda cidx: (cellToBatch[cidx],cellToIdxInBatch[cidx])

    data = {'imgs':allImages,'contours':allContours, 'convertIndex':convertIndex, 'rawData':curData }
    meta = {'Cells':len(allImages), 'Batches':len(curData['data'])}
    if labeledCells > 0:
        meta['Labeled Cells'] = labeledCells
    scale = [curData['data'][i].scale for i in curData['data'] if curData['data'][i].scale is not None]
    if len(scale) > 0:
        meta['1px'] = '%.2fnm'%scale[0]
        data['1px'] = scale[0]
        if len(set(scale)) != 1:
            meta['Warning'] = 'Batches have different scales'

    preview = getPreviewImage(__generateDataSetPreview(allImages,previewGridSize),pipekey,True)
    return LoaderResult(data,preview['url'],meta)
