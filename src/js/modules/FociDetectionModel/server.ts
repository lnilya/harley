import * as eel from "../../eel/eel";
import {EelResponse} from "../../eel/eel";
import {deletePipelineData, updatePipelineData} from "../../state/stateutil";
import * as self from "./params";
import {PipelineImage, PipelinePolygons} from "../../types/datatypes";

export type FociDetectionModelResult = {
    /**Images of the cells*/
    imgs:PipelineImage[],
    /**Foci in each cell at optimal outline*/
    foci:PipelinePolygons[]
    /**Foci Indices selected by user in each cell at optimal outline*/
    selection:number[][]
    /**Foci indices selected by model  in each cell at optimal outline*/
    modelSelection:number[][]
}
export async function runFociDetectionModel(curParams:self.Parameters, curStep:self.Step, portion:number):Promise<EelResponse<FociDetectionModelResult>>{
    
    //Run algorithm - this demo is for a simple image in and image out.
    var res:EelResponse<FociDetectionModelResult> =
        await eel.runStepAsync<FociDetectionModelResult>(self.moduleName,'apply', {...curParams, portion:portion},curStep)

    //update pipeline, on error, delete the output again.
    if(res.error) deletePipelineData(curStep.outputKeys.foci);
    else updatePipelineData(curStep.outputKeys.foci,res.data.imgs.map((img,i)=>i));
    
    return res
}

export async function changeFociSelection(curParams:self.Parameters, curStep:self.Step, foci:number[][]):Promise<EelResponse<boolean>>{
    var res:EelResponse<boolean> = await eel.runStepAsync<boolean>(self.moduleName,'changefociselection', {curParams, foci:foci},curStep)
    return res
}
export async function changeCellSelection(curParams:self.Parameters, curStep:self.Step, cellNums:number[]):Promise<EelResponse<boolean>>{
    
    var res:EelResponse<boolean> = await eel.runStepAsync<boolean>(self.moduleName,'excludecell', {curParams, cells:cellNums},curStep)

    //update pipeline, on error, delete the output again.
    if(res.error) deletePipelineData(curStep.outputKeys.foci);
    else updatePipelineData(curStep.outputKeys.foci,cellNums);
    

    return res
}