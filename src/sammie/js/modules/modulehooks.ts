import {RecoilState, SetterOrUpdater, useRecoilState, useRecoilValue} from "recoil";
import * as alg from "../state/algstate";
import {SingleDataBatch} from "../state/algstate";
import * as ui from "../state/uistates";
import * as eventbus from "../state/eventbus";
import {ParametersChangedPayload} from "../state/eventbus";
import {useEffect, useState} from "react";
import {OverlayState} from "../types/uitypes";
import {abortStep} from "../eel/eel";
import {PipelineStep} from "../types/pipelinetypes";
import {DisplayOptionSetting} from "../ui/modules/DisplayOptions";
import {ParameterKey} from "./paramtypes";

const deepEqual = require('deep-equal')

export type StepState<InputType, ParameterType, Step, BatchParams> = {
    curParams: ParameterType,
    curInputs: InputType,
    curStep: Step,
    isRunning: boolean,
    setOverlay:SetterOrUpdater<OverlayState>,
    curBatch: SingleDataBatch<BatchParams>
}
type AtomFamily<P> = (param: P) => RecoilState<P>

/**
 * Hook bundling some shared functionality of all steps. Initates input, parameters, step and overlay states.
 * Manages listening to input and parameter changes and calls appropriate callbacks
 * returns the current description of a more generic step state.
 * @param settingsAtomFamily
 * @param onInputChange
 * @param runMainAlgorithm Will return true if all went well, or an o object containing an error description
 * @param overlayMessageOnRun
 * @param canAbort If true the UI will display some sort of abort button. The abortID of the process is the moduleID, which is the default parameter for runStep.
 */
export function useStepHook<Inputs, Parameters, Step extends PipelineStep<any, any>, BatchParamType = Record<ParameterKey, any>>(
    settingsAtomFamily: AtomFamily<any>,
    onInputChange: (newParams?:Inputs, oldParams?:Inputs) => any,
    runMainAlgorithm: (params: Parameters, step: Step) => true|Promise<true|{error:string}>,
    overlayMessageOnRun?: OverlayState,
    canAbort:boolean = false,
    paramChangeListener:Record<string, (newValue,oldValue)=>void> = null
    ): StepState<Inputs, Parameters, Step, BatchParamType> {
    
        const curParams:Parameters = useRecoilValue(alg.curPipelineStepParameterValues) as Parameters;
        const curInputs:Inputs = useRecoilValue(alg.curPipelineStepInputData) as unknown as Inputs;
        const curStep:Step = useRecoilValue(ui.curPipelineStep) as unknown as Step;
        const curBatch:SingleDataBatch<BatchParamType> = useRecoilValue(alg.curLoadedBatch) as SingleDataBatch<BatchParamType>;
        const [overlay, setOverlay] = useRecoilState(ui.overlay);
        const [lastRunSettings, setLastRunSettings] = useRecoilState(settingsAtomFamily(curStep.moduleID));
        
        //Since this hook is only for 1 step = 1 blocking process case
        //we use the moduleID as an identifier for the thread to kill in case of user abort
        if(canAbort && overlayMessageOnRun)
            overlayMessageOnRun.abortCallBack = ()=> {
                onInputChange();
                abortStep(curStep.moduleID)
            };
            
        
        //Should delete current persistent recoil-state, when inputs have changed since last render
        useEffect(() => {
            if (onInputChange && lastRunSettings && curInputs && !deepEqual(lastRunSettings.inputs, curInputs))
                onInputChange(curInputs,lastRunSettings.inputs);
            
            //Small caveat. Empty paramaters will lead to Sidebar not being rendered
            //this will prevent it from triggering a parameter change event, which in turn would call the inital
            //algorithm run. Therefore we simply add a clause here.
            if(Object.keys(curParams).length == 0)
                runAlgorithmInPipeline()
            
        }, [])
        
        //Wrapper for running the Algorithm, will test if inputs or parameters have changed.
        const runAlgorithm:eventbus.ListenerFunction<void,eventbus.RunPipelineStepSyncResult> = async () => {
            console.log(`[${curStep.moduleID}] RUNNING STEP`);
            
            if (overlay != null) return {moduleID:curStep.moduleID, success:false, error: 'Can\'t run algorithm while overlay is active or something else is running'};
            var changedInputs = !deepEqual(curInputs, lastRunSettings?.inputs);
    
            var changedParams = false;
            
            //Call any registered parameter change listener
            var listOfChangedParams = curStep.parameters.filter((p)=> lastRunSettings?.params[p.key] != curParams[p.key]);
            if(paramChangeListener){
                for (let pk of listOfChangedParams){
                    if(paramChangeListener[pk.key] !== undefined)
                       paramChangeListener[pk.key](curParams[pk.key],lastRunSettings?.params[pk.key])
                }
            }
            
            //get parameter keys that are not frontendOnly
            var serverRelevantKeys:string[] = curStep.parameters.map((p)=>p.frontendOnly ? null : p.key);
            //check only those keys for changes
            for (let paramName of serverRelevantKeys) {
                if(!paramName) continue;
                if(!deepEqual(curParams[paramName],lastRunSettings?.params[paramName])){
                    changedParams = true;
                    break;
                }
            }
            
            var needRun = changedParams || changedInputs;
            
            
            setLastRunSettings({inputs: curInputs, params: curParams})
            
            //Do not run if neither input nor parameters changed from last run
            if (!needRun){
                console.log(`[${curStep.moduleID}] NO NEED TO RUN`);
                //We return success = true so that the auto play of the algorithm can continue
                return {moduleID:curStep.moduleID, success:true, error: 'Neither input nor parameters changed. Call to run will be ignored.'};
            }
            
            //filter out parameters that are decorative
            
            //tell component to run algorihtm
            if (overlayMessageOnRun) {
                setOverlay(overlayMessageOnRun)
            }
            
            //run algorithm and disable overlay
            const algResult = await runMainAlgorithm(curParams,curStep);
            
            setOverlay(null)
            console.log(`[${curStep.moduleID}] COMPLETING STEP:`);
            //Return the Result, only relevant if algorithm is run automatically inside the pipeline.
            return <eventbus.RunPipelineStepSyncResult>{ moduleID: curStep.moduleID, success: algResult === true, error: algResult !== true ? algResult.error : null };
        }
        
        /**Will run the algorithm and then fire off an event upon completion. Used for automated execution.*/
        const runAlgorithmInPipeline = async () => {
            
            const res:eventbus.RunPipelineStepSyncResult = await runAlgorithm();
            //additionally fire off completion event
            eventbus.fireEvent(eventbus.EventTypes.PipelineStepCompleted,res)
            return res;
        }
        
        //Register listeners for parameter change
        useEffect(() => {
            eventbus.unlistenTo(curStep.moduleID)
            //in any case running the algorithm should trigger the execution completed event
            eventbus.listenTo<void,eventbus.RunPipelineStepSyncResult>(eventbus.EventTypes.RunPipelineStepSync, curStep.moduleID, async ()=> {
                // console.log(`RUNNING ALG BECAUSE `,eventbus.EventTypes.RunPipelineStepSync);
                return runAlgorithmInPipeline();
            })
            
            eventbus.listenTo<ParametersChangedPayload>(eventbus.EventTypes.ParametersChanged, curStep.moduleID, async ()=> {
                // console.log(`RUNNING ALG BECAUSE `,eventbus.EventTypes.ParametersChanged);
                runAlgorithmInPipeline()
            })
            return () => eventbus.unlistenTo(curStep.moduleID);
        })
    
        
        return {
            curInputs: curInputs as Inputs,
            curParams: curParams as Parameters,
            isRunning: !!overlay,
            curStep: curStep,
            setOverlay:setOverlay,
            curBatch: curBatch
        };
}

