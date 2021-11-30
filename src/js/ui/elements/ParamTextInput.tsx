import React, {useEffect, useState} from "react"
import {DirInputParams, Parameter, TextInputParams} from "../../modules/_shared";
import {cl} from "../../util";
import ParamHelpBtn from "./ParamHelpBtn";
import {Input} from "@material-ui/core";
import {setPipelineParameterValue} from "../../state/stateutil";

interface IParamTextInputProps{
    conf:Parameter<DirInputParams|TextInputParams>,
    curVal:string,
    disabled:boolean,
}

const ParamTextInput:React.FC<IParamTextInputProps> = ({conf,curVal,disabled}) => {

    const [isActive, setActive] = useState(false);
    const [curInputVal, setInputVal] = useState(curVal);
    
    //Reset values when external values reset
    useEffect(() => {
        if (curVal !== curInputVal) setInputVal(curVal)
    }, [curVal])
    
    //Send values to pipeline when loosing focus
    useEffect(()=>{
        if(!isActive) setPipelineParameterValue(conf, curInputVal)
    },[isActive])
    
    const onKeyUpInput = (e)=>{ if(e.keyCode == 13)e.target.blur(); }
    const onChange = (e)=>setInputVal(e.target.value)
    const onBlurIn = () => setActive(true)
    const onBlurOut = () => setActive(false)
    
    
	return (<div className={'param param-text' + cl(disabled,'is-disabled')}>
        <div className="fl-row-between">
            <div className="param__name">{conf.display.title}</div>
            <div className="fl-grow"/>
            <ParamHelpBtn content={conf.display.hint}/>
        </div>
        <Input className={'full-w'}
               placeholder={conf.input.placeholder}
               value={curInputVal} onChange={onChange}
               onBlur={onBlurOut} onKeyUp={onKeyUpInput} onFocus={onBlurIn}
        />
	</div>);
}
export default ParamTextInput;