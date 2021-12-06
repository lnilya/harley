import {ReactNode} from "react";

/**
 * Specifically a datatype, to avoid using "number" in JS 
 */
export enum DType{  
    Int,
    String,
    Float,
    Bool
}


/**Parameters for a slider with 1 or 2 handles*/
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
/**Parameters for a single text input box */
export type TextInputParams = {
    type:'text_input',
    inputtype:string
    defaultVal:string,
    placeholder:string
}
/**Parameters for a DropDown with a single selection*/
export type DropDownParams = {
    type:'dropdown',
    defaultVal:string,
    options:Record<string,string>
}
/**Parameters for a Checkbox*/
export type CheckboxParams = {
    type:'checkbox',
    defaultVal:boolean,
    label:string
}
/**"Parameters" for a Separator title - this is not a parameter but uses the same interface.*/
export type SeparatorParams = {
    type:'separator',
}

export type InputParams = SliderInputParams|TextInputParams|DropDownParams|CheckboxParams|SeparatorParams

export type ParameterDisplayState = 'hide'|'disable'|'active';
export type Condition = (allSettings:SettingDictionary) => ParameterDisplayState
export type ParameterKey = string
/** Defines settings that the user can edit when inside a pipeline step*/
export type Parameter<T extends InputParams> = {
    
    /**Unique key used to identify this parameter, needs to be unique for the pipeline step, not for the whole pipeline, since it is automatically prepended with steps module id.*/
    key: ParameterKey,
    
    /**Type for the resulting values, is used to send correct datatypes to server*/
    dtype:DType,
    
    /**Specific values for the respective input*/
    input:T,
    
    /**Parameters for displaying this settings*/
    display:{
        /**Title or label*/
        title:ReactNode,
        /**A descriptive hint that might appear as a tooltip to explain the impact of this parameter*/
        hint:ReactNode
    }
    /**Conditional function to show or hide this parameters depending on other settings, passed as parameters.*/
    conditional:Condition,
    
    /**Parameters that will not trigger an update to server are marked as frontendonly*/
    frontendOnly:boolean,
    
    /**Parameters that are ui only will be filtered out during all algorithm processing and will not be available
     * to anyhting but the Sidebar UI that displays them. These are things like titles, separators etc */
    uiOnly?:boolean
}

//Final export of all settings for a step
export type SettingDictionary = Record<string, any>;