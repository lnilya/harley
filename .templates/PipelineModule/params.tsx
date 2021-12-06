import {PipelineImage} from "../../types/datatypes";
import {PipelineStep} from "../../types/pipelinetypes";
import {Parameter} from "../_shared";
import React from "react";

/**Name of the module*/
export const moduleName = '__NAME__'

/**Parameter UI Definition the user can set in __NAME__*/
export const parameters:Array<Parameter<any>> = [
    //Use functions sammie/js/modules/paramutil to add configs for different parameters
    /*
     * getSliderParams('sliderWithOneHandle','Slider Setting','Help Text...',0,5000,50,0),
     * getSliderParams('sliderWithTwoHandles','Slider Rande Setting','Help Text...',0,5000,50,[200,500]),
     * getCheckboxParams('checkbox','Active Checkbox','Checkbox Help...','Enable',true)
     * getDropdownParams('dropdown','Choose Color','Color Tutorial...','blue',{'blue':'Blue Color', 'yellow':'Yellow Color'})
     */
];

/**Typing for __NAME__ Inputs - Define Input Types/Names of this Pipeline step here.*/
export type Inputs = {in:PipelineImage }

/**Typing for __NAME__ Outputs - Define Output Types/Names of this Pipeline step here.*/
export type Outputs = {out:PipelineImage}

/**Shorthand for the PipelineStep of __NAME__*/
export type Step = PipelineStep<Inputs, Outputs>;

/**Parameter Object of __NAME__ - Include all Parameters with their types that this step has. Should match the actual parameter definiton on top.*/
export type Parameters = {
    
    //A few example data types:
    /*
    dropdown:'blue'|'yellow'
    sldierWithTwoHandles:[number,number]
    sldierWithOneHandle:[number]
    checkbox:boolean,
    text:string,
    */
}