import {PipelineName} from "../types/datatypes";
import {getConnectedValue} from "./ConnectedStore";
import * as ui from './uistates'
import {selectedPipelineName} from './uistates'
import {SettingDictionary} from "../modules/paramtypes";

enum keys{
    PIPELINE_PARAMS='pipelineparams',
    PIPELINE_DATA='pipelinedata',
    GLOBAL_DATA='globaldata'
}

/**The default name for the current parameter set.*/
export const PARAM_SET_NAME_CURRENT = 'current';
export type ParamSet = {
    /**Short "filename" for this set.*/
    name:string,
    /**User given description to remember what this Parameter set did.*/
    desc:string,
    /**Last write to this Parameter set*/
    timestamp:number,
    /**Actual data*/
    data:Array<SettingDictionary>,
}

//***************************************************************/
//* GLOBAL */
//***************************************************************/

/**Saves arbitrary data that is global for the application*/
export function saveGlobalData(data:any,key:string){
    console.log(`[persistance]: Saved Global Data for ${key}`,data);
    localStorage.setItem(keys.GLOBAL_DATA + '_' + key,JSON.stringify(data))
}
/**Loads arbitrary data that is global for the application*/
export function loadGlobalData(key:string){
    var res = localStorage.getItem(keys.GLOBAL_DATA + '_' + key)
    if(!res) return null;
    return JSON.parse(res)
}

//***************************************************************/
//* TIED TO PIPELINE */
//***************************************************************/

/**Saves arbitrary data that is tied to the cirrent pipeline*/
export function saveDataForCurPipeline(data:any,key:string){
    const pipe = getConnectedValue(ui.selectedPipelineName)
    localStorage.setItem(keys.PIPELINE_DATA+'_'+pipe+'_'+key,JSON.stringify(data))
}
/**Loads arbitrary data that is tied to the current pipeline*/
export function loadDataForPipeline(key:string, pipe:PipelineName = null){
    if(!pipe) pipe = getConnectedValue(ui.selectedPipelineName)
    var res = localStorage.getItem(keys.PIPELINE_DATA+'_'+pipe+'_'+key)
    if(!res) return null;
    return JSON.parse(res)
}

/**
 * Stores parameters for the current pipeline
 * @param parameters The parameters to store
 * @param paramSetKey A key or "file" to save this parameters to, Normally everythign goes into "current",
 * but when user chooses to store or load specific parameters during batchmode or just to make backups of parameters that work well for certain input data
 * it can be identified by key. The parameters are still tied to the pipeline but additionally also to the set of parameter keys.
 * @param name Human readable/given name for this parameter set. Is irrelevent if paramSetKey is the PARAM_SET_NAME_CURRENT
 * @param desc Human readable/given description for this parameter set. Is irrelevent if paramSetKey is the PARAM_SET_NAME_CURRENT
 * */
export function saveParameters(parameters:Array<SettingDictionary>, paramSetKey:string = PARAM_SET_NAME_CURRENT, name:string = '', desc:string = ''){
    const pn = getConnectedValue(selectedPipelineName)
    const allSets:Record<string,ParamSet> = loadParameterSets()
    allSets[paramSetKey] = {
        desc:desc || allSets[paramSetKey]?.desc,
        name:name || allSets[paramSetKey]?.name || paramSetKey,
        timestamp: new Date().getTime(),
        data: parameters
    }
    console.log(`[persistance] Stored pipelineParams ${pn}/${paramSetKey}`,allSets);
    localStorage.setItem(keys.PIPELINE_PARAMS+'_'+pn,JSON.stringify(allSets))
}

/**Deletes a parameter set from store*/
export function deleteStoredParameterSet(parameterSetName:string){
    const pn = getConnectedValue(selectedPipelineName)
    const allSets:Record<string,ParamSet> = loadParameterSets()
    if(!allSets[parameterSetName]) return;
    delete allSets[parameterSetName]
    localStorage.setItem(keys.PIPELINE_PARAMS+'_'+pn,JSON.stringify(allSets))
}
/***
 * Loads all Parameter sets stored for the current pipeline
 */
export function loadParameterSets(excludeCurrent:boolean = false):Record<string,ParamSet>{
    const pn = getConnectedValue(selectedPipelineName)
    var res:string = localStorage.getItem(keys.PIPELINE_PARAMS+'_'+pn);
    if(res){
        try{
            const json =  JSON.parse(res);
            if(excludeCurrent) delete json[PARAM_SET_NAME_CURRENT];
            return json;
        }catch (e){}
    }
    return {}
}

/**
 * Loads last parameters from local storages and merges with default ones, if something has changed.
 * @param defaults A set of default parameters to merge the loaded values with. If nothing has been stored or the defaults are from
 * an older version, with less parameters, this will be necessary.
 * @param pipeName: The name of the pipeline to load parameters from
 * * @param paramSetKey A key or "file" to save this parameters to, Normally everythign goes into "current",
 * but when user chooses to store or load specific parameters during batchmode or just to make backups of parameters that work well for certain input data
 * it can be identified by key. The parameters are still tied to the pipeline but additionally also to the set of parameter keys.
 */
export function loadParameters(defaults:Array<SettingDictionary>,pipeName:PipelineName,paramSetKey:string = PARAM_SET_NAME_CURRENT):Array<SettingDictionary>{
    var parsedRes:ParamSet = loadParameterSets()[paramSetKey];
    // console.log(`[persistance] Loaded PArameterSets ${pn}/${paramSetKey}`,allSets);
    if(!parsedRes) return defaults;
    
    var newP = [];
    for (let i = 0; i < defaults.length; i++) {
        var oldStep:SettingDictionary = parsedRes.data[i];
        var defStep:SettingDictionary = defaults[i];
        
        //merge, however do not add values that are not present in default parameters
        var mergedStep = defStep;
        if(oldStep){ //might happen we had less steps previously
            for (let paramName in defStep){
                if(oldStep[paramName] !== undefined )
                    mergedStep[paramName] = oldStep[paramName];
            }
        }
        
        newP.push(mergedStep)
    }
    
    console.log(`[persistance]: Loaded Pipeline(${pipeName}) Parameters ${paramSetKey}: `,parsedRes);
    return newP;
}