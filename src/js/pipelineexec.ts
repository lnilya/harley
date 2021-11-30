import * as alg from "./state/algstate";
import {pipelineExecution, RunningMode, SingleDataBatch} from "./state/algstate";
import * as ui from "./state/uistates";
import {autoExecDialogOpen, UIScreens} from "./state/uistates";
import * as eventbus from "./state/eventbus";
import {EventTypes, PipelineStepCompletedPayload} from "./state/eventbus";
import {getConnectedValue, updateConnectedValue} from "./state/ConnectedStore";
import {wait} from "./util";
import {loadBatchAndStartPipeline} from "./pipeline";
import {doesPipelineStepHaveData} from "./state/stateutil";


/**
 * Will look starting at given element for the next non-null element in allBatches and return either false if nothing is
 * found or an object with index and element.
 * @param firstElemToCheck if -1: the next to the loaded is used: curLoadedBatch + 1
 * @return result false if nothign is found otherwise {batch:... idx:...} object.
 */
function __getNextAvailableBatch(firstElemToCheck: number = -1) {
    firstElemToCheck = firstElemToCheck != -1 ? firstElemToCheck :  getConnectedValue(alg.curLoadedBatch) + 1;
    const allBatches = getConnectedValue(alg.allPipelineBatches);
    //step to the next non-null batch
    while (firstElemToCheck < allBatches.length && !allBatches[firstElemToCheck])
        firstElemToCheck++;
    
    if (firstElemToCheck >= allBatches.length) return false;
    
    return {batch:allBatches[firstElemToCheck], idx:firstElemToCheck};
}

async function __onStepToNextBatch(runningMode:RunningMode.running|RunningMode.runningUntilNextExport = RunningMode.running):Promise<boolean>{
    const nextBatch = __getNextAvailableBatch();
    //we are done nothing to do
    if(nextBatch === false){
        __addToAutoExecLog('Completed all Input Data','info');
        updateConnectedValue(pipelineExecution,RunningMode.manual);
        return false;
    }else{
        
        //move to input, to indicate to user that we are loading new data & display progress bar.
        updateConnectedValue(ui.appScreen,UIScreens.input)
        await wait(50)
        //continue with the next batch
        startPipelineAutoPlay(nextBatch.idx,false,true,runningMode)
    }
    return true;
}
async function __onRunAutoAggregateExport(){
    //run the Aggregators
    const res:eventbus.RunAggregateSyncResult[] = await eventbus.fireEventSync(EventTypes.RunAggregateSync);
    const requiredAggregates = getConnectedValue(alg.pipelineGlobalSettings).runAggregatorExports
    let allSuccess = true;
    res.forEach((res)=>{
        
        //Excluded Aggregates will not be exported if they are not required, and simply return true, but we do not need Log output for those.
        if(requiredAggregates.indexOf(res.out.aggregatorID) == -1)
            return;
        
        if(res.error) {
            allSuccess = false;
            __addToAutoExecLog(`Error aggregating [${res.out.title}]: ${res.error} `, 'fail')
        }
        else __addToAutoExecLog(`Aggregated [${res.out.title}] to ${res.destinationFile} `,'success')
    })
    
    return allSuccess
}
async function __onRunAutoExport(){
    //run the exporters
    const res:eventbus.RunExportSyncResult[] = await eventbus.fireEventSync(EventTypes.RunExportSync);
    const requiredExports = getConnectedValue(alg.pipelineGlobalSettings).runBatchExports
    
    let allSuccess = true;
    res.forEach((res)=>{
        //Excluded Exports will not be exported if they are not required, and simply return true, but we do not need Log output for those.
        if(requiredExports.indexOf(res.out.requiredInput) == -1)
            return;
        
        if(res.error) {
            allSuccess = false;
            __addToAutoExecLog(`Error exporting [${res.out.title}]: ${res.error} `, 'fail')
        }
        else __addToAutoExecLog(`Exported [${res.out.title}] to ${res.destinationFile} `,'success')
    })
    
    return allSuccess
}

