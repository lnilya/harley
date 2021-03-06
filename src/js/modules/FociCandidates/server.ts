import * as eel from "../../../sammie/js/eel/eel";
import {EelResponse} from "../../../sammie/js/eel/eel";
import {deletePipelineData, updatePipelineData} from "../../../sammie/js/state/stateutil";
import * as self from "./params";
import {PipelineImage, PipelinePolygons} from "../../../sammie/js/types/datatypes";

export type FociInCell = {
    fociMax:PipelinePolygons, //Contour loops of maximal length
    fociMin:PipelinePolygons, //Outlines loops of minimal length
}
export type CellImageResponse = {
    imgs:PipelineImage[],
    contours:PipelinePolygons
}
export async function loadCellImages(curParams:self.Parameters,curStep:self.Step):Promise<EelResponse<CellImageResponse>>{
    var res:EelResponse<CellImageResponse> =
        await eel.runStep<CellImageResponse>(self.moduleName,'generateImages',curParams,curStep)
    
    if(res.error) {
        deletePipelineData(curStep.outputKeys.cellImages);
        deletePipelineData(curStep.outputKeys.cellContours);
    }
    else {
        updatePipelineData(curStep.outputKeys.cellImages, res.data.imgs);
        updatePipelineData(curStep.outputKeys.cellContours, res.data.contours);
    }
    
    return res
}
export async function runFociCandidates(curParams:self.Parameters, curStep:self.Step, cellNum:number):Promise<EelResponse<FociInCell>>{
    
    //Run algorithm - this demo is for a simple image in and image out.
    var res:EelResponse<FociInCell> = await eel.runStep<FociInCell>(self.moduleName,'apply', {...curParams, cellNum:cellNum},curStep)

    //update pipeline, on error, delete the output again.
    if(res.error) deletePipelineData(curStep.outputKeys.sizes);
    else updatePipelineData(curStep.outputKeys.sizes,curParams.fociSize);

    return res
}