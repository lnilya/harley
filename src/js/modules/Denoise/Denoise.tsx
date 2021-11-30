import React, {useState} from "react"
import {atomFamily, useRecoilState} from "recoil";
import * as self from "./params";
import {runDenoise} from "./server";
import './scss/Denoise.scss'
import {useStepHook} from "../_hooks";
import {PipelineImage} from "../../types/datatypes";
import {EelResponse} from "../../eel/eel";
import ErrorHint from "../../ui/elements/ErrorHint";
import ReactBeforeSliderComponent from 'react-before-after-slider-component';
import 'react-before-after-slider-component/dist/build.css';


/**PERSISTENT UI STATE DEFINITIONS*/
const asDenoised = atomFamily<PipelineImage,string>({key:'denoise_result',default:null});
const asLastRunSettings = atomFamily< {inputs:self.Inputs, params:self.Parameters},string>({key:'denoise_initial',default:null});

interface IDenoiseProps{}
const Denoise:React.FC<IDenoiseProps> = () => {
    
    /**CLEANUP CALLBACK WHEN INPUTS HAVE CHANGED*/
    const onInputChanged = ()=>{
        setResImg(null)
        setError(null)
    };
    
    /**RUNNING ALGORITHM CALLBACK*/
    const runMainAlgorithm = async (params:self.Parameters,step:self.Step)=>{
        const res = await runDenoise(params,step);
        setError(res.error ? error : null)
        setResImg(res.error ? null : res.data)
        return res.error ? {error:res.error} : true;
    };
    
    /**CORE HOOK FOR SETTING UP STATE*/
    const {curInputs,curStep,curParams,isRunning} = useStepHook<self.Inputs, self.Parameters,self.Step>(asLastRunSettings,
        onInputChanged,
        runMainAlgorithm,
        {msg: 'Denoising...', display: "overlay"});
    
    /**UI SPECIFIC STATE*/
    const [resImg,setResImg] = useRecoilState(asDenoised(curStep.moduleID))
    const [error,setError] = useState<EelResponse<any>>(null)
	return (<div className={'denoise'}>
        {error && <ErrorHint error={error}/> }
        {resImg &&
            <>
                <ReactBeforeSliderComponent firstImage={{id:1,imageUrl: resImg.url}}
                                            secondImage={{id:2,imageUrl: curInputs.noisyImg.url}}/>
            </>
        }
	</div>);
}
export default Denoise