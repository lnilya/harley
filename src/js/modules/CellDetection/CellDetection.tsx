import React from "react"
import {atomFamily, useRecoilState} from "recoil";
import {runCellDetection} from "./server";
import * as self from "./params";
import './scss/CellDetection.scss'
import DisplayOptions, {DisplayOptionSetting} from "../../../sammie/js/ui/modules/DisplayOptions";
import {PipelineBlobs} from "../../../sammie/js/types/datatypes";
import {useStepHook} from "../../../sammie/js/modules/modulehooks";

interface ICellDetectionProps{}

const asShowRejected = atomFamily<boolean,string>({key:'cd_show_rejected',default:true});
const asShowBorderCells = atomFamily<boolean,string>({key:'cd_show_border',default:true});
const asDetected = atomFamily<PipelineBlobs,string>({key:'cd_detected',default:null});
const asAccepted = atomFamily<number[],string>({key:'cd_accepted',default:null});
const asBorder = atomFamily<number[],string>({key:'cd_border',default:null});
const asLastRunSettings = atomFamily< {inputs:self.Inputs, params:self.Parameters},string>({key:'cd_initial',default:null});
const CellDetection:React.FC<ICellDetectionProps> = () => {
    
    /**CLEANUP CALLBACK WHEN INPUTS HAVE CHANGED*/
    const onInputChanged = ()=>setDetectedCells(null)
    
    /**RUNNING ALGORITHM CALLBACK*/
    const runMainAlgorithm = async (params:self.Parameters,step:self.Step)=>{
        const res = await runCellDetection(params,step)
        setDetectedCells(res.error ? null : res.data.blobs)//input and output image are same
        setAcceptedCells(res.error ? null : res.data.accepted)//input and output image are same
        setBorderCells(res.error ? null : res.data.border)//input and output image are same
        return res.error ? {error:res.error} : true;
    };
    
    /**CORE HOOK FOR SETTING UP STATE*/
    const {curInputs,curStep} = useStepHook<self.Inputs, self.Parameters,self.Step>(asLastRunSettings,
        onInputChanged,
        runMainAlgorithm,
        {msg: 'Detecting Cells...', display: "overlay"});
    
    /**UI SPECIFIC STATE*/
    const [showRejected,setShowRejected] = useRecoilState(asShowRejected(curStep.moduleID));
    const [showBorderCells,setShowBorderCells] = useRecoilState(asShowBorderCells(curStep.moduleID));
    const [detectedCells,setDetectedCells] = useRecoilState(asDetected(curStep.moduleID));
    const [acceptedCells,setAcceptedCells] = useRecoilState(asAccepted(curStep.moduleID));
    const [borderCells,setBorderCells] = useRecoilState(asBorder(curStep.moduleID));
    
    const displayOptions:DisplayOptionSetting[] = [
        {checked:showRejected,label:'Show Rejected Cells',setter:setShowRejected},
        {checked:showBorderCells,label:'Show Border Cells',setter:setShowBorderCells},
    ]
    
    const onClickCell = (cellNum)=>{
        var idx = acceptedCells.indexOf(cellNum);
        if(idx == -1){
            setAcceptedCells([...acceptedCells,cellNum])
        }else{
            var nv = [...acceptedCells];
            nv.splice(idx,1);
            setAcceptedCells(nv)
        }
        
    }
	return (<div className={'cell-detection margin-100-neg-top'}>
	    <DisplayOptions settings={displayOptions} />
        <div className="rel outer-container">
            <img src={curInputs.srcImg.url} />
            <div className="blob-container">
                {borderCells && detectedCells && acceptedCells && detectedCells.map((c,i)=>{
                    var pos = { left:(100*c.x / curInputs.srcImg.w)+'%',
                                top:(100*c.y / curInputs.srcImg.h)+'%'};
                    
                    var accepted = acceptedCells.indexOf(i) != -1;
                    var border = borderCells.indexOf(i) != -1;
                    
                    if(!accepted && border && !showBorderCells) return null;
                    
                    var blobClass = '';
                    if(!accepted && border) blobClass = 'border';
                    else if(!accepted && !border) blobClass = 'rejected';
                    
                    if(!showRejected && !accepted) return null
                    return <img onClick={()=>onClickCell(i)} className={'blob ' + blobClass} key={i} src={c.img.url} style={pos}/>
                })}
            </div>
        </div>
	</div>);
}
export default CellDetection