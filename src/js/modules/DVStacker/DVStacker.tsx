import React, {useState} from "react"
import {atomFamily, useRecoilState} from "recoil";
import * as self from "./params";
import {DVStackerResult, runDVStacker} from "./server";
import './scss/DVStacker.scss'
import {useStepHook} from "../_hooks";
import {PipelineImage} from "../../types/datatypes";
import InnerImageZoom from 'react-inner-image-zoom';
import 'react-inner-image-zoom/lib/InnerImageZoom/styles.min.css';
import {EelResponse} from "../../eel/eel";
import ErrorHint from "../../ui/elements/ErrorHint";

interface IDVStackerProps{}
/**PERSISTENT UI STATE DEFINITIONS*/
const asLastRunSettings = atomFamily< {inputs:self.Inputs, params:self.Parameters},string>({key:'dv-stacker_initial',default:null});
const asCurResult = atomFamily<{ z:PipelineImage[], stack:PipelineImage },string>({key:'dvstacker_result',default:null});

const DVStacker:React.FC<IDVStackerProps> = () => {
    
    /**CLEANUP CALLBACK WHEN INPUTS HAVE CHANGED*/
    const onInputChanged = ()=>{
        setCurResult(null)
    };
    
    /**RUNNING ALGORITHM CALLBACK*/
    const runMainAlgorithm = async (params:self.Parameters,step:self.Step)=>{
        const res = await runDVStacker(params,step);
        setCurResult(res.error ? null : res.data)
        setErr(res.error ? res : null)
        
        return res.error ? {error:res.error} : true;
    };
    
    /**CORE HOOK FOR SETTING UP STATE*/
    const {curInputs,curStep,curParams,isRunning} = useStepHook<self.Inputs, self.Parameters,self.Step>(asLastRunSettings,
        onInputChanged,
        runMainAlgorithm,
        {msg: 'Stacking...', display: "overlay"});
    
    /**UI SPECIFIC STATE*/
    const [curResult, setCurResult] = useRecoilState(asCurResult(curStep.moduleID));
    const [err, setErr] = useState<EelResponse<DVStackerResult>>(null);
    
    
	return (<div className={'dv-stacker'}>
        {err &&
            <ErrorHint error={err}/>
        }
        {curResult &&
            <>
                <h2>Stacked Image</h2>
                <img className={'dv-stacker__mainimg'} src={curResult.stack.url} alt={'Stacked Image'} />
                <h2>Z Channels</h2>
                <div className="pad-50-hor">
                    <div className="grid cols-3 half-gap">
                        {curResult.z.map((zp,k)=>{
                            return <div key={k} className="dv-stacker__z-preview rel">
                                <div className={'bg-main'}>{k}</div>
                                <InnerImageZoom src={zp.url} zoomSrc={zp.url} hideHint/>
                            </div>
                        })}
                    </div>
                </div>
            </>
        }
	</div>);
}

export default DVStacker