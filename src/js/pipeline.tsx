import {getConnectedValue, updateConnectedValue} from "./state/ConnectedStore";
import * as ui from "./state/uistates";
import {allPipelines, allPipelineSteps, curPipelineStepNum, selectedPipelineName, UIScreens} from "./state/uistates";
import * as alg from './state/algstate';
import {allPipelineBatches, allPipelineData, allPipelineInputs, SingleDataBatch} from './state/algstate';
import {SettingDictionary} from "./modules/_shared";
import React from "react";
import {loadParameters, PARAM_SET_NAME_CURRENT} from "./state/persistance";
import {loadInputFile, onLoadNewPipeline} from "./eel/eel";
import fociDetectionPipeline from "./pipelines/fociDetectionPipeline";
import cellDetectionPipeline from "./pipelines/cellDetectionPipeline";
import preprocessingPipeline from "./pipelines/dvPreprocessingPipeline";
import modelPipeline from "./pipelines/modelTrainingPipeline";
import {GlobalPipelineSettings, Pipeline, PipelineInput} from "./types/pipelinetypes";
import * as storage from '../js/state/persistance'
import {updatePipelineInput} from "./state/stateutil";
import {resetAutoExecution} from "./pipelineexec";
import {EventTypes, fireEvent, ToastEventPayload} from "./state/eventbus";
import {LocalFile} from "./types/datatypes";

//***************************************************************/
//* FUNCTIONS */
//***************************************************************/

/**Retrieve the loader from the defined list of loaders by their exension*/
export function getLoaderFromFileName(fileName: string, input: PipelineInput) {
    var loader = null
    const fileExtension = fileName.split('.')[1].toLowerCase()
    for (let ext in input.loaders) {
        const extensions = ext.split(',')
        for (let e of extensions) {
            if (fileExtension == e.toLowerCase()) {
                return input.loaders[ext]
            }
        }
    }
    return null
}

/**Removes the inputs for the current pipeline and all downstream keys.
 * This is necessary when a batch is for example deleted on the frontend.*/
export async function unloadPipeline() {
    const allPipes = getConnectedValue(ui.allPipelines);
    const selPipeName = getConnectedValue(ui.selectedPipelineName);
    if (!allPipes[selPipeName]) return false;
    const pipeline = allPipes[selPipeName];
    resetAutoExecution();
    //if we are here all data has been successfully loaded on server
    for (let i = 0; i < pipeline.inputs.length; i++) {
        let pinp = pipeline.inputs[i];
        //Load data into pipeline locally
        updatePipelineInput(pinp, null, false)
    }
}

export async function loadBatchAndStartPipeline(batchIndex: number, reloadParameters: boolean = true) {
    
    const allPipes = getConnectedValue(ui.allPipelines);
    const selPipeName = getConnectedValue(ui.selectedPipelineName);
    if (!allPipes[selPipeName]) return false;
    const pipeline = allPipes[selPipeName];
    const batch: SingleDataBatch = getConnectedValue(alg.allPipelineBatches)[batchIndex];
    const allInputs = []
    for (let i = 0; i < pipeline.inputs.length; i++) {
        let pinp = pipeline.inputs[i];
        //Load data into pipeline on server
        let res = await loadInputFile(pinp.key, batch.inputs[pinp.key].file.path, getLoaderFromFileName(batch.inputs[pinp.key].file.name, pinp));
        if (res.error) {
            return res.error;
        }
        allInputs.push({file: batch.inputs[pinp.key].file, ...res.data})
    }
    //if we are here all data has been successfully loaded on server
    for (let i = 0; i < pipeline.inputs.length; i++) {
        let pinp = pipeline.inputs[i];
        //Load data into pipeline locally
        updatePipelineInput(pinp, allInputs[i], true)
    }
    
    //Load parameters if needed
    if (reloadParameters) {
        loadStoredParametersIntoPipeline(batch.settingsSetName)
    }
    
    //update index of batch
    updateConnectedValue(alg.curLoadedBatch, batchIndex)
    return true
}

