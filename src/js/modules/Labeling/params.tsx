import {PipelineImage} from "../../types/datatypes";
import {PipelineStep} from "../../types/pipelinetypes";
import {Parameter} from "../_shared";
import React from "react";
import {LabelingResult} from "./server";
import {getCheckboxParams} from "../_util";

/**Name of the module*/
export const moduleName = 'Labeling'

/**Parameter UI Definition the user can set in Labeling*/
export const parameters:Array<Parameter<any>> = [
    getCheckboxParams('randomize','Random Order','Wether or not the cells for labeling are presented in a random order. If labeling the same dataset more than once, it makes sense to randomise it. Later you could compare your own labeling to itself to assess variability in your quantification.',
        'Present cells in random order',true,null,true)
]

/**Typing for Labeling Inputs*/
export type Inputs = {sizes:[number,number], cellImages:PipelineImage[] }

/**Typing for Labeling Outputs*/
export type Outputs = {labels:LabelingResult[], trainingData:any}

/**Shorthand for the PipelineStep of Labeling*/
export type Step = PipelineStep<Inputs, Outputs>;

/**Parameter Object of Labeling*/
export type Parameters = {
    randomize:boolean
    /*ttype:'whiteorblack'|'band'
    innerband:[number,number]
    outerband:[number,number],
    removeblobs:boolean,
    sb_solidity:[number,number],
    sb_size:[number],
    sb_area:[number],
    sb_ecc:[number,number]*/
}