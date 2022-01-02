import React, {useState} from "react";
import {atomFamily, useRecoilState, useRecoilValue} from "recoil";
import * as alg from "../../../sammie/js/state/algstate";
import {SingleDataBatch} from "../../../sammie/js/state/algstate";
import * as self from "./params";
import * as server from "./server";
import {ColocGraphsResult} from "./server";
import './scss/ColocGraphs.scss'
import * as parent from "../../pipelines/ColocalizationPipeline";
import {ColocalizationBatchParameters} from "../../pipelines/ColocalizationPipeline";
import {useStepHook} from "../../../sammie/js/modules/modulehooks";
import ErrorHint from "../../../sammie/js/ui/elements/ErrorHint";
import {EelResponse} from "../../../sammie/js/eel/eel";
import {LocalFileWithPreview, PipelineDataKey} from "../../../sammie/js/types/datatypes";
import FlexBinChart from "./FlexBinChart";
import ColocOverview from "./ColocOverview";
import CentroidTitleImage from '../../../assets/images/graph-centroid.svg'
import OverlapTitleImage from '../../../assets/images/graph-overlap.svg'
import ContourTitleImage from '../../../assets/images/graph-contour.svg'
import PCCTitleImage from '../../../assets/images/graph-pcc.svg'

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
        var centroidData = {}
        var pccData = {}
        
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
        
        centroidData[`From ${n0} to ${n1}`] = result.nncentroid.fwd;
        centroidData[`From ${n1} to ${n0}`] = result.nncentroid.bck;
        var formatCentroid = {}
        formatCentroid[`From ${n0} to ${n1}`] = {format:'%d', dataKey:'xinterval'}
        formatCentroid[`From ${n1} to ${n0}`] = {format:'%d', dataKey:'xinterval'}
        
        pccData[`Whole Cell Area`] = result.pcc.cell.filter(c=>!!c).map((c)=>c[0])
        pccData[`Foci Area`] = result.pcc.foci.filter(c=>!!c).map((c)=>c[0])
        pccData[`${n0} Area`] = result.pcc.fwd.filter(c=>!!c).map((c)=>c[0])
        pccData[`${n1} Area`] = result.pcc.bck.filter(c=>!!c).map((c)=>c[0])
        
    }
    
    return (<div className={'coloc-graphs'}>
        {error && <ErrorHint error={error}/>}
        {!error && result &&
        <div className={'site-block medium'}>
            <ColocOverview result={result} name0={n0} name1={n1} className={'pad-200-bottom'}/>
            <FlexBinChart titleImg={ContourTitleImage}  format={format} className={'pad-200-bottom'} data={nnData} title={'Contour Distance to non-overlapping Nearest Neighbour in ' + units}
                          xlabel={'Distance in ' + units}
                          explanation={'Histogram of distances of one type of foci to the nearest neighbour of the other type. This gives a contour to contour distance, which means that it is only calculated for foci that are non overlapping. Overlapping foci end up in the overlap graph.'}/>
            <FlexBinChart titleImg={OverlapTitleImage}  format={format} className={'pad-200-bottom'} data={overlapData} title={'Overlap'}
                          xlabel={'Overlap of focus'}
                          explanation={'Area of overlap for Foci of the two types. Either as absolute area measurements (e.g. in nm²) or as a percentage of the size of the overlapping focus (0-1).'}/>
            <FlexBinChart  titleImg={CentroidTitleImage} format={formatCentroid} className={'pad-200-bottom'} data={centroidData} title={'Centroid Distance to Nearest Neighbour in ' + units}
                          xlabel={'Distance in ' + units}
                          explanation={'Histogram of distances centroid to centroid from one focus to its nearest neighbour (in the other channel). As opposed to contour distance, centroid to centroid distances are calculated for all foci, regardless of the overlap they have.'}/>
            <FlexBinChart  titleImg={PCCTitleImage} format={{}} className={'pad-200-bottom'} data={pccData} title={'Pearson correlation'}
                          xlabel={'Pearson Correlation Coefficient'}
                          explanation={'Pearson correlation between pixels in the separate channels. The pixels used are either for the full cells, only inside foci of one of the two channels or all foci. (P value is ignored).'}
                          colFromEntry={colForPCC}/>
        </div>
        }
    </div>);
}
export default ColocGraphs

function colForPCC(x:number,y:number):string{
    if(x < 0) return '#FF7F5077'
    return '#FF7F50ff'
}
function getDSName(curBatch:SingleDataBatch<ColocalizationBatchParameters>, allInputs:Record<PipelineDataKey,LocalFileWithPreview>, i:number){
    if(curBatch.batchParameters['name'+i])
        return curBatch.batchParameters['name'+i]
    
    const k = Object.keys(allInputs)[i]
    return 'Foci in ' + allInputs[k].file.name
}