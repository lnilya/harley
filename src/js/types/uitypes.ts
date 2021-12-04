import {InputParams, Parameter} from "../modules/_shared";


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