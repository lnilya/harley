import {EelResponse} from "../../../sammie/js/eel/eel";
import * as eel from "../../../sammie/js/eel/eel";
import * as self from "./params";
import {deletePipelineData, updatePipelineData} from "../../../sammie/js/state/stateutil";
import {SingleDataBatch} from "../../../sammie/js/state/algstate";


/**All data on a single Focus.*/
export type FociScatter = {
    //Original cell number (in array of selected cells)
    cellNum:number,
    //original number of focus inside the cell
    focusNum:number,
    //basic continuous properties
    area:number,
    overlappedArea:number,
    contourDistToNN:number,
    centroidDistToNN:number,
    numOverlapPartners:number,
    
    //relational properties
    nearestNeighbour:number,
    overlapPartners:number[],
    
};
export type ColocGraphsResult = {
    nn: {fwd:number[],bck:number[]},
    pcc: {cell:[number,number][],foci:[number,number][],fwd:[number,number][],bck:[number,number][]},
    nncentroid: {fwd:number[],bck:number[]},
    overlap: {abs:number[], fwd:number[],bck:number[]}
    stats:{cells:number, num0:number, num1:number},
    scatter:{c0:FociScatter[],c1:FociScatter[]}
}
export async function runColocGraphs(curParams:self.Parameters, curStep:self.Step, scale:number):Promise<EelResponse<ColocGraphsResult>>{
    
    //Run the algorithm associated with this module in python
    var res:EelResponse<ColocGraphsResult> = await eel.runStep<ColocGraphsResult>(self.moduleName,'apply',
        {curParams, scale:(!scale || isNaN(scale)) ? 1 : scale},curStep)

    //update pipeline, on error, delete the output again.
    if(res.error) deletePipelineData(curStep.outputKeys.graphdata);
    else updatePipelineData(curStep.outputKeys.graphdata,res.data);

    return res
}