import pickle

from src.py.loaders import loadBinaryImage
from src.py.loaders.fileloaders import LoaderResult
from src.py.types.MaskFile import MaskFile
from src.sammie.py.util.imgutil import getPreviewImage


def loadMaskFileFromBinaryImage(asPreview:bool, pipekey:str, filePath:str):
    r:LoaderResult = loadBinaryImage(asPreview,pipekey,filePath)
    maskFile = MaskFile(r.data,None)
    maskFile.extractCellOutlinesFromMaskImage()
    r.data = maskFile

    return r

def loadMaskFile(asPreview:bool, pipekey:str, filePath:str):
    with open(filePath,'rb') as handle:
        data = pickle.load(handle)

    maskFile = MaskFile(**data)
    if asPreview:
        preview = getPreviewImage(maskFile.getPreviewImg(),pipekey+'_preview')
    else:
        preview = getPreviewImage(maskFile.ref,pipekey+'_preview')

    return LoaderResult(maskFile, preview['url'], {'Width': maskFile.ref.shape[1], 'Height': maskFile.ref.shape[0], 'Cells':len(maskFile.cells)})