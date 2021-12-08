import React, {useEffect} from "react";
import {useRecoilValue} from "recoil";
import * as ui from '../../state/uistates'
import * as alg from '../../state/algstate'
import ParamSlider from "../elements/ParamSlider";
import ParamTextInput from "../elements/ParamTextInput";
import ParamDropdown from "../elements/ParamDropdown";
import ParamCheckbox from "../elements/ParamCheckbox";
import * as eventbus from '../../state/eventbus'
import ParamTitle from "../elements/ParamTitle";
import {cl} from "../../util";
import {setPipelineParameterValue} from "../../state/stateutil";
import {Parameter, SettingDictionary} from "../../modules/paramtypes";

interface ISidebarProps{

}

var sbtimeout;
var oldStep = '';
const Sidebar:React.FC<ISidebarProps> = () => {

    const curStep = useRecoilValue(ui.curPipelineStep)
    const overlay = useRecoilValue(ui.overlay)
    const curParams:SettingDictionary = useRecoilValue(alg.curPipelineStepParameterValuesUI)
    
    
    //Firing of event changed
    useEffect(()=>{
        clearTimeout(sbtimeout)
        sbtimeout = setTimeout(()=> {
                eventbus.fireEvent<eventbus.ParametersChangedPayload>(eventbus.EventTypes.ParametersChanged, curStep.title != oldStep)
                oldStep = curStep.title;
            }
        ,1000)
    },[curParams])
    
    /**
     * TODO: The Parameter should be changed here, rather than in the ParamComponents This would allow a better control/reduction on repaints
     * */
    const onSetParameter = (conf:Parameter<any>,value:any)=>{
        setPipelineParameterValue(conf,value);
    }
    
    const overlayBlock = overlay !== null && overlay.nonBlocking !== false
    
    if(!curStep) return null;
	return (<div className={'sidebar pad-100-top ' + cl(overlayBlock, 'blocked')}>
        {curStep.parameters.map((s)=>{
            let vis = s.conditional(curParams);
            if( vis == 'hide') return null;
            const params = {onParameterChanged:onSetParameter, key:s.key, conf:s, curVal:curParams[s.key], disabled:overlayBlock|| vis == 'disable'};
            
            if(s.input.type == 'slider') return <ParamSlider {...params}/>;
            else if( s.input.type == 'text_input') return <ParamTextInput {...params}/>;
            else if(s.input.type == 'dropdown') return <ParamDropdown {...params}/>;
            else if(s.input.type == 'checkbox') return <ParamCheckbox {...params}/>;
            else if(s.input.type == 'separator') return <ParamTitle {...params}/>;
            
            return null;
        }
        )}
        <div className="fl-grow"/>
	</div>);
}

export default Sidebar