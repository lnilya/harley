import * as self from "../Thinning/params";
import {PipelineImage} from "../../../sammie/js/types/datatypes";
import * as eel from "../../../sammie/js/eel/eel";
import {EelResponse} from "../../../sammie/js/eel/eel";
import {updatePipelineData} from "../../../sammie/js/state/stateutil";

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

