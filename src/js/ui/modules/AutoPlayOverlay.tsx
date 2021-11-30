import React, {useEffect, useState} from "react";
import {cl} from "../../util";
import '../../../scss/modules/AutoPlayOverlay.scss'
import {Backdrop} from "@mui/material";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import * as ui from '../../state/uistates'
import {UIScreens} from '../../state/uistates'
import * as alg from '../../state/algstate'
import {BatchInfo, PipelineLogEntry, RunningMode} from '../../state/algstate'
import {useRecoilState, useRecoilValue} from "recoil";
import {LinearProgress, Tooltip} from "@material-ui/core";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AnimateHeight from "react-animate-height";
import {printf} from "fast-printf";
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import {resumeAutoExecution, stopAutoExecution} from "../../pipelineexec";
import SkipNextIcon from '@mui/icons-material/SkipNext';

interface IAutoPlayOverlayProps{
	
	/**Additional classnames for this component*/
	className?:string
}
/**
 * PipelineAutoPlayOverlay
 * @author Ilya Shabanov
 */
const AutoPlayOverlay:React.FC<IAutoPlayOverlayProps> = ({className}) => {
    
    const pipeName = useRecoilValue(ui.selectedPipelineName);
    const batchInfo:BatchInfo = useRecoilValue<BatchInfo>(alg.loadedBatchInfo);
    const execState = useRecoilValue(alg.pipelineExecution);
    const log = useRecoilValue(alg.pipelineLog);
    const steps = useRecoilValue(ui.selectedPipeline).steps.length
    const curStepNum = useRecoilValue(ui.curPipelineStepNum)
    const [aeDialogOpen, setAEDialogOpen] = useRecoilState(ui.autoExecDialogOpen);
    const appScreen = useRecoilValue(ui.appScreen);
    
    const [logOpen,setLogOpen] = useState(false);
    const totalProgress = steps * batchInfo.totalDispBatches;
    const curProgress = curStepNum + (batchInfo.displayedBatch * steps) + 1;
    
    useEffect(()=>{
        if(appScreen == UIScreens.pipelineswitch) setAEDialogOpen(false);
    },[appScreen])
    
    const renderLogEntry = (le:PipelineLogEntry, key: number) => {
        var m:any = le.msg.split('\n');
        m = m.reduce((a,b,u)=> {
            if(!Array.isArray(a)) a = [a];
            return a.concat([<br key={u}/>, b]);
        });
        return (<div className="log-entry" key={key}>
            {le.type == 'success' && <CheckCircleIcon/>}
            {le.type == 'fail' && <ErrorIcon/>}
            {le.type == 'info' && <InfoIcon/>}
            <span>{m}</span>
            <span>
                {le.duration !== null &&
                `in ${printf('%.2fs', le.duration / 1000)}`}
            </span>
        </div>);
    }
    
    const showBackDrop = execState != RunningMode.manual
    const showWindow = aeDialogOpen || showBackDrop
    
    const isRunning = execState != RunningMode.manual;
    
	return (
		<div className={`auto-play-overlay ` + cl(showWindow, 'is-active')}>
            <Backdrop sx={{ color: '#fff', zIndex:15 }} open={showBackDrop} />
            <div className="auto-play-overlay__content bg-bgwhite">
                <div className="fl-row fl-align-center auto-play-overlay__main pad-50">
                    <span>
                        {pipeName} {(batchInfo.batch+1)}/{batchInfo.totalDispBatches}
                    </span>
                    <div className="fl-grow"/>
                    <div onClick={() => stopAutoExecution()} className={`btn btn-pause` + cl(execState == RunningMode.manual,'disabled')}>
                        <PauseIcon/>
                    </div>
                    <Tooltip arrow placement={'top'} title={'Will run pipeline until current batch is processed and stop at Data Output screen.'}>
                        <div onClick={()=>resumeAutoExecution(true)} className={`btn btn-playend` + cl(isRunning,'disabled') + cl(execState == RunningMode.runningUntilNextExport,'active')}>
                            <PlayArrowIcon/>
                        </div>
                    </Tooltip>
                    <Tooltip arrow placement={'top'} title={'Will run pipeline until all batches are processed.'}>
                        <div onClick={()=>resumeAutoExecution(false)} className={`btn btn-play` + cl(isRunning,'disabled') + cl(execState == RunningMode.running,'active')}>
                            <SkipNextIcon/>
                        </div>
                    </Tooltip>
                </div>
                {log?.length > 0 &&
                    <div className={`auto-play-overlay__log bg-bglight pad-50 ` + cl(logOpen, 'is-open')}>
                        <div className="auto-play-overlay__logheader fl-row-between fl-align-center">
                            {logOpen && <span>Pipeline Log:</span>}
                            {!logOpen && renderLogEntry(log[0],0)}
                            <KeyboardArrowDownIcon onClick={e=>setLogOpen(!logOpen)}/>
                        </div>
                        <AnimateHeight height={logOpen?250:0}>
                            <div className="pad-50-top">
                                {log.map((le,idx)=>renderLogEntry(le,idx))}
                            </div>
                        </AnimateHeight>
                    </div>
                }
                <LinearProgress color={'primary'}  variant={'determinate'} value={100 * curProgress/totalProgress}/>
            </div>
		</div>
	);
}

export default AutoPlayOverlay;