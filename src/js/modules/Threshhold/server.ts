import * as eel from "../../eel/eel";
import {EelResponse} from "../../eel/eel";
import {PipelineImage} from "../../types/datatypes";
import * as self from "./params";
import {updatePipelineData} from "../../state/stateutil";

export async function runThreshhold(curParams:self.Parameters, curStep:self.Step):Promise<EelResponse<PipelineImage>>{
    
    //Run threshholding algorithm
    var res:EelResponse<any> = await eel.runStep<PipelineImage>(self.moduleName,'apply',curParams,curStep)

    updatePipelineData(curStep.outputKeys.threshholdedImg,res.error ? null : res.data);
    
    return res;
}