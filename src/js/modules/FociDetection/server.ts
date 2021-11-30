import {EelResponse} from "../../eel/eel";
import * as eel from "../../eel/eel";
import {deletePipelineData, updatePipelineData} from "../../state/stateutil";
import * as self from "./params";
import {PipelineImage, PipelinePolygons} from "../../types/datatypes";

export type FociInCell = {
    foci:number[][], //K x 4 Array storing y, x, radius, intensity values for each foci location, detected by curvature
    basins?:PipelinePolygons, //Outlines of basins, when using brightness
    basinmeta?:number[][] //Kx4 Array of accepted focis meta data, centerX,centerY,maxintensity,borderinternsity
    img:PipelineImage //Preview Image of the Cell
}
export type FociDetectionResult = Array<FociInCell>
export type FociAdjustResult = {
    basins:PipelinePolygons,
    brightness:number
}
export async function runFociDetection(curParams:self.Parameters, curStep:self.Step):Promise<EelResponse<FociDetectionResult>>{
    
    //Run algorithm - this demo is for a simple image in and image out.
    var res:EelResponse<FociDetectionResult> = await eel.runStep<FociDetectionResult>(self.moduleName,'apply',curParams,curStep)

    //update pipeline, on error, delete the output again.
    if(res.error) deletePipelineData(curStep.outputKeys.foci);
    else updatePipelineData(curStep.outputKeys.foci,res.data);

    return res
}

export async function selectCellFittingResults(curStep:self.Step,individualThreshholds:number[], individualExceptions:number[][]):Promise<EelResponse<boolean>>{
    return await eel.runStep<boolean>(self.moduleName,
        'adjustThreshholds',
        {'ts':individualThreshholds, 'exceptions':individualExceptions},curStep)
}
export async function adjustAccepted(curStep:self.Step, curParams:self.Parameters, cellnum:number, accepted:boolean[], cellDeleted:boolean):Promise<EelResponse<boolean>>{
    return await eel.runStep<boolean>(self.moduleName,
        'excludeBasin',
        {...curParams, cellnum:cellnum, accepted:accepted, deleted:cellDeleted },curStep)
}

