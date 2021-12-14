import React from "react";
import {atomFamily, useRecoilState, useRecoilValue} from "recoil";
import * as alg from "../../../sammie/js/state/algstate";
import * as ui from "../../../sammie/js/state/uistates";
import * as eventbus from "../../../sammie/js/state/eventbus";
import * as self from "./params";
import * as server from "./server";
import './scss/ColocGraphs.scss'
import * as parent from "../../pipelines/ColocalizationPipeline";
import {useStepHook} from "../../../sammie/js/modules/modulehooks";
import ErrorHint from "../../../sammie/js/ui/elements/ErrorHint";
import {EelResponse} from "../../../sammie/js/eel/eel";
import {LocalFileWithPreview, PipelineDataKey, PipelineImage} from "../../../sammie/js/types/datatypes";
import {useState} from "react";
import {ColocGraphsResult} from "./server";
import {hist} from "../../util/math";
import {Area, Bar, BarChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import FlexBinChart from "./FlexBinChart";
import {SingleDataBatch} from "../../../sammie/js/state/algstate";
import {ColocalizationBatchParameters} from "../../pipelines/ColocalizationPipeline";
import ColocOverview from "./ColocOverview";

/**PERSISTENT UI STATE DEFINITIONS*/
const asResult = atomFamily<ColocGraphsResult, string>({key: 'coloc-graphs_result', default: null});
const asLastRunSettings = atomFamily<{ inputs: self.Inputs, params: self.Parameters }, string>({
    key: 'coloc-graphs_initial',
    default: null
});

interface IColocGraphsProps {
}

const ColocGraphs: React.FC<IColocGraphsProps> = () => {
    
    /**CLEANUP CALLBACK WHEN INPUTS HAVE CHANGED*/
    const onInputChanged = () => {
        setResult(null)
        console.log(`INPUT HAS CHANGED CLEANING STATE...`);
    };
    
    /**RUNNING ALGORITHM CALLBACK*/
    const runMainAlgorithm = async (params: self.Parameters, step: self.Step) => {
        const res = await server.runColocGraphs(params, step, curBatch.batchParameters["1px"]);
        setError(res.error ? res : null)
        setResult(!res.error ? res.data : null)
        if (res.error) {
            console.log(`Error...`);
        } else {
            console.log(`Success...`);
        }
        return res.error ? {error: res.error} : true;
    };
    
    /**CORE HOOK FOR SETTING UP STATE*/
    const {
        curInputs,
        curStep,
        curParams,
        isRunning,
        curBatch
    } = useStepHook<self.Inputs, self.Parameters, self.Step, parent.ColocalizationBatchParameters>(asLastRunSettings,
        onInputChanged,
        runMainAlgorithm,
        {msg: 'Running ColocGraphs', display: "overlay"});
    
    /**UI SPECIFIC STATE*/
    const [result, setResult] = useRecoilState(asResult(curStep.moduleID))
    const [error, setError] = useState<EelResponse<any>>(null)
    const allInputs = useRecoilValue(alg.allPipelineInputs)
    
    const n0 = getDSName(curBatch,allInputs,0)
    const n1 = getDSName(curBatch,allInputs,1)
    const units = curBatch.batchParameters["1px"] ? 'nm' : 'px'
    if(result){
        var format = {}
        
        var overlapData = {}
        
        
        overlapData[`As % of ${n0} area`] = result.overlap.fwd
        format[`As % of ${n0} area`] = {type:'number', domain:[0,1]}
        
        overlapData[`As % of ${n1} area`] = result.overlap.bck
        format[`As % of ${n1} area`] = {type:'number', domain:[0,1]}
        
        overlapData[`Absolute in ${units}²`] = result.overlap.abs
        format[`Absolute in ${units}²`] = {format:'%d'}
        
        var nnData = {}
        nnData[`From ${n0} to ${n1}`] = result.nn.fwd
        nnData[`From ${n1} to ${n0}`] = result.nn.bck
        format[`From ${n0} to ${n1}`] = {format:'%d', dataKey:'xinterval'}
        format[`From ${n1} to ${n0}`] = {format:'%d', dataKey:'xinterval'}
    }
    
    return (<div className={'coloc-graphs'}>
        {error && <ErrorHint error={error}/>}
        {!error && result &&
        <div className={'site-block medium'}>
            <ColocOverview result={result} name0={n0} name1={n1} className={'pad-200-bottom'}/>
            <FlexBinChart format={format} className={'pad-200-bottom'} data={nnData} title={'Distance to Nearest Neighbour in ' + units}
                          explanation={'Histogram of distances of one type of foci to the nearest neighbour of the other type. Only cells where both type of foci are present are counted. Distances are only calculated for foci that do not overlap the other type.'}/>
            <FlexBinChart format={format} className={'pad-200-bottom'} data={overlapData} title={'Overlap'}
                          explanation={'Area of overlap for Foci of the two types. Either as absolute area measurements (e.g. in nm²) or as a percentage of the size of the overlapping focus (0-1).'}/>
        </div>
        }
    </div>);
}
export default ColocGraphs

function getDSName(curBatch:SingleDataBatch<ColocalizationBatchParameters>, allInputs:Record<PipelineDataKey,LocalFileWithPreview>, i:number){
    if(curBatch.batchParameters['name'+i])
        return curBatch.batchParameters['name'+i]
    
    const k = Object.keys(allInputs)[i]
    return 'Foci in ' + allInputs[k].file.name
}