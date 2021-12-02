import {ReactNode} from "react";
import {PipelineStep} from "../types/pipelinetypes";

/**
 * Specifically a datatype, to avoid using "number" in JS 
 */
export enum DType{  
    Int,
    String,
    Float,
    Bool
}


export type SliderInputParams = {
    type:'slider',
    min:number,
    max:number,
    // borders:{}
    stepsize:number,
    defaultVal:number[],
    /**If inverted the slider color a different portion of the area*/
    invert?:boolean
}
export type TextInputParams = {
    type:'text_input',
    defaultVal:string,
    placeholder:string
}
export type DirInputParams = {
    type:'dir_input',
    defaultVal:string,
    placeholder:string
}
export type DropDownParams = {
    type:'dropdown',
    defaultVal:string,
    options:Record<string,string>
}
export type CheckboxParams = {
    type:'checkbox',
    defaultVal:boolean,
    label:string
}
export type SeparatorParams = {
    type:'separator',
}

export type InputParams = DirInputParams|SliderInputParams|TextInputParams|DropDownParams|CheckboxParams|SeparatorParams

export type ParameterDisplayState = 'hide'|'disable'|'active';
export type Condition = (allSettings:SettingDictionary) => ParameterDisplayState
/**
 * A parameter is simply a setting that the user can set.  
 */
export type Parameter<T extends InputParams> = {
    key: string,
    dtype:DType,
    input:T,
    display:{
        title:ReactNode,
        hint:ReactNode
    },
    conditional:Condition,
    /**Parameters that will not trigger an update to server are marked as frontendonly*/
    frontendOnly:boolean,
    
    /**Parameters that are ui only will be filtered out during all algorithm processing and will not be available
     * to anyhting but the Sidebar UI that displays them. These are things like titles, separators etc */
    uiOnly?:boolean
}

//Final export of all settings for a step
export type SettingDictionary = Record<string, any>;