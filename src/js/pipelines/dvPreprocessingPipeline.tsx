import DVStacker from "../modules/DVStacker/DVStacker";
import * as DVStackerParams from "../modules/DVStacker/params";
import React from "react";
import {Pipeline} from "../../sammie/js/types/pipelinetypes";
import * as util from '../../sammie/js/pipelines/pipelineutil'
import {suggestModifiedFilename} from '../../sammie/js/pipelines/pipelineutil'
import * as DenoiseParams from '../modules/Denoise/params'
import Denoise from "../modules/Denoise/Denoise";
import * as MaskTighteningParams from '../modules/MaskTightening/params'
import MaskTightening from "../modules/MaskTightening/MaskTightening";
import thumb from "../../assets/images/pp_thumb.jpg";
import ResponsiveEmbed from 'react-responsive-embed'
import {getTextfieldInputParams} from "../../sammie/js/modules/paramutil";
//%NEWMODULE_IMPORT%

const keys = {
    input:'Input Image',
    mask:'Raw Mask',
    stacked:'Stacked Image',
    denoised: "Denoised Image",
    tightCells: "Tight Cells"
    
}

const helpScreen = <div>
    <ResponsiveEmbed src='https://www.youtube.com/embed/RjvG61KGxZI' allowFullScreen />
</div>

function getPipeline(): Pipeline {
    const steps = [
        {
            title: 'Stacking',
            moduleID: 'stacking',
            renderer: <DVStacker/>,
            parameters: DVStackerParams.parameters,
            inputKeys: {dvImg:keys.input},
            outputKeys: {stackedImg:keys.stacked}
        } as DVStackerParams.Step,
        {
            title:'Denoise',
            moduleID:'Denoise',
            renderer: <Denoise/>,
            parameters:DenoiseParams.parameters,
            inputKeys:{noisyImg:keys.stacked, dvImg:keys.input},
            outputKeys:{denoisedImg:keys.denoised}
        } as DenoiseParams.Step,
        { 
            title:'MaskTightening',
            moduleID:'MaskTightening',
            renderer: <MaskTightening/>,
            parameters:MaskTighteningParams.parameters,
            inputKeys:{mask:keys.mask,srcImg:keys.denoised},
            outputKeys:{tightCells:keys.tightCells}
        } as MaskTighteningParams.Step,
        //%NEWMODULE_STEP%
    ];
    return {
        name: 'Preprocessing',
        steps: steps,
        inputs: [
            {
                key:keys.input,
                title:'MultiChannel Fluorescence Image',
                description:'A multichannel fluorescence image, where the z-stack will be collapsed to create a final image that can be used for foci detection.',
                loaders:{ 'dv': 'loadDVMultiChannelImage',
                           'tif,tiff': 'loadTifMultiChannelImage'},
                postProcessForJS:util.postProcessForImage,
                //will overwrite the "1px" setting
                modifyBatchParameters:util.mergeMetaInformationWithBatchSettings
            },
            {
                key:keys.mask,
                title:'Mask Image',
                description:'The mask image is a binary image that has usually been generated from lightfield images. However lightfield images not always coincide with the signal in the cytoplasm. For Foci Detection to work well, the mask is tightened to the diffuse signal inside the cytoplasm.',
                loaders:{ 'png,tiff': 'loadBinaryImage' },
                postProcessForJS:util.postProcessForImage
            }
        ],
        inputParameters: [
            getTextfieldInputParams('1px','1px in nm','How many nanometers correspond to 1px. This is useful for your dataset to have the proper scale and allow downstream processing steps to access this information. If blank no conversion will be used and all downstream values will be in px.','Scale...','',null,false,'number'),
        ],
        aggregatorOutputs:[
            {
                title:'Cells Dataset Aggregate',
                description:`Cells are cut out from the denoised image using the tightened mask, which are both results of this pipeline.
                The results are appended to this file. As batches are processed this file will contain the results of all processed batches and can be used as a dataset for model training, manual foci detection etc.`,
                requiredInputs: [keys.denoised,keys.tightCells],
                aggregatorID:'appendToCellSet'
            }
        ],
        outputs:[
            {
                title:'Denoised Image',
                description:'The stacked and denoised image. It is advisible to use the denoised image for foci detection, to reduce the influence of noise',
                requiredInput: keys.denoised,
                suggestDestinationOutput:{
                    pipelineInputKey:keys.input,
                    transform:suggestModifiedFilename(/(.*)\..*/g,'$1_denoised.tiff'),
                }
            },
            {
                title:'Tightened Mask',
                description:'A binary image for the new tightened and filtered mask. this will be the basis to use the most viable cells for foci dection.',
                requiredInput: keys.tightCells,
                suggestDestinationOutput:{
                    pipelineInputKey:keys.mask,
                    transform:suggestModifiedFilename(/(.*)\..*/g,'$1_tightened.png'),
                }
            }
        ],
        descriptions:{
            thumb: <img src={thumb}/>,
            title:'Pre Processing',
            description:'This pipeline goes from stacks of images to a single denoised image. Additionally the masks obtained from brightfield images can be tightened with the fluorescence data. This is especially useful, when cell area needs to be calculated precisely, or the cells are very close by and may overlap.',
            helpscreen:helpScreen
        }
    }
}

export default getPipeline;