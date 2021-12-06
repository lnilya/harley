import React, {useState} from "react";
import {ClickAwayListener, Tooltip, TooltipProps} from "@mui/material";

interface IConfirmToolTipProps{
	
	/**Additional classnames for this component*/
	className?:string
    question:string,
    options:[string,string],
    onConfirm:()=>void,
    disabled?:boolean
    children
    tooltipParams?:Partial<TooltipProps>
}
/**
 * ConfirmToolTip
 * @author Ilya Shabanov
 */
const ConfirmToolTip:React.FC<IConfirmToolTipProps> = ({disabled, tooltipParams,onConfirm, question,options, children, className}) => {
	
    
    const [open,setOpen] = useState(false);
    
    const cnt = <div className={'confirm-tool-tip__content'}>
        {question}
        <div className="fl-row">
            <span className={'confirm-tool-tip__yes'} onClick={()=>{
                setOpen(false);
                onConfirm()
            }}>{options[0]}</span>
            <span className={'confirm-tool-tip__no'} onClick={()=>setOpen(false)}>{options[1]}</span>
        </div>
    </div>
    
	return (
        <ClickAwayListener onClickAway={() => setOpen(false)}>
            <Tooltip title={cnt} className={`confirm-tool-tip`} open={open} onClose={e=>setOpen(false)}
                     disableFocusListener disableHoverListener disableTouchListener
                     {...(tooltipParams||{})}>
                <div onClick={disabled ? null : e=>setOpen(true)}>
                    {children}
                </div>
            </Tooltip>
        </ClickAwayListener>
	);
}
export default ConfirmToolTip;