import os
import threading
import traceback
from typing import Dict, List

import eel

from src.py import aggregators
from src.py.SessionData import SessionData
from src.py.modules.FileLoader import FileLoader
from src.py.modules.ModuleBase import ModuleBase

executionKey:int = 0
log = True
modulesById: Dict[str, ModuleBase] = {}
modulesByExecutionKey: Dict[str, ModuleBase] = {}
session: SessionData = SessionData()
fileLoader: FileLoader = FileLoader(session)
pipelineParams: Dict = {}

def getModule(moduleID: str, moduleName: str):

    params = pipelineParams[moduleID]

    if moduleID not in modulesById:
        # Instantiate required module and return new instance
        if moduleName == 'Threshhold':
            from src.py.modules.Threshhold import Threshhold
            modulesById[moduleID] = Threshhold(moduleID,session,**params)
        elif moduleName == 'BlobRemoval':
            from src.py.modules.BlobRemoval import BlobRemoval
            modulesById[moduleID] = BlobRemoval(moduleID,session,**params)
        elif moduleName == 'Thinning':
            from src.py.modules.Thinning import Thinning
            modulesById[moduleID] = Thinning(moduleID,session,**params)
        elif moduleName == 'CellDetection':
            from src.py.modules.CellDetection import CellDetection
            modulesById[moduleID] = CellDetection(moduleID,session,**params)
        elif moduleName == 'CellFitting':
            from src.py.modules.CellFitting import CellFitting
            modulesById[moduleID] = CellFitting(moduleID,session,**params)
        elif moduleName == 'CellFittingHeatmap':
            from src.py.modules.CellFittingHeatmap import CellFittingHeatmap
            modulesById[moduleID] = CellFittingHeatmap(moduleID,session,**params)
        elif moduleName == 'CellFittingManual':
            from src.py.modules.CellFittingManual import CellFittingManual
            modulesById[moduleID] = CellFittingManual(moduleID,session,**params)
        elif moduleName == 'DVStacker':
            from src.py.modules.DVStacker import DVStacker
            modulesById[moduleID] = DVStacker(moduleID,session,**params)
        elif moduleName == 'Denoise':
            from src.py.modules.Denoise import Denoise
            modulesById[moduleID] = Denoise(moduleID,session)
        elif moduleName == 'MaskTightening':
            from src.py.modules.MaskTightening import MaskTightening
            modulesById[moduleID] = MaskTightening(moduleID,session)
        elif moduleName == 'FociDetection':
            from src.py.modules.FociDetection import FociDetection
            modulesById[moduleID] = FociDetection(moduleID,session)
        elif moduleName == 'FociCandidates':
            from src.py.modules.FociCandidates import FociCandidates
            modulesById[moduleID] = FociCandidates(moduleID,session)
        elif moduleName == 'Labeling':
            from src.py.modules.Labeling import Labeling
            modulesById[moduleID] = Labeling(moduleID,session)
        elif moduleName == 'Training':
            from src.py.modules.Training import Training
            modulesById[moduleID] = Training(moduleID,session)
        elif moduleName == 'FociDetectionModel':
            from src.py.modules.FociDetectionModel import FociDetectionModel
            modulesById[moduleID] = FociDetectionModel(moduleID,session)
        #%NEW_MODULE%

    return modulesById[moduleID]

def startThreadInModule(m:ModuleBase, asyncKey:int, params):
    print("[Eel]: Started Run in separate thread with execKey %s"%(asyncKey))
    m.startingRun()  # indicate that we started, important to be able to abort
    try:
        res = m.run(*params)
    except Exception as e:
        traceback.print_exc()
        print("[Eel]: Error or Abort in Thread %s"%(asyncKey))
        eel.asyncError(asyncKey, {'errorText':str(e)})
    else:
        print("[Eel]: Ending Thread %s"%(asyncKey))
        eel.asyncFinished(asyncKey,res)

@eel.expose
def loadInputFile(pipelinekey:str, path:str, loaderName:str, loaderArgs:Dict, batchPreviewIdx:int = -1):
    """
    Loads an file by path into the input of the pipeline
    Args:
        pipelinekey (str): The key to recognise this input by
        path (str):  Full Path to load from
        loaderName (str): See src/py/loaders/fileloaders.py for a list of loader funcitons
        loaderArgs (Dict): Any arguments to be passed to the loader, set in JS if necessary
        batchPreviewIdx (int): The batch number this preview is part of. giving a batchPReview will identify this data as simply preview and it will not be loaded into the session.
    Returns: a JS object with a preview URL and some metadata on this file.

    """
    print('[Eel]: Loading Input %s: %s (preview #%d):' % (pipelinekey,path,batchPreviewIdx))
    if batchPreviewIdx == -1:
        return fileLoader.loadFile(pipelinekey,path,loaderName,loaderArgs)

    return fileLoader.loadFilePreview(pipelinekey,batchPreviewIdx,path,loaderName,loaderArgs)

