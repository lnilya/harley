
//***************************************************************/
//* TYPING OF THE JS->PYTHON INTERFACE */
//***************************************************************/

import {LocalFile, LocalFilePath, LocalFileWithPreview, LocalFolder, PipelineDataKey} from "../types/datatypes";
import {addExecutionCallback} from "./eelJsFunctions";
import {Pipeline, PipelineDataLoader, PipelineStep} from "../types/pipelinetypes";
import {ModuleID} from "../types/maintypes";
import {getLoaderFromFileName} from "../pipeline";

export type EelThreadKey = string

/**List of all currently implement server functions*/
enum EelPythonFunctions {
    
    /** Runs a Module Step in main thread on server, discouraged */
    runStep = 'runStep',
    
    /** Runs a Module Step in separate thread on server*/
    runStepAsync = 'runStepAsync',
    
    /**Request to abort a currently running step and kill the thread, only for async steps*/
    abortStep = 'abortStep',
    
    /**Will Load a file at a given path with a given loader into the pipeline*/
    loadInputFile = 'loadInputFile',
    
    /**Retrieve contens of a given folder*/
    getFolderContents = 'getFolderContents',
    
    /**Retrieves batches by globs for data input*/
    getBatchGlobs = 'getBatchGlobs',
    
    /**Reset server state by loading new pipeline data*/
    onNewPipelineLoaded = 'onNewPipelineLoaded',
    
    /**Export a given piece of Data*/
    exportData = 'exportData',
    
    /**Aggregate a given piece of Data, e.g. append to file*/
    exportAggregateData = 'exportAggregateData',
    
    /**Give information about an aggregate piece of Data*/
    getAggregateDataInfo = 'getAggregateDataInfo',
    
    /**Deletes the existing aggregate file and writes a blank file*/
    resetAggregateData = 'resetAggregateData',
}

/**A generic server response object response, to avoid try catch for server errors.
 * Will either hava data set or error and errorTrace .*/
export type EelResponse<T> = Partial<{
    error:string,
    errorTrace:string[],
    data:T
}>;

const eel = window['eel'];

//***************************************************************/
//* PUBLIC API FOR REST OF REACT APP                            */
//***************************************************************/

export async function abortStep(threadID:EelThreadKey):Promise<any>{
    return runEelEndpoint(EelPythonFunctions.abortStep,[threadID]);
}

/**
 * Runs an algorithm Step in a separate thread on server. This is the preferred way of doing this.
 * However for matplotlib you need to be in the main thread on server and crashes might occur. So The sync
 * method is still present.
 * @param moduleName
 * @param action
 * @param params
 * @param step
 * @param customThreadID
 */
export async function runStepAsync<T>(moduleName:string,action:string, params:any, step:PipelineStep<any, any>, customThreadID:EelThreadKey = null):Promise<EelResponse<T>>{
    const args = [ moduleName,
        step.moduleID,
        action,
        params,
        Object.values(step.inputKeys || {}),
        Object.values(step.outputKeys || {})];
    return runEelEndpointAsync<T>(customThreadID || step.moduleID, EelPythonFunctions.runStepAsync, args);
}

/**
 * Will run an algorithm step on server, in the main thread. i.e. server will be not responsible for the time being.
 * This might be needed if the server side algorithm in some way relies on being inside the main thread
 * If possible use runStepAsync instead. The behaviour is identical to the rest of the Frontend.
 * @param moduleName
 * @param action
 * @param params
 * @param step
 */
export async function runStep<T>(moduleName:string,action:string, params:any, step:PipelineStep<any, any>):Promise<EelResponse<T>>{
    const args = [ moduleName,
        step.moduleID,
        action,
        params,
        Object.values(step.inputKeys || {}),
        Object.values(step.outputKeys || {})];
    return runEelEndpoint<T>(EelPythonFunctions.runStep, args);
}

export async function onLoadNewPipeline(pn:Pipeline):Promise<EelResponse<boolean>>{
    var serverParams = {}
    //Extract parameters for the single modules
    pn.steps.forEach((ps)=>{
        serverParams[ps.moduleID] = ps.serverParameters || {}
    })
    return runEelEndpoint<boolean>(EelPythonFunctions.onNewPipelineLoaded,[pn.name,serverParams]);
}

