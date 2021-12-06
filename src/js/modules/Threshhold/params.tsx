import {getDropdownParams, getSliderParams} from "../../../sammie/js/modules/paramutil";
import React from "react";
import {PipelineImage} from "../../../sammie/js/types/datatypes";
import {PipelineStep} from "../../../sammie/js/types/pipelinetypes";


var bandDesc = <>Intensity is a range/spectrum between 0 and 1, 0 being black and 1 being white. Thresholding allows to pick out a subrange
    inside the 0-1.
    <ul>
        <li><strong>Use Band (recommended)</strong>:<br/>Will discard everything outside of a subrange/band of the spectrum. For example discard all whites or all blacks.</li>
        <li><strong>Discard Band</strong>:<br/> Will discard a subrange/band of the spectrum. This allows to exclude all grays and keep strong whites *and* strong blacks.</li>
    </ul>
    </>;
var srcDesc = <>The choice of source image for thresholding.
    <ul>
        <li><strong>Raw Image</strong><br/>
            The grayscale image itself
        </li>
        <li><strong>Smoothed Gradient</strong>
            <br/>
            Will run edge detection, then smoothing before threshold is applied.
        </li>
        <li><strong>Ridges (recommended)</strong><br/>
            Will run Frangi ridge detection. The Smoothing factor governs the approximate thickness of the edges.
            
        </li>
    </ul>
    </>;

const t = getDropdownParams('src','Type',srcDesc,'frangi',
    {raw:'Raw Image',
        grad:'Smoothed Gradient',
        frangi:'Ridges'
    },null,false)

const threshholdChoice = getDropdownParams('ttype','Threshold Range',bandDesc,'whiteorblack',
    {'whiteorblack':'Discard Band','band':'Use Band'})

const ridgeColor = getDropdownParams('ridgecol','Color of Cell Wall','In most cases cell walls will be white, in some images however the outlines of the cells appear black. Change this setting if your cell outlines are black.','white',{'white':'White','black':'Black'},
    allSettings => {return allSettings['src'] == 'frangi' ? 'active': 'hide'})

const s = getSliderParams('smoothing','Smoothing','Gradient images will usually produce double lines around cell outlines, smoothing can usually remove this. Set the smoothing factor high enough, so that you do not see double outlines anymore, but rather fat outlines. The unit are standard deviation in pixels for the smoothing kernel.',0,10,0.1,2,false,
    allSettings => {return allSettings['src'] != 'raw' ? 'active': 'hide'})

const tinfo = <div>Any image used here, be it the raw or processed image is essentially a grayscale image with values 0-1.
    <ul>
        <li><strong>In Raw Image</strong>:</li> 0 being black and 1 being white
        <li><strong>In Gradient Image</strong>:</li> 0 being no change and 1 being strong change
        <li><strong>In Ridge Image</strong>:</li> 0 being no ridge and 1 being strong ridge probability
    </ul>
    <br/>
    Note that the values usually need to be adjusted when you switch Type (Raw,Gradient,Ridge).
    </div>

const ib = getSliderParams('innerband','Threshhold',tinfo,0,1,0.005,[0.1,0.9],
    false,allSettings => {return allSettings['ttype'] == 'band' ? 'active': 'hide'})

const ob = getSliderParams('outerband','Threshhold',tinfo,0,1,0.005,[0,0.31],
    true,allSettings => {return allSettings['ttype'] == 'whiteorblack' ? 'active': 'hide'})



//***************************************************************/
//* PUBLIC */
//***************************************************************/

/**Parameters the user can set in this step*/
export const parameters = [
    t,
    s,
    ridgeColor,
    threshholdChoice,
    ib,
    ob,
]

export const moduleName = 'Threshhold';

/**Typing for input array*/
export type Inputs = { srcImg:PipelineImage }
export type Outputs = { threshholdedImg:PipelineImage }
export type Step = PipelineStep<Inputs, Outputs>;

export type Parameters = {
    src:'raw'|'grad',
    smoothing:[number]
    ridgecol:'white'|'black'
    ttype:'whiteorblack'|'band'
    innerband:[number,number]
    outerband:[number,number],
}