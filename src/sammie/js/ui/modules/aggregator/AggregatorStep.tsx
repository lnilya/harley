import React, {useState} from "react"
import {cl, parseFilePath} from "../../../util";
import * as ui from '../../../state/uistates'
import * as alg from '../../../state/algstate'
import {atomFamily, useRecoilState, useRecoilValue} from "recoil";
import {PipelineAggregatorOutput, PipelineOutput, PipelineStep} from "../../../types/pipelinetypes";
import {Alert, Button, Input, Tooltip} from "@mui/material";
import {LocalFilePath, PipelineDataAggregatorID} from "../../../types/datatypes";
import * as server from "../../../eel/eel";
import {AggregateDataInfo, EelResponse} from "../../../eel/eel";
import ErrorHint from "../../elements/ErrorHint";
import TooltipHint from "../../elements/TooltipHint";
import {useEventBusCallback, useLocalStoreRecoilHook} from "../../uihooks";
import * as eventbus from "../../../state/eventbus";
import {EventTypes, ToastEventPayload} from "../../../state/eventbus";
import "../../../../scss/modules/aggregator/AggregatorStep.scss";
import {useDebounce} from "react-use";
import ConfirmToolTip from "../../elements/ConfirmToolTip";
import {InputWithShortening, shortenFolders} from "../../elements/InputWithShortening";
import AggregatorFileInfo from "./AggregatorFileInfo";

interface IAggregatorStepProps {
    onExport:(owner:PipelineStep<any,any>,
              exporter:PipelineOutput,
              destination:LocalFilePath,
              overwrite:boolean) => Promise<EelResponse<boolean>>,
    step: PipelineAggregatorOutput,
}

