import {EelResponse} from "../../../sammie/js/eel/eel";
import * as eel from "../../../sammie/js/eel/eel";
import * as self from "./params";
import {deletePipelineData, updatePipelineData} from "../../../sammie/js/state/stateutil";
import {SingleDataBatch} from "../../../sammie/js/state/algstate";


export type ColocGraphsResult = {
    nn: {fwd:number[],bck:number[]},
    overlap: {abs:number[], fwd:number[],bck:number[]}
    stats:{cells:number, num0:number, num1:number}
}
export async function runColocGraphs(curParams:self.Parameters, curStep:self.Step, scale:number):Promise<EelResponse<ColocGraphsResult>>{
    
    //Run the algorithm associated with this module in python
    var res:EelResponse<ColocGraphsResult> = await eel.runStep<ColocGraphsResult>(self.moduleName,'apply',
        {curParams, scale:(!scale || isNaN(scale)) ? 1 : scale},curStep)

    //update pipeline, on error, delete the output again.
    if(res.error) deletePipelineData(curStep.outputKeys.graphdata);
    else updatePipelineData(curStep.outputKeys.graphdata,res.data);

    return res
}