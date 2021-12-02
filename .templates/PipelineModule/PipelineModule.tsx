import React, {useEffect, useState} from "react"
import {atomFamily, useRecoilState, useRecoilValue} from "recoil";
import * as alg from "../../state/algstate";
import * as ui from "../../state/uistates";
import * as eventbus from "../../state/eventbus";
import * as self from "./params";
import {run__NAME__} from "./server";
import './scss/__NAME__.scss'
import {useStepHook} from "../_hooks";
import {PipelineImage} from "../../types/datatypes";
import {EelResponse} from "../../eel/eel";
import ErrorHint from "../../ui/elements/ErrorHint";

/**PERSISTENT UI STATE DEFINITIONS*/
const asDemoUIState = atomFamily<PipelineImage,string>({key:'__NAME_LC___demo',default:null});
const asLastRunSettings = atomFamily< {inputs:self.Inputs, params:self.Parameters},string>({key:'__NAME_LC___initial',default:null});

interface I__NAME__Props{}
const __NAME__:React.FC<I__NAME__Props> = () => {
    
    /**CLEANUP CALLBACK WHEN INPUTS HAVE CHANGED*/
    const onInputChanged = ()=>{
        console.log(`INPUT HAS CHANGED CLEANING STATE...`);
    };
    
    /**RUNNING ALGORITHM CALLBACK*/
    const runMainAlgorithm = async (params:self.Parameters,step:self.Step)=>{
        const res = await run__NAME__(params,step);
        setError(res.error ? res : null)
        if(res.error) {
            console.log(`Error...`);
        }else {
            console.log(`Success...`);
        }
        return res.error ? {error:res.error} : true;
    };
    
    /**CORE HOOK FOR SETTING UP STATE*/
    const {curInputs,curStep,curParams,isRunning} = useStepHook<self.Inputs, self.Parameters,self.Step>(asLastRunSettings,
        onInputChanged,
        runMainAlgorithm,
        {msg: 'Running Threshhold', display: "text"});
    
    /**UI SPECIFIC STATE*/
    const [demoState,setDemoSTate] = useRecoilState(asDemoUIState(curStep.moduleID))
    const [error,setError] = useState<EelResponse<any>>(null)
    
	return (<div className={'__NAME_LC__'}>
	    {error && <ErrorHint error={error}/> }
        {!error &&
            <>
                Result goes here
            </>
        }
	</div>);
}
export default __NAME__