import React, {useEffect} from "react";
import {atomFamily, useRecoilState, useRecoilValue} from "recoil";
import * as alg from "../../../sammie/js/state/algstate";
import * as ui from "../../../sammie/js/state/uistates";
import * as eventbus from "../../../sammie/js/state/eventbus";
import * as self from "./params";
import * as server from "./server";
import './scss/FociDetectionParams.scss'
import * as parent from "../../pipelines/ParametrizedFociDetectionPipeline";
import {useStepHook, useToggleKeys} from "../../../sammie/js/modules/modulehooks";
import ErrorHint from "../../../sammie/js/ui/elements/ErrorHint";
import {EelResponse} from "../../../sammie/js/eel/eel";
import {PipelineImage} from "../../../sammie/js/types/datatypes";
import {useState} from "react";
import {FociDetectionParamsResult} from "./server";
import CellResult from "../FociDetectionModel/CellResult";
import _ from "lodash";
import DisplayOptions, {DisplayOptionModKey, DisplayOptionSetting} from "../../../sammie/js/ui/modules/DisplayOptions";
import {cl, copyChange, copyRemove} from "../../../sammie/js/util";
import {Tooltip} from "@mui/material";
import TooltipCellResult from "./TooltipCellResult";
import {printf} from "fast-printf";
import {useLocalStoreRecoilHook} from "../../../sammie/js/ui/uihooks";
import {mean} from "../../util/math";

/**PERSISTENT UI STATE DEFINITIONS*/
const asResult = atomFamily<FociDetectionParamsResult,string>({key:'foci-detection-params_demo',default:null});
const asLastRunSettings = atomFamily< {batchTimeStamp:number, inputs:self.Inputs, params:self.Parameters},string>({key:'foci-detection-params_initial',default:null});
const asSorting = atomFamily<string,string>({key:'foci-detection-params-sorting',default:'none'});
const asColCount = atomFamily<number,string>({key:'foci-detection-params-colcount',default:3});
const asIncludedCells = atomFamily<number[],string>({key:'foci-detection-params_included',default:null});
const asFociInfo = atomFamily<FociInfo[][],string>({key:'foci-detection-params_foci',default:null});

