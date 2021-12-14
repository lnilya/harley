import React, {useEffect, useState} from "react"
import {Input, Slider} from "@mui/material";
import {ccl, cl} from "../../util";
import ParamHelpBtn from "./ParamHelpBtn";
import {IParamUISettingBase} from "../../types/uitypes";
import {SliderInputParams} from "../../modules/paramtypes";

interface ISliderSettingProps extends IParamUISettingBase<SliderInputParams>{
    curVal: number[],
}

const cls = ccl('param-slider--')
const ParamSlider: React.FC<ISliderSettingProps> = ({onParameterChanged,tooltipPlacement, conf, curVal, disabled}) => {
    
    //we need to keep local state, since the slider changes read-only value internally before calling onChange.
    const [curSliderVal, setSliderVal] = useState(curVal);
    const [isActive, setActive] = useState(false);
    const setVal = (v) => {
        // console.log(`SET VAL: `, v);
        if (!Array.isArray(v)) v = [v];
        v = v.map((val) => Math.min(Math.max(val, conf.input.min), conf.input.max))
        if (v.length > 1 && v[0] > v[1]) v = [v[1], v[0]];
        setSliderVal(v)
    };
    const setValPartially = (v, pos) => {
        const nv = [...curSliderVal];
        nv[pos] = v;
        setVal(nv)
    };
    
    //External change of parameters, via undo or reset.
    useEffect(() => {
        if (curVal !== curSliderVal)
            setSliderVal(curVal)
    }, [curVal])
    
    const ip = {step: conf.input.stepsize, min: conf.input.min, max: conf.input.max, type: 'number'}
    const ipchange = (p) => (e) => setValPartially(e.target.value, p);
    
    const inputLabels = ['From:', 'To:']
    
    const onBlurIn = ()=>setActive(true)
    const onBlurOut = ()=>setActive(false)
    
    useEffect(()=>{
        if(!isActive)
            onParameterChanged(conf,curSliderVal)
        
    },[isActive])
    
    const onKeyUpInput = (e)=>{
        if(e.keyCode == 13)e.target.blur();
    }
    return (<div className={'param param-slider' + cl(disabled, 'is-disabled') + cls(conf.input.invert, 'inverted')}>
        <div className="fl-row-between">
            <div className="param__name">{conf.display.title}</div>
            <div className="fl-grow"/>
            <ParamHelpBtn toolTipPlacement={tooltipPlacement} content={conf.display.hint}/>
        </div>
        {curSliderVal.length == 1 &&
        <div className={`fl-row param-slider__slider is-single`}>
            <Slider size={'small'} value={curSliderVal[0]} min={conf.input.min} max={conf.input.max} step={conf.input.stepsize}
                    onChange={(e, v) => setVal(v)} onMouseDown={onBlurIn} onChangeCommitted={onBlurOut}/>

            <Input value={curSliderVal[0]} inputProps={ip} onChange={ipchange(0)}
                   onBlur={onBlurOut} onKeyUp={onKeyUpInput} onFocus={onBlurIn}/>
        </div>
        }
        {curSliderVal.length == 2 &&
        <>
            <div className={`fl-row param-slider__slider `}>
                <Slider size={'small'} value={[...curSliderVal]} min={conf.input.min} max={conf.input.max} step={conf.input.stepsize}
                        onChange={(e, v) => setVal(v)}
                        onMouseDown={onBlurIn} onChangeCommitted={onBlurOut}/>
            </div>
            <div className="param-slider__direct fl-row">
                {curSliderVal.map((v, i) => {
                    return (<div key={i}>
                        <span>{inputLabels[i]}</span>
                        <Input  value={v} inputProps={ip} onChange={ipchange(i)} onBlur={onBlurOut} onKeyUp={onKeyUpInput} onFocus={onBlurIn}/>
                    </div>)
                })}
            </div>
        </>
        }
    </div>);
}

export default ParamSlider;