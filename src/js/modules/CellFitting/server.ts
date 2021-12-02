import {PipelineImage, PipelinePolygons} from "../../types/datatypes";
import * as eel from "../../eel/eel";
import {EelResponse} from "../../eel/eel";
import * as self from "./params";
import {updatePipelineData} from "../../state/stateutil";

export type CellFittingResponse = {
    /**new threshholded heatmap*/
    heatmap:PipelineImage,
    /**Coordinates of maxima that were found*/
    maxima: PipelinePolygons,
    /**Indices of the points that were accepted wrt constraints*/
    accepted: Array<number>
}

export async function selectCellFittingResults(curStep:self.Step,acceptedEllipses:Array<number>):Promise<EelResponse<boolean>>{
    return await eel.runStep<boolean>(self.moduleName,'selectEllipses',{'accepted':acceptedEllipses},curStep)
}
export async function runCellFitting(curParams:self.Parameters, curStep:self.Step):Promise<EelResponse<CellFittingResponse>>{
    
    //Run algorithm - this demo is for a simple image in and image out.
    var res:EelResponse<CellFittingResponse> = await eel.runStep<CellFittingResponse>(self.moduleName,'apply',curParams,curStep)

    updatePipelineData(curStep.outputKeys.ellipses,res.error ? null : res.data);
    return res
}