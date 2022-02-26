import hashlib
import os.path
import pickle
import time
from typing import Dict, List

import matplotlib.pyplot as plt
import numpy as np

from src.py.types.CellsDataset import CellsDataset
from src.py.types.MaskFile import MaskFile
from src.sammie.py.ModuleConnector import AggregatorFileInfo, AggregatorReturn, AggregatorBatchInfo
from src.sammie.py.SessionData import SessionData
from src.sammie.py.modules.ModuleBase import ModuleBase
from src.sammie.py.util import shapeutil


def __getBatchHash(batchKey: List[str]):
    return hashlib.md5(
        ''.join(batchKey).encode()).hexdigest()  # The hash used for storage a simple concatenation of batchKeys


def __getBaseAggregateFile():
    return {'data': {}, 'created': time.time(), 'batchinfo': {}}


def __getDataSetInfoObject(curData) -> AggregatorFileInfo:
    if len(curData['data']) == 0:
        return AggregatorFileInfo(True, True, 'File exists, but contains no results yet.')
    batchInfoArr = [curData['batchinfo'][c] for c in curData['batchinfo']]
    return AggregatorFileInfo(True, True, 'File contains results from %d batches' % (len(curData['data'])),
                              batchInfoArr)


def __getBatchData(session: SessionData, modulesById: Dict[str, ModuleBase], scalePxToNm: float = None):
    denoised = "Denoised Image"
    tightCells = "Tight Cells"
    refImage = "Cell Outlines"

    denoisedImage = session.getData(denoised)  # the cells
    tightContourList = session.getData(tightCells)  # the cells as outlines
    imgShift = session.getParams(tightCells)['shift']  # the parameters
    maskFile: MaskFile = session.getData(refImage)
    cellImages = []

    acceptedContourList = [tightContourList[i] for i in modulesById['CellSelection'].userAcceptedContours]

    # We store the source image and the contours the user accepted in this dataset.
    return CellsDataset(denoisedImage, acceptedContourList, scalePxToNm, maskFile.ref, imgShift)


def appendToCellSet_Info(destinationPath: str) -> AggregatorFileInfo:
    filename = os.path.basename(destinationPath)
    ext = filename.split('.')
    if len(ext) > 1:
        ext = ext[-1]
    else:
        return AggregatorFileInfo(False, False, 'Add a file with a *.cells extension.')

    if ext != 'cells':
        return AggregatorFileInfo(False, False, 'File extension should be *.cells')

    if not os.path.exists(destinationPath):
        return AggregatorFileInfo(False, True, 'The selected file will be created on first export.')

    try:
        with open(destinationPath, 'rb') as handle:
            curData = pickle.load(handle)
    except:
        return AggregatorFileInfo(True, True,
                                  'File exists but is corrupt and can\'t be loaded. It will be overwritten on export.')

    return __getDataSetInfoObject(curData)


def appendToCellSet_Reset(destinationPath: str, batchKey: List[str]):
    success = False
    if batchKey is None:
        with open(destinationPath, 'wb') as handle:
            pickle.dump(__getBaseAggregateFile(), handle, protocol=pickle.HIGHEST_PROTOCOL)
            success = True
    else:
        with open(destinationPath, 'rb') as handle:
            curData = pickle.load(handle)
            for cb in curData['batchinfo']:
                bi:AggregatorBatchInfo = curData['batchinfo'][cb]
                if bi.compareToKey(batchKey): #found the data to delete
                    del curData['batchinfo'][cb]
                    del curData['data'][cb]
                    success = True
                    break

        if success: #Store the file back to disk
            with open(destinationPath, 'wb') as handle:
                pickle.dump(curData, handle, protocol=pickle.HIGHEST_PROTOCOL)

    return success

def appendToCellSet(destinationPath: str, data: SessionData, modulesById: Dict[str, ModuleBase], batchKey: List[str],
                    adtlParams: Dict = None) -> AggregatorReturn:
    scale = None
    if '1px' in adtlParams: scale = adtlParams['1px']

    curData: Dict = __getBaseAggregateFile()

    reset: bool = False
    # Read file if it exists
    if os.path.exists(destinationPath):
        try:
            with open(destinationPath, 'rb') as handle:
                curData = pickle.load(handle)
        except:
            # reset file
            reset = True
            curData = __getBaseAggregateFile()
            appendToCellSet_Reset(destinationPath)

    batchHash = __getBatchHash(batchKey)

    overwritten: bool = batchHash in curData['data']

    # Add the data from this batch, with current timestamp
    curData['data'][batchHash] = __getBatchData(data, modulesById, scale)
    curData['batchinfo'][batchHash] = AggregatorBatchInfo(batchKey)

    # Overwrite with new data
    with open(destinationPath, 'wb') as handle:
        pickle.dump(curData, handle, protocol=pickle.HIGHEST_PROTOCOL)

    if overwritten and not reset:
        msg = 'Overwritten results in dataset: Currently %d entries. ' % len(curData['data'])
    elif not overwritten and not reset:
        msg = 'Added results to dataset. Currently %d entries. ' % len(curData['data'])
    else:
        msg = 'Reset file and added new results to dataset.'

    return AggregatorReturn(msg, __getDataSetInfoObject(curData))


def resetFociInCellSet(curData):
    for d in curData['data']:
        curData['data'][d].removeFociContours()


def addFocusToCellSet(curData, batchNum: int, cellNum: int, fociList: List[np.ndarray]):
    """Adds foci to a data batch. curData has the same structures as exporte dby this aggregator"""
    if batchNum not in curData['data']:
        raise RuntimeError('Invalid batchnum (%d) provided for export fo cell (%d)' % (batchNum, cellNum))

    ds: CellsDataset = curData['data'][batchNum]
    ds.addFociContourForCell(cellNum, fociList)
