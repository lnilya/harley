import React from "react";
import {UIScreens} from "../../state/uistates";
import {doesPipelineStepHaveData} from "../../state/stateutil";
import {useRecoilState, useRecoilValue} from "recoil";
import * as ui from "../../state/uistates";
import * as alg from "../../state/algstate";
import {cl} from "../../util";
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
interface IStepDistplayProps {
    
    /**Additional classnames for this component*/
    className?: string
}

/**
 * StepDistplay
 * @author Ilya Shabanov
 */
const StepDisplay: React.FC<IStepDistplayProps> = ({className}) => {
    
    //Needs to stay here in order for the Dispaly to update when pipeline data becomes available.
    const pd = useRecoilValue(alg.allPipelineData);
    const pi = useRecoilValue(alg.allPipelineInputs);
    
    const [displayedStep, setDisplayedStep] = useRecoilState(ui.curPipelineStepNum);
    const [uiStep,setUIStep] = useRecoilState(ui.appScreen);
    const overlay = useRecoilValue(ui.overlay);
    // const overlayBlock = overlay !== null && overlay.nonBlocking !== false
    const allSteps = useRecoilValue(ui.allPipelineSteps);
    
    const onChangeStep = (newStep:number)=>{
        if(uiStep == UIScreens.pipeline && newStep == displayedStep) return;
        setDisplayedStep(newStep)
        setUIStep(UIScreens.pipeline)
    }
    
    return (
        <div className={`step-display`}>
            {allSteps.map((s, i) => {
                    const isNotReady = doesPipelineStepHaveData(i) !== true;
                    var classes = 'step'
                        + cl(displayedStep == i && uiStep == UIScreens.pipeline, 'selected')
                        + cl(isNotReady, 'not-ready')
                    
                    const el = <div key={i} className={classes} onClick={e => onChangeStep(i)}>
                        <span>
                            {s.title}
                        </span>
                    </div>;
                    if( i > 0) return [<KeyboardArrowRightIcon key={i*100} sx={{opacity:isNotReady ? .4 : 1}}/>,el]
                    return el
                }
            )}
        </div>
    );
}
export default StepDisplay;
