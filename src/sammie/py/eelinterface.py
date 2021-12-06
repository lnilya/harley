import os
import threading
import traceback
from typing import Dict, List

import eel

from src.py import aggregators
from src.sammie.py.SessionData import SessionData

from src.py.__config import initializeModule
from src.sammie.py.modules.FileLoader import FileLoader
from src.sammie.py.modules.ModuleBase import ModuleBase

executionKey:int = 0
log = True
#Stores module instances by their ID
modulesById: Dict[str, ModuleBase] = {}

#Stores module instances by their Thread Execution key, allows to kill if necessary
modulesByExecutionKey: Dict[str, ModuleBase] = {}

#Sessiondata stores all the information produced by Modules
session: SessionData = SessionData()

#Loader is a speicifc module, that loads files
fileLoader: FileLoader = FileLoader(session)

#Stores parameters passed to newly initialized modules/steps in the pipeline
pipelineParams: Dict = {}


def getModule(moduleID: str, moduleName: str):
    params = pipelineParams[moduleID]
    if moduleID not in modulesById:
        modulesById[moduleID] = initializeModule(moduleID,moduleName,params,session)

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
def getAggregateDataInfo(aggregatorID:str, path:str, exporterArgs:Dict = None):
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
    return aggregatorFun(path,session,modulesById,batchnum,exporterArgs)

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