import React, {useState} from "react"
import '../../../../scss/modules/DataLoader/DataBatch.scss'
import {PipelineInput} from "../../../types/pipelinetypes";
import {useRecoilState, useRecoilValue} from "recoil";
import * as ui from "../../../state/uistates";
import {UIScreens} from "../../../state/uistates";
import * as alg from "../../../state/algstate";
import {SingleDataBatch} from "../../../state/algstate";
import {DeleteForever} from "@mui/icons-material";
import {Tooltip} from "@mui/material";
import AnimateHeight from 'react-animate-height';
import BatchSettings from "./BatchSettings";
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import {doesPipelineStepHaveData} from "../../../state/stateutil";
import {loadBatchAndStartPipeline} from "../../../pipelines/pipeline";
import * as eventbus from '../../../state/eventbus';
import {EventTypes} from '../../../state/eventbus';
import {cl} from "../../../util";
import ReplayCircleFilledIcon from '@mui/icons-material/ReplayCircleFilled';
import PipelineParamList from "../../elements/PipelineParamList";
import DataBatchPreviewImage from "./DataBatchPreviewImage";


interface IDataBatchProps {
    className?: string,
    batchIdx: number,
    title: string,
    batch: SingleDataBatch,
    onOpenSelectionDialogue: (forInp: PipelineInput) => void,
    onDeleteBatch: () => void
}

const DataBatch: React.FC<IDataBatchProps> = ({
                                                  onDeleteBatch,
                                                  title,
                                                  className,
                                                  batch,
                                                  onOpenSelectionDialogue,
                                                  batchIdx
                                              }) => {
    const curPipeline = useRecoilValue(ui.selectedPipeline);
    const [uiState, setUIState] = useRecoilState(ui.appScreen);
    const [curPipelineStep, setCurPipelineStep] = useRecoilState(ui.curPipelineStepNum);
    const [overlay, setOverlay] = useRecoilState(ui.overlay);
    const [deleted, setDeleted] = useState(false);
    const loadedBatch = useRecoilValue(alg.curLoadedBatchNumber);
    
    
    const runSingleBatch = async () => {
        
        setOverlay({msg:'Loading Pipeline',display:'overlay'})
        var res = await loadBatchAndStartPipeline(batchIdx);
        setOverlay(null)
        if( res !== true)
            eventbus.fireEvent(EventTypes.ToastEvent,{severity:'error',msg:`Error Starting batch: ${res}`})
        else{
            //Step to first step of pipeline
            if(doesPipelineStepHaveData(0)){
                setCurPipelineStep(0)
                setUIState(UIScreens.pipeline)
            }
        }
    }
    const isReady = curPipeline.inputs.filter((p)=>batch?.inputs[p.key] == null).length == 0;
    return (<AnimateHeight height={deleted ? 0 : 'auto'} onAnimationEnd={()=>(deleted ? onDeleteBatch() : null)}>
            <div className={className + '  data-batch pad-50 site-block medium bg-bglight ' + cl(loadedBatch == batchIdx, 'active-batch')}>
                {loadedBatch == batchIdx &&
                    <div className="data-batch__active-indicator">
                        <div>Batch in Execution</div>
                    </div>
                }
                
                <div className="data-batch__title  margin-50-neg-hor pad-50-hor pad-50-bottom margin-100-bottom text-bold fl-row-start fl-align-center">
                    <span className={'text-title pad-50-left'}>{title}</span>
                    {loadedBatch == batchIdx &&
                        <span className={'text-processing pad-25-left'}>(in step: {curPipeline.steps[curPipelineStep].title})</span>
                    }
                    <div className="fl-grow"/>
                    <span className={'pad-50-right text-reg'}>Pipeline Parameters:</span>
                    <BatchSettings batchIdx={batchIdx}/>
                    <div className="sep margin-100-hor"/>
                    <Tooltip title={'Delete this batch'} arrow>
                        <div className="data-batch__action" onClick={()=>setDeleted(true)}>
                            <DeleteForever/>
                        </div>
                    </Tooltip>
                    <div className="sep margin-100-hor"/>
                    <Tooltip title={isReady ? (loadedBatch == batchIdx ? 'Restart batch and reload parameters' : 'Start batch and reload parameters') : 'Please set data first'} arrow>
                        <div className={`data-batch__action margin-50-right ${!isReady ? 'disabled' : ''}`} onClick={isReady ? runSingleBatch : null}>
                            {loadedBatch == batchIdx && <ReplayCircleFilledIcon/>}
                            {loadedBatch != batchIdx && <PlayCircleIcon/>}
                        </div>
                    </Tooltip>
                </div>
                <div className="fl-row-start pad-50-excepttop">
                    {curPipeline.inputs.map((i, k) =>
                        <DataBatchPreviewImage key={i.title}
                                               img={batch.inputs[i.key]}
                                                      onClick={()=>onOpenSelectionDialogue(i)}
                                                      title={i.title}/>
                    )}
                </div>
                {curPipeline?.inputParameters?.length && <PipelineParamList batchIdx={batchIdx}/>}
            </div>
        </AnimateHeight>
    
    );
}

export default DataBatch;
