import {EelResponse} from "../../eel/eel";
import * as eel from "../../eel/eel";
import {updatePipelineData,deletePipelineData} from "../../state/stateutil";
import * as self from "./params";
import {PipelineImage, PipelinePolygons} from "../../types/datatypes";

export type FociDetectionModelResult = {
    /**Images of the cells*/
    imgs:PipelineImage[],
    /**Foci in each cell at optimal outline*/
    foci:PipelinePolygons[]
}
export async function runFociDetectionModel(curParams:self.Parameters, curStep:self.Step):Promise<EelResponse<FociDetectionModelResult>>{
    
    //Run algorithm - this demo is for a simple image in and image out.
    var res:EelResponse<FociDetectionModelResult> = await eel.runStepAsync<FociDetectionModelResult>(self.moduleName,'apply',curParams,curStep)

    //update pipeline, on error, delete the output again.
    if(res.error) deletePipelineData(curStep.outputKeys.foci);
    else updatePipelineData(curStep.outputKeys.foci,res.data.imgs.map((img,i)=>i));
    
    return res
}
export async function changeCellSelection(curParams:self.Parameters, curStep:self.Step, cellNums:number[]):Promise<EelResponse<boolean>>{
    
    //Run algorithm - this demo is for a simple image in and image out.
    var res:EelResponse<boolean> = await eel.runStepAsync<boolean>(self.moduleName,'excludecell', {curParams, cells:cellNums},curStep)

    //update pipeline, on error, delete the output again.
    if(res.error) deletePipelineData(curStep.outputKeys.foci);
    else updatePipelineData(curStep.outputKeys.foci,cellNums);
    

    return res
}