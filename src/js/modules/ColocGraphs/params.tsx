import {Parameter} from "../../../sammie/js/modules/paramtypes";
import {PipelineImage} from "../../../sammie/js/types/datatypes";
import {PipelineStep} from "../../../sammie/js/types/pipelinetypes";
import React from "react";
import {getSliderParams} from "../../../sammie/js/modules/paramutil";
import {ColocCellsResult} from "../ColocCells/server";

/**Name of the module*/
export const moduleName = 'ColocGraphs'

/**Parameter UI Definition the user can set in ColocGraphs*/
export const parameters:Array<Parameter<any>> = [
    //Use functions sammie/js/modules/paramutil to add configs for different parameters
    /*
     * getSliderParams('sliderWithTwoHandles','Slider Rande Setting','Help Text...',0,5000,50,[200,500]),
     * getCheckboxParams('checkbox','Active Checkbox','Checkbox Help...','Enable',true)
     * getDropdownParams('dropdown','Choose Color','Color Tutorial...','blue',{'blue':'Blue Color', 'yellow':'Yellow Color'})
     */
     // getSliderParams('nnbins','Number Bins','Help Text...',0,5000,50,0),
];

/**Typing for ColocGraphs Inputs - Define Input Types/Names of this Pipeline step here.*/
export type Inputs = {colocResult:ColocCellsResult }

/**Typing for ColocGraphs Outputs - Define Output Types/Names of this Pipeline step here.*/
export type Outputs = {graphdata:any}

/**Shorthand for the PipelineStep of ColocGraphs*/
export type Step = PipelineStep<Inputs, Outputs>;

/**Parameter Object of ColocGraphs - Include all Parameters with their types that this step has. Should match the actual parameter definiton on top.*/
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