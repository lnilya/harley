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
import {ColocCellsResult} from "./server";

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

const normDesc = <>
    Signal strength varies by cell. While some cells might have the full spectrum of a signal from 0 to 1, others might only be 0 - 0.1. Normalizing will artificially normalize the signal to unit range: 0-1. This makes all foci clearly visible regardless of signal strength. However cells with no signal/no foci will appear full bright after normalization, as if the signal strength is close to 1 over the whole cell.
    <br/><br/>
    The pearson correlation is invariant to normalization. Thus this setting is a purely visual setting, to more clearly see shapes/locations of foci.
</>

/**Parameter UI Definition the user can set in ColocCells*/
export const parameters:Array<Parameter<any>> = [
     getDropdownParams('color','Color Combination','Colors to use to visualize the channels.','rg',
         {rg:'Red-Green', gr:'Green-Red',
                  gb:'Green-Blue', bg:'Blue-Green',
                  br:'Blue-Red', rb:'Red-Blue',
                  yb:'Yellow-Blue',by:'Blue-Yellow',
                  ob:'Orange-Blue',bo:'Blue-Orange',
         }),
     getSliderParams('cellsperrow','Cells per Row','Number of cells displayed in a row. The less dispalyed, the bigger the magnification.',3,8,1,4,false,null,true),
     getDropdownParams('sorting','Cell Sorting','Order of sorting in the UI','pcc',{none:'No Particular Sorting', pcc:'Pearson Correlation (cell)',fpcc:'Pearson Correlation (foci)',nf:'Total Number of Foci', nf1:'Number of Foci Channel 1', nf2:'Number of Foci Channel 2', cellsize:'Cell Area'},null,true),
     getTextfieldInputParams('shift','Channel Shift',shiftDesc,'X;Y shift...','',null,false),
    getCheckboxParams('norm','Normalize Brightness',normDesc,
        'Enabled',true)
];

/**Typing for ColocCells Inputs - Define Input Types/Names of this Pipeline step here.*/
export type Inputs = {alignedDatasets:number[]}

/**Typing for ColocCells Outputs - Define Output Types/Names of this Pipeline step here.*/
export type Outputs = {
    colocResult:ColocCellsResult
}

/**Shorthand for the PipelineStep of ColocCells*/
export type Step = PipelineStep<Inputs, Outputs>;

/**Parameter Object of ColocCells - Include all Parameters with their types that this step has. Should match the actual parameter definiton on top.*/
export type Parameters = {
    color:string,
    cellsperrow:[number],
    shift:string,
    norm:boolean,
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