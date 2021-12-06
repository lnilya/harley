import {EelResponse} from "../../eel/eel";
import * as eel from "../../eel/eel";
import {updatePipelineData,deletePipelineData} from "../../state/stateutil";
import * as self from "./params";

export type __NAME__Result = {
    demoResult:string
}
export async function run__NAME__(curParams:self.Parameters, curStep:self.Step):Promise<EelResponse<__NAME__Result>>{
    
    //Run athe lgorithm associated with this module
    var res:EelResponse<__NAME__Result> = await eel.runStepAsync<__NAME__Result>(self.moduleName,'apply',curParams,curStep)

    //update pipeline, on error, delete the output again.
    if(res.error) deletePipelineData(curStep.outputKeys.foci);
    else updatePipelineData(curStep.outputKeys.foci,res.data);

    return res
}