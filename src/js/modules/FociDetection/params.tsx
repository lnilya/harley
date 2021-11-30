/* eslint-disable react/no-unescaped-entities */
import {PipelineImage} from "../../types/datatypes";
import {PipelineStep} from "../../types/pipelinetypes";
import {Parameter} from "../_shared";
import React from "react";
import {getCheckboxParams, getDropdownParams, getSliderParams} from "../_util";

/**Name of the module*/
export const moduleName = 'FociDetection'

const fociSize = getSliderParams('fociRadius',
    'Foci Radius Range', 'The algorihtm will look for foci of a particular size. If you have an approximate idea of how big they are, keep this parameter tight to increase execution speed.',
    1, 10, 0.5, [2, 7])

const fcmd = <>
    <ul>
        <li>
            <strong>Curvature Threshhold:</strong><br/>
            Simplest and fastest method. Simply allows you to pick points of certain curvature. Method usually errs on
            the side of big and faint foci, as well as around cell borders.
        </li>
        <li>
            <strong>Curvature & Contours:</strong><br/>
            Out of all possible curvature maxima we pick out a few that form distinct foci, that is there is a contour line that can be
            mapped around the point and falls and is in size somewhere between the given foci size. Each of these foci can be filtered
            by adjusting either a certain ratio of peak to border intensity, or a hard border on intensity itself.
            <br/>
            <br/>
            This is an improvement of the curvature method, since it elimenates most false-positives and gives clearer outlines and sizes for foci.
            <br/>
            Detection is however somewhat sensitive of size, since the bigger the allowed size, the more foci can grow.
        </li>
    </ul>
</>
const fociDetMethod = getDropdownParams('detMethod',
    'Detection Method', fcmd,
    'brightness', {
        'curvature': 'Curvature (LoG)',
        'brightness': 'Curvature & Contours'
    }, null, false)

//CURVATURE METHOD PARAMETERS:
const fociThrehshold = getSliderParams('fociThreshold',
    'Min Curvature Intensity', 'The intensity of the Foci. This is an arbitrary value, that relates to the curvature-strength of the foci, not to the intensity inside the image. The higher the value the less foci you will get, but they will be more "obvious".',
    0, 1, 0.01, 0, true, (ap => ap['detMethod'] == 'brightness' ? 'hide' : 'active'), true)

//BRIGHTNESS METHODS
const brightnessThrehshold = getSliderParams('brightnessThreshold',
    'Min Foci to Background Ratio', 'The brightness of foci center vs contour line around it. Setting of 1.5 means foci are at least 50% brighter than the outlines.',
    1.0, 2, 0.01, 1.25, true, (ap => ((ap['detMethod'] == 'curvature') ? 'hide' : 'active')), true)

const minFociBrightness = getSliderParams('minFociBrightness',
    'Exclude Below Brightness', 'The maximum brightness inside a foci needs to be above this value, or it will be discarded. This will remove very faint blobs. However since all cells are normalized in their respective signal, this parameter is not universal, but has somewhat different effects on different cells.',
    0, 1, 0.01, 0.05, true, (ap => ((ap['detMethod'] == 'curvature') ? 'hide' : 'active')), true)

const includeAboveBrightness = getSliderParams('minInclusionBrightness',
    'Include Above Brightness', 'If desired Foci above a certain brightness can be included regardless of their background ratio. If this value is in its maximal position above 1, it has no influence, since brightness is normed 0-1.',
    0, 1, 0.01, 1.01, true, (ap => ((ap['detMethod'] == 'curvature') ? 'hide' : 'active')), true)

const splitDesc = <>
    When two foci are closeby they might be considered part of one bigger focus(that would meet the minimum and maximum size condition) or two distinct smaller ones.
    The algorithm can tend to treat closeby or overlapping foci either by attempting to split them into smaller foci,
    or by merging them into a big one.
    <br/>
    The result will still satisfy the conditions of size. Smaller foci have usually smaller background to peak ratios.
    <ul>
        <li>
            <strong>Split Foci:</strong><br/>
            In this case we shrink both foci until no overlap occurs.<br/>
            Sometimes however the weaker foci will shrink below the minimum foci size and thus would be elimenated. If this would happen,
            the output of this method switches to the same as the "elimenate weaker" option.
        </li>
        <li>
            <strong>Join Foci:</strong><br/>
            Here we simply eliminate the weaker of the two foci, while the stronger remains unchanged.
        </li>
    </ul>
</>

const splitMethod = getDropdownParams('splitmode',
    'Splitting of closeby foci', splitDesc,
    'join', {
        'split': 'Split Foci',
        'join': 'Join Foci'
    }, (ap=>((ap['detMethod'] == 'curvature') ? 'hide' : 'active') ), false)

const useSqrt = getCheckboxParams('useSqrt',
    'Brightness Adaptation','Human perception is not really linear. Something that is 50% brighter in signal, will usually not appear 50% brighter to a human. The correlation between the two is roighly the square root. Activating this option will use the square root of the signal instead of the raw signal. In effect brighter spots will be somewhat less tight.',
    'Enable',true,(ap=>((ap['detMethod'] == 'curvature') ? 'hide' : 'active') ),false)



/**Parameter UI Definition the user can set in FociDetection*/
export const parameters: Array<Parameter<any>> = [
    fociSize,
    fociDetMethod,
    fociThrehshold,
    brightnessThrehshold,
    includeAboveBrightness,
    minFociBrightness,
    splitMethod,
    useSqrt
]

/**Typing for FociDetection Inputs*/
export type Inputs = { model: any, dataset: any }

/**Typing for FociDetection Outputs*/
export type Outputs = { foci: any }

/**Shorthand for the PipelineStep of FociDetection*/
export type Step = PipelineStep<Inputs, Outputs>;

/**Parameter Object of FociDetection*/
export type Parameters = {
    fociRadius: [number, number],
    detMethod: string,
    fociThreshold: [number]
    minInclusionBrightness: [number]
    brightnessThreshold: [number]
    minFociBrightness: [number]
    splitmode: string,
    useSqrt: boolean
}