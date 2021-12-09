import {Parameter} from "../../../sammie/js/modules/paramtypes";
import {PipelineImage} from "../../../sammie/js/types/datatypes";
import {PipelineStep} from "../../../sammie/js/types/pipelinetypes";
import React from "react";
import {DatasetPreviewResult} from "./server";
import {getCheckboxParams} from "../../../sammie/js/modules/paramutil";

/**Name of the module*/
export const moduleName = 'DatasetAlignment'

/**Parameter UI Definition the user can set in DatasetAlignment*/
export const parameters:Array<Parameter<any>> = [
    //Use functions sammie/js/modules/paramutil to add configs for different parameters
    /*
     * getSliderParams('sliderWithOneHandle','Slider Setting','Help Text...',0,5000,50,0),
     * getSliderParams('sliderWithTwoHandles','Slider Rande Setting','Help Text...',0,5000,50,[200,500]),
     * getDropdownParams('dropdown','Choose Color','Color Tutorial...','blue',{'blue':'Blue Color', 'yellow':'Yellow Color'})
     */
     // getCheckboxParams('checkbox','Active Checkbox','Checkbox Help...','Enable',true)
];

/**Typing for DatasetAlignment Inputs - Define Input Types/Names of this Pipeline step here.*/
export type Inputs = {set0:any, set1:any }

/**Typing for DatasetAlignment Outputs - Define Output Types/Names of this Pipeline step here.*/
export type Outputs = {datasetPreview:DatasetPreviewResult}

/**Shorthand for the PipelineStep of DatasetAlignment*/
export type Step = PipelineStep<Inputs, Outputs>;

/**Parameter Object of DatasetAlignment - Include all Parameters with their types that this step has. Should match the actual parameter definiton on top.*/
export type Parameters = {
    // checkbox:boolean,
    //A few example data types:
    /*
    dropdown:'blue'|'yellow'
    sldierWithTwoHandles:[number,number]
    sldierWithOneHandle:[number]
    checkbox:boolean,
    text:string,
    */
}