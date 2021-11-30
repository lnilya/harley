import {PipelineImage} from "../../types/datatypes";
import React, {ReactNode} from "react";
import {getCheckboxParams, getSliderParams} from "../_util";
import {Condition} from "../_shared";
import {PipelineStep} from "../../types/pipelinetypes";


var eccentricity = 'An eccentricity of 0 means the outer shape (convex hull) of a blob is circular. The higher it is the less circular the blob is.'
var area = 'The number of white pixels in the blob.'
var size = 'The maximum width/height of the bounding box of the blob.'
var solidity = 'The number of white pixels in the blob divided by the area of its convex hull. A convex blob will have a ratio of 1. Blobs with big holes (i.e. outlines) will get very small values.'
var sbTutorial:ReactNode = <div>
    In order to make the threshholded image clearer, small blobs can be removed, either by limiting different values.
    <ul>
        <li><strong>Eccentricity</strong>: {eccentricity}</li>
        <li><strong>Size</strong>: {size}</li>
        <li><strong>Area</strong>: {area}</li>
        <li><strong>Solidity</strong>: {solidity}</li>
    </ul>
</div>
const smallBlobs = getCheckboxParams('removeblobs','Small Blob Removal',sbTutorial,'Enable',true)
const cond:Condition = (allSettings)=>allSettings['removeblobs'] ? 'active' : "hide";
const sb_solidity = getSliderParams('sb_solidity','Solidity',solidity,0,1,0.01,[0.1,0.9],false,cond)
const sb_size = getSliderParams('sb_size','Min Size',size,0,100,1,0,true,cond)
const sb_ecc = getSliderParams('sb_eccentricity','Eccentricity',eccentricity,0,1,0.01,[0,1],false,cond)
const sb_area = getSliderParams('sb_area','Min Area',area,0,5000,50,0,true,cond)

/**Parameters the user can set in this step*/
export const parameters = [
    smallBlobs,
    sb_ecc,
    sb_size,
    sb_area,
    sb_solidity
]

export const moduleName = 'BlobRemoval';

/**Typing for input data*/
export type Inputs = {srcImg:PipelineImage, threshholdedImg:PipelineImage};
/**Typing for output data*/
export type Outputs = {cleanedImg:PipelineImage};
/**Typing for PipelineStep*/
export type Step = PipelineStep<Inputs, Outputs>;

/**Typing for Parameter Values*/
export type Parameters = {
    removeblobs:boolean
    sb_solidity:[number,number],
    sb_size:[number],
    sb_area:[number],
    sb_ecc:[number,number]
}