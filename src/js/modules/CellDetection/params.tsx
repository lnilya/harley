import {PipelineBlobs, PipelineImage} from "../../types/datatypes";
import {Parameter} from "../_shared";
import {getSliderParams} from "../_util";
import {PipelineStep} from "../../types/pipelinetypes";


var size = 'The maximum width/height of the bounding box of the cell.'
var solidity = 'The number of white pixels in the blob divided by the area of its convex hull. A convex(i.e. more circular) blob will have a ratio of 1. Blobs with big indentations will get very small values.'

const sb_solidity = getSliderParams('solidity','Cell Solidity',solidity,0,1,0.01,[0.1,0.9],false)
const sb_size = getSliderParams('size','Cell Size',size,0,100,1,[30,90],true)

export const moduleName = 'CellDetection';
/**Parameters the user can set in this step*/
export const parameters:Array<Parameter<any>> = [
    sb_solidity,
    sb_size
]

/**Typing for input array*/
export type Inputs = {skeletonImg:PipelineImage, srcImg:PipelineImage }
export type Outputs = {cells:PipelineBlobs }
export type Step = PipelineStep<Inputs, Outputs>;

export type Parameters = {
    solidity:[number,number],
    size:[number,number]
    
    /*ttype:'whiteorblack'|'band'
    innerband:[number,number]
    outerband:[number,number],
    removeblobs:boolean,
    sb_solidity:[number,number],
    sb_size:[number],
    sb_area:[number],
    sb_ecc:[number,number]*/
}