import React, {ReactNode} from "react";
import '../../../scss/elements/ToolTipIconButton.scss'
import {Tooltip} from "@mui/material";
import {TooltipPlacement} from "../../types/uitypes";
import {SvgIconComponent} from "@mui/icons-material";

interface IToolTipIconButtonProps{
	
	/**Additional classnames for this component*/
	className?:string
    
    /**React component to display*/
    Icon:SvgIconComponent
    
    color?:string,
    
    tooltipText:ReactNode,
    tooltipDelay?:number,
    tooltipPlacement?:TooltipPlacement
    onClick?:()=>void,
}
/**
 * Wraps a material UI icon with a tooltip
 * @author Ilya Shabanov
 */
const ToolTipIconButton:React.FC<IToolTipIconButtonProps> = ({tooltipPlacement, Icon,color,onClick,tooltipDelay,tooltipText,className}) => {
	tooltipPlacement = tooltipPlacement || 'top';
 
	return (
        <Tooltip title={tooltipText} enterDelay={tooltipDelay} arrow placement={tooltipPlacement}>
            <Icon className={className} onClick={onClick}/>
        </Tooltip>
	);
}
export default ToolTipIconButton;