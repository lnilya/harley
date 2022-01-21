import {EelResponse} from "../../../sammie/js/eel/eel";
import * as eel from "../../../sammie/js/eel/eel";
import * as self from "./params";
import {deletePipelineData, updatePipelineData} from "../../../sammie/js/state/stateutil";
import {PipelinePolygons} from "../../../sammie/js/types/datatypes";

export type SingleFocusData = {
    /**Mean brightness normalized and original*/
    mean:[number,number],
    /**max intensity / contour intensity ratio or 255 if contour intensity is 0*/
    drop:number,
}
export type FociDetectionParamsResult = {
    foci:PipelinePolygons[],
    fociData:SingleFocusData[][],
}
export async function runSelection(curParams:self.Parameters, curStep:self.Step,cells:number[], foci:number[][]):Promise<EelResponse<boolean>>{
    var res:EelResponse<boolean> = await eel.runStep<boolean>(self.moduleName,'applyselect',{...curParams, ...{cells,foci}},curStep)

    //update pipeline data; on error, delete the output again.
    if(res.error) deletePipelineData(curStep.outputKeys.foci);
    else updatePipelineData(curStep.outputKeys.foci,{cells:cells, foci:foci});
    
    return res;
}
export async function runFociDetectionParams(curParams:self.Parameters, curStep:self.Step,portion:number):Promise<EelResponse<FociDetectionParamsResult>>{
    //Run the algorithm associated with this module in python
    var res:EelResponse<FociDetectionParamsResult> = await eel.runStepAsync<FociDetectionParamsResult>(self.moduleName,'apply',{...curParams, portion:portion},curStep)

    return res
}