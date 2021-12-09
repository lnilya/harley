import React from "react";
import {atomFamily, useRecoilState, useRecoilValue} from "recoil";
import * as alg from "../../../sammie/js/state/algstate";
import * as ui from "../../../sammie/js/state/uistates";
import * as eventbus from "../../../sammie/js/state/eventbus";
import * as self from "./params";
import * as server from "./server";
import './scss/DatasetAlignment.scss'
import {useStepHook} from "../../../sammie/js/modules/modulehooks";
import ErrorHint from "../../../sammie/js/ui/elements/ErrorHint";
import {EelResponse} from "../../../sammie/js/eel/eel";
import {PipelineImage} from "../../../sammie/js/types/datatypes";
import {useState} from "react";
import {DatasetPreviewResult} from "./server";

/**PERSISTENT UI STATE DEFINITIONS*/
const asDatasets = atomFamily<DatasetPreviewResult,string>({key:'dataset-alignment_preview',default:null});
const asLastRunSettings = atomFamily< {inputs:self.Inputs, params:self.Parameters},string>({key:'dataset-alignment_initial',default:null});

interface IDatasetAlignmentProps{}
const DatasetAlignment:React.FC<IDatasetAlignmentProps> = () => {
    
    /**CLEANUP CALLBACK WHEN INPUTS HAVE CHANGED*/
    const onInputChanged = ()=>{
        setDatasets(null)
    };
    
    /**RUNNING ALGORITHM CALLBACK*/
    const runMainAlgorithm = async (params:self.Parameters,step:self.Step)=>{
        const res = await server.preloadDataset(params,step);
        setError(res.error ? res : null)
        setDatasets(!res.error ? res.data : null)
        return res.error ? {error:res.error} : true;
    };
    
    /**CORE HOOK FOR SETTING UP STATE*/
    const {curInputs,curStep,curParams,isRunning,curBatch} = useStepHook<self.Inputs, self.Parameters,self.Step>(asLastRunSettings,
        onInputChanged,
        runMainAlgorithm,
        {msg: 'Running DatasetAlignment', display: "overlay"});
    
    /**UI SPECIFIC STATE*/
    const [datasets,setDatasets] = useRecoilState(asDatasets(curStep.moduleID))
    const [error,setError] = useState<EelResponse<any>>(null)
	return (<div className={'dataset-alignment'}>
	    {error && <ErrorHint error={error}/> }
        {!error && datasets &&
            <div className={'grid half-gap cols-2'}>
                {datasets.previews1.map((p)=><img src={p.url} key={p.url}/>)}
                
                {datasets.previews2.map((p)=><img src={p.url} key={p.url}/>)}
            </div>
        }
	</div>);
}
export default DatasetAlignment