import React from "react"
import {atomFamily, useRecoilState} from "recoil";
import {runThinning} from "./server";
import * as self from "./params";
import './scss/Thinning.scss'
import DisplayOptions, {DisplayOptionSetting} from "../../../sammie/js/ui/modules/DisplayOptions";
import MasksOverImage, {MaskOverImageMask} from "../../../sammie/js/ui/elements/MasksOverImage";
import {PipelineImage} from "../../../sammie/js/types/datatypes";
import {useStepHook} from "../../../sammie/js/modules/modulehooks";

interface IThinningProps{}

const asShowClosedGaps = atomFamily<boolean,string>({key:'thinning_closed_gaps',default:true});
const asShowOriginal = atomFamily<boolean,string>({key:'thinning_original',default:true});
const asThinnedImage = atomFamily<PipelineImage,string>({key:'thinning_thinned',default:null});
const asThinnedImageWithGaps = atomFamily<PipelineImage,string>({key:'thinning_thinned_with_gaps',default:null});
const asLastRunSettings = atomFamily< {inputs:self.Inputs, params:self.Parameters},string>({key:'thinning_initial',default:null});
const Thinning:React.FC<IThinningProps> = () => {
    
    /**CLEANUP CALLBACK WHEN INPUTS HAVE CHANGED*/
    const onInputChanged = ()=>{
        setThinnedImage(null);
        setThinnedWithGapsImage(null);
    };
    
    /**RUNNING ALGORITHM CALLBACK*/
    const runMainAlgorithm = async (params:self.Parameters,step:self.Step)=>{
        const res = await runThinning(params,step)
        setThinnedImage(res.error ? null : res.data.thinned)
        setThinnedWithGapsImage(res.error ? null : res.data.thinnedWithGaps)
        return res.error ? {error:res.error} : true;
    };
    
    /**CORE HOOK FOR SETTING UP STATE*/
    const {curInputs,curStep,curParams,isRunning} = useStepHook<self.Inputs, self.Parameters,self.Step>(asLastRunSettings,
        onInputChanged,
        runMainAlgorithm,
        {msg: 'Thinning...', display: "overlay"});
    
    /**UI SPECIFIC STATE*/
    const [showClosedGaps, setShowClosedGaps] = useRecoilState(asShowClosedGaps(curStep.moduleID));
    const [showOriginal, setShowOriginal] = useRecoilState(asShowOriginal(curStep.moduleID));
    const [thinnedImage,setThinnedImage] = useRecoilState(asThinnedImage(curStep.moduleID));
    const [thinnedImageWithGaps,setThinnedWithGapsImage] = useRecoilState(asThinnedImageWithGaps(curStep.moduleID));
    
    const displayOptions: DisplayOptionSetting[] = [
        {checked: showClosedGaps, label: 'Show Closed Gaps (blue)', setter: setShowClosedGaps},
        {checked: showOriginal, label: 'Show Image', setter: setShowOriginal},
    ]
    
    const shownMasks:Array<MaskOverImageMask> = [
        !showClosedGaps && thinnedImage && { url:thinnedImage.url, col:'red' },
        showClosedGaps && thinnedImage && { url:thinnedImage.url, col:'blue' },
        showClosedGaps && thinnedImageWithGaps && { url:thinnedImageWithGaps.url, col:'red' },
    ];
    
	return (<div className={'thinning'}>
	    <DisplayOptions settings={displayOptions}/>
        <MasksOverImage originalURL={curInputs.srcImg.url} showOriginal={showOriginal} masks={shownMasks}/>
	</div>);
}
export default Thinning