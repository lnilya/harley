import {EelResponse} from "../../../sammie/js/eel/eel";
import * as eel from "../../../sammie/js/eel/eel";
import * as self from "./params";
import {deletePipelineData, updatePipelineData} from "../../../sammie/js/state/stateutil";
import {PipelineImage, PipelinePolygons} from "../../../sammie/js/types/datatypes";

/**Returned on first run*/
export type DatasetPreviewResult = {
    similarity:number[][],
    previews1: Array<{ img:PipelineImage,contours:PipelinePolygons }>
    previews2: Array<{ img:PipelineImage,contours:PipelinePolygons }>
    suggestedAlignment:number[]
}
export type DatasetAlignmentResult = {
    demoResult:string
}
export async function setAlignment(curParams:self.Parameters, curStep:self.Step, alignment:number[]):Promise<EelResponse<boolean>>{
    var res:EelResponse<boolean> = await eel.runStep<boolean>(self.moduleName,'align', {...curParams, alignment:alignment},curStep)
    
    //update pipeline, on error, delete the output again.
    if(res.error) deletePipelineData(curStep.outputKeys.alignedDatasets);
    else updatePipelineData(curStep.outputKeys.alignedDatasets, alignment);
    
    return res
}
export async function preloadDataset(curParams:self.Parameters, curStep:self.Step):Promise<EelResponse<DatasetPreviewResult>>{
    
    //Run the algorithm associated with this module in python
    var res:EelResponse<DatasetPreviewResult> = await eel.runStep<DatasetPreviewResult>(self.moduleName,'preload',curParams,curStep)
    //update pipeline, on error, delete the output again.
    if(res.error) deletePipelineData(curStep.outputKeys.alignedDatasets);
    else updatePipelineData(curStep.outputKeys.alignedDatasets, res.data.suggestedAlignment);
    
    return res
}