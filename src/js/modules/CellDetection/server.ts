import * as self from "./params";
import {PipelineBlobs} from "../../../sammie/js/types/datatypes";
import * as eel from "../../../sammie/js/eel/eel";
import {EelResponse} from "../../../sammie/js/eel/eel";
import {updatePipelineData} from "../../../sammie/js/state/stateutil";

type CellDetectionBlobs = { blobs:PipelineBlobs , accepted: number[], border:number[] };

export async function runCellDetection(curParams:self.Parameters, curStep:self.Step):Promise<EelResponse<CellDetectionBlobs>>{
    
    //Run algorithm - this demo is for a simple image in and image out.
    var res:EelResponse<any> = await eel.runStep<PipelineBlobs>(self.moduleName,'apply',curParams,curStep)

    if(res.error) return Promise.resolve(res);
    
    //we only include the accepted in the pipeline
    var serverResponse:CellDetectionBlobs = res.data;
    var acceptedBlobs = serverResponse.blobs.filter((pbl,i)=>{
        return serverResponse.accepted.indexOf(i) != -1;
    });
    updatePipelineData(curStep.outputKeys.cells,res.error ? null : acceptedBlobs);
    
    return Promise.resolve({data:serverResponse})
}