export async function getBatchGlobs(patterns:string[],extensions:string[][]):Promise<EelResponse<LocalFile[][]>>{
    return await runEelEndpoint<LocalFile[][]>(EelPythonFunctions.getBatchGlobs,[patterns,extensions])
}
export async function loadInputFile(pipelinekey:string, filePath:string,loader:PipelineDataLoader, batchIndexPreview:number = -1):Promise<EelResponse<LocalFileWithPreview>>{
    const loaderName = Array.isArray(loader) ? loader[0] : loader
    const loaderParams = Array.isArray(loader) ? loader[1] : {}
    
    return await runEelEndpoint<LocalFileWithPreview>(EelPythonFunctions.loadInputFile,[pipelinekey, filePath,loaderName,loaderParams,batchIndexPreview])
}
export async function exportData(moduleID:ModuleID, pipelinekey:PipelineDataKey, filePath:LocalFilePath,overwrite:boolean,addtlParams = null):Promise<EelResponse<boolean>>{
    return await runEelEndpoint<boolean>(EelPythonFunctions.exportData,
        [moduleID,pipelinekey,filePath,overwrite,addtlParams || {}])
}
export type AggregateDataResponse = {msg:string, info:AggregateDataInfo}
export async function exportAggregateData(aggregatorID:string, batchnum:number, filePath:LocalFilePath,addtlParams = null):Promise<EelResponse<AggregateDataResponse>>{
    return await runEelEndpoint<AggregateDataResponse>(EelPythonFunctions.exportAggregateData,
        [aggregatorID,filePath,batchnum, addtlParams || {}])
}
export type AggregateDataInfo = {exists:boolean, info:any, ready:boolean}
export async function getAggregateDataInfo(aggregatorID:string, filePath:LocalFilePath):Promise<EelResponse<AggregateDataInfo>>{
    return await runEelEndpoint<AggregateDataInfo>(EelPythonFunctions.getAggregateDataInfo,
        [aggregatorID,filePath])
}
export async function resetAggregateData(aggregatorID:string, filePath:LocalFilePath):Promise<EelResponse<boolean>>{
    return await runEelEndpoint<boolean>(EelPythonFunctions.resetAggregateData,
        [aggregatorID,filePath])
}

type FolderContents = { files:LocalFile[], folders:LocalFolder[] };
export async function getFolderContents(folder:string, extensions:string[] = null):Promise<EelResponse<FolderContents>>{
    return await runEelEndpoint<FolderContents>(EelPythonFunctions.getFolderContents,[folder,extensions])
}


//***************************************************************/
//* CORE FUNCTIONS HANDLING THE EEL COMMUNICATION */
//***************************************************************/

function parseEelError<T>(err:{errorText:string, errorTraceback:string}):EelResponse<T>{
    return {
        error: err.errorText,
        errorTrace: err?.errorTraceback?.split('\n') || ['No Stacktrace available.']
    }
}

const debug = true;
var num = 0;
async function runEelEndpointAsync<T>(threadID:EelThreadKey, endpoint:EelPythonFunctions, params:any = {}):Promise<EelResponse<T>>{
    if(!eel) return {error:'Eel Not initialized', errorTrace:[]};
    var curExec = num++;
    debug && console.log(`[runEelEndpointAsync ${curExec}]: Contacting ${endpoint} in thread ${endpoint} with params:`,params);
    try{
        
        //Start execution
        await eel[endpoint](threadID,...params)();
        
        //wait for the eel process to send a callback
        var data = await new Promise<T>((resolve,reject)=>{
            addExecutionCallback(threadID,resolve,reject)
        })
        
        debug && console.log(`[runEelEndpointAsync ${curExec}]: Completed ${endpoint}, result:`,data);
        
    }catch (e){
        debug && console.log(`[runEelEndpointAsync ${curExec}]: ERROR ${e.errorText}`);
        return parseEelError<T>(e)
    }
    return {data:data};
}
async function runEelEndpoint<T>(endpoint:EelPythonFunctions, params:any = {}):Promise<EelResponse<T>>{
    
    if(!eel) return {error:'Eel Not initialized', errorTrace:[]};
    var curExec = num++;
    debug && console.log(`[runEelEndpoint ${curExec}]: Contacting ${endpoint} with params:`,params);
    
    try{
        var k =  await eel[endpoint](...params)();
        debug && console.log(`[runEelEndpoint ${curExec}]: Completed ${endpoint}, result:`,k);
        
    }catch (e){
        debug && console.log(`[runEelEndpoint ${curExec}]: ERROR ${e.errorText}`);
        return parseEelError<T>(e)
    }
    return {data:k};
}