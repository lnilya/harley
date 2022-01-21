import React, {useState} from "react"
import CellResult, {ICellResultProps} from "../FociDetectionModel/CellResult";
import {FociInfo} from "./FociDetectionParams";
import {Tooltip} from "@mui/material";

interface ITooltipCellResultProps extends ICellResultProps{
    focusInfo:FociInfo[]
    showTooltips:boolean
}
const TooltipCellResult:React.FC<ITooltipCellResultProps> = (props) => {
    
    const [info,setInfo] = useState<FociInfo>(null);
    
    const showTooltip = (focusIdx) => {
        setInfo(props.focusInfo[focusIdx])
    };
    const hideTooltip = (focusIdx) => {
        setInfo(null)
    };
    
    const show:boolean = props.showTooltips && info && (info.manual !== undefined || !info.in)
    var text = '';
    if(show && info.manual !== undefined)
        text = 'Manually ' + (info.manual ? 'added' : 'removed');
    else if(show) text = info.reason;
	return (
        <Tooltip title={text} followCursor={true} open={show} arrow>
            <div className="cell">
                <CellResult {...props} fociEnter={showTooltip} fociLeave={hideTooltip}/>
            </div>
        </Tooltip>
    );
}
export default TooltipCellResult;