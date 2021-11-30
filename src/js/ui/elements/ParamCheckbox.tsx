import React from "react";
import {cl} from "../../util";
import {CheckboxParams, Parameter} from "../../modules/_shared";
import ParamHelpBtn from "./ParamHelpBtn";
import {Checkbox, FormControlLabel} from "@material-ui/core";
import {setPipelineParameterValue} from "../../state/stateutil";

interface IParamCheckboxProps{
	conf:Parameter<CheckboxParams>,
    curVal:boolean,
    disabled:boolean,
}
/**
 * ParamCheckbox
 * @author Ilya Shabanov
 */
const ParamCheckbox:React.FC<IParamCheckboxProps> = ({conf,curVal,disabled}) => {
    
    const onChange = (e)=>{
        setPipelineParameterValue(conf,e.target.checked);
    }
    
	return (<div className={'param param-checkbox' + cl(disabled, 'is-disabled')}>
        <div className="fl-row-between">
            <div className="param__name">{conf.display.title}</div>
            <div className="fl-grow"/>
            <ParamHelpBtn content={conf.display.hint}/>
        </div>
        <FormControlLabel control={ <Checkbox color={'primary'} checked={curVal} onChange={onChange}/>} label={conf.input.label} />
	</div>);
}
export default ParamCheckbox;