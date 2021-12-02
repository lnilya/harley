import {PipelineImage} from "../../types/datatypes";
import {PipelineStep} from "../../types/pipelinetypes";
import {Parameter} from "../_shared";
import React from "react";
import {getSliderParams} from "../_util";

/**Name of the module*/
export const moduleName = 'FociCandidates'

const sizeDesc = `
Min/Max circumference of the foci in px. This is an approximate value that needs to be set according to the size of features in question.
Choose a range that is tight enough not to encompass unnecessarily big areas or multiple foci but also small enough to capture the smallest foci. The actual sizes of the
foci will lie in the range between these two values and are determined automatically.
`
const granDesc = `It is recommended not to change this parameter, since it has only a very minor effect.\n\n
Contour Loops are analyzed by first finding all contours at this many levels of intensity and then picking out closed loops.
It governs how close the shortest and longest contours will be to the desired circumference. The higher the granularity is, the more the contours found will match the desired circumference, but also the contour extraction will be (~linearly) slower.
Consider lowering this parameter if your dataset is very large and contour detection takes a long time, identify the best parameters and before exporting set it back to a higher value.`;
/**Parameter UI Definition the user can set in FociCandidates*/
export const parameters:Array<Parameter<any>> = [
    getSliderParams('fociSize','Foci Circumference in px',sizeDesc,5,100,1,[10,40]),
    getSliderParams('granularity','Granularity',granDesc,20,200,1,150),
]

/**Typing for FociCandidates Inputs*/
export type Inputs = {dataset:PipelineImage[] }

/**Typing for FociCandidates Outputs*/
export type Outputs = {cellImages:PipelineImage[], sizes:[number,number]}

/**Shorthand for the PipelineStep of FociCandidates*/
export type Step = PipelineStep<Inputs, Outputs>;

/**Parameter Object of FociCandidates*/
export type Parameters = {
    fociSize:[number,number],
    granularity:[number]
}