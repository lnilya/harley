import os.path
import pickle
import time
from typing import Dict

from src.sammie.py.ModuleConnector import AggregatorFileInfo, AggregatorReturn
from src.sammie.py.SessionData import SessionData
from src.sammie.py.modules.ModuleBase import ModuleBase
from src.sammie.py.util import shapeutil


def __getBaseAggregateFile():
    return {'data':{},'created':time.time()}

def __getDataSetInfoObject(curData) -> AggregatorFileInfo:
    if len(curData['data']) == 0:
        return AggregatorFileInfo(True,True,'File exists, but contains no results yet.')

    return AggregatorFileInfo(True,True,'File contains results from %d batches'%(len(curData['data'])))

def __getBatchData(session:SessionData, modulesById:Dict[str, ModuleBase],scalePxToNm:float = None):
    denoised = "Denoised Image"
    tightCells = "Tight Cells"

    denoisedImage = session.getData(denoised)  #the cells
    tightContourList = session.getData(tightCells)  #the cells as outlines

    cellImages = []

    for i in modulesById['MaskTightening'].userAcceptedContours:
        cnt = tightContourList[i]
        maskPatch, dx, dy = shapeutil.getPolygonMaskPatch(cnt['x'], cnt['y'], 0)
        img = denoisedImage[dy:dy+maskPatch.shape[0],dx:dx+maskPatch.shape[1]]
        minIntensity = img[maskPatch].min()
        maxIntensity = img[maskPatch].max()
        img = (img - minIntensity) / (maxIntensity - minIntensity)
        img[maskPatch == False] = 0

        cellImages += [img]

    return {'images':cellImages, 'scale':scalePxToNm}

def appendToCellSet_Info(destinationPath:str) -> AggregatorFileInfo:
    filename = os.path.basename(destinationPath)
    ext = filename.split('.')
    if len(ext) > 1:
        ext = ext[-1]
    else:
        return AggregatorFileInfo(False,False,'Add a file with a *.cells extension.')

    if ext != 'cells':
        return AggregatorFileInfo(False,False,'File extension should be *.cells')

    if not os.path.exists(destinationPath):
        return AggregatorFileInfo(False,True,'The selected file will be created on first export.')

    try:
        with open(destinationPath, 'rb') as handle:
            curData = pickle.load(handle)
    except:
        return AggregatorFileInfo(True,True,'File exists but is corrupt and can\'t be loaded. It will be overwritten on export.')

    return __getDataSetInfoObject(curData)

def appendToCellSet_Reset(destinationPath:str):
    with open(destinationPath, 'wb') as handle:
        pickle.dump(__getBaseAggregateFile(), handle, protocol=pickle.HIGHEST_PROTOCOL)

    return True

def appendToCellSet(destinationPath:str,data:SessionData, modulesById:Dict[str, ModuleBase], batchNum:int, adtlParams:Dict = None)->AggregatorReturn:
    scale = None
    if '1px' in adtlParams: scale = adtlParams['1px']

    curData:Dict = __getBaseAggregateFile()

    reset:bool = False
    #Read file if it exists
    if os.path.exists(destinationPath):
        try:
            with open(destinationPath, 'rb') as handle:
                curData = pickle.load(handle)
        except:
            #reset file
            reset = True
            curData = __getBaseAggregateFile(scale)
            appendToCellSet_Reset(destinationPath)

    overwritten:bool = batchNum in curData['data']

    #Add the data from this batch
    curData['data'][batchNum] = __getBatchData(data,modulesById, scale)

    #Overwrite with new data
    with open(destinationPath, 'wb') as handle:
        pickle.dump(curData, handle, protocol=pickle.HIGHEST_PROTOCOL)

    if overwritten and not reset:
        msg = 'Overwritten batch %d results in dataset: Currently %d entries. '%(batchNum, len(curData['data']))
    elif not overwritten and not reset:
        msg = 'Added batch %d results to dataset. Currently %d entries. '%(batchNum, len(curData['data']))
    else:
        msg = 'Reset file and added batch %d results to dataset.'%(batchNum)

    return AggregatorReturn(msg,__getDataSetInfoObject(curData))
