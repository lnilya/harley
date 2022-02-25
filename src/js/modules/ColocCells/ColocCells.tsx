import React, {useState} from "react";
import {atomFamily, useRecoilState} from "recoil";
import * as self from "./params";
import * as server from "./server";
import {ColocCellsResult} from "./server";
import './scss/ColocCells.scss'
import {useDisplaySettings, useStepHook, useToggleKeys} from "../../../sammie/js/modules/modulehooks";
import ErrorHint from "../../../sammie/js/ui/elements/ErrorHint";
import {EelResponse} from "../../../sammie/js/eel/eel";
import ColocCellResult from "./ColocCellResult";
import DisplayOptions, {DisplayOptionModKey, DisplayOptionSetting} from "../../../sammie/js/ui/modules/DisplayOptions";
import {Alert, Tooltip} from "@mui/material";
import {cl, copyRemove} from "../../../sammie/js/util";
import _ from "lodash";
import {ColocalizationBatchParameters} from "../../pipelines/ColocalizationPipeline";
import {printf} from "fast-printf";
import {mean} from "../../util/math";
import {useLocalStoreRecoilHook} from "../../../sammie/js/ui/uihooks";

/**PERSISTENT UI STATE DEFINITIONS*/
const asResult = atomFamily<server.ColocCellsResult, string>({key: 'coloc-cells_result', default: null});
const asSelectedCells = atomFamily<number[], string>({key: 'coloc-cells_selection', default: null});
const asLastRunSettings = atomFamily<{ batchTimeStamp:number, inputs: self.Inputs, params: self.Parameters }, string>({
    key: 'coloc-cells_initial',
    default: null
});
const asSorting = atomFamily<string,string>({key:'coloc-cells-sorting',default:'none'});
const asColCount = atomFamily<number,string>({key:'coloc-cells-colcount',default:3});
const asShowOutline = atomFamily<boolean, string>({key: 'coloc-cells_show_outline', default: true});
const asUseGrayscale = atomFamily<boolean, string>({key: 'coloc-cells_grayscale', default: false});

interface IColocCellsProps {
}

const ColocCells: React.FC<IColocCellsProps> = () => {
    
    /**CLEANUP CALLBACK WHEN INPUTS HAVE CHANGED*/
    const onInputChanged = () => {
        setResult(null)
        setSelection(null)
    };
    
    /**RUNNING ALGORITHM CALLBACK*/
    const runMainAlgorithm = async (params: self.Parameters, step: self.Step) => {
        const res = await server.runColocCells(params, step, curBatch.batchParameters["1px"]);
        setError(res.error ? res : null)
        setResult(!res.error ? res.data : null)
        setSelection(!res.error ? res.data.selected : null)
        return res.error ? {error: res.error} : true;
    };
    
    /**CORE HOOK FOR SETTING UP STATE*/
    const {
        curInputs,
        curStep,
        curParams,
        isRunning,
        curBatch
    } = useStepHook<self.Inputs, self.Parameters, self.Step, ColocalizationBatchParameters>(asLastRunSettings,
        onInputChanged,
        runMainAlgorithm,
        {msg: 'Running ColocCells', display: "overlay"});
    
    /**UI SPECIFIC STATE*/
    const [result, setResult] = useRecoilState(asResult(curStep.moduleID))
    const [selected, setSelection] = useRecoilState(asSelectedCells(curStep.moduleID))
    const [error, setError] = useState<EelResponse<any>>(null)
    const [colCount,setColCount] = useLocalStoreRecoilHook(asColCount(curStep.moduleID))
    const [sorting,setSorting] = useLocalStoreRecoilHook(asSorting(curStep.moduleID))
    const [grayscale,setGrayscale] = useLocalStoreRecoilHook(asUseGrayscale(curStep.moduleID))
    const [cellBorders,setCellBorders] = useLocalStoreRecoilHook(asShowOutline(curStep.moduleID))
    
    const mod = useToggleKeys(['1', '2', '3'])
    
    var selMod = mod['1'] ? 0 : mod['2'] ? 1 : mod['3'] ? 2 : 3
    
    const displayOptions:DisplayOptionSetting<any>[] = [
        {type:'dropdown',label:'Sort by',options:{none:'No Particular Sorting', pcc:'Pearson Correlation (cell)',fpcc:'Pearson Correlation (foci)',nf:'Total Number of Foci', nf1:'Number of Foci Channel 1', nf2:'Number of Foci Channel 2', cellsize:'Cell Area'},
            value:sorting,setter:setSorting},
        {type:'slider',label:'Columns',sliderParams:[3,7,1], value:colCount,setter:setColCount},
        {type:'binary',label:'Cell Borders', value:cellBorders,setter:setCellBorders},
        {type:'binary',label:'Grayscale', value:grayscale,setter:setGrayscale},
    ]
    
    const onCellInclusionToggle = async (idx: number) => {
        if (selected.indexOf(idx) == -1)
            var na = [...selected, idx];
        else
            na = copyRemove(selected, idx);
        
        setSelection(na)
        await server.runCellSelection(curParams, curStep, na,result)
    };
    
    const sortingSeq = result?.imgs && getResultSorting(sorting, result)
    
    const pccs = getPCCs(selected,result);
    const fociStats = getFociStats(selected,result);
    
    return (<div className={`coloc-cells ${cl(cellBorders, 'show-borders')} ${cl(grayscale, 'use-grayscale')}`}>
        {error && <ErrorHint error={error}/>}
        {!error && result &&
        <>
            <div className="coloc-cells__box pad-100-excepttop pad-50-top margin-100-bottom">
                    <Tooltip title={`Total number of included cells`} placement={'bottom'}>
                        <div className="box-row">
                                <span>Number of Cells:</span>
                            <span>{selected.length}</span>
                        </div>
                    </Tooltip>
                    <Tooltip title={`Number of included cells that have foci in both channels absolute and in %`} placement={'bottom'}>
                        <div className="box-row">
                            <span>Cells with foci in both channels:</span>
                            <span>{fociStats.both} ({printf('%.2f %%',100*fociStats.both/selected.length)})</span>
                        </div>
                    </Tooltip>
                    <Tooltip title={`Number of included cells that have no foci at all absolute and in %`} placement={'bottom'}>
                        <div className="box-row">
                            <span>Cells without foci:</span>
                            <span>{fociStats.noFoci} ({printf('%.2f %%',100*fociStats.noFoci/selected.length)})</span>
                        </div>
                    </Tooltip>
                    <Tooltip title={`Average pearson correlation across all selected cells calculated over pixels in entire cell area or just foci area.`} placement={'bottom'}>
                        <div className="box-row">
                            <span>Average Pearson Correlation (Cells/Foci):</span>
                            <span>{printf('%.4f / %.4f',pccs[0],pccs[1])}</span>
                        </div>
                    </Tooltip>
            </div>
            
            <DisplayOptions settings={displayOptions} modKeys={modKeysDesc} activeModKeys={['' + (selMod + 1)]}/>
            <div className={`grid quarter-gap cols-${colCount}`}>
                {sortingSeq.map((i) => {
                    const r = result.imgs[i]
                    return (
                        <ColocCellResult foci0={result.foci[0][i]}
                                         cellNum={i}
                                         pcc={result?.pccs[i]}
                                         fpcc={result?.fpccs[i]}
                                         colorSet={curParams.color}
                                         foci1={result.foci[1][i]}
                                         onToggleCellInclusion={() => onCellInclusionToggle(i)}
                                         excluded={selected.indexOf(i) == -1}
                                         cnt={result.cnts[i]} imgIdx={selMod} key={i} res={r}/>
                    )
                })
                }
            </div>
            {curParams.norm &&
                <Alert key={'notnn'} severity="info" className={'margin-100-top'}>
                    Be aware that cells that have close to no signal will appear in full brightness for that channel, since
                    all cells are normalized in intensity. This does not effect pearson correlation, but might be visually suprising.
                    Uncheck the normalization checkbox on the left hand side, to disable normalization and look at images as they are.
                </Alert>
            }
            
            {!curParams.norm &&
                <Alert key={'nn'} severity="info" className={'margin-100-top'}>
                    Some cells might appear very dim, to the point, where you cannot discern foci. While the signal is dim it is still there.
                    Check the normalization checkbox on the left hand side, to enable brightness normalization and see the foci more clearly.
                </Alert>
            }
        </>
        }
    </div>);
}
export default ColocCells

