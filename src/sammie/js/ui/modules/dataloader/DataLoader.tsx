import React, {useState} from "react"
import {useRecoilValue} from "recoil";
import * as ui from '../../../state/uistates'
import * as alg from '../../../state/algstate'
import {SingleDataBatch} from '../../../state/algstate'
import FilePicker from "./FilePicker";
import {Pipeline, PipelineInput} from "../../../types/pipelinetypes";
import DataBatch from "./DataBatch";
import {LocalFileWithPreview} from "../../../types/datatypes";
import {Button, Dialog, Tooltip} from "@mui/material";
import {copyChange} from "../../../util";
import * as store from '../../../state/persistance'
import {PARAM_SET_NAME_CURRENT, ParamSet} from '../../../state/persistance'
import {useLocalStoreRecoilHook} from "../../uihooks";
import {getBlankBatch, unloadPipeline} from "../../../pipelines/pipeline";
import {Alert} from "@mui/material";
import {startPipelineAutoPlay} from "../../../pipelines/pipelineexec";
import BatchCreator from "./BatchCreator";
import BallotIcon from '@mui/icons-material/Ballot';
import AddBoxIcon from '@mui/icons-material/AddBox';
import {DeleteForever} from "@mui/icons-material";
import ConfirmToolTip from "../../elements/ConfirmToolTip";

interface IDataLoaderProps{

}


type DialogState = {
    input:PipelineInput,
    batchIndex:number,
}

function analyzeBatches(allBatches:SingleDataBatch[], inputs:PipelineInput[]){
    
    //csWarning happens when current settings and named settings are mixed.
    
    const needsCurrentSettingsWarning = allBatches.find(b=>b?.settingsSetName == PARAM_SET_NAME_CURRENT) &&
                                        allBatches.find(b=>b?.settingsSetName != PARAM_SET_NAME_CURRENT);
        
    //Ready batches have all inputs defined and non-null settings
    const hasReadyBatches = allBatches.filter((batch:SingleDataBatch)=>{
        if(!batch) return false;
        const noMissingInputs = inputs.filter((p)=>batch?.inputs[p.key] == null).length == 0;
        const hasSettings = batch.settingsSetName != null;
        return hasSettings && noMissingInputs;
    }).length > 0
    
    return [needsCurrentSettingsWarning,hasReadyBatches]
}
/**
 * Dataloader loads any kind of data and puts it into the pipeline
 * @constructor
 */
