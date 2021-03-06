import {PipelineImage} from "../../../sammie/js/types/datatypes";
import * as eel from "../../../sammie/js/eel/eel";
import {EelResponse} from "../../../sammie/js/eel/eel";
import {updatePipelineData} from "../../../sammie/js/state/stateutil";
import * as self from "./params";

export type CellFittingHeatmapResponse = {
    heatmap:PipelineImage,
    skel: PipelineImage
}
export async function runCellFittingHeatmap(curParams:self.Parameters, curStep:self.Step):Promise<EelResponse<CellFittingHeatmapResponse>>{
    
    //Run algorithm - this demo is for a simple image in and image out.
    var res:EelResponse<CellFittingHeatmapResponse> = await eel.runStepAsync<CellFittingHeatmapResponse>(self.moduleName,'apply',curParams,curStep)

    updatePipelineData(curStep.outputKeys.heatmap,res.error ? null : res.data.heatmap);
    updatePipelineData(curStep.outputKeys.skeleton,res.error ? null : res.data.skel);
    
    return res
}
