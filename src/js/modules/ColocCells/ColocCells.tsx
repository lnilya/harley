import React from "react";
import {atomFamily, useRecoilState, useRecoilValue} from "recoil";
import * as alg from "../../../sammie/js/state/algstate";
import * as ui from "../../../sammie/js/state/uistates";
import * as eventbus from "../../../sammie/js/state/eventbus";
import * as self from "./params";
import * as server from "./server";
import './scss/ColocCells.scss'
import {useStepHook} from "../../../sammie/js/modules/modulehooks";
import ErrorHint from "../../../sammie/js/ui/elements/ErrorHint";
import {EelResponse} from "../../../sammie/js/eel/eel";
import {PipelineImage} from "../../../sammie/js/types/datatypes";
import {useState} from "react";

/**PERSISTENT UI STATE DEFINITIONS*/
const asDemoUIState = atomFamily<PipelineImage,string>({key:'coloc-cells_demo',default:null});
const asLastRunSettings = atomFamily< {inputs:self.Inputs, params:self.Parameters},string>({key:'coloc-cells_initial',default:null});

interface IColocCellsProps{}
const ColocCells:React.FC<IColocCellsProps> = () => {
    
    /**CLEANUP CALLBACK WHEN INPUTS HAVE CHANGED*/
    const onInputChanged = ()=>{
        console.log(`INPUT HAS CHANGED CLEANING STATE...`);
    };
    
    /**RUNNING ALGORITHM CALLBACK*/
    const runMainAlgorithm = async (params:self.Parameters,step:self.Step)=>{
        const res = await server.runColocCells(params,step);
        setError(res.error ? res : null)
        if(res.error) {
            console.log(`Error...`);
        }else {
            console.log(`Success...`);
        }
        return res.error ? {error:res.error} : true;
    };
    
    /**CORE HOOK FOR SETTING UP STATE*/
    const {curInputs,curStep,curParams,isRunning,curBatch} = useStepHook<self.Inputs, self.Parameters,self.Step>(asLastRunSettings,
        onInputChanged,
        runMainAlgorithm,
        {msg: 'Running ColocCells', display: "overlay"});
    
    /**UI SPECIFIC STATE*/
    const [demoState,setDemoSTate] = useRecoilState(asDemoUIState(curStep.moduleID))
    const [error,setError] = useState<EelResponse<any>>(null)
    
	return (<div className={'coloc-cells'}>
	    {error && <ErrorHint error={error}/> }
        {!error &&
            <>
                Result goes here
            </>
        }
	</div>);
}
export default ColocCells