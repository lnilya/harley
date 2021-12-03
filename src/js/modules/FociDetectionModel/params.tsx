import {PipelineImage} from "../../types/datatypes";
import {PipelineStep} from "../../types/pipelinetypes";
import {Parameter} from "../_shared";
import React from "react";
import {getSliderParams} from "../_util";

/**Name of the module*/
export const moduleName = 'FociDetectionModel'

/**Parameter UI Definition the user can set in FociDetectionModel*/
export const parameters:Array<Parameter<any>> = [
    getSliderParams('sizeadjustment','Adjust Foci Size','If you feel the determined foci sizes are too big or too small, you can adjust all of them by this factor.',0,2,0.01,1),
    getSliderParams('fociperrow','Foci per Row','Number of Foci displayed in a row. The less dispalyed, the bigger the magnification.',3,8,1,4,false,null,true)
]

/**Typing for FociDetectionModel Inputs*/
export type Inputs = {model:any, dataset:any }

/**Typing for FociDetectionModel Outputs*/
export type Outputs = {foci:any}

/**Shorthand for the PipelineStep of FociDetectionModel*/
export type Step = PipelineStep<Inputs, Outputs>;

/**Parameter Object of FociDetectionModel*/
export type Parameters = {
    sizeadjustment:[number],
    fociperrow:[number],
}