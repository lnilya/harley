import * as ui from '../state/uistates'
//***************************************************************/
//* PYTHON->JS INTERFACE */
//***************************************************************/
import {getConnectedValue, updateConnectedValue} from "../state/ConnectedStore";
import {EelThreadKey} from "./eel";

const callbacks:Record<EelThreadKey, { resolve:(data: any)=>void, reject:(data: any)=>void }> = {}
export function removeExecutionCallback(callbackID:EelThreadKey, callbackFun){
    if(callbacks[callbackID] === undefined) return;
    callbacks[callbackID].reject({error:'Aborted', errorTrace:'User induced abortion of promise.'})
    delete callbacks[callbackID];
}
export function addExecutionCallback(callbackID:EelThreadKey, callbackFun, abortFun){
    callbacks[callbackID] = {resolve:callbackFun, reject:abortFun}
}
window['__eel_js_progress'] = function(x:number,msg:string) {
    var curOverlay = getConnectedValue(ui.overlay)
    if(curOverlay){
        var ov = {...curOverlay}
        if(msg) ov.msg = msg;
        if(x > 0) ov.progress = x;
        else delete ov.progress;
        updateConnectedValue(ui.overlay,ov)
    }
}

window['__eel_js_asyncFinished'] = function(callbackID:EelThreadKey,data) {
    if(callbacks[callbackID] === undefined) return;
    callbacks[callbackID].resolve(data);
    delete callbacks[callbackID];
}
window['__eel_js_asyncError'] = function(callbackID:EelThreadKey,data) {
    if(callbacks[callbackID] === undefined) return;
    callbacks[callbackID].reject(data);
    delete callbacks[callbackID];
}
