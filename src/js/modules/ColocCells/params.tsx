import {Parameter} from "../../../sammie/js/modules/paramtypes";
import {PipelineImage} from "../../../sammie/js/types/datatypes";
import {PipelineStep} from "../../../sammie/js/types/pipelinetypes";
import React from "react";
import {
    getCheckboxParams,
    getDropdownParams,
    getSliderParams,
    getTextfieldInputParams
} from "../../../sammie/js/modules/paramutil";

/**Name of the module*/
export const moduleName = 'ColocCells'

const shiftDesc = <>
    Some microscopes might produce slight shifts in images depending on wave length, this can affect colocalization of especially small features significantly.
    This setting will shift the second channel by the given amount.
    <br/><br/>
    Input consists of two numbers for X and Y shift respecitvely, separated by semicolon. e.g. "200;-200". Leave empty or set to 0 if you do not need to use shifting for your data/microscope.
    <br/><br/>
    Units are either nanometers or pixels, depending on whether the scale was provided in Data Input step to convert pixels to nanometers.
    Positive numbers shift to bottom and right.
    </>
/**Parameter UI Definition the user can set in ColocCells*/
export const parameters:Array<Parameter<any>> = [
     getDropdownParams('color','Color Combination','Colors to use to visualize the channels.','rg',{rg:'Red-Green', rb:'Red-Blue',gb:'Green-Blue',gr:'Green-Red', br:'Blue-Red',bg:'Blue-Green'}),
     getSliderParams('cellsperrow','Cells per Row','Number of cells displayed in a row. The less dispalyed, the bigger the magnification.',3,8,1,4,false,null,true),
     getDropdownParams('sorting','Cell Sorting','Order of sorting in the UI','pcc',{none:'No Particular Sorting', pcc:'Pearson Correlation (cell)',fpcc:'Pearson Correlation (foci)',nf:'Total Number of Foci', nf1:'Number of Foci Channel 1', nf2:'Number of Foci Channel 2', cellsize:'Cell Area'},null,true),
     getTextfieldInputParams('shift','Channel Shift',shiftDesc,'X;Y shift...','',null,false),
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
    shift:string,
    sorting:'none'|'pcc'|'fpcc'|'nf'|'nf1'|'nf2'|'cellsize',
    //A few example data types:
    /*
    dropdown:'blue'|'yellow'
    sldierWithTwoHandles:[number,number]
    sldierWithOneHandle:[number]
    checkbox:boolean,
    text:string,
    */
}