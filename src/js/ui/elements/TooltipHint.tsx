import React, {ReactNode, useState} from "react";
import {EelResponse} from "../../eel/eel";
import {ClickAwayListener, Tooltip} from "@material-ui/core";

interface ITooltipHintProps {
    col:'success'|'error'
    title: ReactNode
    desc: ReactNode
    /**Additional classnames for this component*/
    className?: string
}

/**
 * ErrorHint
 * @author Ilya Shabanov
 */
const TooltipHint: React.FC<ITooltipHintProps> = ({col, title,desc, className}) => {
    
    const [open, setOpen] = useState(false);
    if (!title || !desc) return null;
    return (
        <div className={`error-hint error-hint--${col} ` + className}>
            <ClickAwayListener onClickAway={() => setOpen(false)}>
                <Tooltip  title={desc} open={open} disableFocusListener disableHoverListener disableTouchListener
                         arrow>
                    <div className={'error-hint__title'} onClick={() => setOpen(true)}>{title}</div>
                </Tooltip>
            </ClickAwayListener>
        
        </div>
    );
}
export default TooltipHint;