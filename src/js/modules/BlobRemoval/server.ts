import {PipelineImage} from "../../types/datatypes";
import * as eel from "../../eel/eel";
import {EelResponse} from "../../eel/eel";
import {updatePipelineData} from "../../state/stateutil";
import * as self from "./params";

export async function runBlobRemoval(curParams:self.Parameters, curStep:self.Step):Promise<EelResponse<PipelineImage>>{
    
    //Run threshholding algorithm
    var res:EelResponse<any> = await eel.runStep<PipelineImage>(self.moduleName,'apply',curParams,curStep)

    updatePipelineData(curStep.outputKeys.cleanedImg,res.error ? null : res.data);
    
    return res
}
