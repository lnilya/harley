import {PipelineImage} from "../../types/datatypes";
import {PipelineStep} from "../../types/pipelinetypes";
import {Parameter} from "../_shared";
import React from "react";

/**Name of the module*/
export const moduleName = '__NAME__'

/**Parameter UI Definition the user can set in __NAME__*/
export const parameters:Array<Parameter<any>> = []

/**Typing for __NAME__ Inputs*/
export type Inputs = {in:PipelineImage }

/**Typing for __NAME__ Outputs*/
export type Outputs = {out:PipelineImage}

/**Shorthand for the PipelineStep of __NAME__*/
export type Step = PipelineStep<Inputs, Outputs>;

/**Parameter Object of __NAME__*/
export type Parameters = {
    
    /*ttype:'whiteorblack'|'band'
    innerband:[number,number]
    outerband:[number,number],
    removeblobs:boolean,
    sb_solidity:[number,number],
    sb_size:[number],
    sb_area:[number],
    sb_ecc:[number,number]*/
}