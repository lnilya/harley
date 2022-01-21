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

/**PERSISTENT UI STATE DEFINITIONS*/
const asResult = atomFamily<FociDetectionParamsResult,string>({key:'foci-detection-params_demo',default:null});
const asLastRunSettings = atomFamily< {batchTimeStamp:number, inputs:self.Inputs, params:self.Parameters},string>({key:'foci-detection-params_initial',default:null});
const asSorting = atomFamily<string,string>({key:'foci-detection-params-sorting',default:'none'});
const asColCount = atomFamily<number,string>({key:'foci-detection-params-colcount',default:3});
const asShowTooltips = atomFamily<boolean,string>({key:'foci-detection-params-show-tooltip',default:true});
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
            setIncludedCells(_.range(0,res.data.foci.length))
            setFociInfo(analyzeFoci(res.data,curParams,fociInfo));
        }
        return res.error ? {error:res.error} : true;
    };
    
    const runFiltering = ()=>{
        setFociInfo(analyzeFoci(result,curParams,fociInfo));
    }
    
    /**CORE HOOK FOR SETTING UP STATE*/
    const {curInputs,curStep,curParams,isRunning,curBatch} = useStepHook<self.Inputs, self.Parameters,self.Step,parent.ParametrizedFociDetectionBatchParameters>(asLastRunSettings,
        onInputChanged,
        runMainAlgorithm,
        {msg: 'Running FociDetectionParams', display: "overlay",progress:0},
        true,
        {
            rawbrightnessrange:runFiltering,
            normbrightnessrange:runFiltering,
            brightnessdrop:runFiltering,
        });
    
    /**UI SPECIFIC STATE*/
    const [result,setResult] = useRecoilState(asResult(curStep.moduleID))
    const [error,setError] = useState<EelResponse<any>>(null)
    const modKeys = useToggleKeys(['1','2'])
    
    const onFociToggle = (i,v) => {
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
    }
    const onCellInclusionToggle = (idx) => {
        if(includedCells.indexOf(idx) == -1)
            var na = [...includedCells, idx];
        else
            na = copyRemove(includedCells,idx);
        
        setIncludedCells(na)
    };
    
    const [sorting,setSorting] = useRecoilState(asSorting(curStep.moduleID))
    const [colCount,setColCount] = useLocalStoreRecoilHook(asColCount(curStep.moduleID))
    const [includedCells,setIncludedCells] = useRecoilState(asIncludedCells(curStep.moduleID))
    const [showTT,setshowTT] = useLocalStoreRecoilHook(asShowTooltips(curStep.moduleID))
    const [fociInfo,setFociInfo] = useRecoilState(asFociInfo(curStep.moduleID))
    const displayOptions:DisplayOptionSetting<any>[] = [
        {type:'dropdown',label:'Sort by',options:{none:'No Sorting', numfoci:'Selected Foci', avfoci:'Available Foci'}, value:sorting,setter:setSorting},
        {type:'slider',label:'Columns',sliderParams:[3,7,1], value:colCount,setter:setColCount},
        {type:'binary',label:'Foci Tooltips', value:showTT,setter:setshowTT}
    ]
    
    //curInputs.dataset
    //Figure out sorting order
    const order = result && _.range(0,result?.foci?.length)
    
	return (<div className={'foci-detection-params ' + cl(modKeys['1'],'mod-1') + cl(modKeys['2'],'mod-2')}>
	    {error && <ErrorHint error={error}/> }
        {!error && result &&
            <>
                {curBatch.batchParameters['cellstoprocess'] < 100 &&
                    <div className="incomplete-hint col-error pad-100-bottom">Showing only first {curBatch.batchParameters['cellstoprocess']}% of dataset as preview. Change parameter in Data Input if not desired.</div>
                }
                
                <DisplayOptions settings={displayOptions} modKeys={modKeysDesc} activeModKeys={modKeys}/>
                 <div className={`grid cols-${colCount} half-gap`}>
                    {order.map((i,k)=>{
                        const img = curInputs.cellImages[i]
                        return <TooltipCellResult key={i} img={img} foci={result.foci[i]}
                                           idx={i}
                                           showTooltips={showTT}
                                           focusInfo={fociInfo[i]}
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

function getFociSelectionModel(cell:number,fociInfo:FociInfo[][]):number[]{
    if(!fociInfo || !fociInfo[cell]) return [];
    return fociInfo[cell].map((fi,k)=>(fi.in && fi.manual !== false) ? k : -1 ).filter(k=>k!=-1)
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
    const checkDrop = _.curryRight(isIn)([params.rawbrightnessrange,255])
    
    return res.fociData.map((fd,cell)=>{
        return fd.map((sfd,foci)=>{
            
            //Foci that have been manually included or excluded, do not get refiltered
            //only mind old Oldanalysis if the number of foci remained the same, otherwise discard
            if(oldAnalysis && oldAnalysis[cell].length == fd.length && oldAnalysis[cell][foci].manual === true)
                return oldAnalysis[cell][foci];
            
            //Other foci are subject to automatic filtering
            if(!checkNormBrightness(sfd.mean[0]))
                return {in:false,reason:printf('Normalized Brightness (%.2f) not in range',sfd.mean[0])}
            else if(!checkRawBrightness(sfd.mean[1]))
                return {in:false,reason:printf('Raw Brightness (%.2f) not in range',sfd.mean[1])}
            else if(checkDrop(sfd.drop))
                return {in:false,reason:printf('Brightness drop (%.2f) not in range',sfd.drop)}
            
            return {in:true};
        })
    })
    
}