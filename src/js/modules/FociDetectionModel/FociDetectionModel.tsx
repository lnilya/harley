import React, {useState} from "react"
import {atomFamily, useRecoilState} from "recoil";
import * as self from "./params";
import {changeCellSelection, changeFociSelection, FociDetectionModelResult, runFociDetectionModel} from "./server";
import './scss/FociDetectionModel.scss'
import {useStepHook, useToggleKeys} from "../../../sammie/js/modules/modulehooks";
import {EelResponse} from "../../../sammie/js/eel/eel";
import ErrorHint from "../../../sammie/js/ui/elements/ErrorHint";
import CellResult from "./CellResult";
import {cl, copyChange, copyRemove} from "../../../sammie/js/util";
import ButtonIcon from "../../../sammie/js/ui/elements/ButtonIcon";
import {printf} from "fast-printf";
import {mean} from "../../util/math";
import {Tooltip} from "@mui/material";
import {showToast} from "../../../sammie/js/state/eventbus";
import DisplayOptions, {DisplayOptionModKey, DisplayOptionSetting} from "../../../sammie/js/ui/modules/DisplayOptions";
import {ColocCellsResult} from "../ColocCells/server";
import _ from "lodash";

/**PERSISTENT UI STATE DEFINITIONS*/
const asResult = atomFamily<FociDetectionModelResult,string>({key:'foci-detection-model_result',default:null});
const asIncludedCells = atomFamily<number[],string>({key:'foci-detection-model_included',default:null});
const asSelectedFoci = atomFamily<number[][],string>({key:'foci-detection-model_foci',default:null});
const asModelFoci = atomFamily<number[][],string>({key:'foci-detection-model_foci_model',default:null});
const asSorting = atomFamily<string,string>({key:'foci-detection-sorting',default:'none'});
const asLastRunSettings = atomFamily< {batchTimeStamp:number, inputs: self.Inputs, params: self.Parameters},string>({key:'foci-detection-model_initial',default:null});

