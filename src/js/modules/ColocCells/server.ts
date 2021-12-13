import {EelResponse} from "../../../sammie/js/eel/eel";
import * as eel from "../../../sammie/js/eel/eel";
import * as self from "./params";
import {deletePipelineData, updatePipelineData} from "../../../sammie/js/state/stateutil";
import {PipelineImage, PipelinePolygons, PolygonData} from "../../../sammie/js/types/datatypes";

export type ColocSingleCellImages = [PipelineImage,PipelineImage,PipelineImage,PipelineImage]
export type ColocCellsResult = {
    imgs:ColocSingleCellImages[]
    cnts:PolygonData[],
    selected:number[],
    foci:[PipelinePolygons[],PipelinePolygons[]]
}
export async function runCellSelection(curParams:self.Parameters, curStep:self.Step, selectedCells:number[]):Promise<EelResponse<boolean>>{
    
    var res:EelResponse<boolean> = await eel.runStep<boolean>(self.moduleName,'select', {...curParams, select:selectedCells},curStep)
    
    //update pipeline, on error, delete the output again.
    if(res.error) deletePipelineData(curStep.outputKeys.colocCells);
    else updatePipelineData(curStep.outputKeys.colocCells,selectedCells);
    
    return res
}
export async function runColocCells(curParams:self.Parameters, curStep:self.Step):Promise<EelResponse<ColocCellsResult>>{
    
    //Run the algorithm associated with this module in python
    var res:EelResponse<ColocCellsResult> = await eel.runStep<ColocCellsResult>(self.moduleName,'apply',curParams,curStep)

    //update pipeline, on error, delete the output again.
    if(res.error) deletePipelineData(curStep.outputKeys.colocCells);
    else updatePipelineData(curStep.outputKeys.colocCells,res.data.selected);

    return res
}