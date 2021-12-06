import React from "react"
import {atomFamily, useRecoilState} from "recoil";
import {runBlobRemoval} from "./server";
import * as self from "./params";
import DisplayOptions, {DisplayOptionSetting} from "../../../sammie/js/ui/modules/DisplayOptions";
import {PipelineImage} from "../../../sammie/js/types/datatypes";
import './scss/BlobRemoval.scss'
import MasksOverImage, {MaskOverImageMask} from "../../../sammie/js/ui/elements/MasksOverImage";
import {useStepHook} from "../../../sammie/js/modules/modulehooks";

interface IBlobRemovalProps {

}

const asCleanedImage = atomFamily<PipelineImage,string>({key:'br_cleanedImage',default:null});
const asShowOrig = atomFamily<boolean,string>({key:'br_show_original',default:true});
const asShowRemoved = atomFamily<boolean,string>({key:'br_show_removed',default:true});
const asLastRunSettings = atomFamily< {inputs:self.Inputs, params:self.Parameters},string>({key:'br_initial',default:null});
const BlobRemoval: React.FC<IBlobRemovalProps> = () => {
    
    /**CLEANUP CALLBACK WHEN INPUTS HAVE CHANGED*/
    const onInputChanged = ()=>{
        setCleanedImage(curInputs.threshholdedImg)//input and output image are same
    };
    
    /**RUNNING ALGORITHM CALLBACK*/
    const runMainAlgorithm = async (params:self.Parameters,step:self.Step)=>{
        const res = await runBlobRemoval(params,step)
        setCleanedImage(res.error ? curInputs.threshholdedImg : res.data)//input and output image are same
        return res.error ? {error:res.error} : true;
    };
    
    /**CORE HOOK FOR SETTING UP STATE*/
    const {curInputs,curStep} = useStepHook<self.Inputs, self.Parameters,self.Step>(asLastRunSettings,
        onInputChanged,
        runMainAlgorithm,
        {msg: 'Removing Blobs...', display: "overlay"});
    
    /**UI SPECIFIC STATE*/
    const [cleanedImage,setCleanedImage] = useRecoilState(asCleanedImage(curStep.moduleID));
    const [showRemoved, setShowRemoved] = useRecoilState(asShowRemoved(curStep.moduleID));
    const [showOriginal, setShowOriginal] = useRecoilState(asShowOrig(curStep.moduleID));
    
    const displayOptions: DisplayOptionSetting[] = [
        {checked: showRemoved, label: 'Show Removed (blue)', setter: setShowRemoved},
        {checked: showOriginal, label: 'Show Image', setter: setShowOriginal},
    ]
    
    const shownMasks:Array<MaskOverImageMask> = [
        showRemoved && { url:curInputs.threshholdedImg.url, col:'blue' },
        cleanedImage && { url:cleanedImage.url, col:!showOriginal ? 'black' : 'red' }
    ];
    
    return (
        <div className={'blob-removal margin-100-neg-top'}>
            <DisplayOptions settings={displayOptions}/>
            <MasksOverImage originalURL={curInputs.srcImg.url} showOriginal={showOriginal}
                            masks={shownMasks}/>
        </div>);
}
export default BlobRemoval