interface IFociDetectionModelProps{}
const FociDetectionModel:React.FC<IFociDetectionModelProps> = () => {
    
    /**CLEANUP CALLBACK WHEN INPUTS HAVE CHANGED*/
    const onInputChanged = ()=>{
        setResult(null)
    };
    
    /**RUNNING ALGORITHM CALLBACK*/
    const runMainAlgorithm = async (params:self.Parameters,step:self.Step)=>{
        const res = await runFociDetectionModel(params,step,curBatch.batchParameters['cellstoprocess']);
        setError(res.error ? res : null)
        setIncludedCells(!res.error ? res.data.cellsInExport : null)
        setSelectedFoci(!res.error ? res.data.selection: null)
        setModelFoci(!res.error ? res.data.modelSelection: null)
        setResult(!res.error ? res.data : null)
        if(!res.error && Object.keys(res.data.merges).length > 0){
            var totalMerges = 0;
            Object.keys(res.data.merges).forEach((fk)=>totalMerges += res.data.merges[fk])
            showToast(`Due to the current foci adjustment size (${printf('%.1f',curParams.sizeadjustment)}) ${totalMerges} foci have been merged in ${Object.keys(res.data.merges).length} cells.`,'warning')
        }
        return res.error ? {error:res.error} : true;
    };
    
    /**CORE HOOK FOR SETTING UP STATE*/
    const {curInputs,curStep,curParams,isRunning,curBatch} = useStepHook<self.Inputs, self.Parameters,self.Step>(asLastRunSettings,
        onInputChanged,
        runMainAlgorithm,
        {msg: 'Running Detection', display: "overlay", progress:0},true);
    
    /**UI SPECIFIC STATE*/
    const [result,setResult] = useRecoilState(asResult(curStep.moduleID))
    const [includedCells,setIncludedCells] = useRecoilState(asIncludedCells(curStep.moduleID))
    const [selectedFoci,setSelectedFoci] = useRecoilState(asSelectedFoci(curStep.moduleID))
    const [modelFoci,setModelFoci] = useRecoilState(asModelFoci(curStep.moduleID))
    const [sorting,setSorting] = useRecoilState(asSorting(curStep.moduleID))
    const [error,setError] = useState<EelResponse<any>>(null)
    const modKeys = useToggleKeys(['1','2'])
    
    const displayOptions:DisplayOptionSetting<string>[] = [
        {type:'dropdown',label:'Sort by',options:{none:'No Sorting', numfoci:'Selected Foci', avfoci:'Available Foci', mods:'Modified first'},
            value:sorting,setter:setSorting}
    ]
    
    const onCellInclusionToggle = (idx:number) => {
        if(includedCells.indexOf(idx) == -1)
            var na = [...includedCells, idx];
        else
            na = copyRemove(includedCells,idx);
        
        setIncludedCells(na)
        
        changeCellSelection(curParams,curStep,na)
    };
    const onFociToggle = (cellIdx:number, selFoci:number[])=>{
        const nv = copyChange(selectedFoci,cellIdx,selFoci)
        setSelectedFoci(nv)
        changeFociSelection(curParams,curStep,nv)
    }
    const fcc = result && includedCells?.map((cidx)=>selectedFoci[cidx]).map((fociInCell)=>fociInCell.length);
    const numCells = includedCells?.length || 0;
    const numCellsWithFoci = fcc?.filter(f=>f>0).length
    const meanFociPerCell = fcc ? mean(fcc) : 0
    
    //Figure out sorting order
    const order = getResultSorting(sorting,result,selectedFoci);
    
	return (<div className={'foci-detection-model margin-100-neg pad-100 ' + cl(modKeys['1'],'mod-1') + cl(modKeys['2'],'mod-2') + cl(curParams.showoutlines, 'show-outlines')}>
	    {error && <ErrorHint error={error}/> }
        {!error && result &&
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
                <DisplayOptions settings={displayOptions} modKeys={modKeysDesc} activeModKeys={Object.keys(modKeys).filter(k=>modKeys[k])}/>
                <div className={`grid cols-${curParams.fociperrow} half-gap`}>
                    {order.map((i,k)=>{
                        const img = result.imgs[i]
                        return <CellResult key={i} img={img} foci={result.foci[i]}
                                           idx={i}
                                           cellOutline={result.contours[i]}
                                           modelSelection={modelFoci[i]}
                                           onChangeSelection={(v)=>onFociToggle(i,v)}
                                           curSelection={selectedFoci[i]}
                                           excluded={includedCells.indexOf(i) == -1}
                                           onToggleCellInclusion={()=>onCellInclusionToggle(i)} />
                    })}
                </div>
            </>
        }
	</div>);
}
export default FociDetectionModel

var modKeysDesc: DisplayOptionModKey[] = [
    {name: '1', desc: 'Hold "1" key to temporarily hide all foci.'},
    {name: '2', desc: 'Hold "2" key to temporarily display all selectable foci in cell.'},
]

function getResultSorting(sorting:string, result: FociDetectionModelResult,selectedFoci:number[][]): number[] {
    var sortOrder: number[] = _.range(0, result?.imgs.length);
    
    if (sorting == 'numfoci')
        return sortOrder.sort((a, b) => selectedFoci[a].length > selectedFoci[b].length ? -1 : 1)
    else if (sorting == 'avfoci')
        return sortOrder.sort((a, b) => result.foci[a].length > result.foci[b].length ? -1 : 1)
    else if (sorting == 'mods')
        
        return sortOrder.sort((a, b) => {
            var da = Math.abs(selectedFoci[a].length - result.modelSelection[a].length);
            var db = Math.abs(selectedFoci[b].length - result.modelSelection[b].length);
            return da > db ? -1 : 1;
        })
    
    return sortOrder
}