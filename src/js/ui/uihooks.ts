import {atomFamily, RecoilState, useRecoilState} from "recoil";
import {useEffect} from "react";
import * as storage from '../state/persistance'
import {EventPayload, EventResult, EventTypes} from "../state/eventbus";
import * as eventbus from "../state/eventbus";

const asPrevSettings = atomFamily<boolean,string>({key:'prev_settings',default:false});
export function useInitalLoadCallback(recoilState:RecoilState<any>, initCallBack:()=>any){
    const [initialized, setInitialized] = useRecoilState(asPrevSettings(recoilState.key));
    const [curSettings, setCurSettings] = useRecoilState(recoilState);
    
    useEffect(()=>{
        if(!initialized) initCallBack()
        setInitialized(true)
    },[])
    
}

export function useLocalStoreRecoilHook(recoilState:RecoilState<any>,scope:'global'|'pipeline' = 'pipeline', initalLoad:boolean = true){
    const [curSettings, setCurSettings] = useRecoilState(recoilState);
    
    //load data on init if necessary
    useEffect(()=>{
        if(!initalLoad) return;
        var data = curSettings;
        if(scope == 'global') data = storage.loadGlobalData(recoilState.key);
        else if(scope == 'pipeline') data = storage.loadDataForPipeline(recoilState.key);
        if(data !== null) setCurSettings(data);
    },[])
    
    //store data on write
    const writeOut = (data)=>{
        setCurSettings(data)
        if(scope == 'global') storage.saveGlobalData(data,recoilState.key);
        else if(scope == 'pipeline') storage.saveDataForCurPipeline(data,recoilState.key);
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