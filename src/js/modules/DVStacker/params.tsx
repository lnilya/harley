import {PipelineStep} from "../../types/pipelinetypes";
import {Parameter} from "../_shared";
import {getDropdownParams, getTextInputParams} from "../_util";
import React from "react";
import {PipelineImage} from "../../types/datatypes";

/**Name of the module*/
export const moduleName = 'DVStacker'


/*FILE NAME FILTER*/
const beh = getDropdownParams('stacking',
    'Stacking Type',
    'The way that the stacking happens.',
    'max',
    {max:'Use Max Value',mean:'Use Mean Value'})

const channel = getTextInputParams('channel','Channel to use','The channel inside the image to use','Channel...','0',null,false)
const zstackdesc = (<div>
    Leave empty to use all.<br/>
    Otherwise you can define ranges with a colon and commas. Note that indices start from 0.<br/>
    Example:
    <ul>
        <li><strong>0:3</strong>{'=> 0,1,2,3'}</li>
        <li><strong>3:4,7:8</strong>{'=> 3,4,7,8'}</li>
        <li><strong>1,2,3</strong>{'=> 1,2,3'}</li>
    </ul>
</div>)
const zstacks = getTextInputParams('zstacks','ZStacks to use',zstackdesc,'ZStacks...','',null,false)



/**Parameter UI Definition the user can set in DVStacker*/
export const parameters:Array<Parameter<any>> = [
    beh,
    channel,
    zstacks,
]

/**Typing for DVStacker Inputs*/
export type Inputs = {
    dvImg:PipelineImage
}

/**Typing for DVStacker Outputs*/
export type Outputs = {
    stackedImg:PipelineImage
}

/**Shorthand for the PipelineStep of DVStacker*/
export type Step = PipelineStep<Inputs, Outputs>;

/**Parameter Object of DVStacker*/
export type Parameters = {
    stacking:string,
    channel:number,
    zstack:string,
}