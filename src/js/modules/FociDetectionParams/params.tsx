import {Parameter} from "../../../sammie/js/modules/paramtypes";
import {PipelineStep} from "../../../sammie/js/types/pipelinetypes";
import React from "react";
import {getSliderParams} from "../../../sammie/js/modules/paramutil";
import {PipelineImage, PipelinePolygons} from "../../../sammie/js/types/datatypes";

/**Name of the module*/
export const moduleName = 'FociDetectionParams'

/**Parameter UI Definition the user can set in FociDetectionParams*/
export const parameters:Array<Parameter<any>> = [
    getSliderParams('sizeadjustment','Adjust Foci Size','If you feel the determined foci sizes are too big or too small, you can adjust all of them by this factor. The size adjustment cannot go over the max and min sizes of the foci, determined in the previous step of this pipeline.',0,2,0.01,1),
    getSliderParams('normbrightnessrange','Normalized Brightness Range','For all foci the average normalized brightness inside its area needs to lie inside these bounds.',0,1,0.01,[0,1],false,null,true),
    getSliderParams('rawbrightnessrange','Raw Brightness Range','For all foci the average absolute (i.e. unscaled, coming from microscope) brightness inside its area needs to lie inside these bounds.\n\nUse this setting to exclude cells with low absolute signal.',0,1,0.01,[0,1],false,null,true),
    getSliderParams('brightnessdrop','Min Brightness Drop','The brightness ratio between the brightest point of the focus and its outline. A value of for example 4 signifies that only foci are considered where the peak brightness is at least 4 times brighter than the outline of the focus.',1,20,0.25,1,false,null,true),
];

/**Typing for FociDetectionParams Inputs - Define Input Types/Names of this Pipeline step here.*/
export type Inputs = {dataset:any, cellImages:PipelineImage[], cellContours:PipelinePolygons }

/**Typing for FociDetectionParams Outputs - Define Output Types/Names of this Pipeline step here.*/
export type Outputs = {foci:any}

/**Shorthand for the PipelineStep of FociDetectionParams*/
export type Step = PipelineStep<Inputs, Outputs>;

/**Parameter Object of FociDetectionParams - Include all Parameters with their types that this step has. Should match the actual parameter definiton on top.*/
export type Parameters = {
    sizeadjustment:[number],
    normbrightnessrange:[number,number],
    rawbrightnessrange:[number,number],
    brightnessdrop:[number],
}