import React, {ReactNode, useState} from "react"
import {ClickAwayListener, Tooltip} from "@material-ui/core";

interface IParamHelpBtnProps {
    content: ReactNode
    className?:string
}

const ParamHelpBtn: React.FC<IParamHelpBtnProps> = ({className, content}) => {
    
    const [open, setOpen] = useState(false);
    return (
        <ClickAwayListener onClickAway={() => setOpen(false)}>
            <Tooltip interactive title={content} open={open} disableFocusListener disableHoverListener disableTouchListener
            placement={'right'} arrow>
                <div className={`param-help-btn ${className}`} onClick={()=>setOpen(true)}>?</div>
            </Tooltip>
        </ClickAwayListener>
    );
}

export default ParamHelpBtn;