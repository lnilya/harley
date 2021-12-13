import React from "react";
import {atomFamily, useRecoilState, useRecoilValue} from "recoil";
import * as alg from "../../../sammie/js/state/algstate";
import * as ui from "../../../sammie/js/state/uistates";
import * as eventbus from "../../../sammie/js/state/eventbus";
import * as self from "./params";
import * as parent from "../../pipelines/ColocalizationPipeline";
import * as server from "./server";
import './scss/DatasetAlignment.scss'
import {useStepHook} from "../../../sammie/js/modules/modulehooks";
import ErrorHint from "../../../sammie/js/ui/elements/ErrorHint";
import {EelResponse} from "../../../sammie/js/eel/eel";
import {PipelineImage} from "../../../sammie/js/types/datatypes";
import {useState} from "react";
import {DatasetPreviewResult} from "./server";
import AlignmentPair from "./AlignmentPair";
import {printf} from "fast-printf";
import {copyChange} from "../../../sammie/js/util";

/**PERSISTENT UI STATE DEFINITIONS*/
const asDatasets = atomFamily<DatasetPreviewResult,string>({key:'dataset-alignment_preview',default:null});
const asAlignment = atomFamily<number[],string>({key:'dataset-alignment_alignment',default:null});
const asLastRunSettings = atomFamily< {inputs:self.Inputs, params:self.Parameters},string>({key:'dataset-alignment_initial',default:null});

interface IDatasetAlignmentProps{}
const DatasetAlignment:React.FC<IDatasetAlignmentProps> = () => {
    
    /**CLEANUP CALLBACK WHEN INPUTS HAVE CHANGED*/
    const onInputChanged = ()=>{
        setDatasets(null)
        setAlignment(null)
    };
    
    /**RUNNING ALGORITHM CALLBACK*/
    const runMainAlgorithm = async (params:self.Parameters,step:self.Step)=>{
        const res = await server.preloadDataset(params,step);
        setError(res.error ? res : null)
        setDatasets(!res.error ? res.data : null)
        setAlignment(!res.error ? res.data.suggestedAlignment : null)
        return res.error ? {error:res.error} : true;
    };
    
    /**CORE HOOK FOR SETTING UP STATE*/
    const {curInputs,curStep,curParams,isRunning,curBatch} = useStepHook<self.Inputs, self.Parameters,self.Step,parent.ColocalizationBatchParameters>(asLastRunSettings,
        onInputChanged,
        runMainAlgorithm,
        {msg: 'Running DatasetAlignment', display: "overlay"});
    
    /**UI SPECIFIC STATE*/
    const allInputs = useRecoilValue(alg.allPipelineInputs)
    const [datasets,setDatasets] = useRecoilState(asDatasets(curStep.moduleID))
    const [alignment,setAlignment] = useRecoilState(asAlignment(curStep.moduleID))
    const [error,setError] = useState<EelResponse<any>>(null)
    
    const changeAlignment = async (from:number, to:number) => {
        const nv = copyChange(alignment,from,to)
        const res = await server.setAlignment(curParams,curStep,nv)
        if(!res.error){
            setAlignment(nv)
        }else{
            onInputChanged()
            setError(res.error ? res : null)
        }
    }
    
	return (<div className={'dataset-alignment '}>
     
	    {error && <ErrorHint error={error}/> }
        {!error && datasets && alignment &&
            <>
                <div className="grid cols-2 no-gap titles pad-50-bottom">
                    {Object.keys(allInputs).map((k,i)=> {
                        var n = allInputs[k].file.name
                        if(curBatch.batchParameters['name'+i])
                            n = printf('%s (%s)',curBatch.batchParameters['name'+i],n)
                        return <h3 key={k}>{n}</h3>
                    })}
                </div>
                {alignment.map((p2, p1) => {
                    const dr = p2 == -1 ? null : datasets.previews2[p2]
                    
                    return (
                        <AlignmentPair dataLeft={datasets.previews1[p1]} key={p1}
                                       batchNum={p1}
                                       dataRight={dr}
                                       onChangeAlignment={t=>changeAlignment(p1,t)}
                                       match={p2 == -1 ? 0 : datasets.similarity[p1][p2]}
                                       curVal={p2} dropDownSel={getSelCol(datasets.similarity,p1)}/>
                    )
                })}
            </>
        }
	</div>);
}
export default DatasetAlignment


function getSelCol(sim,col:number){
    var res = {'-1':`Don't align`}
    sim[col].forEach((i,idx)=>{
        res[idx] = `Batch #${idx} (Alignment: ${printf('%.1f%%',sim[col][idx]*100)})`
    })
    return res
}