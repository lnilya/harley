import React, {useEffect, useState} from "react";
import Header from "./ui/modules/Header";
import Sidebar from "./ui/modules/Sidebar";
import {initializePipelineStack} from "./pipeline";
import * as ui from './state/uistates';
import {UIPopups, UIScreens} from './state/uistates';
import * as alg from './state/algstate';
import {useRecoilValue} from "recoil";
import {cl} from "./util";
import Exporter from "./ui/modules/exporter/Exporter";
import DataLoader from "./ui/modules/dataloader/DataLoader";
import MainMenu from "./ui/modules/MainMenu";
import PipelineSwitchScreen from "./ui/modules/PipelineSwitchScreen";
import ParamLoaderDialog from "./ui/modules/ParamLoaderDialog";
import ParamSaverDialog from "./ui/modules/ParamSaverDialog";
import {Alert} from "@mui/material";
import {EventTypes, listenTo, ToastEventPayload} from "./state/eventbus";
import {useSnackbar} from "notistack";
import AutoPlayOverlay from "./ui/modules/AutoPlayOverlay";
import ProgressOverlay from "./ui/modules/ProgressOverlay";
import Aggregator from "./ui/modules/aggregator/Aggregator";
import WelcomeScreen from "./ui/modules/WelcomeScreen";

const App: React.FC = () => {
    const overlay = useRecoilValue(ui.overlay);
    const curStep = useRecoilValue(ui.curPipelineStep)
    const uiStep = useRecoilValue(ui.appScreen)
    const openPopup = useRecoilValue(ui.popupOpen);
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    
    const [sideMenuOpen,setSideMenuOpen] = useState(false);
    
    const inp = useRecoilValue(alg.allPipelineInputs);
    
    useEffect(() => {
        initializePipelineStack();
        listenTo<ToastEventPayload>(EventTypes.ToastEvent, 'apptoast', (data) => {
            enqueueSnackbar(data.msg,{content:<Alert severity={data.severity}>{data.msg}</Alert>})
        })
    }, [])
    
    // if (!curStep) return null
    const showSidebar = uiStep == UIScreens.pipeline && curStep?.parameters?.length > 0;
    
    return(
            <div className={"app " + (cl(sideMenuOpen,'app--side-menu-open'))}>
    
                {curStep && <AutoPlayOverlay/>}
                
                
                {openPopup == UIPopups.paramload && <ParamLoaderDialog/>}
                {openPopup == UIPopups.paramsave && <ParamSaverDialog/>}
                <MainMenu onChangeOpenState={s=>setSideMenuOpen(s)}/>
                <Header/>
                {curStep &&  <ProgressOverlay sidebarActive={uiStep == UIScreens.pipeline}/> }
                {showSidebar && <Sidebar/>}
                <div className={`inner`}>
                    <div className={`main pad-100 rel` + cl(showSidebar, 'has-sidebar')}>
                        {uiStep == UIScreens.pipeline && curStep.renderer}
                        {uiStep == UIScreens.output && <Exporter/>}
                        {uiStep == UIScreens.input && <DataLoader/>}
                        {uiStep == UIScreens.aggregate && <Aggregator/>}
                        {uiStep == UIScreens.pipelineswitch && <PipelineSwitchScreen/>}
                        {uiStep == UIScreens.welcome && <WelcomeScreen/>}
                    </div>
                </div>
            </div>
    );
}
export default App;
