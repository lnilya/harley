import React, {useEffect, useState} from "react"
import {atomFamily, useRecoilState} from "recoil";
import * as self from "./params";
import './scss/MaskTightening.scss'
import {useDisplaySettings, useStepHook, useToggleKeys} from "../../../sammie/js/modules/modulehooks";
import {PipelinePolygons} from "../../../sammie/js/types/datatypes";
import ErrorHint from "../../../sammie/js/ui/elements/ErrorHint";
import {EelResponse} from "../../../sammie/js/eel/eel";
import PolygonCloud from "../../../sammie/js/ui/elements/PolygonCloud";
import {cl, copyRemove} from "../../../sammie/js/util";
import DisplayOptions from "../../../sammie/js/ui/modules/DisplayOptions";
import MasksOverImage, {MaskOverImageMask} from "../../../sammie/js/ui/elements/MasksOverImage";
import ImageBorder from "../../../sammie/js/ui/elements/ImageBorder";
import * as server from './server'
import ButtonIcon from "../../../sammie/js/ui/elements/ButtonIcon";
import styled from "@emotion/styled";


export const TightPolygon = styled.polygon({
    stroke:'yellow',
    strokeWidth:1,
    strokeDasharray:2,
    fill:'none'
})
export const AccPolygon = styled.polygon({
    stroke:'#9ACD32ff',
    strokeWidth:1,
    fill:'#9ACD3233',
    '&:hover':{
        fill:'#9ACD3299',
    }
})
export const RejPolygon = styled.polygon({
    stroke:'#ff000099',
    strokeWidth:1,
    fill:'none',
    '&:hover':{
        fill:'#ff000099',
    }
})


/**PERSISTENT UI STATE DEFINITIONS*/
const asCells = atomFamily<PipelinePolygons,string>({key:'mask-tightening_cells',default:null});
const asCellsTight = atomFamily<PipelinePolygons,string>({key:'mask-tightening_cells-tight',default:null});
const asAcceptedCells = atomFamily<number[],string>({key:'mask-tightening_accepted_cells',default:[]});
const asLastRunSettings = atomFamily< {inputs:self.Inputs, params:self.Parameters},string>({key:'mask-tightening_initial',default:null});
const asShowMask = atomFamily<boolean,string>({key:'mask-tightening_show_mask',default:true});


interface IMaskTighteningProps{}
const MaskTightening:React.FC<IMaskTighteningProps> = () => {
    
    /**CLEANUP CALLBACK WHEN INPUTS HAVE CHANGED*/
    const onInputChanged = ()=>{
        setAccepted(null)
        setAllCells(null)
        setTightCells(null)
    };
    
    /**RUNNING ALGORITHM CALLBACK*/
    const runMainAlgorithm = async (params:self.Parameters,step:self.Step)=>{
        const res = await server.runMaskTightening(params,step);
        setError(res.error ? res : null)
        if(res.error) {
            onInputChanged()
        }else {
            setAllCells(res.data.original)
            setTightCells(res.data.tight)
            setAccepted(res.data.original.map((k,i)=>i))
        }
        return res.error ? {error:res.error} : true;
    };
    
    /**CORE HOOK FOR SETTING UP STATE*/
    const {curInputs,curStep,curParams,isRunning} = useStepHook<self.Inputs, self.Parameters,self.Step>(asLastRunSettings,
        onInputChanged,
        runMainAlgorithm,
        {msg: 'Tightening...', display: "overlay"});
    
    /**UI SPECIFIC STATE*/
    const [allCells,setAllCells] = useRecoilState(asCells(curStep.moduleID))
    const [tightCells,setTightCells] = useRecoilState(asCellsTight(curStep.moduleID))
    const [accepted,setAccepted] = useRecoilState(asAcceptedCells(curStep.moduleID))
    const [error,setError] = useState<EelResponse<any>>(null)
    
    /**REJECTED AND ACCEPTED Filtering*/
    const rejectedPolygons = allCells?.map((p,i)=>accepted?.indexOf(i) == -1 ? p : null)
    const acceptedPolygons = allCells?.map((p,i)=>accepted?.indexOf(i) == -1 ? null : p)
    const onAcceptRejected = (pid)=>setAccepted([...accepted,pid]);
    const onRejectAccepted = (pid)=>setAccepted(copyRemove(accepted,pid));
    const hideMask = useToggleKeys(['1','2'])
    
    //give note to server that results have been selected
    useEffect(()=>{
        server.selectResults(curStep,accepted)
    },[accepted])
    
    /**MASKS DISPLAY*/
    const [displayOptions,showMask,setShowMask] = useDisplaySettings(curStep,{'Show Untightened Mask':asShowMask})
    const shownMasks:MaskOverImageMask[] = [
        curInputs.srcImg && showMask && { url:curInputs.mask.url, col:'blue' },
    ];
    
    const numAccepted = acceptedPolygons?.filter(a=>!!a).length
	return (<div className={'mask-tightening ' + cl(hideMask['1'] , 'hide-mask-orig') + cl(hideMask['2'] , 'hide-mask-all')}>
	    {error && <ErrorHint error={error}/> }
        <div className="margin-50-bottom">
            Hold the <ButtonIcon btnText={'1'}/> or <ButtonIcon btnText={'2'}/> keys to hide the cells temporarily.
        </div>
        <DisplayOptions settings={displayOptions} />
        <div className={'rel img-cont'}>
            {numAccepted > 0 &&
                <div className="count">{numAccepted}</div>
            }
            <ImageBorder hideAfter={2000} img={curInputs.srcImg} border={curParams.border[0]}/>
            <MasksOverImage originalURL={curInputs.srcImg.url} showOriginal={true} masks={shownMasks}/>
            
            <PolygonCloud PolyComp={TightPolygon} polygons={tightCells} canvasDim={curInputs.srcImg}/>
            
            <PolygonCloud className={'orig'} onClick={onAcceptRejected} PolyComp={RejPolygon} polygons={rejectedPolygons} canvasDim={curInputs.srcImg}/>
            <PolygonCloud className={'orig'} onClick={onRejectAccepted} PolyComp={AccPolygon} polygons={acceptedPolygons} canvasDim={curInputs.srcImg}/>
        </div>
	</div>);
}
export default MaskTightening