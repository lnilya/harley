import {Parameter} from "../../../sammie/js/modules/paramtypes";
import {PipelineImage} from "../../../sammie/js/types/datatypes";
import {PipelineStep} from "../../../sammie/js/types/pipelinetypes";
import React from "react";
import {getCheckboxParams, getDropdownParams, getSliderParams} from "../../../sammie/js/modules/paramutil";

/**Name of the module*/
export const moduleName = 'ColocCells'
/**Parameter UI Definition the user can set in ColocCells*/
export const parameters:Array<Parameter<any>> = [
    //Use functions sammie/js/modules/paramutil to add configs for different parameters
    /*
     * getSliderParams('sliderWithOneHandle','Slider Setting','Help Text...',0,5000,50,0),
     * getSliderParams('sliderWithTwoHandles','Slider Rande Setting','Help Text...',0,5000,50,[200,500]),
     * getCheckboxParams('checkbox','Active Checkbox','Checkbox Help...','Enable',true)
     */
     getDropdownParams('color','Color Combination','Colors to use to visualize the channels.','rg',{rg:'Red-Green', rb:'Red-Blue',gb:'Green-Blue',gr:'Green-Red', br:'Blue-Red',bg:'Blue-Green'}),
     getSliderParams('cellsperrow','Cells per Row','Number of cells displayed in a row. The less dispalyed, the bigger the magnification.',3,8,1,4,false,null,true),
];

/**Typing for ColocCells Inputs - Define Input Types/Names of this Pipeline step here.*/
export type Inputs = {alignedDatasets:number[]}

/**Typing for ColocCells Outputs - Define Output Types/Names of this Pipeline step here.*/
export type Outputs = {colocCells:any}

/**Shorthand for the PipelineStep of ColocCells*/
export type Step = PipelineStep<Inputs, Outputs>;

/**Parameter Object of ColocCells - Include all Parameters with their types that this step has. Should match the actual parameter definiton on top.*/
export type Parameters = {
    color:string,
    cellsperrow:[number],
    //A few example data types:
    /*
    dropdown:'blue'|'yellow'
    sldierWithTwoHandles:[number,number]
    sldierWithOneHandle:[number]
    checkbox:boolean,
    text:string,
    */
}