async function __onAutoStepCompleted(){
    const pipe = getConnectedValue(ui.selectedPipeline);
    const curStepNum = getConnectedValue(ui.curPipelineStepNum)
    if (curStepNum < (pipe.steps.length - 1))
        updateConnectedValue(ui.curPipelineStepNum, curStepNum + 1);
    else{
        const settings = getConnectedValue(alg.pipelineGlobalSettings)
        
        if(settings.runBatchExports.length > 0){
            //we just finished last step but are not in export screen yet
            updateConnectedValue(ui.appScreen, UIScreens.output);
            
            //this will trigger a repaint and once the Exporter UI is loaded,
            //it will be able to listen to events. In order to follow the paradigm, that you see what the
            //UI is doign, we wait for repaint, even though the export could be done without loading the UI and triggereing events on it.
            //Maybe this is a decision to change at some later point.
            //However this approach allows us to simply stop execution display errors to the user directly in the UI
            //same as the were doing it by hand. This way they can step back and rerun/rexport manually
            
            //wait for repaint
            await wait(50);
            
            //Abort execution if exporting fails
            const success = await __onRunAutoExport();
            if(!success){
                stopAutoExecution();
                return true;
            }
        }
        
        if(settings.runAggregatorExports.length > 0){
            updateConnectedValue(ui.appScreen, UIScreens.aggregate);
            await wait(50);
            const success = await __onRunAutoAggregateExport();
            if(!success){
                stopAutoExecution();
                return true;
            }
        }
    
        const bi = getConnectedValue(alg.loadedBatchInfo)
        __addToAutoExecLog(`Completed Batch ${bi.displayedBatch+1} / ${bi.totalDispBatches}`,'success')
        //done
        return true;
    }
    //not done yet
    return false;
}

//***************************************************************/
//* PUBLIC API */
//***************************************************************/

/**
 * Stops the auto execution routine. Will not stop any running calls to server.
 * @param hideDialogue if true, will fold down the auto exec dialoague too.
 */
export function stopAutoExecution(hideDialogue:boolean = false){
    eventbus.unlistenTo('rah');
    updateConnectedValue(pipelineExecution,RunningMode.manual);
    if(hideDialogue) updateConnectedValue(autoExecDialogOpen,false);
}

/**
 * Resets the auto execution state. Folds down the dialogue, stops the execution
 * and clears the log after 500ms, when animaiton of folding down is finished.
 */
export async function resetAutoExecution(){
    stopAutoExecution(true);
    
    await wait(500);
    //clear log after the dialogue is not visible anymore.
    updateConnectedValue(alg.pipelineLog,[])
}

/**
 * Resumes Auto execution, same as starting it but pipeline loading is not happening.
 * This may only be called when inside the pipeline or with a pipeline loaded.
 * @param stopAtExport
 */
export async function resumeAutoExecution(stopAtExport:boolean = false){
    
    const newMode = stopAtExport ? RunningMode.runningUntilNextExport : RunningMode.running;
    if(getConnectedValue(ui.appScreen) == UIScreens.input){
        //Check if the currently loaded step has enough data and we can in theory simply step to
        //the pipeline view.
        const curStepNum = getConnectedValue(ui.curPipelineStepNum)
        if(doesPipelineStepHaveData(curStepNum)){
            
            //Initiate liseners
            __runAutoExecutionLoop(newMode);
            
            //data is present, simply step to the pipelie at whatever step we have been to
            //This will trigger a rerun of algorithm, which will exit right away, since all data is present and params didn't change,
            //listener will catch it and continue.
            updateConnectedValue(ui.appScreen, UIScreens.pipeline);
    
        }else{
            //this should not happen. And means we are in input and the auto exec dialog is still open
            //maybe because someone deleted the current pipeline's input while dialog was open.
            
            //Display an error to the user and kill the pipeline dialogue
            eventbus.fireEvent<eventbus.ToastEventPayload>(eventbus.EventTypes.ToastEvent,{msg:'Pipeline input missing.',severity:'error'})
            updateConnectedValue(autoExecDialogOpen,false);
        }
    }else if(getConnectedValue(ui.appScreen) == UIScreens.output){
        //if we are in the output we need to restart the autoexec in the next batch
        const canContinue = __onStepToNextBatch(newMode);
        updateConnectedValue(pipelineExecution,canContinue ? newMode : RunningMode.manual);
    }else{
        //since we are not in output screen
        //initiate listeners
        __runAutoExecutionLoop(newMode);
        
        //the current displayed step is completed, since we are viewing it and could click on "play"
        //The event will rerun it, but the step should not run, but simply return a success
        //which will be caucht by the execution listener
        eventbus.fireEvent<void>(eventbus.EventTypes.RunPipelineStepSync)
    }
}

/**
 * Central auto execution loop function.
 * @param runningMode defined the mode to run in, this should be RunningMode.running or RunningMode.runningUntilNextExport.
 */
