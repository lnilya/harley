import {PipelineImage} from "../../types/datatypes";
import * as eel from "../../eel/eel";
import {EelResponse} from "../../eel/eel";
import {updatePipelineData} from "../../state/stateutil";
import * as self from "./params";

export type DenoiseResult = PipelineImage
export async function runDenoise(curParams:self.Parameters, curStep:self.Step):Promise<EelResponse<DenoiseResult>>{
    
    //Run algorithm - this demo is for a simple image in and image out.
    var res:EelResponse<DenoiseResult> = await eel.runStep<DenoiseResult>(self.moduleName,'apply',curParams,curStep)

    updatePipelineData(curStep.outputKeys.denoisedImg,res.error ? null : res.data);
    
    return res
}