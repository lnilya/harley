import {PipelineImage} from "../../../sammie/js/types/datatypes";
import * as eel from "../../../sammie/js/eel/eel";
import {EelResponse} from "../../../sammie/js/eel/eel";
import * as self from "./params";
import {updatePipelineData} from "../../../sammie/js/state/stateutil";

export type DVStackerResult = {
    z:PipelineImage[],
    stack:PipelineImage
}
export async function runDVStacker(curParams:self.Parameters, curStep:self.Step):Promise<EelResponse<DVStackerResult>>{
    
    //Run algorithm - this demo is for a simple image in and image out.
    var res = await eel.runStepAsync<DVStackerResult>(self.moduleName,'apply',curParams,curStep)

    updatePipelineData(curStep.outputKeys.stackedImg,res.error ? null : res.data.stack);
    
    return res
}