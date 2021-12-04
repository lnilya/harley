
//***************************************************************/
//* ALL STATES RELATED TO THE ALGORITHM */
//***************************************************************/


/*
 * Statemodel always has the current parameters of an algorithm in one atom.
 * When we migrate from one step to the other this atom is replaced and has different data.
 * The total state of all settings is stored inside another object and is through this accessible.
 * The results are being stored yet again separately by step.
 *
 */

import {connectedAtom, connectedSelector} from "./ConnectedStore";
import {
    LocalFilePath,
    LocalFileWithPreview,
    PipelineData,
    PipelineDataAggregatorID,
    PipelineDataKey
} from "../types/datatypes";
import {ParameterKey, SettingDictionary} from "../modules/_shared";
import * as ui from './uistates'
import {curPipelineStep} from './uistates'
import {atom, selector} from "recoil";
import {GlobalPipelineSettings, PipelineAggregatorOutput, PipelineStep} from "../types/pipelinetypes";


/**Stores all available data by key. The key is set in the pipeline. This way a step can identify wether or not
 * it misses certain data*/
export const allPipelineData = connectedAtom<Record<PipelineDataKey,PipelineData>>({key:'all_data',default:{}});

/**Stores a single input into the pipeline, the one that is being processed*/
export const allPipelineInputs = connectedAtom<Record<PipelineDataKey,LocalFileWithPreview>>({key:'all_pl_inputs',default:{}});

// export const allPipelineAggregatePaths = connectedAtom<Record<PipelineDataAggregatorID,LocalFilePath>>({key:'all_pl_aggregates',default:{}});


export type SingleDataBatch = {
    /**Files loaded into this batch*/
    inputs: Record<PipelineDataKey,LocalFileWithPreview>,
    
    /**Parameters for this batch*/
    batchParameters: Record<ParameterKey, any>,
    
    /**Name of settings set in this batch*/
    settingsSetName:string
}
/**Stores batches, i.e. array of inputs to be processed sequentially*/
export const allPipelineBatches = connectedAtom<SingleDataBatch[]>({key:'all_pl_batches', default:[]});

/**The number of the batch currently loaded, which is an index of allPipelineBatches. If a batch is deleted,
 *  this index needs to change as well to still point to the right batch.*/
export const curLoadedBatch = connectedAtom<number>({key:'cur_pl_batches', default:-1});


export type BatchInfo = {batch:number, displayedBatch:number, totalDispBatches:number};
/**Since allPipelineBatches is not a dense array, i.e. it has nulls in it, which is necessary due to preloading of images
 * we use this selector which always gives a batch number, corresponding to the batch number the user sees:
 * example if allBatches is: [b1,null,null,b2] and curLoadedBatch: 3  then displayedBatchNumber = 1
 * Since the user only sees [b1,b2], and hence inde 1 corresponds to b2
 * */
export const loadedBatchInfo = connectedSelector<BatchInfo>({key:'cur_displayed_batch',
    get:({get})=>{
        const apb = get(allPipelineBatches);
        const bn = get(curLoadedBatch);
        var k = 0;
        for (let i = 0; i < apb.length; i++) {
            if(i == bn) break;
            if(apb[i] != null) k++;
        }
        return {batch:bn, displayedBatch:k, totalDispBatches:apb.filter(e=>e!=null).length};
    }})


/**Values of all parameters of the current step, keys are set inside the steps module definition and should
 * only be relevant to the respective step. Will not contain uiOnly Steps*/
export const curPipelineStepParameterValues = selector<SettingDictionary | null>({
    key: 'cur_params',
    get: ({get}) => {
        var csn = get(ui.curPipelineStepNum);
        const allParams = get(curPipelineParameterValues);
        var step = get(curPipelineStep);
        if (csn >= 0 && csn < allParams.length) {
            //filter out uiOnly parameters
            var ret = {};
            for (let pkey in allParams[csn]) {
                const isValidParam = !!step.parameters.find((p)=>p.key == pkey && !p.uiOnly)
                if(isValidParam)
                    ret[pkey] = allParams[csn][pkey]
             }
            return ret
        }
        //filter out uionly parameters
        return null;
    }
});
/**Values of all parameters of the current step, keys are set inside the steps module definition and should
 * only be relevant to the respective step. Will not contain uiOnly Steps*/
export const curPipelineStepParameterValuesUI = selector<SettingDictionary | null>({
    key: 'cur_params_ui',
    get: ({get}) => {
        var csn = get(ui.curPipelineStepNum);
        var allParams = get(curPipelineParameterValues);
        var step = get(curPipelineStep);
        if (csn >= 0 && csn < allParams.length)
            return allParams[csn]
        return null;
    }
});

/**All Input Data for current step in the pipeline.*/
export const curPipelineStepInputData = selector<Record<string,PipelineData>>({
    key: 'cur_inputs',
    get: ({get}) => {
        var csn:PipelineStep<any, any> = get(ui.curPipelineStep);
        var allData = get(allPipelineData);
        var res = {}
        for (let ik in csn.inputKeys) {
            res[ik] = allData[csn.inputKeys[ik]];
        }
        return res;
    }
});

/**Stores all the parameter values for all steps of the current pipeline as one dictionary. This is
 * used to persist state.*/
export const curPipelineParameterValues = connectedAtom<Array<SettingDictionary>>({key:'all_params',default:[]})

export enum RunningMode{
    manual, //not running/manual mode
    running, //will stop when all batches are finished
    runningUntilNextExport//Will stop when current batch is finished
}

/**Determines the state of the automated pipeline execution*/
export const pipelineExecution = connectedAtom<RunningMode>({key:'pl_running_state',default:RunningMode.manual})

export const pipelineGlobalSettings = connectedAtom<GlobalPipelineSettings>({key:'pl_globalsettings',default:null})

export type PipelineLogEntry = {msg:string,type:'success'|'fail'|'info',duration:number|null, time:number};
export const pipelineLog = connectedAtom<PipelineLogEntry[]>({key:'pl_log',default:[]})
