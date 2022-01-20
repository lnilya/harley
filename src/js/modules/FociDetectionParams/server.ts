import {EelResponse} from "../../../sammie/js/eel/eel";
import * as eel from "../../../sammie/js/eel/eel";
import * as self from "./params";
import {deletePipelineData, updatePipelineData} from "../../../sammie/js/state/stateutil";

export type FociDetectionParamsResult = {
    demoResult:string
}
export async function runFociDetectionParams(curParams:self.Parameters, curStep:self.Step):Promise<EelResponse<FociDetectionParamsResult>>{
    
    //Run the algorithm associated with this module in python
    var res:EelResponse<FociDetectionParamsResult> = await eel.runStepAsync<FociDetectionParamsResult>(self.moduleName,'apply',curParams,curStep)

    //update pipeline, on error, delete the output again.
    if(res.error) deletePipelineData(curStep.outputKeys.foci);
    else updatePipelineData(curStep.outputKeys.foci,res.data);

    return res
}