function __runAutoExecutionLoop(runningMode:RunningMode.running|RunningMode.runningUntilNextExport = RunningMode.running) {
    
    var startTime = new Date().getTime();
    const gps = getConnectedValue(alg.pipelineGlobalSettings)
    eventbus.unlistenTo('rah')
    eventbus.listenTo<PipelineStepCompletedPayload>(eventbus.EventTypes.PipelineStepCompleted, 'rah',async (d)=>{
        const curStepNum = getConnectedValue(ui.curPipelineStepNum)
        const allSteps = getConnectedValue(ui.allPipelineSteps)
        const curStep = allSteps[curStepNum];
        
        const pp = '['+curStep.title+']: '
        //Check if it is the current step, not sure if it can be anything but.
        if(curStep.moduleID != d.moduleID){
            __addToAutoExecLog(pp+'Completed Step('+curStep.moduleID+') is not the current ('+d.moduleID+').','fail',startTime)
        }else if(!d.success){
            __addToAutoExecLog(pp+'Error:'+d.error,'fail',startTime)
            stopAutoExecution();
        }else{
            __addToAutoExecLog(pp+'Completed','success',startTime)
            //step to next Step if all went well.
            
            if(gps.pauseUIToSeeResults > 0)
                await wait(gps.pauseUIToSeeResults); //wait for bit so user sees the output, usually just loading an image from server
            
            var batchCompleted = await __onAutoStepCompleted();
            
            //done with this batch, stop listening and restart
            if(batchCompleted){
                eventbus.unlistenTo('rah')
                const curMode = getConnectedValue(pipelineExecution);
                
                if(curMode == RunningMode.runningUntilNextExport){
                    //if we only wanted to run till end of this batch
                    updateConnectedValue(pipelineExecution,RunningMode.manual);
                    __addToAutoExecLog('Stopping Pipeline at output','info');
                    //unlisten since this function will be called again
                }else{
                    //if we wanted to run all batches
                    __onStepToNextBatch();
                }
            }
        }
        startTime = new Date().getTime();
    } )
    
    //indicate that we are now running in auto mode
    updateConnectedValue(pipelineExecution,runningMode)
    updateConnectedValue(autoExecDialogOpen,true)
    
}


/**
 * Will start the pipeline execution for a given batch.
 * It involves loading the batch's parameter set, setting all states to processing
 * ui as well as data.
 * @param forBatchNum loads a specific batch num if it is not null.
 * @param clearLog If true the pipeline auto exec log will be reset. Should be done when restarting the whole pipeline
 * @param searchForNextAvailableIfNull Since allPipelineBatches might have nulls in them due to user deleting data, forBatchNum parameter might point to null.
 * If this is set to true we will look for the next possible batch instead.
 * */
export async function startPipelineAutoPlay(forBatchNum: number = 0, clearLog: boolean = true, searchForNextAvailableIfNull: boolean = true, runningMode:RunningMode.running|RunningMode.runningUntilNextExport = RunningMode.running) {
    //Start the pipeline at the given parameters
    let batch: SingleDataBatch = getConnectedValue(alg.allPipelineBatches)[forBatchNum];
    if (!batch && searchForNextAvailableIfNull) {
        const res = __getNextAvailableBatch(forBatchNum)
        if(res === false) return false; // wecan't to anything, no available batches found
        batch = res.batch;
        forBatchNum = res.idx;
    }
    
    //we identified the batch to process, it is now loaded into the pipeline, along with the parameters in this batch
    await loadBatchAndStartPipeline(forBatchNum, true)
    
    //double check if pipeline execution can begin.
    const missingKeys = doesPipelineStepHaveData(0);
    
    //Switch UI to current step
    if (missingKeys === true) {
        if (clearLog) updateConnectedValue(alg.pipelineLog, []);
        
        //Print debugs for data loaded
        __addToAutoExecLog(`Loading data batch with parameter set: ${batch.settingsSetName}.`, 'info')
        var msg = [];
        for (let ik in batch.inputs) msg.push(ik + ':' + batch.inputs[ik].file.name);
        __addToAutoExecLog(`Inputs:\n` + msg.join('\n'), 'info')
        
        //switch UI to first step of pieline
        updateConnectedValue(ui.curPipelineStepNum, 0)
        updateConnectedValue(ui.appScreen, UIScreens.pipeline)
        
        //Start running batchmode
        __runAutoExecutionLoop(runningMode);
    } else {
        __addToAutoExecLog(`Could not load data for Batch #${forBatchNum + 1}`, 'fail')
        __addToAutoExecLog(`Failed Loading :\n` + missingKeys.join('\n'), 'fail')
        
        //indicate that we are not running anymore
        stopAutoExecution();
    }
}

function __addToAutoExecLog(msg:string, type:'success'|'fail'|'info' = 'success', startTime:number = -1){
    const duration = startTime == -1 ? null : new Date().getTime() - startTime;
    const entry = {msg:msg,type:type, time:new Date().getTime(), duration: duration}
    const curLog = getConnectedValue(alg.pipelineLog)
    updateConnectedValue(alg.pipelineLog,[entry,...curLog]);
}