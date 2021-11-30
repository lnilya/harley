import {ReactNode} from "react";

export type StepKey = string
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
