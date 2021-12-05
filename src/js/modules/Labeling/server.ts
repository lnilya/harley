import * as eel from "../../eel/eel";
import {EelResponse} from "../../eel/eel";
import {deletePipelineData, updatePipelineData} from "../../state/stateutil";
import * as self from "./params";
import {PipelinePolygons} from "../../types/datatypes";

export type LabelingResult = {
    cellNum:number,
    foci:number[],
    splits:number[],
    rejected:boolean,
    labelingData:SingleCellLabelingData
}
export type SingleCellLabelingData = {
    cellNum:number,
    /**Foci at different levels*/
    foci:PipelinePolygons[]
}
export type LabelResponse = {numCells:number}
export async function labelCell(curParams:self.Parameters, curStep:self.Step, cell:number, result:LabelingResult):Promise<EelResponse<LabelResponse>>{
    
    var res:EelResponse<LabelResponse> = await eel.runStep<LabelResponse>(self.moduleName,'labelCell',
        {...curParams, cell:cell, result:{foci:result.foci, splits:result.splits, labelingFoci:result.labelingData.foci} },curStep)
    
    //update pipeline, on error, delete the output again.
    if(res.error) {
        deletePipelineData(curStep.outputKeys.trainingData);
        deletePipelineData(curStep.outputKeys.labels);
    }
    else {
        //we do not need to store labeling results in pipeline, they are stored on server and arent relevant to the UI
        //the two different keys are just to be able to use it on server.
        updatePipelineData(curStep.outputKeys.labels, res.data);
        updatePipelineData(curStep.outputKeys.trainingData, res.data);
    }
    return res
}
export async function generateDatasetForCell(curParams:self.Parameters, curStep:self.Step, forCell:number, reset=false):Promise<EelResponse<SingleCellLabelingData>>{
    
    //Run algorithm - this demo is for a simple image in and image out.
    var res:EelResponse<SingleCellLabelingData> = await eel.runStep<SingleCellLabelingData>(self.moduleName,'getCellFoci',
        {...curParams, cell:forCell, reset:reset},curStep)

    //add cell number
    if(!res.error) res.data.cellNum = forCell
    

    return res
}