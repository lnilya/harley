import {getConnectedValue, updateConnectedValue} from "./ConnectedStore";
import * as alg from "./algstate";
import {allPipelineData, curPipelineParameterValues} from "./algstate";
import {allPipelineSteps, curPipelineStepNum} from "./uistates";
import {DType, Parameter, SettingDictionary} from "../modules/paramtypes";
import {LocalFileWithPreview, PipelineData, PipelineDataKey} from "../types/datatypes";
import * as store from "./persistance";
import {PipelineInput, PipelineStep} from "../types/pipelinetypes";

const deepEqual = require('deep-equal')

/**
 * Will set the allParameterValues atom at the correct step with the parameter given.
 * Will also make sure the type is cast in the correct type.
 * Will make a deep comparison, to avoid unnecessary updates with same values.
 * @param conf
 * @param newVal
 */
export function setPipelineParameterValue(conf:Parameter<any>, newVal:any){
    
    if(Array.isArray(newVal)) newVal = newVal.map((nv)=>parseValueToParamType(conf.dtype,nv));
    else newVal = parseValueToParamType(conf.dtype,newVal);
    
    //find the step this parameter is in
    var oldParams:Array<SettingDictionary> = getConnectedValue(curPipelineParameterValues);
    var curStep = -1;
    for (let s = 0; s < oldParams.length; s++) {
        if(oldParams[s][conf.key] !== undefined){
            curStep = s;
            break;
        }
    }
    if(curStep == -1) return; //parameter not found
    
    //compare wether or not the value is equal
    var oldVal = oldParams[curStep][conf.key];
    
    //parameter value is the same, no need to do anything
    if(deepEqual(oldVal,newVal)) {
        return;
    }
    
    var newP = [...oldParams];
    newP[curStep] = {...newP[curStep], [conf.key]: newVal};
    
    
    store.saveParameters(newP);
    
    updateConnectedValue(curPipelineParameterValues,newP);
}

//Cast according to desired type
export function parseValueToParamType(type:DType, newVal:any):any{
    if(type == DType.Bool) return !!newVal;
    else if(type == DType.String) return ''+newVal;
    else if(type == DType.Int) return parseInt(newVal);
    else if(type == DType.Float) return parseFloat(newVal);
    
    return newVal;
}

function _getCurStep(stepnum:number = -1):PipelineStep<any,any>{
    const csn = stepnum == -1 ? getConnectedValue(curPipelineStepNum) :stepnum;
    const all = getConnectedValue(allPipelineSteps);
    if(all && csn >= 0 && csn < all?.length)
        return all[csn];
    
    return null;
}

export function deletePipelineData(plk:PipelineDataKey, deleteDownstreamResults:boolean = true):void{
    updatePipelineData(plk,null,deleteDownstreamResults)
}
export async function updatePipelineInput(inp:PipelineInput, data:LocalFileWithPreview, add:boolean){
    if(add){
        updateConnectedValue(alg.allPipelineInputs, {...getConnectedValue(alg.allPipelineInputs),[inp.key]:data})
        updatePipelineData(inp.key,await inp.postProcessForJS(data,inp.key))
    }else{
        //inputfile unselected
        var nv = {...getConnectedValue(alg.allPipelineInputs)}
        delete nv[inp.key];
        updateConnectedValue(alg.allPipelineInputs, {...getConnectedValue(alg.allPipelineInputs),[inp.key]:data})
        deletePipelineData(inp.key)
    }
}
/**
 * Central function to be called when a step is finished. The data is passed as an array.
 * @param newData if data object is null the data is deleted from pipeline
 * @param deleteDownstreamResults Will delete all pipeline data that depend on this pipeline atom through the series of input/output keys.
 */
export function updatePipelineData<T extends PipelineData>(newDataKey:PipelineDataKey, newData:T, deleteDownstreamResults:boolean = true):void{
    
    var curState:Record<PipelineDataKey,PipelineData> = getConnectedValue(allPipelineData);
    var newPipeLineData = {...curState};
    var updated = false;
    //check if any data changes, otherwise we do not need to notify ui of updates
    if(newData === null) {
        if(newPipeLineData[newDataKey] !== undefined){
            updated = true
            delete newPipeLineData[newDataKey]
        }
    }else{
        if(!deepEqual(newPipeLineData[newDataKey],newData)){
            updated = true;
            newPipeLineData[newDataKey] = newData
        }
    }
    
    //we do not need to delete anything if no update happened.
    if(updated && deleteDownstreamResults){
        let delKeys = _getDownstreamKeys(newDataKey);
        //delete all keys that did exist before
        delKeys.forEach((delKey)=>{
            if(newPipeLineData[delKey] !== undefined){
                updated = true;
                delete newPipeLineData[delKey];
            }
        })
    }
    
    if(!updated) return;
    updateConnectedValue(allPipelineData,newPipeLineData)
}

/**
 * Will check wether or not a pipeline step has all input data generated and can be executed.
 * @param stepnum the number of the step to check
 */
export function doesPipelineStepHaveData(stepnum:number):true|PipelineDataKey[]{
    var step:PipelineStep<any,any> = _getCurStep(stepnum);
    if(!step) return null;
    if(step.inputKeys === undefined || Object.keys(step.inputKeys).length == 0) return true; //no inputs
    
    var pipelineData:Record<PipelineDataKey,PipelineData> = getConnectedValue(allPipelineData) || {};
    
    var missingKeys = Object.keys(step.inputKeys).filter((ik)=>{
        return !(pipelineData[step.inputKeys[ik]])
    })
    // console.log(`Checking Step#${stepnum}/${step.title}. Needs: ${Object.values(step.inputKeys)} => missing: ${missingKeys}, has:`,pipelineData);
    if(missingKeys.length > 0) return missingKeys;
    return true;
}


/**
 * Looks at the pipeline and a given key. Returns all Output keys resulting from the given input key.
 * Does so recusrively for the whole pipeline.
 * @param pk The key that is our start
 */
function _getDownstreamKeys(pk:PipelineDataKey):Array<PipelineDataKey>{
    var aS = getConnectedValue(allPipelineSteps);
    if(!aS) return null;
    
    const findAllOutKeysFromIn = (ink:PipelineDataKey, as:Array<PipelineStep<any, any>>)=>{
        let allK:Record<PipelineDataKey,PipelineDataKey> = {};
        for (let i = 0; i < as.length; i++) {
            if(Object.values(as[i].inputKeys || {}).indexOf(ink) != -1){
                //found a step who depends on the given input key, add output keys to result
                Object.values(as[i].outputKeys || {}).forEach((l)=>allK[l] = l)
            }
        }
        return allK;
    }
    
    let allDownstreamKeys:Record<PipelineDataKey,PipelineDataKey> = {};
    
    let newKeys = [pk]
    while(newKeys.length > 0){
        var it:Record<PipelineDataKey, PipelineDataKey> = findAllOutKeysFromIn(newKeys.pop(),aS);
        for (let plk in it) {
            if(allDownstreamKeys[plk] === undefined){
                allDownstreamKeys[plk] = plk
                newKeys.push(plk)
            }
        }
    }
    return Object.values(allDownstreamKeys)
}