function getFociStats(selected:number[], result: ColocCellsResult): {both:number, noFoci:number,c0:number, c1:number} {
    var ret = {both:0, noFoci:0, c0:0, c1:0 };
    if(!selected || !result) return ret;
    
    selected.forEach((s)=>{
        if(result.foci[0][s].length > 0 && result.foci[1][s].length > 0) ret.both++;
        else if(result.foci[0][s].length == 0 && result.foci[1][s].length == 0) ret.noFoci++;
        else if(result.foci[0][s].length > 0) ret.c0++;
        else if(result.foci[1][s].length > 0) ret.c1++;
    })
    
    return ret;
}
function getPCCs(selected:number[], result: ColocCellsResult): [number,number] {
    if(!selected || !result) return [0,0];
    return [
        mean(selected.map((idx)=>(result.pccs[idx] ? result.pccs[idx][0] : NaN)).filter(s=>!isNaN(s))),
        mean(selected.map((idx)=>(result.fpccs[idx] ? result.fpccs[idx][0] : NaN)).filter(s=>!isNaN(s))),
    ]
}

function getResultSorting(sorting:string, result: ColocCellsResult): number[] {
    var sortOrder: number[] = _.range(0, result?.imgs.length);
    
    if (sorting == 'pcc')
        return sortOrder.sort((a, b) => {
            if(result.pccs[b] === null || result.pccs[a] === null) return -1
            return result.pccs[a][0] > result.pccs[b][0] ? -1 : 1
        })
    else if (sorting == 'fpcc')
        return sortOrder.sort((a, b) => {
            if(result.fpccs[a] === null) return 1
            else if(result.fpccs[b] === null) return -1
            return result.fpccs[a][0] > result.fpccs[b][0] ? -1 : 1
        })
    else if (sorting == 'cellsize')
        return sortOrder.sort((a, b) => result.cellAreas[a] > result.cellAreas[b] ? -1 : 1)
    else if (sorting == 'nf')
        return sortOrder.sort((a, b) => {
            const nf1 = (result.foci[0][a].length + result.foci[1][a].length);
            const nf2 = (result.foci[0][b].length + result.foci[1][b].length);
            return nf1 > nf2 ? -1 : 1;
        })
    else if (sorting == 'nf1')
        return sortOrder.sort((a, b) => result.foci[0][a].length > result.foci[0][b].length ? -1 : 1)
    else if (sorting == 'nf2')
        return sortOrder.sort((a, b) => result.foci[1][a].length > result.foci[1][b].length ? -1 : 1)
    
    return sortOrder
}

var modKeysDesc: DisplayOptionModKey[] = [
    {name: '1', desc: 'Hold "1" key to display channel 1 only'},
    {name: '2', desc: 'Hold "2" key to display channel 2 only'},
    {name: '3', desc: 'Hold "3" key to display colocalization only'}
]