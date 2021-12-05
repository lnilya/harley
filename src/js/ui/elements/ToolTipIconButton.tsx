import React, {ReactElement, ReactNode} from "react";
import {ccl} from "../../util";
import '../../../scss/elements/ToolTipIconButton.scss'
import {SvgIconTypeMap, Tooltip} from "@material-ui/core";
import {TooltipPlacement} from "../../types/uitypes";
import {OverridableComponent} from "@material-ui/core/OverridableComponent";
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