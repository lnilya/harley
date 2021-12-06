import React from "react";
import {cl} from "../../util";
import ParamHelpBtn from "./ParamHelpBtn";
import {FormControl, NativeSelect} from "@mui/material";
import {IParamUISettingBase} from "../../types/uitypes";
import {DropDownParams} from "../../modules/paramtypes";

interface IParamDropdownProps extends IParamUISettingBase<DropDownParams> {
    curVal:string
}
/**
 * ParamDropdown
 * @author Ilya Shabanov
 */
const ParamDropdown:React.FC<IParamDropdownProps> = ({onParameterChanged, tooltipPlacement, conf,curVal,disabled}) => {
    const handleChange = (event) => {
        onParameterChanged(conf,event.target.value);
    };
    
	return (
        <div className={`param param-dropdown` + cl(disabled, 'is-disabled')}>
            <div className="fl-row-between">
                <div className="param__name">{conf.display.title}</div>
                <div className="fl-grow"/>
                <ParamHelpBtn toolTipPlacement={tooltipPlacement} content={conf.display.hint}/>
            </div>
    
            <FormControl variant="outlined">
                <NativeSelect value={curVal} onChange={handleChange}>
                    {Object.keys(conf.input.options).map((k)=>
                        <option key={k} value={k}>{conf.input.options[k]}</option>
                    )}
                </NativeSelect>
            </FormControl>
        </div>
	);
}
export default ParamDropdown;