import React, {ReactNode, useState} from "react"
import {ClickAwayListener, Tooltip} from "@mui/material";

interface IParamHelpBtnProps {
    content: ReactNode
    className?:string,
    toolTipPlacement?:'bottom-end'
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
    | 'top';
}

const ParamHelpBtn: React.FC<IParamHelpBtnProps> = ({toolTipPlacement, className, content}) => {
    toolTipPlacement = toolTipPlacement || 'right'
    
    const [open, setOpen] = useState(false);
    return (
        <ClickAwayListener onClickAway={() => setOpen(false)}>
            <Tooltip title={content} open={open} disableFocusListener disableHoverListener disableTouchListener
            placement={toolTipPlacement} arrow>
                <div className={`param-help-btn ${className}`} onClick={()=>setOpen(true)}>?</div>
            </Tooltip>
        </ClickAwayListener>
    );
}

export default ParamHelpBtn;