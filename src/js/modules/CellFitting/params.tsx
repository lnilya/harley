import {PipelineEllipses, PipelineImage} from "../../types/datatypes";
import {PipelineStep} from "../../types/pipelinetypes";
import {Parameter} from "../_shared";
import {getSliderParams} from "../_util";
import React from "react";

export const moduleName = 'CellFitting'

const mc = getSliderParams('minconfidence','Min Confidence','The heatmap gives a confidence of 0-1. With 1 being the best. To reduce the influence of noise, you can set this parameter tighter to filter out false-positives.',0,1,0.005,0.9,true)
const md = getSliderParams('mindist','Min Cell Distance','Governs how close cells can be to one another. This depends solely on resolution. Within min cell distance there can only be one detected cells, that with the highest score.',20,100,1,45,true)
const mz = getSliderParams('masksize','Min Peak Size','A size constraint for finding maxima. A maxima needs to be at least this size to be considered one. Making this large, will exclude small and less probable cell centers. However the cell distance constraint will in most cases eliminate most small maxima.',3,20,1,3,false)
const snap = getSliderParams('snapping','BoundarySnapping','Originally cells are estimated as ellipses. In the last step the ellipses are snapped to the respective pixel outlines, to refine the cell shape. The snapping parameter governs how much snapping is happening. 0 means we retain ellipses, 1 represents a full snap to boundaries.',0,1,0.01,0,false)

/**Parameter UI Definition the user can set in CellFitting*/
export const parameters:Array<Parameter<any>> = [
    mc, md, mz,snap
]

/**Typing for CellFitting Inputs*/
export type Inputs = {scoremap:PipelineImage,srcImg:PipelineImage,skeleton:PipelineImage}

/**Typing for CellFitting Outputs*/
export type Outputs = {ellipses:PipelineEllipses}

/**Shorthand for the PipelineStep of CellFitting*/
export type Step = PipelineStep<Inputs, Outputs>;

/**Parameter Object of CellFitting*/
export type Parameters = {
    minconfidence:[number]
    mindist:[number]
    masksize:[number]
    snapping:[number]
}