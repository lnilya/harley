import React from "react";
import {cl} from "../../util";
import ParamHelpBtn from "./ParamHelpBtn";
import {Checkbox, FormControlLabel} from "@mui/material";
import {IParamUISettingBase} from "../../types/uitypes";
import {CheckboxParams} from "../../modules/paramtypes";

interface IParamCheckboxProps extends IParamUISettingBase<CheckboxParams> {
    curVal:boolean
}
/**
 * ParamCheckbox
 * @author Ilya Shabanov
 */
const ParamCheckbox:React.FC<IParamCheckboxProps> = ({onParameterChanged, tooltipPlacement, conf,curVal,disabled}) => {
    
    const onChange = (e)=>{
        onParameterChanged(conf,e.target.checked);
    }
    
	return (<div className={'param param-checkbox' + cl(disabled, 'is-disabled')}>
        <div className="fl-row-between">
            <div className="param__name">{conf.display.title}</div>
            <div className="fl-grow"/>
            <ParamHelpBtn content={conf.display.hint} toolTipPlacement={tooltipPlacement}/>
        </div>
        <FormControlLabel control={ <Checkbox color={'primary'} checked={curVal} onChange={onChange}/>} label={conf.input.label} />
	</div>);
}
export default ParamCheckbox;