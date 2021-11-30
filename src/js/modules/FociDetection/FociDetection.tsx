import React, {useEffect, useState} from "react"
import {atomFamily, useRecoilState, useRecoilValue} from "recoil";
import * as alg from "../../state/algstate";
import * as ui from "../../state/uistates";
import * as eventbus from "../../state/eventbus";
import * as server from "./server";
import * as self from "./params";
import './scss/FociDetection.scss'
import {useStepHook, useToggleKeys} from "../_hooks";
import {PipelineImage, PipelinePolygons} from "../../types/datatypes";
import {EelResponse, runStepAsync} from "../../eel/eel";
import ErrorHint from "../../ui/elements/ErrorHint";
import SingleCell from "./SingleCell";
import {cl, copyChange, copyRemove} from "../../util";
import SingleCellWithBasins from "./SingleCellWithBasins";
import {FociInCell} from "./server";
import ButtonIcon from "../../ui/elements/ButtonIcon";

/**PERSISTENT UI STATE DEFINITIONS*/
const asResult = atomFamily<server.FociDetectionResult, string>({key: 'foci-detection_result', default: null});
const asIndThreshhold = atomFamily<number[], string>({key: 'foci-detection_idts', default: null});
const asIndExceptions = atomFamily<number[][], string>({key: 'foci-detection_idts_exc', default: null});
const asLastRunSettings = atomFamily<{ inputs: self.Inputs, params: self.Parameters }, string>({
    key: 'foci-detection_initial',
    default: null
});

interface IFociDetectionProps {
}

const FociDetection: React.FC<IFociDetectionProps> = () => {
    
    /**CLEANUP CALLBACK WHEN INPUTS HAVE CHANGED*/
    const onInputChanged = () => {
        setResult(null)
        setIndividualTS(null)
        setIndividualExcp(null)
        setError(null)
    };
    
    /**RUNNING ALGORITHM CALLBACK*/
    const runMainAlgorithm = async (params: self.Parameters, step: self.Step) => {
        const res = await server.runFociDetection(params, step);
        setError(res.error ? res : null)
        setResult(res.error ? null : res.data)
        //initiate individual threshholds to global
        const g: number[] = (!res.data || res.error) ? [] : Array(res.data.length).fill(curParams.fociThreshold[0])
        const e: number[][] = (!res.data || res.error) ? [] : Array(res.data.length).fill([])
        setIndividualTS(g)
        setIndividualExcp(e)
        
        return res.error ? {error:res.error} : true;
    };
    
    /**CORE HOOK FOR SETTING UP STATE*/
    const {
        curInputs,
        curStep,
        curParams,
        isRunning
    } = useStepHook<self.Inputs, self.Parameters, self.Step>(asLastRunSettings,
        onInputChanged,
        runMainAlgorithm,
        {msg: 'Detecting Foci...', display: "overlay"}, true,
        {
            'fociThreshold': (newValue, oldValue) => {
                if (!result) return
                if(individualTS) setIndividualTS(individualTS.map((t)=>t < 0 ? -newValue : newValue))
                else setIndividualTS(Array(result.length).fill(newValue))
                setIndividualExcp(Array(result.length).fill([]))
            }
        }
    );
    
    /**UI SPECIFIC STATE*/
    const [result, setResult] = useRecoilState(asResult(curStep.moduleID))
    const [individualTS, setIndividualTS] = useRecoilState(asIndThreshhold(curStep.moduleID))
    const [individualExcp, setIndividualExcp] = useRecoilState(asIndExceptions(curStep.moduleID))
    const [error, setError] = useState<EelResponse<any>>(null)
    
    const hideFoci = useToggleKeys('1')
    
    const setTSForFoci = (idx: number, newThreshhold: number) => {
        const nv = copyChange(individualTS, idx, newThreshhold);
        setIndividualTS(nv)
        const ne = copyChange(individualExcp, idx, [])
        setIndividualExcp(ne)
        server.selectCellFittingResults(curStep, nv, ne)
    }
    
    const onChangeFociManualInclusion = async (cellnum: number, exclusions: number[]) => {
        const ne = copyChange(individualExcp, cellnum, exclusions)
        setIndividualExcp(ne)
        server.selectCellFittingResults(curStep, individualTS, ne)
    }
    const onChangeBasinManualInclusion = async (cellnum: number, accepted: boolean[], deleted:boolean) => {
        server.adjustAccepted(curStep, curParams, cellnum,accepted,deleted)
    }
    return (<div className={'foci-detection ' + cl(isRunning, 'is-running') + cl(hideFoci,'hide-foci')} >
        {error && <ErrorHint error={error}/>}
        {!error &&
        <>
            <h2>Detected Foci</h2>
            <div className="hint pad-200-bottom">
                You can adjust the number of foci by using the + and - buttons (only in LoG Mode) or clicking on the single foci.
                Currently the foci are detected using the global parameters to the left.
                <br/>
                <br/>
                Hold <ButtonIcon btnText={'1'}/> to toggle foci visibility
                <br/>
                <br/>
                Warning: <strong>Changing the global parameters after manual adjustment will overwrite manual cell
                parameters. So be careful not to lose any settings.</strong>
            </div>
            {curParams.detMethod == 'brightness' &&
                <div className="bg-bgmain pad-50 legend margin-100-bottom fl-row-start fl-align-center">
                    <span className={'acc'}/><strong>Accepted Foci</strong>
                    <span className={'man'}/><strong>Manully Rejected Foci</strong>
                    <span className={'dim'}/><strong>Not enough Brightness</strong>
                    <span className={'bgr'}/><strong>Not enough Background Ratio</strong>
                </div>
            }
            <div className={'grid cols-6 half-gap '}>
                
                {curParams.detMethod == 'curvature' && result?.map((r, i) =>
                    <SingleCell size={curParams.fociRadius} exclusions={individualExcp ? individualExcp[i] : []}
                                onExcludeFoci={(f) => onChangeFociManualInclusion(i, f)}
                                showTS={!individualTS || (curParams.fociThreshold[0] != individualTS[i])}
                                className={'i' + i} changeTS={ts => setTSForFoci(i, ts)} res={r}
                                threshhold={individualTS[i]} key={i}/>
                )}
                
                {curParams.detMethod == 'brightness' && result?.map((r, i) =>
                    <SingleCellWithBasins
                        uniqueID={i+''}
                        onChangeFociInclusion= {(accepted:boolean[],del)=>onChangeBasinManualInclusion(i,accepted,del)}
                        className={'i' + i}
                                          globalDropofLimit={curParams.brightnessThreshold[0]}
                                          globalBrightnessLimit={curParams.minFociBrightness[0]}
                        minInclusionBrightness={ curParams.minInclusionBrightness[0]}
                                          res={r} key={i}/>
                )}
            </div>
        </>
        }
    </div>);
}

export default FociDetection