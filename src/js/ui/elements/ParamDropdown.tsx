import React from "react";
import {cl} from "../../util";
import {DropDownParams, Parameter} from "../../modules/_shared";
import ParamHelpBtn from "./ParamHelpBtn";
import {FormControl, NativeSelect} from "@material-ui/core";
import {setPipelineParameterValue} from "../../state/stateutil";

interface IParamDropdownProps{
	conf:Parameter<DropDownParams>,
    curVal:string,
    disabled:boolean,
}
/**
 * ParamDropdown
 * @author Ilya Shabanov
 */
const ParamDropdown:React.FC<IParamDropdownProps> = ({conf,curVal,disabled}) => {
    const handleChange = (event) => {
        setPipelineParameterValue(conf,event.target.value);
    };
    
	return (
        <div className={`param param-dropdown` + cl(disabled, 'is-disabled')}>
            <div className="fl-row-between">
                <div className="param__name">{conf.display.title}</div>
                <div className="fl-grow"/>
                <ParamHelpBtn content={conf.display.hint}/>
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