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

/**PERSISTENT UI STATE DEFINITIONS*/
const asResult = atomFamily<FociDetectionModelResult,string>({key:'foci-detection-model_result',default:null});
const asIncludedCells = atomFamily<number[],string>({key:'foci-detection-model_included',default:null});
const asSelectedFoci = atomFamily<number[][],string>({key:'foci-detection-model_foci',default:null});
const asModelFoci = atomFamily<number[][],string>({key:'foci-detection-model_foci_model',default:null});
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
    const [error,setError] = useState<EelResponse<any>>(null)
    const modKeys = useToggleKeys(['1','2'])
    
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
    const fcc = includedCells.map((cidx)=>result.selection[cidx]).map((fociInCell)=>fociInCell.length);
    const numCells = includedCells.length;
    const numCellsWithFoci = fcc.filter(f=>f>0).length
    const meanFociPerCell = mean(fcc)
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
                <div className="pad-100-bottom">
                    Hold the <ButtonIcon btnText={'1'}/> key to hide all foci and hold the <ButtonIcon btnText={'2'}/> key to show all other selectable foci in cell.
                </div>
                <div className={`grid cols-${curParams.fociperrow} half-gap`}>
                    {result.imgs.map((img,i)=>{
                        return <CellResult key={i} img={img} foci={result.foci[i]}
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