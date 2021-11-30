import * as datatypes from "../../types/datatypes";
import { PipelineImage} from "../../types/datatypes";
import {PipelineStep} from "../../types/pipelinetypes";
import {Parameter} from "../_shared";
import {getCheckboxParams, getSliderParams} from "../_util";
import React from "react";


const sp = getSliderParams('radiusbounds','Cell Size','The min and max dimension of a cell in pixels. Try to keep this parameter tight to increase performance',10,100,1,[30,60])
const mpc = getSliderParams('minpercboundary','Min Boundary Percentage','The percentage of boundary that the algorithm needs in order to define valid cell candidates. a value of 0.8 means that the gaps in a supposed cell boundary are less than 20%. Increasing this parameter will increase quality and confidence of detected cells, but might increase falls negatives as well as make the algorithm less performant',0,1,0.01,0.75)
const fastmode = getCheckboxParams('fastmode','FastMode',
    'Fast mode works best for images that have clearer outlines. It first computes the distance of each pixel to the detected cell walls. This distance has for one to be between the minimum and maximum radius of cells, defined in parameter above. And second we need only to scan around the peaks of this distance map. The downside is, that in noisy images you might miss a few spots.','Enable Fast Mode',true)
const stride = getSliderParams('stride','Stride',<div>To speed up algorithm we can skip pixels in heatmap generation and approximate the heatmap in the skipped positions. A stride of 1 means, no skipping. 2 means we skip every second pixel, that means the algorithm runs stride<sup>2</sup> times faster.<br/>It makes sense to first work with a big stride, find good parameters and then reduce it to a value of 2-3</div>,1,10,1,3,
    false,(allP) => allP['fastmode'] ? 'hide' : 'active')


/**Name of the module*/
export const moduleName = 'CellFittingHeatmap'

/**Parameter UI Definition the user can set in CellFittingHeatmap*/
export const parameters:Array<Parameter<any>> = [
    sp,fastmode,mpc,stride
]

/**Typing for CellFittingHeatmap Inputs*/
export type Inputs = {cleanedImg:PipelineImage }

/**Typing for CellFittingHeatmap Outputs*/
export type Outputs = {heatmap:PipelineImage, skeleton:PipelineImage}

/**Shorthand for the PipelineStep of CellFittingHeatmap*/
export type Step = PipelineStep<Inputs, Outputs>;

/**Parameter Object of CellFittingHeatmap*/
export type Parameters = {
    fastmode:boolean,
    radiusbounds:[number,number],
    minpercboundary:[number],
    stride:[number],
}