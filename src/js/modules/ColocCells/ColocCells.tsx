import React from "react";
import {atomFamily, useRecoilState, useRecoilValue} from "recoil";
import * as alg from "../../../sammie/js/state/algstate";
import * as ui from "../../../sammie/js/state/uistates";
import * as eventbus from "../../../sammie/js/state/eventbus";
import * as self from "./params";
import * as server from "./server";
import './scss/ColocCells.scss'
import {useDisplaySettings, useStepHook, useToggleKeys} from "../../../sammie/js/modules/modulehooks";
import ErrorHint from "../../../sammie/js/ui/elements/ErrorHint";
import {EelResponse} from "../../../sammie/js/eel/eel";
import {PipelineImage} from "../../../sammie/js/types/datatypes";
import {useState} from "react";
import ColocCellResult from "./ColocCellResult";
import ButtonIcon from "../../../sammie/js/ui/elements/ButtonIcon";
import DisplayOptions, {DisplayOptionModKey} from "../../../sammie/js/ui/modules/DisplayOptions";
import {Alert} from "@mui/material";
import {cl, copyRemove, doesPolygonContain} from "../../../sammie/js/util";
import {changeCellSelection} from "../FociDetectionModel/server";
import {SelectedPolygon, SplitablePolygon, SplitPolygon} from "../Labeling/_polygons";
import _ from "lodash";
import {ColocCellsResult} from "./server";
import {ColocalizationBatchParameters} from "../../pipelines/ColocalizationPipeline";

/**PERSISTENT UI STATE DEFINITIONS*/
const asResult = atomFamily<server.ColocCellsResult, string>({key: 'coloc-cells_result', default: null});
const asSelectedCells = atomFamily<number[], string>({key: 'coloc-cells_selection', default: null});
const asLastRunSettings = atomFamily<{ batchTimeStamp:number, inputs: self.Inputs, params: self.Parameters }, string>({
    key: 'coloc-cells_initial',
    default: null
});
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
    const mod = useToggleKeys(['1', '2', '3'])
    
    var selMod = mod['1'] ? 0 : mod['2'] ? 1 : mod['3'] ? 2 : 3
    
    const [displayOptions, cellBorders, scb, grayscale] = useDisplaySettings(curStep, {
        'Show Cell Borders': asShowOutline,
        'Show Grayscale': asUseGrayscale
    })
    
    const onCellInclusionToggle = async (idx: number) => {
        if (selected.indexOf(idx) == -1)
            var na = [...selected, idx];
        else
            na = copyRemove(selected, idx);
        
        setSelection(na)
        await server.runCellSelection(curParams, curStep, na,result)
    };
    
    const sortingSeq = result?.imgs && getResultSorting(curParams, result)
    
    return (<div className={`coloc-cells ${cl(cellBorders, 'show-borders')} ${cl(grayscale, 'use-grayscale')}`}>
        {error && <ErrorHint error={error}/>}
        {!error && result &&
        <>
            <DisplayOptions settings={displayOptions} modKeys={modKeysDesc} activeModKeys={['' + (selMod + 1)]}/>
            <div className={`grid quarter-gap cols-${curParams.cellsperrow[0]}`}>
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
            <Alert severity="info" className={'margin-100-top'}>
                Be aware that cells that have close to no signal will appear in full brightness for that channel, since
                all cells are normalized in intensity.
                This will make it look like colocalization appears but is in actuality nothing.
                The final colocalization detection however is not based on pixels but on the detected foci and the
                overlap of their outlines. This problem will therefore not occur.
            </Alert>
        </>
        }
    </div>);
}
export default ColocCells

function getResultSorting(curParams: self.Parameters, result: ColocCellsResult): number[] {
    var sortOrder: number[] = _.range(0, result?.imgs.length);
    
    if (curParams.sorting == 'pcc')
        return sortOrder.sort((a, b) => result.pccs[a][0] > result.pccs[b][0] ? -1 : 1)
    else if (curParams.sorting == 'fpcc')
        return sortOrder.sort((a, b) => {
            if(result.fpccs[a] === null) return 1
            else if(result.fpccs[b] === null) return -1
            return result.fpccs[a][0] > result.fpccs[b][0] ? -1 : 1
        })
    else if (curParams.sorting == 'cellsize')
        return sortOrder.sort((a, b) => result.cellAreas[a] > result.cellAreas[b] ? -1 : 1)
    else if (curParams.sorting == 'nf')
        return sortOrder.sort((a, b) => {
            const nf1 = (result.foci[0][a].length + result.foci[1][a].length);
            const nf2 = (result.foci[0][b].length + result.foci[1][b].length);
            return nf1 > nf2 ? -1 : 1;
        })
    else if (curParams.sorting == 'nf1')
        return sortOrder.sort((a, b) => result.foci[0][a].length > result.foci[0][b].length ? -1 : 1)
    else if (curParams.sorting == 'nf2')
        return sortOrder.sort((a, b) => result.foci[1][a].length > result.foci[1][b].length ? -1 : 1)
    
    return sortOrder
}

var modKeysDesc: DisplayOptionModKey[] = [
    {name: '1', desc: 'Hold "1" key to display channel 1 only'},
    {name: '2', desc: 'Hold "2" key to display channel 2 only'},
    {name: '3', desc: 'Hold "3" key to display colocalization only'}
]