@eel.expose
def exportData(moduleID:str, pipelinekey:str, path:str, overwrite:bool,exporterArgs:Dict = None):
    if not overwrite and os.path.exists(path):
        raise RuntimeError('File %s already exists'%path)

    modulesById[moduleID].exportData(pipelinekey,path,**exporterArgs)

    return True

@eel.expose
def getAggregateDataInfo(aggregatorID:str, path:str):
    aggregatorFun = getattr(aggregators, aggregatorID+'_Info')  # will throw an error if doesnt exist
    return aggregatorFun(path)

@eel.expose
def resetAggregateData(aggregatorID:str, path:str):
    """Simply deletes the """
    aggregatorFun = getattr(aggregators, aggregatorID+'_Reset')  # will throw an error if doesnt exist
    return aggregatorFun(path)

@eel.expose
def exportAggregateData(aggregatorID:str, path:str, batchnum:int, exporterArgs:Dict = None):
    aggregatorFun = getattr(aggregators, aggregatorID)  # will throw an error if doesnt exist
    return aggregatorFun(path,session,modulesById,batchnum,**exporterArgs)

@eel.expose
def getBatchGlobs(patterns:List[str],allowedExtensions:List[List[str]]):
    return fileLoader.getFileGlob(patterns,allowedExtensions)

@eel.expose
def getFolderContents(folder:str, extenstions:List[str]):
    return fileLoader.getFolderContents(folder,extenstions)

@eel.expose
def onNewPipelineLoaded(pipelineID:str, pipelineParamsByModuleID:Dict = None):

    #simply delete all data related to the old modules
    global modulesById
    global modulesByExecutionKey
    global session
    global fileLoader
    global pipelineParams
    pipelineParams = pipelineParamsByModuleID
    modulesById = {}
    modulesByExecutionKey = {}
    session = SessionData()
    fileLoader = FileLoader(session)
    print('[EEL] New Pipeline loaded %s'%pipelineID)
    return True

# Central function for running a step with its respective parameters
# Parameters are defined in the JS definition of module. Module will be instantiated if it has not been created yet.
@eel.expose
def runStep(moduleName: str, moduleID: str, action:str, params: Dict[str, str], inputs: List[str], outputs: List[str]):

    m: ModuleBase = getModule(moduleID, moduleName)
    if log:
        inputsStr = ', '.join(inputs) if inputs is not None else '-'
        outputsStr = ', '.join(outputs) if inputs is not None else '-'
        print('[Eel]: Running action: %s on %s(%s) with inputs: [%s] -> [%s]' % ( action, moduleID, moduleName, inputsStr,outputsStr))

    res = m.run(action, params, inputs, outputs)
    return res






# Async version of runStep.
# Will get a key that is used as an identifier for the thread.
# JS can send a termination signal with that key to stop the execution and it will get a callback with that key when execution is completed.
@eel.expose
def runStepAsync(threadID, moduleName: str, moduleID: str, action:str, params: Dict[str, str], inputs: List[str], outputs: List[str]):

    m: ModuleBase = getModule(moduleID, moduleName)
    if log:
        inputsStr = ', '.join(inputs) if inputs is not None else '-'
        outputsStr = ', '.join(outputs) if inputs is not None else '-'
        print('[Eel]: Async Running %s(%s) with inputs: [%s] -> [%s]' % ( moduleID, moduleName, inputsStr,outputsStr))

    #start execution in a separate thread
    modulesByExecutionKey[threadID] = m
    tmp = threading.Thread(target=startThreadInModule, args = (m,threadID,[action, params, inputs,outputs]) )
    tmp.start()
    # eel.spawn(startThreadInModule, m, threadID, [action, params, inputs,outputs])









@eel.expose
def abortStep(execKey:str):
    if execKey in modulesByExecutionKey:
        m = modulesByExecutionKey[execKey]
        m.abort()
        print("[Eel]: Sent Abort signal to module %s in thread %s"%(m.id,execKey))
    else:
        print("[Eel]: Ignoring abort signal for thread %s, since it can't be found."%(execKey))