interface IFociDetectionParamsProps{}
const FociDetectionParams:React.FC<IFociDetectionParamsProps> = () => {
    
    /**CLEANUP CALLBACK WHEN INPUTS HAVE CHANGED*/
    const onInputChanged = ()=>{
        setResult(null)
        setIncludedCells(null)
        setFociInfo(null)
    };
    
    /**RUNNING ALGORITHM CALLBACK*/
    const runMainAlgorithm = async (params:self.Parameters,step:self.Step)=>{
        const res = await server.runFociDetectionParams(params,step,curBatch.batchParameters['cellstoprocess']);
        setError(res.error ? res : null)
        setResult(res.error ? null: res.data);
        if(includedCells == null && !res.error){
            const inc = _.range(0,res.data.foci.length);
            setIncludedCells(inc)
            const info:FociInfo[][] = analyzeFoci(res.data,curParams,fociInfo);
            await syncSelection(info,inc)
            setFociInfo(info);
        }
        return res.error ? {error:res.error} : true;
    };
    
    const syncSelection = async (info:FociInfo[][], cells:number[] = null)=>{
        const foci = info.map((fia,i)=>getFociSelection(i,info));
        //Translate info into server format and send it out, do not wait
        return server.runSelection(curParams,curStep,cells ? cells : includedCells,foci)
    }
    const reRunFiltering = async ()=>{
        if(!result) return;
        const info:FociInfo[][] = analyzeFoci(result,curParams,fociInfo);
        setFociInfo(info);
        await syncSelection(info);
    }
    
    /**CORE HOOK FOR SETTING UP STATE*/
    const {curInputs,curStep,curParams,isRunning,curBatch} = useStepHook<self.Inputs, self.Parameters,self.Step,parent.ParametrizedFociDetectionBatchParameters>(asLastRunSettings,
        onInputChanged,
        runMainAlgorithm,
        {msg: 'Running FociDetectionParams', display: "overlay",progress:0},
        true,
        {
            rawbrightnessrange:reRunFiltering,
            normbrightnessrange:reRunFiltering,
            brightnessdrop:reRunFiltering,
        });
    
    /**UI SPECIFIC STATE*/
    const [result,setResult] = useRecoilState(asResult(curStep.moduleID))
    const [error,setError] = useState<EelResponse<any>>(null)
    const modKeys = useToggleKeys(['1','2'])
    
    const onFociToggle = async (i,v) => {
        const ft = [...fociInfo[i]].map((info,idx)=>{
            const isSelected = v.indexOf(idx) != -1;
            if(isSelected != info.in && info.manual === undefined){
                //Has been selected/unselected and deviating from model, not yet touched by user
                return {...info, manual:isSelected}; //manually added/removed by user
            }else if(isSelected == info.in && info.manual !== undefined){
                //Has been set back to original state, remove the manual label again
                var ret = {...info}; //manually added/removed by user
                delete ret.manual;
                return ret;
            }
            return info;
        })
        const nfi = copyChange(fociInfo,i,ft);
        setFociInfo(nfi);
        await syncSelection(nfi);
    }
    const onCellInclusionToggle = async (idx) => {
        if(includedCells.indexOf(idx) == -1)
            var na = [...includedCells, idx];
        else
            na = copyRemove(includedCells,idx);
        
        await syncSelection(fociInfo,na)
        setIncludedCells(na)
    };
    
    const [sorting,setSorting] = useRecoilState(asSorting(curStep.moduleID))
    const [colCount,setColCount] = useLocalStoreRecoilHook(asColCount(curStep.moduleID))
    const [includedCells,setIncludedCells] = useRecoilState(asIncludedCells(curStep.moduleID))
    const [fociInfo,setFociInfo] = useRecoilState(asFociInfo(curStep.moduleID))
    const displayOptions:DisplayOptionSetting<any>[] = [
        {type:'dropdown',label:'Sort by',options:{none:'No Sorting', numfoci:'Selected Foci', avfoci:'Available Foci'}, value:sorting,setter:setSorting},
        {type:'slider',label:'Columns',sliderParams:[3,7,1], value:colCount,setter:setColCount},
    ]
    
    //curInputs.dataset
    //Figure out sorting order
    const order = fociInfo && result && getSortingOrder(sorting,fociInfo);
    
    const fcc = fociInfo && result && includedCells.map(cell => getFociSelection(cell,fociInfo))
    const numCells = fcc?.length;
    const numCellsWithFoci = fcc?.filter(k=>k.length > 0).length
    const meanFociPerCell = fcc && mean(fcc?.map((k)=>k.length))
    
	return (<div className={'foci-detection-params ' + cl(modKeys['1'],'mod-1') + cl(modKeys['2'],'mod-2')}>
	    {error && <ErrorHint error={error}/> }
        {!error && result && fociInfo &&
            <>
                
                <div className="foci-detection-model__box pad-100-excepttop pad-50-top margin-100-bottom">
                    <Tooltip title={`Total number of included cells`} placement={'bottom'}>
                        <div className="box-row">
                            <span>Number of Cells:</span>
                            <span>{numCells}</span>
                        </div>
                    </Tooltip>
                    <Tooltip title={`Number of included cells that have foci absolute and in %`} placement={'bottom'}>
                        <div className="box-row">
                            <span>Cells with Foci:</span>
                            <span>{numCellsWithFoci} ({printf('%.2f %%',100*numCellsWithFoci/numCells)})</span>
                        </div>
                    </Tooltip>
                    <Tooltip title={`Mean number of foci over all included cells.`} placement={'bottom'}>
                        <div className="box-row">
                            <span>Mean Foci per Cell:</span>
                            <span>{printf('%.2f',meanFociPerCell)}</span>
                        </div>
                    </Tooltip>
                </div>
                
                {curBatch.batchParameters['cellstoprocess'] < 100 &&
                    <div className="incomplete-hint col-error pad-100-bottom">Showing only first {curBatch.batchParameters['cellstoprocess']}% of dataset as preview. Change parameter in Data Input if not desired.</div>
                }
                
                <DisplayOptions settings={displayOptions} modKeys={modKeysDesc} activeModKeys={modKeys}/>
                 <div className={`grid cols-${colCount} half-gap`}>
                    {order.map((i,k)=>{
                        const img = curInputs.cellImages[i]
                        return <TooltipCellResult key={i} img={img} foci={result.foci[i]}
                                           idx={i}
                                           focusInfo={fociInfo[i]}
                                           brighntessInfo={result.fociData[i]}
                                           cellOutline={curInputs.cellContours[i]}
                                           onChangeSelection={(v)=>onFociToggle(i,v)}
                                           curSelection={getFociSelection(i,fociInfo)}
                                           modelSelection={getFociSelectionModel(i,fociInfo)}
                                           excluded={includedCells.indexOf(i) == -1}
                                           onToggleCellInclusion={()=>onCellInclusionToggle(i)} />
                    })}
                </div>
                
            </>
        }
	</div>);
}
export default FociDetectionParams

