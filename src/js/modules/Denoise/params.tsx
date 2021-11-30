import {PipelineImage} from "../../types/datatypes";
import {PipelineStep} from "../../types/pipelinetypes";
import {Parameter} from "../_shared";
import {getSliderParams, getTitleSeparatorParams} from "../_util";
import React from "react";

/**Name of the module*/
export const moduleName = 'Denoise'

const h = getSliderParams('h',
    'Denoising Strength',
    'Big value perfectly removes noise but also removes image details, smaller value preserves details but also preserves some noise. If set to 0 will not do any denoising',
    0,40,0.1,10)
const tw = getSliderParams('twindow',
    'Template Window Size',
    'Size in pixels of the template patch that is used to compute weights. Should be odd. Recommended value 7 pixels.',
    3,21,2,7)
const sw = getSliderParams('swindow',
    'Search Window Size',
    'Size in pixels of the window that is used to compute weighted average for given pixel. Should be odd. Affect performance linearly: greater searchWindowsSize - greater denoising time. Recommended value 21 pixels',
    7,41,2,21)

const sepDesc =<>
    See <a href="http://www.ipol.im/pub/algo/bcm_non_local_means_denoising/" target={'_blank'} rel={'noreferrer'}>
    Non-Local Means Denoising</a> Algorithm for details.
</>
/**Parameter UI Definition the user can set in Denoise*/
export const parameters:Array<Parameter<any>> = [
    h,
    getTitleSeparatorParams('sep','Advanced Parameters',sepDesc),
    tw,
    sw,
]

/**Typing for Denoise Inputs*/
export type Inputs = {noisyImg:PipelineImage }

/**Typing for Denoise Outputs*/
export type Outputs = {denoisedImg:PipelineImage}

/**Shorthand for the PipelineStep of Denoise*/
export type Step = PipelineStep<Inputs, Outputs>;

/**Parameter Object of Denoise*/
export type Parameters = {
    twindow:[number]
    swindow:[number]
    h:[number]
}