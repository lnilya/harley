import {PipelineImage} from "../../types/datatypes";
import {PipelineStep} from "../../types/pipelinetypes";
import {Parameter} from "../_shared";
import React from "react";
import {SingleCellLabelingData} from "../Labeling/server";
import {getCheckboxParams} from "../_util";

/**Name of the module*/
export const moduleName = 'Training'

const cvcurveDesc = `Shows the training curve on a successively increasing subset of labeled data.
This allows you to assess whether or not it is worth adding more labels to the training set. Given a very small subset of data
the models performance will be poor, generally as the set size increases so does the performence. At some point the curve levels off
and adding more data does not lead to a significant increase in performance. You can stop adding data if you see the curve leveling off.
Generating this curve might take some time and is therefore optional.
 `
/**Parameter UI Definition the user can set in Training*/
export const parameters:Array<Parameter<any>> = [
    getCheckboxParams('trainingCurve','Show Training Curve',cvcurveDesc,'Show',false)
]

/**Typing for Training Inputs*/
export type Inputs = {labels:SingleCellLabelingData[]}

/**Typing for Training Outputs*/
export type Outputs = {model:any}

/**Shorthand for the PipelineStep of Training*/
export type Step = PipelineStep<Inputs, Outputs>;

/**Parameter Object of Training*/
export type Parameters = {
    trainingCurve:boolean
    /*ttype:'whiteorblack'|'band'
    innerband:[number,number]
    outerband:[number,number],
    removeblobs:boolean,
    sb_solidity:[number,number],
    sb_size:[number],
    sb_area:[number],
    sb_ecc:[number,number]*/
}