/**
 * Hook for use with DisplayOption Component. Will create state for the given display options. The result can then be
 * used in the DisplayOptions component.
 * @param step The step, needed for module ID
 * @param settings settings of desired checkboxes
 * @return Array, first element will be a DisplayOptionSetting[], to be passed to components, then getter, setter functions for the respective elements
 * @see DisplayOptions
 */
export function useDisplaySettings(step:PipelineStep<any,any>, settings:Record<string,(p:string) => RecoilState<boolean>>):Array<any>{
    var displayOptions:DisplayOptionSetting[] = [];
    var res = []
    for (let s in settings){
        const [getter,setter] = useRecoilState(settings[s](step.moduleID));
        res.push(getter)
        res.push(setter)
        displayOptions.push({checked:getter, setter:setter,label:s})
    }
    return [displayOptions].concat(res);
}


/**
 * A hook if the UI needs to be aware if a certain key is down or up. This
 * is useful to enable or disable parts of the UI like masks etc.
 * @param key The key property as it arrives in a normal keydown listener on window.
 */
export function useToggleKeys(keys:string[]|string){
    if(!Array.isArray(keys))
        keys = [keys]
    
    const [isDown,setIsDown] = useState({});
    
    useEffect(()=>{
        
        const listener = (e)=>{
            for( let k of keys){
                if(e.key == k && (e.type == 'keyup' || e.type == 'keydown')){
                    const newVal = e.type != 'keyup'
                    if(isDown[k] == newVal) return
                    setIsDown({...isDown,[k]:newVal})
                }
            }
        }
        
        window.addEventListener('keydown',listener)
        window.addEventListener('keyup',listener)
        return () =>{
            window.removeEventListener('keydown',listener)
            window.removeEventListener('keyup',listener)
        }
    })
    //in case of only a single key just return the value
    if(keys.length == 1) return isDown[keys[0]]
    //for multiple keys return an array
    return isDown
}