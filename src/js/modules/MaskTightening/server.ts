import {PipelinePolygons} from "../../types/datatypes";
import * as eel from "../../eel/eel";
import {EelResponse} from "../../eel/eel";
import {updatePipelineData} from "../../state/stateutil";
import * as self from "./params";

export type MaskTighteningResult = { original:PipelinePolygons, tight:PipelinePolygons }
export async function runMaskTightening(curParams:self.Parameters, curStep:self.Step):Promise<EelResponse<MaskTighteningResult>>{
    
    //Run algorithm - this demo is for a simple image in and image out.
    var res:EelResponse<MaskTighteningResult> = await eel.runStepAsync<MaskTighteningResult>(self.moduleName,'apply',curParams,curStep)

    //Update Pipeline and downstream stuff
    updatePipelineData(curStep.outputKeys.tightCells,res.error ? null : res.data.tight);

    return res
}
export async function selectResults(curStep:self.Step,acceptedCells:number[]):Promise<EelResponse<boolean>>{
    return await eel.runStep<boolean>(self.moduleName,'selectEllipses',{'accepted':acceptedCells},curStep)
}
