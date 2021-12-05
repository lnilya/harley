import * as eel from "../../eel/eel";
import {EelResponse} from "../../eel/eel";
import {deletePipelineData, updatePipelineData} from "../../state/stateutil";
import * as self from "./params";
import {PipelineImage, PipelinePolygons} from "../../types/datatypes";

export type FociInCell = {
    fociMax:PipelinePolygons, //Contour loops of maximal length
    fociMin:PipelinePolygons, //Outlines loops of minimal length
}
export async function loadCellImages(curParams:self.Parameters,curStep:self.Step):Promise<EelResponse<PipelineImage[]>>{
    var res:EelResponse<PipelineImage[]> =
        await eel.runStep<PipelineImage[]>(self.moduleName,'generateImages',curParams,curStep)
    
    if(res.error) deletePipelineData(curStep.outputKeys.cellImages);
    else updatePipelineData(curStep.outputKeys.cellImages,res.data);
    
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