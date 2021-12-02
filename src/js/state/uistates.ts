/**Stores all states related to the state of the UI*/
import {connectedAtom, connectedSelector} from "./ConnectedStore";
import {OverlayState} from "../types/maintypes";
import {selector} from "recoil";
import {PipelineName} from "../types/datatypes";
import {Pipeline, PipelineStep} from "../types/pipelinetypes";


/*
* States related to descriptive data of pipelines, steps and the UI.
* But does not store any actual input/parameter/output data.
* This should go in algstate.ts.
* */


//***************************************************************/
//* PIPELINES RELATED */
//***************************************************************/

/**All Pipelines the user can select*/
export const allPipelines = connectedAtom<Record<PipelineName,Pipeline>>({key:'all_pipelines',default:{}});
/**The name of the current selected pipeline*/
export const selectedPipelineName = connectedAtom<PipelineName>({key:'sel_pipeline_name',default:''})
/**Convenience Selector for the actual Pipeline Object*/
export const selectedPipeline = connectedSelector<Pipeline>({key:'sel_pipeline',
    get:({get})=>{
        if(get(selectedPipelineName))
            return get(allPipelines)[get(selectedPipelineName)]
        return null
    }})


//***************************************************************/
//* SELECTED / CURRENT PIPELINE RELATED */
//***************************************************************/


/**All Steps of the pipeline in order of their execution*/
export const allPipelineSteps = connectedAtom<Array<PipelineStep<any,any>>>({key:'all_step',default:null});
/**Current step of the pipeline*/
export const curPipelineStepNum = connectedAtom<number>({key:'cur_step_num',default:-1})
/**Convenience selector to get the actual step data for current step*/
export const curPipelineStep = connectedSelector<PipelineStep<any,any>>({key:'cur_step',get:({get}) => {
    const csn = get(curPipelineStepNum);
    const all = get(allPipelineSteps);
    if(csn >= 0 && csn <= all?.length) return all[csn];
    return null;
}})



//***************************************************************/
//* UI RELEATED */
//***************************************************************/

/**For displaying an overlay during the execution of an algorithm*/
export const overlay = connectedAtom<null|OverlayState>({key:'overlay',default:null});

/**Indicates wether the right drawer main menu is open*/
export const autoExecDialogOpen = connectedAtom<boolean>({key:'autoexec-open',default:false});

export enum UIPopups{
    /**Loading Parameters*/
    paramload,
    /**Saving parameters*/
    paramsave,
}
/**Indicates an open popup*/
export const popupOpen = connectedAtom<UIPopups>({key:'popup-open',default:null});

/**Wethre or not server can be contacted*/
export const serverConnected = connectedAtom<boolean>({key:'eel_connection',default:window['eel'] !== undefined});


//***************************************************************/
//* EXPORTER */
//***************************************************************/
export enum UIScreens{
    /**Showing the pipeline in the current step*/
    pipeline,
    /**DataLoader Module, to setup source data for current pipeline*/
    input,
    /**Exporter Module to export batch data, for current pipeline*/
    output,
    /**Exporter Module to export aggregate pipeline data, for current pipeline*/
    aggregate,
    /**Help Screen for current pipeline*/
    pipelinehelp,
    /**Welcome Screen of the app*/
    welcome,
    /**Switch of Pipeline Screens*/
    pipelineswitch
}
export const appScreen = connectedAtom<UIScreens>({key:'screen',default:UIScreens.pipelineswitch})
