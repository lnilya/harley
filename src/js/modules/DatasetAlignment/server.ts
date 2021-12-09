import {EelResponse} from "../../../sammie/js/eel/eel";
import * as eel from "../../../sammie/js/eel/eel";
import * as self from "./params";
import {deletePipelineData, updatePipelineData} from "../../../sammie/js/state/stateutil";
import {PipelineImage} from "../../../sammie/js/types/datatypes";

/**Returned on first run*/
export type DatasetPreviewResult = {
    similartiy:number[][],
    previews1: PipelineImage[],
    previews2: PipelineImage[],
}
export type DatasetAlignmentResult = {
    demoResult:string
}
export async function preloadDataset(curParams:self.Parameters, curStep:self.Step):Promise<EelResponse<DatasetPreviewResult>>{
    
    //Run the algorithm associated with this module in python
    var res:EelResponse<DatasetPreviewResult> = await eel.runStep<DatasetPreviewResult>(self.moduleName,'preload',curParams,curStep)

    //update pipeline, on error, delete the output again.
    if(res.error) deletePipelineData(curStep.outputKeys.datasetPreview);
    else updatePipelineData(curStep.outputKeys.datasetPreview,res.data);

    return res
}