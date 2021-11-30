import React, {useEffect, useState} from "react"
import {cl, parseFilePath} from "../../../util";
import * as ui from '../../../state/uistates'
import * as alg from '../../../state/algstate'
import {useRecoilValue} from "recoil";
import {PipelineOutput, PipelineStep} from "../../../types/pipelinetypes";
import {Button, Input} from "@material-ui/core";
import {LocalFilePath} from "../../../types/datatypes";
import {EelResponse} from "../../../eel/eel";
import ErrorHint from "../../elements/ErrorHint";
import TooltipHint from "../../elements/TooltipHint";
import {useEventBusCallback} from "../../uihooks";
import * as eventbus from "../../../state/eventbus";
import {EventTypes} from "../../../state/eventbus";

interface IExportStepProps {
    onExport:(owner:PipelineStep<any,any>,
              exporter:PipelineOutput,
              destination:LocalFilePath,
              overwrite:boolean) => Promise<EelResponse<boolean>>,
    step?: PipelineOutput,
}

const ExportStep: React.FC<IExportStepProps> = ({onExport, step}) => {
    
    const allSteps = useRecoilValue(ui.allPipelineSteps);
    const allData = useRecoilValue(alg.allPipelineData)
    const allInputs = useRecoilValue(alg.allPipelineInputs)
    const [curFolder, setCurFolder] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<EelResponse<boolean>>(null);
    
    //Generate name suggestions on first render
    useEffect(()=>{
        const suggester = step.suggestDestinationOutput;
        //we do not need to generate any suggestion, if no function is present.
        if(suggester == null) return;
        
        //Look if any requiredInput is an Input to the pipeline, rather than a subsequent step.
        //since these contain file references, that can be used to generate a name suggestion
        
        if(!allInputs[suggester.pipelineInputKey]) return;
        setCurFolder(suggester.transform(allInputs[suggester.pipelineInputKey]))
        
    },[])
    
    //check if key is missing
    let missingKey:string = allData[step.requiredInput] == null ? step.requiredInput : null;
    
    //find the step that generate the missing key, for legibility
    const missingStep = allSteps.find((ps)=> {
        return Object.values(ps.outputKeys).indexOf(missingKey) != -1
    })?.title;
    
    const initExport = async ()=>{
        setLoading(true)
        const owner = allSteps.find((ps)=> {
            return Object.values(ps.outputKeys).indexOf(step.requiredInput) != -1
        })
        const exportResult = await onExport(owner,step,curFolder,true);
        setResult(exportResult)
        setLoading(false)
        return exportResult;
    }
    
    
    useEventBusCallback<void,eventbus.RunExportSyncResult>(EventTypes.RunExportSync, 'exporter_'+step.title,async ()=>{
        //Check if we can export
        let error = null;
        if(curFolder.length == 0) error = `No Destination for ${step.title} specified`;
        else if(missingKey !== null) error = `${step.title} cannot be exported because it is missing data:`+missingKey;
        
        //Conditions not met
        if(error)
            return { error:error, out:step, success:false} as eventbus.RunExportSyncResult;
        
        //Ready to run export
        const res:EelResponse<boolean> = await initExport();
        //Something went wrong on server
        if(res.error)
            return { error:res.error, out:step, success:false} as eventbus.RunExportSyncResult;
        
        //Success exporting File
        const file = parseFilePath(curFolder);
        return { destinationFile:file.filename, out:step, success:true} as eventbus.RunExportSyncResult;
    })
    
    return (
        <div className={'export-step' + cl(missingKey !== null, 'has-missing-data')}>
            <h2 className="export-step__title">{step.title}</h2>
            <div className="export-step__desc">{step.description}</div>
            <div className="export-step__settings bg-bglight pad-100 margin-100-top">
                {missingKey !== null &&
                    <div>Missing outputs from: <strong>{'"' + missingStep + '"'}</strong></div>
                }
                {missingKey === null &&
                    <>
                        <div className="fl-row fl-align-center ">
                            <strong className="export-step__label margin-50-right">Output File:</strong>
                            <Input className={'full-w'} placeholder={'Filename...'} value={curFolder} onChange={e=>setCurFolder(e.target.value)} onBlur={e=>setCurFolder(e.target.value)}/>
                        </div>
                    </>
                }
            </div>
            <div className="export-step__btn-container fl-row-end margin-100-top">
                {!loading && result?.error &&
                    <ErrorHint error={result} className={'fl-grow'}/>
                }
                {!loading && result?.data &&
                    <TooltipHint title={<div><strong>{parseFilePath(curFolder).filename}</strong> successfully exported.</div>} desc={'Exported to: ' + curFolder} col={'success'} className={'fl-grow'}/>
                }
                <div className="margin-100-right"/>
                <Button onClick={initExport} color={'primary'}  variant={'contained'} disabled={loading || curFolder.length == 0 || missingKey !== null}>Export</Button>
            </div>
        </div>);
}
export default ExportStep;