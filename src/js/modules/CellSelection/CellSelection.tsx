import React, {useEffect, useState} from "react"
import {atomFamily, useRecoilState} from "recoil";
import * as self from "./params";
import './scss/CellSelection.scss'
import {useDisplaySettings, useStepHook, useToggleKeys} from "../../../sammie/js/modules/modulehooks";
import {PipelineImage, PipelinePolygons} from "../../../sammie/js/types/datatypes";
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
import {Slider} from "@mui/material";
import {useDebounce} from "react-use";
import ParamHelpBtn from "../../../sammie/js/ui/elements/ParamHelpBtn";


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
const asLastRunSettings = atomFamily< {batchTimeStamp:number, inputs: self.Inputs, params: self.Parameters},string>({key:'mask-tightening_initial',default:null});
const asShowMask = atomFamily<boolean,string>({key:'mask-tightening_show_mask',default:true});
const asContrastAdjustment = atomFamily<[number,number],string>({key:'mask-tightening_contrast_asjust',default:[0,1]});
const asRefOpacityAdjustment = atomFamily<number,string>({key:'mask-tightening_ref_opacity',default:.3});
const asContrastAdjustedImage = atomFamily<PipelineImage,string>({key:'mask-tightening_contrast_adjusted_img',default:null});


interface ICellSelectionProps{}
const CellSelection:React.FC<ICellSelectionProps> = () => {
    
    /**CLEANUP CALLBACK WHEN INPUTS HAVE CHANGED*/
    const onInputChanged = ()=>{
        setAccepted(null)
        setAllCells(null)
        setContrastImg(null)
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
            setCurShift(curParams.shift) //set shift only after algorithm has run, to avoid shifting image and masks at different times.
        }
        return res.error ? {error:res.error} : true;
    };
    
    /**CORE HOOK FOR SETTING UP STATE*/
    const {curInputs,curStep,curParams,isRunning} = useStepHook<self.Inputs, self.Parameters,self.Step>(asLastRunSettings,
        onInputChanged,
        runMainAlgorithm,
        {msg: 'Tightening...', display: "overlay"});
    
    /**UI SPECIFIC STATE*/
    const [curShift,setCurShift] = useState(curParams.shift);
    const [allCells,setAllCells] = useRecoilState(asCells(curStep.moduleID))
    const [tightCells,setTightCells] = useRecoilState(asCellsTight(curStep.moduleID))
    const [accepted,setAccepted] = useRecoilState(asAcceptedCells(curStep.moduleID))
    const [contrast,setContrast] = useRecoilState(asContrastAdjustment(curStep.moduleID))
    const [refOpacity,setRefOpacity] = useRecoilState(asRefOpacityAdjustment(curStep.moduleID))
    const [contrastImg,setContrastImg] = useRecoilState(asContrastAdjustedImage(curStep.moduleID))
    const [error,setError] = useState<EelResponse<any>>(null)
    
    
    /**REJECTED AND ACCEPTED Filtering*/
    const rejectedPolygons = allCells?.map((p,i)=>accepted?.indexOf(i) == -1 ? p : null)
    const acceptedPolygons = allCells?.map((p,i)=>accepted?.indexOf(i) == -1 ? null : p)
    const onAcceptRejected = (pid)=>setAccepted([...accepted,pid]);
    const onRejectAccepted = (pid)=>setAccepted(copyRemove(accepted,pid));
    const hideMask = useToggleKeys(curParams.shrink ? ['1','2','3'] : ['2','3'])
    
    //give note to server that results have been selected
    useEffect(()=>{
        server.selectResults(curStep,accepted)
    },[accepted])
    
    /**MASKS DISPLAY*/
    const [displayOptions] = useDisplaySettings(curStep,{})
    
    const shownMasks:MaskOverImageMask[] = [
        curInputs.srcImg && { url:curInputs.mask.url, col:'original', opacity:refOpacity, shift: parseShift(curShift) },
    ];
    
    //Load the new contrast image after a short time
    useDebounce(async ()=>{
        const img = await server.adjustImageContrast(curStep,contrast)
        if(img.error) alert('Something went wrong with creating the contrasted image: ' + img.error)
        else {
            setContrastImg(img.data);
        }
    },500,[contrast])
    
    
    const numAccepted = acceptedPolygons?.filter(a=>!!a).length
	return (<div className={'cell-selection ' + cl(hideMask['1'] , 'hide-mask-orig') + cl(hideMask['2'] , 'hide-mask-all')}>
	    {error && <ErrorHint error={error}/> }
        <DisplayOptions settings={displayOptions} activeModKeys={Object.keys(hideMask).filter(k=>hideMask[k])}  modKeys={[
            curParams.shrink ? {name:'1',desc:'Hold the "1" key to temporarily hide the original outlines and only display tightened mask.'} : null,
            {name:'2',desc:'Hold the "2" key to temporarily hide all outlines.'},
            {name:'3',desc:'Hold the "3" key to see the original image (instead of contrast adjusted one).'}]}>
            <div className="contrast-slider fl-row-start fl-align-center">
                <span className={'pad-100-right'}>Ref Opacity:</span>
                <Slider valueLabelDisplay={'auto'} size={'small'} value={refOpacity} min={0} max={1} step={0.01} onChange={(e, v) =>  setRefOpacity(v as number)}/>
                <ParamHelpBtn className={'margin-50-left'} toolTipPlacement={'bottom'} content={'Opacity of the reference image displayed on top of the fluorescence image.'}/>
            </div>
            <div className="fl-grow"/>
            <div className="contrast-slider fl-row-start fl-align-center">
                <span className={'pad-100-right'}>Contrast:</span>
                <Slider valueLabelDisplay={'auto'} size={'small'} value={contrast} min={0} max={1} step={0.01} onChange={(e, v) =>  setContrast(v as [number,number])}/>
                <ParamHelpBtn className={'margin-50-left'} toolTipPlacement={'bottom'} content={'Temporary contrast adjustment that might help to distinguish between cells with low signal, no signal and/or dead cells. It is advised to use some time here to pick quality cells, that do not need to be sorted out at a later point.'}/>
            </div>
        </DisplayOptions>
        <div className={'rel img-cont'}>
            {numAccepted > 0 &&
                <div className="count">{numAccepted}</div>
            }
            <ImageBorder hideAfter={2000} img={curInputs.srcImg} border={curParams.border[0]}/>
            <MasksOverImage originalURL={(contrastImg && !(hideMask['3'])) ? contrastImg.url : curInputs.srcImg.url} showOriginal={true} masks={shownMasks}/>
            
            {curParams.shrink &&
                <PolygonCloud PolyComp={TightPolygon} polygons={tightCells} canvasDim={curInputs.srcImg}/>
            }
            
            <PolygonCloud className={'orig'} onClick={onAcceptRejected} PolyComp={RejPolygon} polygons={rejectedPolygons} canvasDim={curInputs.srcImg}/>
            <PolygonCloud className={'orig'} onClick={onRejectAccepted} PolyComp={AccPolygon} polygons={acceptedPolygons} canvasDim={curInputs.srcImg}/>
        </div>
	</div>);
}
export default CellSelection


function parseShift(shift:string):number[]{
    if(!shift || shift.length == 0) return [0,0];
    return shift.split(';').map(s=>parseFloat(s))
}