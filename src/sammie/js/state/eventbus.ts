import {AlertColor} from "@mui/material";
import {ModuleID} from "../types/uitypes";
import {PipelineAggregatorOutput, PipelineOutput} from "../types/pipelinetypes";

/*
Events implemented here all can have a return value. This allows for a two-way communication on the event bus.
This return value can in addition be implemented synchroneous or asynchroneous.
All Events are strongly type in in and output.
* */

const __debug = false;

export enum EventTypes {
    
    //EVENTS WITHOUT RETURN
        /**Called after a short delay, when parameter have changed*/
        ParametersChanged = 'Event:ParametersChanged',
        
        /**Called when things like storing parameters are finished, to give some small feedback,
         * will pass some text and icon to show*/
        ToastEvent = 'Event:ToastWorthyEvent',
        
        /**This is an alternative to the RunPipelineStepSync event, it is triggered in addition to the return of RunPipelineStepSync
         * and can be used to just notify something of the completion of a step, without it waiting for it.
         * Which is useful, since Execution can also be triggered by things like parameter or input changes.*/
        PipelineStepCompleted = 'Event:PipelineStepCompleted',
        
    //EVENTS THAT RETURN DATA INSTANTLY
    
    
    //EVENTS THAT RETURN ASYNCHRONEOUS PROMISE TO DATA
    
        /**Asks exporter to do its job*/
        RunExportSync = 'EventAsync:RunExportSync',
        RunAggregateSync = 'EventAsync:RunAggregateSync',
        
        /**Asks a step of the pipeline to execute*/
        RunPipelineStepSync = 'EventAsync:RunPipelineStepSync',
}
//***************************************************************/
//* EVENT RESULTS / OUTPUTS RETURNED FROM LISTENER FUNCTIONS */
//***************************************************************/
//Note that if nothing is passed, no type needs to be defined, since "void" is the default return
    export type RunPipelineStepSyncResult = { moduleID: ModuleID, success: boolean, error?: string };
    export type RunExportSyncResult = { out: PipelineOutput, success: boolean, destinationFile?:string, error?: string };
    export type RunAggregateSyncResult = { out:PipelineAggregatorOutput, success: boolean, destinationFile?:string, error?: string };

    /**Collective type for all Event Results*/
    export type EventResult = RunPipelineStepSyncResult | RunExportSyncResult | RunAggregateSyncResult | void;

//***************************************************************/
//* EVENT PAYLOADS / INPUTS PASSED WHEN EVENT IS FIRED */
//***************************************************************/
//Note that if nothing is passed, no type needs to be defined, since "void" is the default payload

    export type ParametersChangedPayload = boolean;
    export type ToastEventPayload = { severity: AlertColor, msg: string };
    export type PipelineStepCompletedPayload = RunPipelineStepSyncResult; //since it is an async alternative
    
    /**Collective type for all Event Payloads*/
    export type EventPayload = ParametersChangedPayload | ToastEventPayload | PipelineStepCompletedPayload | void;


export type ListenerID = string;
export type ListenerFunction<InputData extends EventPayload = void, OutputData extends EventResult = void> =
    ((data: InputData) => Promise<OutputData>)
    | ((data: InputData) => OutputData);

const eventListeners = <Record<string, ListenerFunction<any, any>>>{};


/**
 * Removes a listener from the eventBus
 * @param id any self chosen id to identify the listener
 * @param event if null will delete all events, otherwise only the specific type
 */
export function unlistenTo(id: ListenerID, event: EventTypes = null) {
    if (event == null) {
        for (let key in eventListeners) {
            if (key.indexOf(id) != -1) delete eventListeners[key]
        }
    } else {
        delete eventListeners[`${id}_${event}`]
    }
}

/**
 * Registeres a callback function to the listener
 * @param event The event type to listen to
 * @param id Id of the listener, allows to remove this listener from event bus.
 * @param callback Any function that will be invoked when event happens
 */
export function listenTo<T extends EventPayload,R extends EventResult = void>(event: EventTypes, id: ListenerID, callback: ListenerFunction<T,R>) {
    __debug && console.log(`[Eventbus] Registered listener "${id}" for event "${event}"`);
    eventListeners[`${id}_${event}`] = callback;
}

/**
 * Same as fireEvent but in case of a listener function returning a promise (i.e. being async) it will wait untill
 * all promises are resolved and return the resolved results.
 * @param event Event type to fire
 * @param data Data to pass to the event
 * Returns a (possibly empty) array with the results of all listeners.
 */
export async function fireEventSync<T extends EventPayload, R>(event: EventTypes, data: T = null): Promise<Array<R>> {
    const res = fireEvent<T, R>(event, data);
    return Promise.all(res)
}

/**Shorthand for dispatching a toast event*/
export function showToast(msg:string, severity:AlertColor = "success"){
    fireEvent<ToastEventPayload>(EventTypes.ToastEvent,{msg:msg,severity:severity})
}
/**
 * Fires an event and returns the results of the registered Listener functions.
 * @param event Event type to fire
 * @param data Data to pass to the event
 * Returns an empty array if nobody was listening.
 */
export function fireEvent<T extends EventPayload, R = void>(event: EventTypes, data: T = null): Array<R> {
    __debug && console.log(`[Eventbus] Firing Event ${event} with data: `,data);
    var results: Array<R> = [];
    for (let key in eventListeners) {
        if (key.indexOf(event) != -1) {
            __debug && console.log(`[Eventbus] Listener ${key} listening and processing`);
            results.push(eventListeners[key](data))
        }
    }
    return results;
}

window['showEventInfo'] = ()=>{
    for (let elk in eventListeners) {
        console.log(`[Eventbus]: Listener: ${elk}`);
    }
}