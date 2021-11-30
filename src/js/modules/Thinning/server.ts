import * as self from "../Thinning/params";
import {PipelineImage} from "../../types/datatypes";
import * as eel from "../../eel/eel";
import {EelResponse} from "../../eel/eel";
import {updatePipelineData} from "../../state/stateutil";

export type ThinningResponse = {
    thinned:PipelineImage,
    thinnedWithGaps:PipelineImage,
}
export async function runThinning(curParams:self.Parameters, curStep:self.Step):Promise<EelResponse<ThinningResponse>>{

    var res:EelResponse<any> = await eel.runStep<PipelineImage>(self.moduleName,'apply',curParams,curStep)
    if(res.error) return Promise.resolve(res);

    updatePipelineData(curStep.outputKeys.skeleton,res.error ? null : res.data.thinned);
    
    return Promise.resolve({data:{
        thinned:res.data.thinned,
        thinnedWithGaps:res.data.thinnedWithGaps
    }})
}

