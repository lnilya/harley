import React, {ReactNode} from "react";
import {Tooltip} from "@mui/material";
import {cl} from "../../util";
import '../../../scss/elements/MainMenuButton.scss'

interface IMainMenuButtonProps {
    
    /**Wether or not the current screen is selected*/
    active?:boolean,
    title: string,
    tooltip: ReactNode,
    Icon: ReactNode
    /**Additional classnames for this component*/
    className?: string,
    
    /**Wether or not this can be clicked*/
    disabled?:boolean,
    tooltipPlacement?: 'bottom-end'
    | 'bottom-start'
    | 'bottom'
    | 'left-end'
    | 'left-start'
    | 'left'
    | 'right-end'
    | 'right-start'
    | 'right'
    | 'top-end'
    | 'top-start'
    | 'top',
    onClick?: () => any
}
/**
 * SideMenuButton
 * @author Ilya Shabanov
 */
const MainMenuButton:React.FC<IMainMenuButtonProps> = ({tooltipPlacement, disabled, active, onClick, className,title,tooltip,Icon}) => {
    tooltipPlacement = tooltipPlacement || 'left';
    
	return (
		<div onClick={disabled ? null : onClick} className={`main-menu-button ${className} ` +cl(active,'is-active') + cl(disabled,'is-disabled')}>
			<Tooltip placement={tooltipPlacement} title={tooltip} arrow enterDelay={disabled ? 500 : 1500}>
                    <div className="main-menu-button__content">
                        {Icon}
                        <span>{title}</span>
                    </div>
                </Tooltip>
		</div>
	);
}
export default MainMenuButton;