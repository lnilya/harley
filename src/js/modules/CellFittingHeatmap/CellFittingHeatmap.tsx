import React from "react"
import {atomFamily, useRecoilState} from "recoil";
import * as self from "./params";
import {runCellFittingHeatmap} from "./server";
import './scss/CellFittingHeatmap.scss'
import {useStepHook} from "../_hooks";
import {PipelineImage} from "../../types/datatypes";
import MasksOverImage, {MaskOverImageMask} from "../../ui/elements/MasksOverImage";
import DisplayOptions, {DisplayOptionSetting} from "../../ui/modules/DisplayOptions";

/**PERSISTENT UI STATE DEFINITIONS*/
const asHeatmap = atomFamily<PipelineImage,string>({key:'cell-fitting-heatmap_heatmap',default:null});
const asSkel = atomFamily<PipelineImage,string>({key:'cell-fitting-heatmap_skel',default:null});
const asShowMask = atomFamily<boolean,string>({key:'cell-fitting-heatmap_mask',default:true});
const asLastRunSettings = atomFamily< {inputs:self.Inputs, params:self.Parameters},string>({key:'cell-fitting-heatmap_initial',default:null});

interface ICellFittingHeatmapProps{}
const CellFittingHeatmap:React.FC<ICellFittingHeatmapProps> = () => {
    
    /**CLEANUP CALLBACK WHEN INPUTS HAVE CHANGED*/
    const onInputChanged = ()=>{
        setHeatmap(null)
    };
    
    /**RUNNING ALGORITHM CALLBACK*/
    const runMainAlgorithm = async (params:self.Parameters,step:self.Step)=>{
        const res = await runCellFittingHeatmap(params,step);
        if(res.error) {
            setHeatmap(null)
            setSkel(null)
        }else {
            setHeatmap(res.data.heatmap)
            setSkel(res.data.skel)
        }
        return res.error ? {error:res.error} : true;
    };
    
    /**CORE HOOK FOR SETTING UP STATE*/
    const {curInputs,curStep,curParams,isRunning} = useStepHook<self.Inputs, self.Parameters,self.Step>(asLastRunSettings,
        onInputChanged,
        runMainAlgorithm,
        {msg: 'Generating Score', display: "overlay", progress:0},true);
    
    /**UI SPECIFIC STATE*/
    const [heatmap,setHeatmap] = useRecoilState(asHeatmap(curStep.moduleID))
    const [skel,setSkel] = useRecoilState(asSkel(curStep.moduleID))
    const [showMask,setShowMask] = useRecoilState(asShowMask(curStep.moduleID))
    
    const displayOptions:DisplayOptionSetting[] = [
        {checked:showMask,label:'Show Skeleton',setter:setShowMask},
    ]
    
    const shownMasks:Array<MaskOverImageMask> = [
        // showMask && { url:curInputs.cleanedImg.url, col:'white' },
        skel && showMask && { url:skel.url, col:'white' },
    ];
	return (<div className={'cell-fitting-heatmap margin-100-neg-top'}>
        { heatmap &&
            <>
                <DisplayOptions settings={displayOptions} />
                <MasksOverImage originalURL={heatmap.url} showOriginal={true} masks={shownMasks}/>
            </>
        }
	</div>);
}
export default CellFittingHeatmap