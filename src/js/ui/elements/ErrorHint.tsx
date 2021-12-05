import React, {useState} from "react";
import {EelResponse} from "../../eel/eel";
import TooltipHint from "./TooltipHint";

interface IErrorHintProps {
    error: EelResponse<any>
    /**Additional classnames for this component*/
    className?: string
}

/**
 * ErrorHint
 * @author Ilya Shabanov
 */
const ErrorHint: React.FC<IErrorHintProps> = ({error, className}) => {
    
    const [open, setOpen] = useState(false);
    if (!error?.error) return null;
    
    const r = /(.*?)\('(.*)'\)/
    const errContent = error.errorTrace.map((l, i) => <div key={i} className={'margin-50-bottom'}>{l}</div>);
    var errTitle: any = r.exec(error.error)
    if (!errTitle) errTitle = error.error
    else errTitle = <>
        <div className={'margin-50-bottom'}>{errTitle[1]}:</div>
        <strong>{errTitle[2]}</strong>
    </>
    
    return <TooltipHint col={'error'} title={errTitle} desc={errContent}/>
}
export default ErrorHint;