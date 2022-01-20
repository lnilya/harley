import {atomFamily, RecoilState, useRecoilState, useRecoilValue} from "recoil";
import {useEffect} from "react";
import * as alg from '../state/algstate'
import * as ui from '../state/uistates'
import * as storage from '../state/persistance'
import * as eventbus from "../state/eventbus";
import {EventPayload, EventResult, EventTypes} from "../state/eventbus";
import {PipelineName} from "../types/datatypes";

const asPrevSettings = atomFamily<boolean,string>({key:'prev_settings',default:false});
export function useInitalLoadCallback(recoilState:RecoilState<any>, initCallBack:()=>any){
    const [initialized, setInitialized] = useRecoilState(asPrevSettings(recoilState.key));
    const [curSettings, setCurSettings] = useRecoilState(recoilState);
    
    useEffect(()=>{
        if(!initialized) initCallBack()
        setInitialized(true)
    },[])
    
}

/***
 * Connects recoil state to local store. Making the state persistent across executions
 * @param recoilState The recoil atom to sync local store with.
 * @param scope if pipeline a value for each pipeline is stored
 * @param initalLoad If true will load the localStore with a useEffect hook on first render. This is not necessary, if the atom has been previously loaded during the current execution and will save a repaint.
 * @param pipelineName name of the pipeline to use, if scope is global, this parameter is ignored/not needed
 */
export function useLocalStoreRecoilHook(recoilState:RecoilState<any>,scope:'global'|'pipeline' = 'pipeline', initalLoad:boolean = true, pipelineName:PipelineName = null){
    const [curSettings, setCurSettings] = useRecoilState(recoilState);
    if(scope == 'pipeline' && pipelineName == null)
        pipelineName = useRecoilValue(ui.selectedPipelineName);
    
    //load data on init if necessary
    useEffect(()=>{
        if(!initalLoad) return;
        var data = curSettings;
        if(scope == 'global') data = storage.loadGlobalData(recoilState.key);
        else if(scope == 'pipeline') data = storage.loadDataForPipeline(recoilState.key,pipelineName);
        if(data !== null) setCurSettings(data);
    },[])
    
    //store data on write
    const writeOut = (data)=>{
        setCurSettings(data)
        if(scope == 'global') storage.saveGlobalData(data,recoilState.key);
        else if(scope == 'pipeline') storage.saveDataForPipeline(data,recoilState.key,pipelineName);
    }
    
    return [curSettings,writeOut]
}

/**
 * Registers a listener to the eventbus for the given event
 * @param event Event to listen to
 * @param callback callback function to call will get the data from Event
 * @param uniqueID An ID to identify this listener by
 * @param onlyOnce If true, the event callback will fire only once
 * @return unlistenFunction a function to be called to unlisten to the event.
 */
export function useEventBusCallback<T extends EventPayload, R extends EventResult = void>(event:EventTypes, uniqueID:string, callback:eventbus.ListenerFunction<T,R>, onlyOnce:boolean = false){
    useEffect(()=>{
        eventbus.listenTo<T>(event, uniqueID,(data)=>{
            if(onlyOnce) eventbus.unlistenTo(uniqueID,event);
            return callback(data);
        })
        return ()=>eventbus.unlistenTo(uniqueID,event);
    })
    return ()=>eventbus.unlistenTo(uniqueID,event);
}