const DataLoader:React.FC<IDataLoaderProps> = () => {
    
    const curPipeline:Pipeline = useRecoilValue(ui.selectedPipeline)
    const overlay = useRecoilValue(ui.overlay)
    const [allBatches, setAllBatches] = useLocalStoreRecoilHook(alg.allPipelineBatches,'pipeline',false, curPipeline.name);
    const [askingForInput,setAskingForInput] = useState<DialogState>(null);
    const [selectedInput,setSelectedInput] = useState<LocalFileWithPreview>(null);
    const [multiBatchDialog,setMultiBatchDialog] = useState(false);
    const curLoadedBatch = useRecoilValue(alg.curLoadedBatchNumber);
    //Initial Load of inputs
    const openPickerDialog = (pinp:PipelineInput, idx:number)=>{
        setSelectedInput(null)
        setAskingForInput({input:pinp, batchIndex:idx})
    }
    
    //Load available parameter sets initially.
    const [allParamSets,setAllParamSets] = useState<ParamSet[]>(()=>Object.values(store.loadParameterSets(true))||[]);
    const resolvePickerDialog = async (canceled:boolean = false)=>{
        if(selectedInput && !canceled){
            const cb:SingleDataBatch = allBatches[askingForInput.batchIndex]
            const nb:SingleDataBatch = {...cb,batchParameters:{...cb.batchParameters}, inputs: {...cb.inputs,[askingForInput.input.key]: selectedInput}};
            
            //we have selected a file check if we need to update the batch settings from loading of this file
            const inp:PipelineInput = curPipeline.inputs.find(i=>i==askingForInput.input);
            if(inp.modifyBatchParameters)
                nb.batchParameters = await inp.modifyBatchParameters(selectedInput,cb.batchParameters,curPipeline.inputParameters)
            
            setAllBatches(copyChange(allBatches,askingForInput.batchIndex,nb))
            
        }
        setSelectedInput(null)
        setAskingForInput(null)
    }
    
    const removeBatch = (bidx) =>{
        //we replace with null value, so that the index is always growing when adding new batches
        //this is important for previews to work correctly.
        setAllBatches(copyChange(allBatches,bidx,null))
        
        //Unload the pipeline if
        if(curLoadedBatch == bidx)
            unloadPipeline();
    }
    const addNewBatch = () =>{
        const nb:SingleDataBatch = getBlankBatch(curPipeline)
        setAllBatches([...allBatches,nb])
    }
    
    //Will show the overlay instead
    if(overlay) return null;
    
    const startPipeAutoMode = () => {
        startPipelineAutoPlay();
    };
    
    const deleteAllBatches = () => {
        //delete with an empty batch
        setAllBatches([getBlankBatch(curPipeline)])
        unloadPipeline();
    };
    
    //get some info for UI display
    const [needsCurrentSettingsWarning,hasReadyBatches] = analyzeBatches(allBatches,curPipeline.inputs);
    
    const startPipelineButton = <Button disabled={!hasReadyBatches || curPipeline.disableBatchMode} onClick={startPipeAutoMode} variant={"contained"} color={'primary'}>Start Pipeline</Button>;
    var counter = 0;
	return (<div className={'site-block data-loader narrow pad-100'}>
        {allBatches.map((pb,i)=>{
            if(!pb) return null;
            return <DataBatch onDeleteBatch={()=>removeBatch(i)}
                              className={'margin-100-bottom'}
                              title={'Batch #'+(++counter)}
                              batchIdx={i} batch={pb} key={i} onOpenSelectionDialogue={(p)=>openPickerDialog(p,i)}/>
        })}
        {needsCurrentSettingsWarning &&
            <Alert severity="warning">
                You are mixing "Current Parameters" setting and named ones. This is dicouraged to use with auto execution. Because every time a named parameter set is loaded, it overwrites the current parameter set.
                In any of the following batches the "Current Parameters" become simply the same as a preceeding named set.
            </Alert>
        }
        <div className="pad-100-top fl-row">
            <Tooltip title={'Add a new empty batch'} placement={'top'} arrow>
                <Button variant={"contained"} color={'secondary'} onClick={addNewBatch}><AddBoxIcon/></Button>
            </Tooltip>
            <div className="margin-100-right"/>
            <Tooltip title={'Batch Creator: Allows to add multiple batches at once using placeholders'} placement={'top'} arrow>
                <Button variant={"contained"} color={'secondary'} onClick={()=>setMultiBatchDialog(true)}><BallotIcon/></Button>
            </Tooltip>
            <div className="margin-100-right"/>
            <ConfirmToolTip onConfirm={deleteAllBatches} question={`Delete all batches?`} options={['Delete','Cancel']} tooltipParams={{placement:'top', arrow:true}}>
                <Button variant={"outlined"} color={'secondary'}><DeleteForever/></Button>
            </ConfirmToolTip>
            <div className="fl-grow"/>
            {!hasReadyBatches && !curPipeline.disableBatchMode &&
                <Tooltip title={'Define a batch with all data to be able to start the pipeline'} placement={'top'} arrow>
                    <div>{startPipelineButton}</div>
                </Tooltip>
            }
            {curPipeline.disableBatchMode &&
                <Tooltip title={'This pipeline does not support batch mode. Use the buttons in the top right hand corner of the batches to execute them.'} placement={'top'} arrow>
                    <div>{startPipelineButton}</div>
                </Tooltip>
            }
            {hasReadyBatches && !curPipeline.disableBatchMode && startPipelineButton }
        </div>
        
        <Dialog open={multiBatchDialog} maxWidth={'md'} onClose={()=>setMultiBatchDialog(false)}>
            <BatchCreator onDone={()=>setMultiBatchDialog(false)}/>
        </Dialog>
        <Dialog open={!!askingForInput} fullWidth={true}
                maxWidth={"md"} onClose={()=>resolvePickerDialog(true)}>
            <div className="pad-200">
                {!!askingForInput &&
                    <FilePicker input={askingForInput.input}
                                batchID={askingForInput.batchIndex}
                                initialFile={allBatches[askingForInput.batchIndex][askingForInput.input.key]}
                    updateFunction={(inp,data,add)=>setSelectedInput((add && !!data) ? data : null)}/>
                    
                }
                <div className="text-right pad-100-top ">
                    <Button onClick={()=>resolvePickerDialog(false)} variant={"contained"} color={'primary'} disabled={!selectedInput}>Use File</Button>
                </div>
            </div>
        </Dialog>
	</div>);
}
export default DataLoader;