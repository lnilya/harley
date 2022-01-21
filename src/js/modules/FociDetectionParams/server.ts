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
export async function runFociDetectionParams(curParams:self.Parameters, curStep:self.Step,portion:number):Promise<EelResponse<FociDetectionParamsResult>>{
    
    //Run the algorithm associated with this module in python
    var res:EelResponse<FociDetectionParamsResult> = await eel.runStep<FociDetectionParamsResult>(self.moduleName,'apply',{...curParams, portion:portion},curStep)

    //update pipeline, on error, delete the output again.
    if(res.error) deletePipelineData(curStep.outputKeys.foci);
    else updatePipelineData(curStep.outputKeys.foci,res.data);

    return res
}