const defaultInfo:EelResponse<AggregateDataInfo> = { data: { exists:false, info:'Loading info...' ,ready:false, batchInfo:[]} }
const asFolder = atomFamily<LocalFilePath,PipelineDataAggregatorID>({key: 'aggregator_input', default: ''});
const asFileInfo = atomFamily<EelResponse<AggregateDataInfo>,PipelineDataAggregatorID>({key:'aggregator_folder_info',default:defaultInfo})
const AggreagatorStep: React.FC<IAggregatorStepProps> = ({onExport, step}) => {
    
    const allSteps = useRecoilValue(ui.allPipelineSteps);
    const allData = useRecoilValue(alg.allPipelineData);
    const [curFolder, setCurFolder] = useLocalStoreRecoilHook(asFolder(step.aggregatorID), 'pipeline');
    const [curFileInfo, setCurFileInfo] = useRecoilState(asFileInfo(step.aggregatorID))
    const curBatchInfo = useRecoilValue(alg.loadedBatchInfo);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<EelResponse<boolean>>(null);
    const curBatch = useRecoilValue(alg.curLoadedBatch);
    const missingKeys:string[] = step.requiredInputs.filter((a)=>{return allData[a] == null})
    //find the steps that generate the missing key, for legibility
    const missingSteps = missingKeys.map((k)=>{
        return allSteps.find((ps)=> {
            return Object.values(ps.outputKeys).indexOf(k) != -1
        })?.title;
    })
    
    //Call server to get info on changes of filder
    useDebounce(() => {
        server.getAggregateDataInfo(step.aggregatorID,curFolder).then((res)=>{
            setCurFileInfo(res)
        })
    },1000, [curFolder] );
    
    const initExport = async (suppressToast:boolean = false)=>{
        setLoading(true)
        const res = await server.exportAggregateData(step.aggregatorID,curBatchInfo.loadedFilePaths,curFolder,curBatch.batchParameters,step.exporterParams)
        if(res.error)
            
            !suppressToast && eventbus.fireEvent<ToastEventPayload>(EventTypes.ToastEvent, {
                msg: `Could not aggregate data for ${step.title}: ${res.error}`,
                severity: "error"
            })
        else{
            !suppressToast && eventbus.fireEvent<ToastEventPayload>(EventTypes.ToastEvent, {
                msg: res.data.msg,
                severity: "success"
            })
            setCurFileInfo({data:res.data.info})
        }
        setLoading(false)
        return res
    }
    const onDeleteAggregateFile = async (batchKey:string[] = null)=>{
        setLoading(true)
        const deleteSuccess:EelResponse<boolean> =  await server.resetAggregateData(step.aggregatorID,curFolder,batchKey)
        if(!deleteSuccess.error && deleteSuccess.data) {
            if(batchKey)
                eventbus.fireEvent<ToastEventPayload>(EventTypes.ToastEvent, {
                    msg: `Deleted batch in ${step.title} file.`,
                    severity: "success"
                })
            else
                eventbus.fireEvent<ToastEventPayload>(EventTypes.ToastEvent, {
                    msg: `Aggregate file for ${step.title} reset.`,
                    severity: "success"
                })
        }
        else {
            eventbus.fireEvent<ToastEventPayload>(EventTypes.ToastEvent, {
                msg: `Could not modify/delete aggregate file for ${step.title}: ${deleteSuccess.error}`,
                severity: "error"
            })
        }
        
        const res = await server.getAggregateDataInfo(step.aggregatorID,curFolder)
        setCurFileInfo(res)
        setLoading(false)
    }
    
    useEventBusCallback<void,eventbus.RunAggregateSyncResult>(EventTypes.RunAggregateSync, 'aggregator_'+step.title,async ()=>{
        const res = await initExport(true)
        return { out:step, success: !res.error, destinationFile:curFolder, error: res.error };
    })
    
    
    var btnTooltip = null;
    if(curBatchInfo.batch == -1) btnTooltip = 'Not processing any data batch. Start the pipeline or load batch in Data Input first.';
    else if(missingKeys.length > 0) btnTooltip = 'Missing outputs from: ' + missingSteps.join(', ');
    else if(!curFileInfo?.data?.ready) btnTooltip = 'Output path not set correctly';
    
    const mainBtn = <Button onClick={e=>initExport()} color={'primary'}  variant={'contained'}
                                disabled={loading || !curFileInfo?.data?.ready || missingKeys.length > 0}>Append results of batch {curBatchInfo.displayedBatch+1}/{curBatchInfo.totalDispBatches}</Button>
    
    return (
        <div className={'aggregator-step' + cl(missingKeys.length > 0, 'has-missing-data')}>
            <h2 className="aggregator-step__title">{step.title}</h2>
            <div className="aggregator-step__desc">{step.description}</div>
            <div className="aggregator-step__settings bg-bglight pad-100 margin-100-top">
                {missingKeys.length > 0 &&
                    <div className={'pad-50-bottom'}></div>
                }
                <div className="fl-row fl-align-start ">
                    <strong className="aggregator-step__label margin-50-right pad-25-top">Output File:</strong>
                    <div className={'full-w'} >
                        <InputWithShortening shortenFun={shortenFolders} className={'full-w'} placeholder={'Filename...'} value={curFolder} onChange={e=>setCurFolder(e.target.value)} onBlur={e=>setCurFolder(e.target.value)}/>
                        {curFileInfo?.data &&
                            <AggregatorFileInfo id={step.aggregatorID} info={curFileInfo.data} deleteBatch={onDeleteAggregateFile}/>
                        }
                    </div>
                </div>
            </div>
            <Alert severity="warning" className={'margin-50-top'}>
                Warning since the last time this file was used to store an aggregator input, the inputs have changed.
                Keep in mind that batches inside the aggregator file are distinguished by batch number. So the first batch defined in input, will be
                stored as batch 1 in the aggregator regardless of input files or anything else.
                <br/>
                <br/>
                If you get this warning because after simply adding new batches to the input, everything is fine.
                <br/>
                More often though this happens because you changed your inputs entirely and you are at risk of overwriting
                the data in this file, since it relates to older inputs.
            </Alert>
            <div className="aggregator-step__btn-container fl-row-between margin-100-top">
                <ConfirmToolTip disabled={!curFileInfo?.data?.exists} onConfirm={onDeleteAggregateFile} question={`This will delete the file, are you sure?`} options={['Delete','Cancel']} tooltipParams={{placement:'top', arrow:true}}>
                    <Button variant={"outlined"} disabled={!curFileInfo?.data?.exists} color={'secondary'}>Reset File</Button>
                </ConfirmToolTip>
                {!loading && result?.error &&
                    <ErrorHint error={result} className={'fl-grow'}/>
                }
                {!loading && result?.data &&
                    <TooltipHint title={<div><strong>{parseFilePath(curFolder).filename}</strong> successfully exported.</div>} desc={'Exported to: ' + curFolder} col={'success'} className={'fl-grow'}/>
                }
                
                <div className="margin-100-right"/>
    
                {btnTooltip &&
                    <Tooltip title={btnTooltip} placement={'top'} arrow>
                        <div>
                            {mainBtn}
                        </div>
                    </Tooltip>
                }
                {!btnTooltip && mainBtn}
            </div>
        </div>);
}
export default AggreagatorStep;