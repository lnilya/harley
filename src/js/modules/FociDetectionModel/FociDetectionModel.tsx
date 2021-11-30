import React, {useEffect, useState} from "react"
import {atomFamily, useRecoilState, useRecoilValue} from "recoil";
import * as alg from "../../state/algstate";
import * as ui from "../../state/uistates";
import * as eventbus from "../../state/eventbus";
import * as self from "./params";
import {changeCellSelection, FociDetectionModelResult, runFociDetectionModel} from "./server";
import './scss/FociDetectionModel.scss'
import {useStepHook} from "../_hooks";
import {PipelineImage} from "../../types/datatypes";
import {EelResponse} from "../../eel/eel";
import ErrorHint from "../../ui/elements/ErrorHint";
import CellResult from "./CellResult";
import {copyChange, copyRemove} from "../../util";

/**PERSISTENT UI STATE DEFINITIONS*/
const asResult = atomFamily<FociDetectionModelResult,string>({key:'foci-detection-model_result',default:null});
const asIncludedCells = atomFamily<number[],string>({key:'foci-detection-model_included',default:null});
const asLastRunSettings = atomFamily< {inputs:self.Inputs, params:self.Parameters},string>({key:'foci-detection-model_initial',default:null});

interface IFociDetectionModelProps{}
const FociDetectionModel:React.FC<IFociDetectionModelProps> = () => {
    
    /**CLEANUP CALLBACK WHEN INPUTS HAVE CHANGED*/
    const onInputChanged = ()=>{
        setResult(null)
    };
    
    /**RUNNING ALGORITHM CALLBACK*/
    const runMainAlgorithm = async (params:self.Parameters,step:self.Step)=>{
        const res = await runFociDetectionModel(params,step);
        setError(res.error ? res : null)
        setResult(!res.error ? res.data : null)
        setIncludedCells(!res.error ? res.data.imgs.map((v,i)=>i) : null)
        
        return res.error ? {error:res.error} : true;
    };
    
    /**CORE HOOK FOR SETTING UP STATE*/
    const {curInputs,curStep,curParams,isRunning} = useStepHook<self.Inputs, self.Parameters,self.Step>(asLastRunSettings,
        onInputChanged,
        runMainAlgorithm,
        {msg: 'Running Detection', display: "overlay", progress:0});
    
    /**UI SPECIFIC STATE*/
    const [result,setResult] = useRecoilState(asResult(curStep.moduleID))
    const [includedCells,setIncludedCells] = useRecoilState(asIncludedCells(curStep.moduleID))
    const [error,setError] = useState<EelResponse<any>>(null)
    
    const onCellInclusionToggle = (idx:number) => {
        if(includedCells.indexOf(idx) == -1)
            var na = [...includedCells, idx];
        else
            na = copyRemove(includedCells,idx);
        
        setIncludedCells(na)
        
        changeCellSelection(curParams,curStep,na)
    };
    
	return (<div className={'foci-detection-model margin-100-neg pad-100'}>
	    {error && <ErrorHint error={error}/> }
        {!error && result &&
            <div className={`grid cols-${curParams.fociperrow} half-gap`}>
                {result.imgs.map((img,i)=>{
                    return <CellResult key={i} img={img} foci={result.foci[i]}
                                       excluded={includedCells.indexOf(i) == -1}
                                       onToggleCellInclusion={()=>onCellInclusionToggle(i)} />
                })}
            </div>
        }
	</div>);
}
export default FociDetectionModel