var modKeysDesc: DisplayOptionModKey[] = [
    {name: '1', desc: 'Hold "1" key to temporarily hide all foci.'},
    {name: '2', desc: 'Hold "2" key to temporarily display all selectable foci in cell.'},
]

function getSortingOrder(sorting:string, fociInfo:FociInfo[][]){
    var sortOrder: number[] = _.range(0, fociInfo.length);
    if(sorting == 'numfoci'){
        return sortOrder.sort((a, b) => {
            const nfa = fociInfo[a].filter(fi => (fi.in && fi.manual === undefined)||fi.manual === true).length
            const nfb = fociInfo[b].filter(fi => (fi.in && fi.manual === undefined)||fi.manual === true).length
            return nfa > nfb ? -1 : 1;
        })
    }else if(sorting == 'avfoci'){
        return sortOrder.sort((a, b) => {
            return fociInfo[a].length > fociInfo[b].length ? -1 : 1;
        })
    }
    
    return sortOrder
}

function getFociSelectionModel(cell:number,fociInfo:FociInfo[][]):number[]{
    if(!fociInfo || !fociInfo[cell]) return [];
    return fociInfo[cell].map((fi,k)=>fi.in ? k : -1 ).filter(k=>k!=-1)
}
function getFociSelection(cell:number,fociInfo:FociInfo[][]):number[]{
    if(!fociInfo || !fociInfo[cell]) return [];
    return fociInfo[cell].map((fi,k)=>(fi.manual === true || (fi.in && fi.manual === undefined)) ? k : -1 ).filter(k=>k!=-1)
}
export type FociInfo = {in:boolean,reason?:string,manual?:boolean};
const isIn = (m,p)=>m >= p[0] && m <= p[1];
function analyzeFoci(res:FociDetectionParamsResult,params:self.Parameters, oldAnalysis:FociInfo[][]): FociInfo[][]{
    if(!res) return [];
    
    const checkRawBrightness = _.curryRight(isIn)(params.rawbrightnessrange)
    const checkNormBrightness = _.curryRight(isIn)(params.normbrightnessrange)
    const checkDrop = _.curryRight(isIn)([params.brightnessdrop,255])
    
    return res.fociData.map((fd,cell)=>{
        return fd.map((sfd,foci)=>{
            
            
            var res:{in:boolean, manual?:boolean, reason?:string} = {in:true};
            
            //Other foci are subject to automatic filtering
            if(!checkNormBrightness(sfd.mean[0]))
                res = {in:false,reason:'NB'}
            else if(!checkRawBrightness(sfd.mean[1]))
                res = {in:false,reason:'RB'}
            else if(!checkDrop(sfd.drop))
                res = {in:false,reason:'D'}
            
            //only mind old Oldanalysis if the number of foci remained the same, otherwise discard
            if(oldAnalysis && oldAnalysis[cell].length == fd.length && oldAnalysis[cell][foci].manual !== undefined){
                //Foci that have been manually included or excluded, do not get refiltered
                if(res.in != oldAnalysis[cell][foci].manual)
                    res.manual = oldAnalysis[cell][foci].manual;
            }
            return res;
        })
    })
    
}