export async function addBatches(pipe:Pipeline, add: LocalFile[][], removeCurrent: Boolean, paramSetName: string = PARAM_SET_NAME_CURRENT) {
    
    updateConnectedValue(ui.overlay, {display: 'overlay', progress: 0, msg: 'Adding new Batches...'})
    var arrAfterLoading: SingleDataBatch[] = []
    var allFiles = []
    const curBatches = getConnectedValue(allPipelineBatches) || [];
    var batchIndexStart = removeCurrent ? 0 : curBatches.length
    
    var totalLoads = 0;
    var totalFilesToLoad = add.map((lf)=>lf.filter(l=>l!=null).length).reduce((a,b)=>a+b)
    
    add.forEach((batch, i) => {
    
        batch.forEach((lf,pidx)=>{
            if(!lf)return;
            const pinputKey = pipe.inputs[pidx].key;
            const loader = getLoaderFromFileName(lf.name, pipe.inputs[pidx]);
            const ld = loadInputFile(pinputKey, lf.path, loader, i + batchIndexStart)
            ld.then((res) => {
                updateConnectedValue(ui.overlay, {
                    display: 'overlay',
                    progress: totalLoads / totalFilesToLoad,
                    msg: 'Adding new Batches...'
                });
                totalLoads++;
                if (!res.error) {
                    if (!arrAfterLoading[i]) arrAfterLoading[i] = {
                        settingsSetName: paramSetName,
                        inputs: {}
                    }
                    arrAfterLoading[i].inputs[pinputKey] = {file: lf, ...res.data};
                }
            })
            allFiles.push(ld)
        })
    })
    
    //Wait for all load requests to finish.
    await Promise.allSettled(allFiles);
    
    //Sort out those batches that do not have any data anymore.
    const lastStoredBatches = arrAfterLoading?.filter((pinput) => {
        for (let pinputKey in pinput)
            if (pinput[pinputKey] != null) return true;
        return false;
    })
    
    var newBatches = lastStoredBatches || [];
    if(!removeCurrent) newBatches = curBatches.concat(lastStoredBatches || []);
    updateConnectedValue(allPipelineBatches, newBatches)
    storage.saveDataForCurPipeline(newBatches, allPipelineBatches.key)
    updateConnectedValue(ui.overlay, null);
}

/**
 * Loads the given pipeline into the UI and resets all related values.
 * @param pipe Pipeline to load
 */
export async function loadPipeline(pipe: Pipeline) {
    const d = await onLoadNewPipeline(pipe);
    if (d.data) {
        storage.saveGlobalData(pipe.name, 'loaded_pipeline')
        
        //set pipeline and step
        updateConnectedValue(selectedPipelineName, pipe.name)
        updateConnectedValue(curPipelineStepNum, 0);
        updateConnectedValue(allPipelineSteps, pipe.steps)
        
        //parameters
        updateConnectedValue(alg.curPipelineParameterValues, loadParameters(__getDefaultParameters(pipe), pipe.name))
        //global settings parameters
        updateConnectedValue(alg.pipelineGlobalSettings, __mergeDefaultGlobalSettings(pipe))
        
        //reset current inputs
        updateConnectedValue(allPipelineData, {})
        updateConnectedValue(allPipelineInputs, {})
        
        //update UI back to input
        updateConnectedValue(ui.appScreen, UIScreens.input);
        updateConnectedValue(alg.curLoadedBatch, -1);
        
        //Reload previous input batches
        
        updateConnectedValue(allPipelineBatches, [])
        //If we had previously stored any input batches use these
        var lastStoredBatches: SingleDataBatch[] = storage.loadDataForPipeline(alg.allPipelineBatches.key);
        if (lastStoredBatches?.length > 0)
            updateConnectedValue(ui.overlay, {display: 'overlay', progress: 0, msg: 'Reloading Inputs...'})
        
        var arrAfterLoading: SingleDataBatch[] = []
        var allFiles = []
        var k = 0;
        var totalLoads = 0;
        // console.log(`LAST STORED:`, lastStoredBatches);
        lastStoredBatches?.forEach((pinput, i) => {
            if (!pinput) return;
            
            //Reload all files, sort out what can't be loaded
            for (let pinputKey in pinput.inputs) {
                if (!pinput.inputs[pinputKey]?.file) {
                    totalLoads++;
                    continue; //hasnt been loaded yet.
                }
                const loader = getLoaderFromFileName(pinput.inputs[pinputKey].file.name, pipe.inputs.find(k => k.key == pinputKey));
                const ld = loadInputFile(pinputKey, pinput.inputs[pinputKey].file.path, loader, k)
                allFiles.push(ld);
                ld.then((res) => {
                    updateConnectedValue(ui.overlay, {
                        display: 'overlay',
                        progress: totalLoads / ((lastStoredBatches.length - 1) * pipe.inputs.length),
                        msg: 'Reloading Inputs...'
                    });
                    
                    totalLoads++;
                    if (!res.error) {
                        if (!arrAfterLoading[i]) arrAfterLoading[i] = {
                            settingsSetName: pinput.settingsSetName,
                            inputs: {}
                        }
                        arrAfterLoading[i].inputs[pinputKey] = {file: pinput.inputs[pinputKey].file, ...res.data};
                        // console.log(`DONE LOADING BATCH`,arrAfterLoading[i]);
                    }
                })
            }
            k++;
        })
        //Wait for all load requests to finish.
        await Promise.allSettled(allFiles);
        
        //Sort out those batches that do not have any data anymore.
        lastStoredBatches = arrAfterLoading?.filter((pinput) => {
            for (let pinputKey in pinput)
                if (pinput[pinputKey] != null) return true;
            return false;
        })
        
        //When no batches are present, auto create a new empty one, for easier user input
        if (lastStoredBatches.length == 0) {
            lastStoredBatches[0] = {inputs: {}, settingsSetName: PARAM_SET_NAME_CURRENT}
            pipe.inputs.forEach((inp) => {
                lastStoredBatches[0].inputs[inp.key] = null;
            })
        }
        
        // console.log(`LAST STORED BATCHES`, lastStoredBatches);
        
        updateConnectedValue(allPipelineBatches, lastStoredBatches || [])
        updateConnectedValue(ui.overlay, null);
    }
}

