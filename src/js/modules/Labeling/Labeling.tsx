import React, {useState} from "react"
import {atomFamily, useRecoilState} from "recoil";
import * as eventbus from "../../../sammie/js/state/eventbus";
import * as self from "./params";
import {generateDatasetForCell, labelCell, LabelingResult, SingleCellLabelingData} from "./server";
import './scss/Labeling.scss'
import {useStepHook} from "../../../sammie/js/modules/modulehooks";
import {PipelineImage} from "../../../sammie/js/types/datatypes";
import {EelResponse} from "../../../sammie/js/eel/eel";
import ErrorHint from "../../../sammie/js/ui/elements/ErrorHint";
import CellCounter from "./CellCounter";
import ButtonIcon from "../../../sammie/js/ui/elements/ButtonIcon";
import {Button} from "@mui/material";
import HelpDialogue from "./HelpDialogue";
import {copyChange} from "../../../sammie/js/util";
import InfoDisplay from "./InfoDisplay";

function getNextLabel(allImgs:PipelineImage[], results:LabelingResult[], random:boolean){
    if(allImgs.length == results.length) return -1
    var labeled = results.map((e)=>e.cellNum)
    var validIndices = allImgs.map((a,i)=>{
        if(labeled.indexOf(i) != -1) return -1
        return i
    }).filter(k=>k!=-1)
    if(random) return validIndices[Math.floor(Math.random()*validIndices.length)]
    return validIndices[0]
    
}
/**PERSISTENT UI STATE DEFINITIONS*/
const asLabelingResults = atomFamily<LabelingResult[],string>({key:'labeling_results',default:[]});
const asCurCell = atomFamily<number,string>({key:'laveling_curCell',default:null});
const asLabelingData = atomFamily<SingleCellLabelingData,string>({key:'labeling_dataset',default:null});
const asLastRunSettings = atomFamily< {inputs:self.Inputs, params:self.Parameters},string>({key:'labeling_initial',default:null});

interface ILabelingProps{}
const Labeling:React.FC<ILabelingProps> = () => {
    
    /**CLEANUP CALLBACK WHEN INPUTS HAVE CHANGED*/
    const onInputChanged = async ()=>{
        //Clear all labeling data
        setLabelingData( null)
        setResults([])
        setCurCell(-1)
    };
    
    /**RUNNING ALGORITHM CALLBACK WHEN PARAMS CHANGE*/
    const runMainAlgorithm = async (params:self.Parameters,step:self.Step)=>{
        if(curLabelingData == null){
            //need to load first batch of data
            const newCell = getNextLabel(curInputs.cellImages,results,params.randomize)
            const res = await generateDatasetForCell(curParams,curStep,newCell,true);
            setError(res.error ? res : null)
            setCurCell(newCell)
            setLabelingData(res.error ? null : res.data)
            setResults([])
        }
        
        return true;
    };
    
    const onLabeled = async (res:LabelingResult) => {
        //Add the result into the current labeling array
        var idx = results.findIndex(r=>r.cellNum == res.cellNum)
        
        if(idx == -1) var newResults = [...results,res]
        else newResults = copyChange(results,idx,res)
        setResults(newResults);
        
        //send result to server
        if(!res.rejected){
            const lres = await labelCell(curParams,curStep,res.cellNum,res)
            if(lres.error){
                setError(lres)
                return
            }
        }
        
        //load next cell
        const newCell = getNextLabel(curInputs.cellImages,newResults ,curParams.randomize)
        if(newCell == -1){
            //dataset is fully labeled
            eventbus.showToast('Dataset fully labeled. Proceed to export.')
        }else{
            //Load the next cell data
            const res = await generateDatasetForCell(curParams,curStep,newCell);
            setError(res.error ? res : null)
            setCurCell(newCell)
            setLabelingData(res.error ? null : res.data)
        }
    };
    
    /**CORE HOOK FOR SETTING UP STATE*/
    const {curInputs,curStep,curParams,isRunning} = useStepHook<self.Inputs, self.Parameters,self.Step>(asLastRunSettings,
        onInputChanged,
        // @ts-ignore
        runMainAlgorithm,
        {msg: 'Generating Dataset', display: "overlay", progress:0},
        true);
    
    /**UI SPECIFIC STATE*/
    const [curLabelingData,setLabelingData] = useRecoilState(asLabelingData(curStep.moduleID))
    
    const [results,setResults] = useRecoilState(asLabelingResults(curStep.moduleID))
    const [showHelp,setShowHelp] = useState(false);
    const [curCell,setCurCell] = useRecoilState(asCurCell(curStep.moduleID))
    
    const [error,setError] = useState<EelResponse<any>>(null)
    
	return (<div className={'labeling margin-100-neg pad-100'}>
	    {error && <ErrorHint error={error}/> }
        {!error && curLabelingData &&
            <>
                <InfoDisplay result={results} totalCells={curInputs.cellImages.length}/>
                <CellCounter cellContour={curInputs.cellContours[curCell]} onNext={onLabeled} cellImg={curInputs.cellImages[curCell]} curCell={curLabelingData}/>
                <div className="pad-100-top col-white text-center">
                    <div className={'pad-50-ver'}>
                        Hold <ButtonIcon btnText={'1'}/> to reveal all foci locations and <ButtonIcon btnText={'2'}/> to hide all selected foci.
                    </div>
                    <Button variant={"outlined"} onClick={e=>setShowHelp(true)} color={"secondary"}>Show Detailed Instructions</Button>
                </div>
                <HelpDialogue open={showHelp} onClose={()=>setShowHelp(false)}/>
            </>
        }
	</div>);
}
export default Labeling

