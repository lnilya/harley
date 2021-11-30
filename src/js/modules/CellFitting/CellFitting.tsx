import React from "react"
import {atomFamily, useRecoilState} from "recoil";
import * as self from "./params";
import {runCellFitting, selectCellFittingResults} from "./server";
import './scss/CellFitting.scss'
import {useStepHook, useToggleKeys} from "../_hooks";
import {PipelineImage, PipelinePolygons} from "../../types/datatypes";
import DisplayOptions, {DisplayOptionSetting} from "../../ui/modules/DisplayOptions";
import MasksOverImage, {MaskOverImageMask} from "../../ui/elements/MasksOverImage";
import PolygonCloud from "../../ui/elements/PolygonCloud";
import {cl} from "../../util";
import ButtonIcon from "../../ui/elements/ButtonIcon";
import styled from "@emotion/styled";

/**PERSISTENT UI STATE DEFINITIONS*/
const asShowRejectedMax = atomFamily<boolean,string>({key:'cell-fitting-rejected_points',default:false});
const asShowOrig = atomFamily<boolean,string>({key:'cell-fitting-orig',default:true});
const asShowSkel = atomFamily<boolean,string>({key:'cell-fitting-skel',default:false});
const asHeatmapAfterThreshhold = atomFamily<PipelineImage,string>({key:'cell-fitting_heatmap-at',default:null});
const asPoints = atomFamily<{points:PipelinePolygons, accepted:Array<number>},string>({key:'cell-fitting_points',default:null});
const asManualRejection = atomFamily<Array<number>,string>({key:'cell-fitting_mrej',default:[]});
const asLastRunSettings = atomFamily< {inputs:self.Inputs, params:self.Parameters},string>({key:'cell-fitting_initial',default:null});


export const AcceptedPolygon = styled.polygon({
    fill:'#9ACD3266',
    stroke:'greenyellow',
    cursor:'not-allowed',
    '&:hover':{
        fill:'#9ACD32aa',
    }
    
})
export const RejectedPolygon = styled.polygon({
    fill:'#ff000011',
    stroke:'red',
    strokeWidth:2,
    cursor:'crosshair',
    strokeDasharray:2,
    '&:hover':{
        fill:'#ff000033',
    }
})

interface ICellFittingProps{}
const CellFitting:React.FC<ICellFittingProps> = () => {
    
    /**CLEANUP CALLBACK WHEN INPUTS HAVE CHANGED*/
    const onInputChanged = ()=>{
        setHeatmap(null)
        setPoints(null)
        setManRej([])
    };
    
    /**RUNNING ALGORITHM CALLBACK*/
    const runMainAlgorithm = async (params:self.Parameters,step:self.Step)=>{
        const res = await runCellFitting(params,step);
        if(res.error) {
            onInputChanged();
        }else {
            setManRej([])
            setHeatmap(res.data.heatmap)
            setPoints({points:res.data.maxima, accepted:res.data.accepted})
        }
        return res.error ? {error:res.error} : true;
    };
    
    /**CORE HOOK FOR SETTING UP STATE*/
    const {curInputs,curStep,curParams,isRunning} = useStepHook<self.Inputs, self.Parameters,self.Step>(asLastRunSettings,
        onInputChanged,
        runMainAlgorithm,
        {msg: 'Running CellFitting', display: "overlay", progress:0});
    
    /**UI SPECIFIC STATE*/
    const [heatmap,setHeatmap] = useRecoilState(asHeatmapAfterThreshhold(curStep.moduleID))
    const [points,setPoints] = useRecoilState(asPoints(curStep.moduleID))
    const [manRej,setManRej] = useRecoilState(asManualRejection(curStep.moduleID))
    const [showOrig,setShowOrig] = useRecoilState(asShowOrig(curStep.moduleID))
    const [showSkel,setShowSkel] = useRecoilState(asShowSkel(curStep.moduleID))

    const displayOptions:DisplayOptionSetting[] = [
        {checked:showOrig,label:'Show Src Image',setter:setShowOrig},
        {checked:showSkel,label:'Show Skeleton',setter:setShowSkel},
    ]
    
    var accEllipses = points?.points?.map((p,i)=>(points.accepted.indexOf(i) != -1 && manRej.indexOf(i) == -1) ? p : null)
    var rejEllipses = points?.points?.map((p,i)=>(manRej.indexOf(i) != -1) ? p : null)
    
    const hideMask = useToggleKeys('1')
    
    const changeManRej = (i)=>{
        let idx = manRej.indexOf(i);
        var mj = [...manRej];
        if(idx == -1){
            mj.push(i)
            setManRej(mj)
        }else{
            mj.splice(idx,1)
            setManRej(mj)
        }
        const acceptedEllipses = points.accepted.filter((p)=>mj.indexOf(p) == -1)
        selectCellFittingResults(curStep,acceptedEllipses)
    }
    const shownMasks:Array<MaskOverImageMask> = [
        // showMask && { url:curInputs.cleanedImg.url, col:'white' },
        curInputs.skeleton && showSkel && { url:curInputs.skeleton.url, col:'white' },
    ];
    const numAcceptedEllipses = points?.accepted?.filter((p)=>manRej.indexOf(p) == -1).length || 0;
	return (<div className={'cell-fitting margin-100-neg-top' + cl(hideMask, 'hide-mask')}>
        <div className="margin-50-bottom pad-100-top">
            Hold the <ButtonIcon btnText={'1'}/> key to hide the cell fittings temporarily.
        </div>
	    <DisplayOptions settings={displayOptions} />
        <div className="rel img-cont">
            {numAcceptedEllipses > 0 &&
                <div className="count">{numAcceptedEllipses}</div>
            }
            {heatmap &&
                <MasksOverImage originalURL={showOrig ? curInputs.srcImg.url : heatmap.url} showOriginal={true} masks={shownMasks}/>
            }
            <PolygonCloud onClick={changeManRej} PolyComp={AcceptedPolygon} polygons={accEllipses} canvasDim={curInputs.srcImg}/>
            <PolygonCloud onClick={changeManRej} PolyComp={RejectedPolygon} polygons={rejEllipses} canvasDim={curInputs.srcImg}/>
        </div>
	</div>);
}
export default CellFitting