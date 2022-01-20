import {Parameter} from "../../../sammie/js/modules/paramtypes";
import {PipelineStep} from "../../../sammie/js/types/pipelinetypes";
import React from "react";
import {getSliderParams} from "../../../sammie/js/modules/paramutil";

/**Name of the module*/
export const moduleName = 'FociDetectionParams'

/**Parameter UI Definition the user can set in FociDetectionParams*/
export const parameters:Array<Parameter<any>> = [
    getSliderParams('sizeadjustment','Adjust Foci Size','If you feel the determined foci sizes are too big or too small, you can adjust all of them by this factor.',0,2,0.01,1),
];

/**Typing for FociDetectionParams Inputs - Define Input Types/Names of this Pipeline step here.*/
export type Inputs = {dataset:any }

/**Typing for FociDetectionParams Outputs - Define Output Types/Names of this Pipeline step here.*/
export type Outputs = {foci:any}

/**Shorthand for the PipelineStep of FociDetectionParams*/
export type Step = PipelineStep<Inputs, Outputs>;

/**Parameter Object of FociDetectionParams - Include all Parameters with their types that this step has. Should match the actual parameter definiton on top.*/
export type Parameters = {
    sizeadjustment:[number],
}