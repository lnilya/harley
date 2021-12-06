import React, {ReactNode, useState} from "react";
import {ccl} from "../../util";
import SaveIcon from '@mui/icons-material/Save';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import MainMenuButton from "../elements/MainMenuButton";
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import {useRecoilState, useRecoilValue} from "recoil";
import LinearScaleIcon from '@mui/icons-material/LinearScale';
import * as ui from '../../state/uistates'
import {UIPopups, UIScreens} from '../../state/uistates'
import '../../../../scss/modules/MainMenu.scss'
import AutoAwesomeMotionIcon from '@mui/icons-material/AutoAwesomeMotion';
import {doesPipelineStepHaveData} from "../../state/stateutil";
import NotStartedIcon from '@mui/icons-material/NotStarted';
import * as alg from "../../state/algstate";
import {RunningMode} from "../../state/algstate";
import {Pipeline} from "../../types/pipelinetypes";
import {Done, DoneAll} from "@mui/icons-material";
import MainLogo from "../elements/MainLogo";

interface ISideMenuProps {
    
    /**Additional classnames for this component*/
    className?: string
    
    onChangeOpenState: (open: boolean) => void
}

const aggregatorDescription = (pipeline: Pipeline): ReactNode => {
    
    const txt = 'Outputs from different batches can be aggregated into a single file.  For example a CSV table might grow as single batches of data are processed, which can be more useful than single CSV files per batch.';
    if (!pipeline) return txt;
    const nw = (!pipeline?.aggregatorOutputs?.length ? `The pipeline "${pipeline.descriptions.title}" does not have any aggregate outputs defined.` : null)
    if (nw) return <>
        <strong>{nw}</strong>
        <br/><br/>
        {txt}
    </>
    return txt
}

/**
 * SideMenu
 * @author Ilya Shabanov
 */
const cl = ccl('main-menu--')
const MainMenu: React.FC<ISideMenuProps> = ({onChangeOpenState, className}) => {
    
    const [openPopupt, setOpenPopup] = useRecoilState(ui.popupOpen);
    const [uiState, setUIState] = useRecoilState(ui.appScreen);
    const [showing, setShowing] = useState(false);
    const pipelineName = useRecoilValue(ui.selectedPipelineName);
    const pipeline = useRecoilValue(ui.selectedPipeline);
    const pipelineStep = useRecoilValue(ui.curPipelineStep);
    const [aeDialogOpen, setAEDialogOpen] = useRecoilState(ui.autoExecDialogOpen);
    const execState = useRecoilValue(alg.pipelineExecution);
    
    // useEffect(()=>onChangeOpenState(showing),[showing])
    
    const onLoadSettings = () => {
        setOpenPopup(UIPopups.paramload)
    }
    const onSaveSettings = () => {
        setOpenPopup(UIPopups.paramsave)
    }
    const onSwitchPipeline = () => {
        setUIState(UIScreens.pipelineswitch)
    }
    
    
    const runReady = doesPipelineStepHaveData(0) === true;
    const runHint = !runReady ? 'This pipeline does not know which data to run on. Navigate to DataInput and either run a single batch of input data, or run all batches autoamtically.' :
        `Running the current pipeline ${pipelineName} in step ${pipelineStep?.title}`;
    ;
    
    return (
        <div className={"main-menu" + (showing ? ' is-showing' : '')} onMouseEnter={() => {
            setShowing(true)
        }} onMouseLeave={() => {
            setShowing(false)
        }}>
            <div className={`main-menu__content bg-bgdark`}>
                <MainLogo onClick={e=>setUIState(UIScreens.welcome)}/>
                <div className="margin-50-top"/>
                <MainMenuButton onClick={onSwitchPipeline} title={'Switch Pipeline'}
                                active={uiState == UIScreens.pipelineswitch}
                                tooltip={'A pipeline is simply a set of steps with a single task. Like "Count Foci" or "Detect Cells".'}
                                Icon={<LinearScaleIcon/>}/>
                {pipeline &&
                <>
                    <div className="main-menu__sep margin-50-ver"/>
                    <MainMenuButton onClick={() => setUIState(UIScreens.input)} title={'Input Files'}
                                    active={uiState == UIScreens.input}
                                    tooltip={'Selection of Data as input for the current pipeline: ' + pipelineName}
                                    Icon={<AutoAwesomeMotionIcon/>}/>
                    <MainMenuButton onClick={() => setUIState(UIScreens.pipeline)}
                                    title={pipelineName}
                                    disabled={!runReady}
                                    active={uiState == UIScreens.pipeline}
                                    tooltip={runHint}
                                    Icon={<PlayCircleOutlineIcon/>}/>
                    <MainMenuButton onClick={() => setUIState(UIScreens.output)} title={'Output Files'}
                                    disabled={!runReady}
                                    active={uiState == UIScreens.output}
                                    tooltip={runReady ? ('Outputs for current batch: ' + pipelineName) : 'Ouput for batch is not available, since no batch has been started yet.'}
                                    Icon={<Done/>}/>

                    <MainMenuButton onClick={() => setUIState(UIScreens.aggregate)} title={'Output Aggregates'}
                                    active={uiState == UIScreens.aggregate}
                                    disabled={!pipeline?.aggregatorOutputs?.length}
                                    tooltip={aggregatorDescription(pipeline)}
                                    Icon={<DoneAll/>}/>

                    <div className="main-menu__sep margin-50-ver"/>
                    {uiState == UIScreens.pipeline &&
                    <>
                        <MainMenuButton onClick={onSaveSettings} title={'Save Current Parameters'}
                                        tooltip={'Stores this pipelines parameters as a separate file. You can then load it or use in batch processing.'}
                                        Icon={<SaveIcon/>}/>
                        <MainMenuButton onClick={onLoadSettings} title={'Load Parameters'}
                                        tooltip={'Loads previously stored parameters into this pipeline. The current values will be overwritten.'}
                                        Icon={<UploadFileIcon/>}/>
                    </>
                    }
                    {uiState != UIScreens.pipelineswitch && !pipeline.disableBatchMode &&
                    <>
                        <div className="fl-grow"/>
                        <MainMenuButton onClick={() => setAEDialogOpen(!aeDialogOpen)}
                                        title={aeDialogOpen ? 'Hide Auto Execution' : 'Show Auto Execution'}
                                        disabled={execState != RunningMode.manual || !runReady}
                                        active={false}
                                        tooltipPlacement={'top-end'}
                                        tooltip={'Auto Execution allows you to run the steps of the pipeline automatically with the current parameters. As long as there is more than one input, your algorithm will continue until all input data is processed or a step encounters an error.'}
                                        Icon={<NotStartedIcon color={aeDialogOpen ? 'primary' : 'inherit'}/>}/>
                    </>
                    }

                </>
                }
            </div>
        </div>
    );
}
export default MainMenu;
