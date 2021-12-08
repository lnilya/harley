import {EelResponse} from "../../../sammie/js/eel/eel";
import * as eel from "../../../sammie/js/eel/eel";
import * as self from "./params";
import {deletePipelineData, updatePipelineData} from "../../../sammie/js/state/stateutil";

export type __NAME__Result = {
    demoResult:string
}
export async function run__NAME__(curParams:self.Parameters, curStep:self.Step):Promise<EelResponse<__NAME__Result>>{
    
    //Run the algorithm associated with this module in python
    var res:EelResponse<__NAME__Result> = await eel.runStepAsync<__NAME__Result>(self.moduleName,'apply',curParams,curStep)

    //update pipeline, on error, delete the output again.
    if(res.error) deletePipelineData(curStep.outputKeys.out);
    else updatePipelineData(curStep.outputKeys.out,res.data);

    return res
}