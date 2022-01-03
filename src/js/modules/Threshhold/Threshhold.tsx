import React from "react"
import * as self from "./params";
import {atomFamily, useRecoilState} from "recoil";
import './scss/Threshhold.scss'
import {PipelineImage} from "../../../sammie/js/types/datatypes";
import {runThreshhold} from "./server";
import DisplayOptions, {DisplayOptionSetting} from "../../../sammie/js/ui/modules/DisplayOptions";
import MasksOverImage, {MaskOverImageMask} from "../../../sammie/js/ui/elements/MasksOverImage";
import {useStepHook} from "../../../sammie/js/modules/modulehooks";

const deepEqual = require('deep-equal')


/**PERSISTENT UI STATE DEFINITIONS*/
const asMaskImg = atomFamily<PipelineImage,string>({key:'ts_mask_img',default:null});
const asPrevMaskImg = atomFamily<PipelineImage,string>({key:'ts_prev_mask_img',default:null});
const asShowOrig = atomFamily<boolean,string>({key:'ts_show_original',default:true});
const asShowPrev = atomFamily<boolean,string>({key:'ts_show_ps',default:true});
const asLastRunSettings = atomFamily< {batchTimeStamp:number, inputs: self.Inputs, params: self.Parameters},string>({key:'ts_initial',default:null});

interface IFileLoaderProps{}
const Threshhold:React.FC<IFileLoaderProps> = () => {
    
    /**CLEANUP CALLBACK WHEN INPUTS HAVE CHANGED*/
    const onInputChanged = ()=>{
        setPrevMaskImage(null);
        setMaskImage(null);
    };
    
    /**RUNNING ALGORITHM CALLBACK*/
    const runMainAlgorithm = async (params:self.Parameters,step:self.Step)=>{
        const res = await runThreshhold(params,step)
        setPrevMaskImage(res.error ? null : maskImage)
        setMaskImage(res.error ? null : res.data);
        return res.error ? {error:res.error} : true;
    };
    
    /**CORE HOOK FOR SETTING UP STATE*/
    const {curInputs,curStep,curParams,isRunning} = useStepHook<self.Inputs, self.Parameters,self.Step>(asLastRunSettings,
        onInputChanged,
        runMainAlgorithm,
        {msg: 'Running Threshhold', display: "overlay"});
    
    /**UI SPECIFIC STATE*/
    const [prevMaskImage,setPrevMaskImage] = useRecoilState(asPrevMaskImg(curStep.moduleID))
    const [maskImage,setMaskImage] = useRecoilState(asMaskImg(curStep.moduleID))
    const [showPrevStep,setShowPrevStep] = useRecoilState(asShowPrev(curStep.moduleID))
    const [showOriginal,setShowOriginal] = useRecoilState(asShowOrig(curStep.moduleID));
    
    const displayOptions:DisplayOptionSetting[] = [
        {checked:showPrevStep,label:'Show Previous Step (blue)',setter:setShowPrevStep},
        {checked:showOriginal,label:'Show Image',setter:setShowOriginal},
    ]
    
    const shownMasks:Array<MaskOverImageMask> = [
        prevMaskImage && showPrevStep && { url:prevMaskImage.url, col:'blue' },
        maskImage && { url:maskImage.url, col:!showOriginal ? 'black' : 'red' }
    ];
    
	return (<div className={'threshhold margin-100-neg-top'}>
        <div className="img-container">
            <DisplayOptions settings={displayOptions} />
            <MasksOverImage originalURL={curInputs.srcImg.url} showOriginal={showOriginal}
                            masks={shownMasks}/>
        </div>
	</div>);
}

export default Threshhold