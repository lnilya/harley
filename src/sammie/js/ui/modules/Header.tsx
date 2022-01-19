import React from "react"
import {useRecoilState, useRecoilValue} from "recoil";
import * as ui from '../../state/uistates'
import {UIScreens} from '../../state/uistates'
import * as alg from '../../state/algstate'
import StepDisplay from "../elements/StepDisplay";
import {SingleDataBatch} from "../../state/algstate";
import {Tooltip} from "@mui/material";

interface IStepChoiceProps{
    className?:string
}



const Header:React.FC<IStepChoiceProps> = ({className}) => {
 
	const allSteps = useRecoilValue(ui.allPipelineSteps);
    const cpn = useRecoilValue(ui.selectedPipelineName)
	const [uiStep,setUIStep] = useRecoilState(ui.appScreen)
    const curBatchInfo = useRecoilValue(alg.loadedBatchInfo);
    const pipe = useRecoilValue(ui.selectedPipeline)
    const curLoadedBatch = useRecoilValue<SingleDataBatch>(alg.curLoadedBatch);
    
    var inputName = '';
    var tooltip = null;
    if(curLoadedBatch?.inputs && uiStep == UIScreens.pipeline) {
        inputName = curLoadedBatch?.inputs[pipe.inputs[0].key]?.file?.name
        tooltip = <div>
            {pipe.inputs.map((pi)=>
                <div className="" key={pi.key}>
                    {pi.title}: <strong>{curLoadedBatch.inputs[pi.key].file.name}</strong>
                </div>
            )}
        </div>
    }
    
	return (<div className={'header ' + className}>
        {uiStep == UIScreens.pipeline &&
        <>
            <Tooltip title={tooltip} arrow placement={'bottom'}>
                <span className={'header__batch-num text-tooltip'}>Data: Batch {(curBatchInfo.displayedBatch+1)}/{curBatchInfo.totalDispBatches} ({inputName})</span>
            </Tooltip>
            <StepDisplay/>
        </> }
        {uiStep == UIScreens.pipelineswitch && <div className="text-center header__title">Choose Pipeline</div> }
        {uiStep == UIScreens.input && <div className="text-center header__title">Data Input for: <strong>{cpn}</strong></div> }
        {uiStep == UIScreens.output &&
        <>
            <span className={'header__batch-num'}>Data: Batch {(curBatchInfo.displayedBatch+1)}/{curBatchInfo.totalDispBatches}</span>
            <div className="text-center header__title">Output for: <strong>{cpn}</strong></div>
        </>
        }
        {uiStep == UIScreens.aggregate &&
        <>
            {curBatchInfo.batch != -1 &&
                <span className={'header__batch-num'}>Data: Batch {(curBatchInfo.displayedBatch+1)}/{curBatchInfo.totalDispBatches}</span>
            }
            <div className="text-center header__title">Aggregate Outputs for: <strong>{cpn}</strong></div>
        </>
        }
	</div>);
}

export default Header