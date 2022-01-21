import React, {ReactNode, useState} from "react"
import CellResult, {ICellResultProps} from "../FociDetectionModel/CellResult";
import {FociInfo} from "./FociDetectionParams";
import './scss/TooltipCellResult.scss'
import {printf} from "fast-printf";
import {SingleFocusData} from "./server";
import {cl} from "../../../sammie/js/util";

interface ITooltipCellResultProps extends ICellResultProps{
    focusInfo:FociInfo[]
    brighntessInfo:SingleFocusData[]
}
const TooltipCellResult:React.FC<ITooltipCellResultProps> = (props) => {
    
    const [idx,setIdx] = useState<number>(-1);
    const info = idx != -1 && props.focusInfo[idx];
    const data = idx != -1 && props.brighntessInfo[idx];
    
    const showTooltip = (focusIdx) => {
        setIdx(focusIdx)
    };
    const hideTooltip = (focusIdx) => {
        setIdx(-1)
    };
    
    var text:ReactNode = '';
    if(idx != -1){
        // if(info.manual !== undefined) text = 'Manually ' + (info.manual ? 'added' : 'removed');
        // else if(!info.in) text = info.reason;
        // else
        var classes = [cl(info.reason == 'NB','err'),
            cl(info.reason == 'RB','err'),
            cl(info.reason == 'D','err')];
        text = <div className={'props'}>
            <div className={classes[0]}><span>NB</span>{printf('%.2f',data.mean[0])}</div>
            <div className={classes[1]}><span>RB</span>{printf('%.2f',data.mean[1])}</div>
            <div className={classes[2]}><span>Drop</span>{printf('%.2f',data.drop)}</div>
        </div>
        if(info.manual !== undefined){
            text = <>
                <div className={'fl-col'}>
                    <span className={'margin-25-bottom'}>Manually {info.manual ? 'added' : 'rejected'}</span>
                    {text}
                </div>
            </>
        }
    }
    
	return (
        <div className="tt-cell-result" onMouseLeave={hideTooltip} onClick={hideTooltip}>
            <CellResult {...props} fociEnter={showTooltip} fociLeave={hideTooltip}>
                {idx != -1 &&
                    <div className="tt">{text}</div>
                }
            </CellResult>
        </div>
    );
}
export default TooltipCellResult;