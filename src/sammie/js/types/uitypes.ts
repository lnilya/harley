import {ReactNode} from "react";
import {InputParams, Parameter} from "../modules/paramtypes";


export type ModuleID = string

export type OverlayState = {
    /**Message to display*/
    msg?:ReactNode,
    
    /**Overlay will block all input, text will display a message*/
    display:'text'|'overlay'
    
    /**Progress 0-1 for the current step, if any*/
    progress?:number
    
    /**Optional function, if present will allow the step to be aborted*/
    abortCallBack?:()=>void
    
    /**Default is blocking, but some algorihtms might be non-blocking
     * Blocking will overlay the parameter side bar and make it inaccessible.*/
    nonBlocking?:boolean
}


/**Same as Material UI ToolTip Placement*/
export type TooltipPlacement = 'bottom-end' | 'bottom-start' | 'bottom' | 'left-end' | 'left-start' | 'left' | 'right-end' | 'right-start' | 'right' | 'top-end' | 'top-start' | 'top';

/**Base Interface for all parameter compontents*/
export interface IParamUISettingBase<T extends InputParams>{
    
    /**Additional Classname for this parameter compontent*/
    className?:string
    
    /**Configuration for this parameter*/
    conf:Parameter<T>,
    
    /**Wether or not this parameter can be edited*/
    disabled:boolean,
    
    /**See TooltipProps frommaterial UI for values*/
    tooltipPlacement?:TooltipPlacement,
    
    /**Callback for changing the parameter*/
    onParameterChanged:(conf:Parameter<T>, newVal:any) => void
}