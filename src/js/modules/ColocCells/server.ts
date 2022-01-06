import {EelResponse} from "../../../sammie/js/eel/eel";
import * as eel from "../../../sammie/js/eel/eel";
import * as self from "./params";
import {deletePipelineData, updatePipelineData} from "../../../sammie/js/state/stateutil";
import {PipelineImage, PipelinePolygons, PolygonData} from "../../../sammie/js/types/datatypes";

export type ColocSingleCellImages = [PipelineImage,PipelineImage,PipelineImage,PipelineImage]
export type ColocCellsResult = {
    imgs:ColocSingleCellImages[]
    cnts:PolygonData[],
    cellAreas:number[],
    selected:number[],
    foci:[PipelinePolygons[],PipelinePolygons[]]
    pccs:[number,number][]
    fpccs:[number,number][]
}
export async function runCellSelection(curParams:self.Parameters, curStep:self.Step, selectedCells:number[], curResult:ColocCellsResult):Promise<EelResponse<boolean>>{
    
    var res:EelResponse<boolean> = await eel.runStep<boolean>(self.moduleName,'select', {...curParams, select:selectedCells},curStep)
    
    //update pipeline, on error, delete the output again.
    if(res.error) deletePipelineData(curStep.outputKeys.colocResult);
    else updatePipelineData<ColocCellsResult>(curStep.outputKeys.colocResult, {...curResult, selected:selectedCells});
    
    return res
}
export async function runColocCells(curParams:self.Parameters, curStep:self.Step, scale:number):Promise<EelResponse<ColocCellsResult>>{
    
    //Run the algorithm associated with this module in python
    var res:EelResponse<ColocCellsResult> = await eel.runStep<ColocCellsResult>(self.moduleName,'apply', {...curParams,scale:scale},curStep)

    //update pipeline, on error, delete the output again.
    if(res.error) deletePipelineData(curStep.outputKeys.colocResult);
    else updatePipelineData<ColocCellsResult>(curStep.outputKeys.colocResult,res.data);

    return res
}