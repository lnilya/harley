import {Parameter} from "../../../sammie/js/modules/paramtypes";
import {PipelineImage} from "../../../sammie/js/types/datatypes";
import {PipelineStep} from "../../../sammie/js/types/pipelinetypes";
import React from "react";

/**Name of the module*/
export const moduleName = 'ColocCells'

/**Parameter UI Definition the user can set in ColocCells*/
export const parameters:Array<Parameter<any>> = [
    //Use functions sammie/js/modules/paramutil to add configs for different parameters
    /*
     * getSliderParams('sliderWithOneHandle','Slider Setting','Help Text...',0,5000,50,0),
     * getSliderParams('sliderWithTwoHandles','Slider Rande Setting','Help Text...',0,5000,50,[200,500]),
     * getCheckboxParams('checkbox','Active Checkbox','Checkbox Help...','Enable',true)
     * getDropdownParams('dropdown','Choose Color','Color Tutorial...','blue',{'blue':'Blue Color', 'yellow':'Yellow Color'})
     */
];

/**Typing for ColocCells Inputs - Define Input Types/Names of this Pipeline step here.*/
export type Inputs = {in:PipelineImage }

/**Typing for ColocCells Outputs - Define Output Types/Names of this Pipeline step here.*/
export type Outputs = {out:PipelineImage}

/**Shorthand for the PipelineStep of ColocCells*/
export type Step = PipelineStep<Inputs, Outputs>;

/**Parameter Object of ColocCells - Include all Parameters with their types that this step has. Should match the actual parameter definiton on top.*/
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