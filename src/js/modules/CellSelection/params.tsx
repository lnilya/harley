import {PipelineEllipses, PipelineImage} from "../../../sammie/js/types/datatypes";
import {PipelineStep} from "../../../sammie/js/types/pipelinetypes";
import {Parameter} from "../../../sammie/js/modules/paramtypes";
import React from "react";
import {
    getCheckboxParams,
    getSliderParams,
    getTextfieldInputParams,
    getTitleSeparatorParams
} from "../../../sammie/js/modules/paramutil";

const shiftDesc = <>
    Due to optical effects or alignment problems at the microscope, the fluorescence channel might be shifted compared to the brightfield channel.
    Which can be a problem if features of interest are located close to the membrane. You can slightly shift the whole mask by a few pixels to avoid this problem.
    <br/><br/>
    Input consists of two numbers for X and Y shift respecitvely, separated by semicolon. e.g. "5;-5". Leave empty if you do not need to use shifting for your data/microscope.
    <br/><br/>
    Positive numbers shift to bottom and right. Units are pixels.
    The output of this pipeline will store the shfited versions of cells and not "remember" the shift any longer.
    </>

/**Name of the module*/
export const moduleName = 'CellSelection'

const border = getSliderParams('border','Border','Every Cell closer than this value in pixels to the border will be automatically discarded.',
    0,50,1,10)
const intensity = getSliderParams('intensityRange','Intensity Range (Avg in Cell)','Dim cells suffer disproportionately from noise and make detection of foci imprecise/impossible. Very bright cells might be oversaturated and equally impair analysis. Those cells can be discarded by adjusting this intensity range. The measurement compared against is the mean intensity within the cell boundary.',
    0,1,0.01,[0,1])
const intensityMax = getSliderParams('intensityRangeMax','Intensity Range (Max in Cell)','Dim cells suffer disproportionately from noise and make detection of foci imprecise/impossible. Very bright cells might be oversaturated and equally impair analysis. Those cells can be discarded by adjusting this intensity range. The measurement compared against is the max intensity within the cell boundary.',
    0,1,0.01,[0,1])
const shift = getTextfieldInputParams('shift','Mask Shift',shiftDesc,'X;Y shift...','',null,false);

const shrink = getCheckboxParams('shrink','Mask Tightening','Shrinking allows the mask to be tightened to the background of the fluorescence signal. This can be beneficial, if your cells clump together or if the boundary was not shrunk initially. In most cases you can forego this step.',
    'Enable Mask Tightening',false)

const isShrink = (allParams)=>allParams['shrink'] ? 'active' : 'hide';

const tit = getTitleSeparatorParams('snake','Shrinking Parameters',
    <div>The algorithm is using the <a href={"http://link.springer.com/10.1007/BF00133570"} target={'_blank'} rel={'noreferrer'}>active contours</a> model. Refer to this for further insight into parameter values. Shrinking allows to make masks fit tighter to the fluorescence image. This is step is rarely necessary.</div>)
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
    shift,
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
    shift:string,
    intensityRange:[number,number],
    intensityRangeMax:[number,number],
    shrink:boolean,
    alpha:[number],
    beta:[number],
    gamma:[number],
}