/**
 * Given a parameter set, that can be loaded from local store, this will load the parameters behind
 * it and put them into the current pipeline.
 * */
export function loadStoredParametersIntoPipeline(parameterSetName: string, showToast: boolean = true) {
    const allPipes = getConnectedValue(ui.allPipelines);
    const selPipeName = getConnectedValue(ui.selectedPipelineName);
    var success = allPipes[selPipeName];
    if (!success) {
        showToast && fireEvent<ToastEventPayload>(EventTypes.ToastEvent, {
            severity: 'error',
            msg: 'Failed loading setting set: ' + parameterSetName
        })
        return false;
    }
    
    const newParamVals = loadParameters(__getDefaultParameters(allPipes[selPipeName]), selPipeName, parameterSetName);
    
    // console.log(`Loading Stored parameters ${selPipeName}/${parameterSetName}. Parameters:`, newParamVals);
    
    //push loaded parameters into pipeline
    updateConnectedValue(alg.curPipelineParameterValues, newParamVals)
    //store the new loaded parameters as "current"
    storage.saveParameters(newParamVals)
    
    showToast && fireEvent<ToastEventPayload>(EventTypes.ToastEvent, {
        severity: 'success',
        msg: 'Loaded setting set: ' + parameterSetName
    })
    return true;
}

/**
 * Resets parameters of a pipelinestep to defaults
 * @param pstep the step to reset parameters for, if -1 the current one will be used
 * */
export function setDefaultParametersForPipelineStep(pstep: number = -1) {
    if (pstep == -1) pstep = getConnectedValue(ui.curPipelineStepNum)
    
    const selPipeName = getConnectedValue(ui.selectedPipelineName)
    const pipe = getConnectedValue(ui.allPipelines)[selPipeName]
    
    var newParams = [...getConnectedValue(alg.curPipelineParameterValues)]
    newParams[pstep] = __getDefaultParameters(pipe)[pstep];
    
    updateConnectedValue(alg.curPipelineParameterValues, newParams)
}

/**
 * Initializes all selectable pipelines and sets a default pipeline
 */
export function initializePipelineStack() {
    
    const cd: Pipeline = cellDetectionPipeline()
    const dvs: Pipeline = preprocessingPipeline()
    const fds: Pipeline = fociDetectionPipeline()
    const svm: Pipeline = modelPipeline()
    
    const avPipelines = {
        [cd.name]: cd,
        [dvs.name]: dvs,
        [svm.name]: svm,
        [fds.name]: fds,
    }
    
    updateConnectedValue(allPipelines, avPipelines)
    console.log(`HIER`);
    const lastPipeline = storage.loadGlobalData('loaded_pipeline')
    if (lastPipeline && avPipelines[lastPipeline])
        loadPipeline(avPipelines[lastPipeline])
    
}

//***************************************************************/
//* PRIVATE FUNCTIONS */
//***************************************************************/

/**Merges global settings for the current pipeline with the defaults, if none are stored - defaults will be returned*/
function __mergeDefaultGlobalSettings(pipe: Pipeline): GlobalPipelineSettings {
    
    const defaults:GlobalPipelineSettings = {
        runAggregatorExports:pipe?.aggregatorOutputs?.map((ao)=>ao.aggregatorID) || [],
        runBatchExports:pipe?.outputs?.map((ao)=>ao.requiredInput) || [],
        pauseUIToSeeResults:1000,
    }
    const storedData = storage.loadDataForPipeline(alg.pipelineGlobalSettings.key,pipe.name) || {}
    return {...defaults,...storedData}
}
function __getDefaultParameters(pipe: Pipeline): Array<SettingDictionary> {
    return pipe.steps.map((s) => {
        let stepParams = {};
        s.parameters.forEach((sp) => {
            stepParams[sp.key] = sp.input.defaultVal;
        })
        return stepParams;
    })
}