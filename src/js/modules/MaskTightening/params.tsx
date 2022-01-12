import {PipelineEllipses, PipelineImage} from "../../../sammie/js/types/datatypes";
import {PipelineStep} from "../../../sammie/js/types/pipelinetypes";
import {Parameter} from "../../../sammie/js/modules/paramtypes";
import React from "react";
import {getCheckboxParams, getSliderParams, getTitleSeparatorParams} from "../../../sammie/js/modules/paramutil";

/**Name of the module*/
export const moduleName = 'MaskTightening'

const border = getSliderParams('border','Border','Every Cell closer than this value in pixels to the border will be automatically discarded.',
    0,50,1,10)
const intensity = getSliderParams('intensityRange','Intensity Range (Avg in Cell)','Dim cells suffer disproportionately from noise and make detection of foci imprecise/impossible. Very bright cells might be oversaturated and equally impair analysis. Those cells can be discarded by adjusting this intensity range. The measurement compared against is the mean intensity within the cell boundary.',
    0,1,0.01,[0,1])
const intensityMax = getSliderParams('intensityRangeMax','Intensity Range (Max in Cell)','Dim cells suffer disproportionately from noise and make detection of foci imprecise/impossible. Very bright cells might be oversaturated and equally impair analysis. Those cells can be discarded by adjusting this intensity range. The measurement compared against is the max intensity within the cell boundary.',
    0,1,0.01,[0,1])
const contrast = getSliderParams('contrast','Contrast Adjustment','Temporary adjustment of contrast of the image allows to see more clearly whether a cell is dim, because of a lack of signal, death or other reasons. It makes sense to spend some time to select quality cells, so you do not have to sort those cells out at a later point. The setting has no influence on exported data and is temporary for this step.',
    0,1,0.01,[0,1])

const shrink = getCheckboxParams('shrink','Mask Tightening','Shrinking allows the mask to be tightened to the background of the fluorescence signal. This can be beneficial, if your cells clump together or if the boundary was not shrunk initially. In most cases you can forego this step.',
    'Enable Mask Tightening',false)

const isShrink = (allParams)=>allParams['shrink'] ? 'active' : 'hide';

const tit = getTitleSeparatorParams('snake','Shrinking Parameters',
    <div>The algorithm is using the <a href={"http://link.springer.com/10.1007/BF00133570"} target={'_blank'} rel={'noreferrer'}>active contours</a> model. Refer to this for further insight into parameter values.</div>)
const alpha = getSliderParams(
    'alpha','Alpha','Snake length shape parameter. Higher values makes snake contract faster.',
    0,100,0.5,1,false,isShrink)
const beta = getSliderParams(
    'beta','Smoothness','Beta or Snake smoothness shape parameter. Higher values makes snake smoother.',
    0,100,0.5,1,false,isShrink)
const gamma = getSliderParams(
    'gamma','Gamma','Explicit time stepping parameter.',
    0,3,0.01,0.5,false,isShrink)
const iterations = getSliderParams(
    'iterations','Iterations','Maximum iterations to optimize snake shape.',
    1,50,1,15,false,isShrink)

/**Parameter UI Definition the user can set in MaskTightening*/
export const parameters:Array<Parameter<any>> = [
    border,
    intensity,
    intensityMax,
    tit,
    shrink,
    alpha,
    beta,
    gamma,
    iterations,
    
]

/**Typing for MaskTightening Inputs*/
export type Inputs = {mask:PipelineImage, srcImg:PipelineImage }

/**Typing for MaskTightening Outputs*/
export type Outputs = {tightCells:PipelineEllipses}

/**Shorthand for the PipelineStep of MaskTightening*/
export type Step = PipelineStep<Inputs, Outputs>;

/**Parameter Object of MaskTightening*/
export type Parameters = {
    border:[number],
    intensityRange:[number,number],
    intensityRangeMax:[number,number],
    shrink:boolean,
    alpha:[number],
    beta:[number],
    gamma:[number],
}