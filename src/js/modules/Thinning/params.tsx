import {PipelineImage} from "../../../sammie/js/types/datatypes";
import {Parameter} from "../../../sammie/js/modules/paramtypes";
import {getSliderParams} from "../../../sammie/js/modules/paramutil";
import {PipelineStep} from "../../../sammie/js/types/pipelinetypes";

const maxGap = getSliderParams('maxgap','Max Closed Gap','Algorithm will try to close gaps on end points of the thinned image. This defines how big of a gap can be closed. Set to 0 if you do not want to close gaps.',0,100,1,30)

/**Parameters the user can set in this step*/
export const parameters:Array<Parameter<any>> = [
    maxGap
]

export const moduleName:string = 'Thinning';

/**Typing for input array*/
export type Inputs = {cleanedImg: PipelineImage, srcImg:PipelineImage}
export type Outputs = {skeleton: PipelineImage}
export type Step = PipelineStep<Inputs, Outputs>;
// export type ThinningInputKeys = Record<keyof ThinningInputs, PipelineDataKey>;


export type Parameters = {
    maxgap:[number]
}