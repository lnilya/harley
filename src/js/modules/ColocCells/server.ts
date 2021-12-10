import {EelResponse} from "../../../sammie/js/eel/eel";
import * as eel from "../../../sammie/js/eel/eel";
import * as self from "./params";
import {deletePipelineData, updatePipelineData} from "../../../sammie/js/state/stateutil";

export type ColocCellsResult = {
    demoResult:string
}
export async function runColocCells(curParams:self.Parameters, curStep:self.Step):Promise<EelResponse<ColocCellsResult>>{
    
    //Run the algorithm associated with this module in python
    var res:EelResponse<ColocCellsResult> = await eel.runStep<ColocCellsResult>(self.moduleName,'apply',curParams,curStep)

    //update pipeline, on error, delete the output again.
    // if(res.error) deletePipelineData(curStep.outputKeys.out);
    // else updatePipelineData(curStep.outputKeys.out,res.data);

    return res
}