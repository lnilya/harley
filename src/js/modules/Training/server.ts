import * as eel from "../../../sammie/js/eel/eel";
import {EelResponse} from "../../../sammie/js/eel/eel";
import {deletePipelineData, updatePipelineData} from "../../../sammie/js/state/stateutil";
import * as self from "./params";

export type TrainingResult = {
    /**CrossValidation MCC of model*/
    cv:number,
    
    /**Test MCC of model*/
    test:number,
    
    /**Curve of CV-MCC over number of foci used from dataset*/
    traincurve:{mean:number[],std:number[],x:number[]},
}
export async function runTraining(curParams:self.Parameters, curStep:self.Step):Promise<EelResponse<TrainingResult>>{
    
    //Run algorithm - this demo is for a simple image in and image out.
    var res:EelResponse<TrainingResult> = await eel.runStepAsync<TrainingResult>(self.moduleName,'train',curParams,curStep)
    
    //update pipeline, on error, delete the output again.
    if(res.error) deletePipelineData(curStep.outputKeys.model);
    else updatePipelineData(curStep.outputKeys.model,res.data);

    return res
}