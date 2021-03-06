import Threshhold from "../modules/Threshhold/Threshhold";
import * as ThreshholdParams from "../modules/Threshhold/params";
import BlobRemoval from "../modules/BlobRemoval/BlobRemoval";
import * as BlobRemovalParams from "../modules/BlobRemoval/params";
import CellFittingHeatmap from "../modules/CellFittingHeatmap/CellFittingHeatmap";
import * as CellFittingHeatmapParams from "../modules/CellFittingHeatmap/params";
import CellFitting from "../modules/CellFitting/CellFitting";
import * as CellFittingParams from "../modules/CellFitting/params";
import React from "react";
import * as util from '../../sammie/js/pipelines/pipelineutil'
import {suggestModifiedFilename} from '../../sammie/js/pipelines/pipelineutil'
import {Pipeline, PipelineStep} from "../../sammie/js/types/pipelinetypes";
import thumb from '../../assets/images/cd_thumb.jpg'
import ResponsiveEmbed from 'react-responsive-embed'

const dataKeys = {
    img: 'Input Image',
    timg: 'Threshholded Image',
    cimg: 'Cleared Image',
    skel: 'Skeleton',
    skelWithBorders: 'Skeleton With Borders',
    cells: 'Cells',
    cellEllipses: 'Cell Ellipses',
    heatmap: 'Heatmap'
};

const helpScreen = <div>
    <ResponsiveEmbed src='https://www.youtube.com/embed/gTJQOmeUkso' allowFullScreen />
</div>

function getPipeline():Pipeline{

    var steps: Array<PipelineStep<any, any>> = [
        {
            title: 'Threshhold',
            moduleID: 'threshhold',
            renderer: <Threshhold/>,
            parameters: ThreshholdParams.parameters,
            inputKeys: {srcImg: dataKeys.img},
            outputKeys: {threshholdedImg: dataKeys.timg}
        } as ThreshholdParams.Step,
        {
            title: 'Cleaning',
            moduleID: 'cleaning',
            renderer: <BlobRemoval/>,
            parameters: BlobRemovalParams.parameters,
            inputKeys: {threshholdedImg: dataKeys.timg, srcImg: dataKeys.img},
            outputKeys: {cleanedImg: dataKeys.cimg}
        } as BlobRemovalParams.Step,
        {
            title: 'Cell Centers',
            moduleID: 'CellFittingHeatmap',
            renderer: <CellFittingHeatmap/>,
            parameters: CellFittingHeatmapParams.parameters,
            inputKeys: {cleanedImg: dataKeys.cimg},
            outputKeys: {heatmap: dataKeys.heatmap, skeleton: dataKeys.skel}
        } as CellFittingHeatmapParams.Step,
        {
            title: 'CellFitting',
            moduleID: 'CellFitting',
            renderer: <CellFitting/>,
            parameters: CellFittingParams.parameters,
            inputKeys: {scoremap: dataKeys.heatmap, skeleton: dataKeys.skel, srcImg: dataKeys.img},
            outputKeys: {ellipses: dataKeys.cells}
        } as CellFittingParams.Step
    ];
    const desc = 'A picture of the cells, outlines should be as saturated white as they can be and it should be in focus for detection to work well.'
    return {
        name: 'Cell Detector',
        inputs: [
            {
                key: dataKeys.img,
                title: 'Lightfield Microscopy Image', description: desc,
                loaders: {
                    'tiff,jpg,png': 'loadIntensityImage',
                    'dv': 'loadDVIntensityImage'
                },
                postProcessForJS:util.postProcessForImage
            },
        ],
        outputs:[
            {
                requiredInput:dataKeys.cells,
                exporterParams:{type:'png'},
                suggestDestinationOutput:{
                    pipelineInputKey:dataKeys.img,
                    transform:suggestModifiedFilename(/(.*)\..*/g,'$1_masked.png'),
                },
                title: 'Binary Mask with non-intersecting cell boundaries',
                description: "Will output a binary PNG image with cell outlines in white. Since cells can overlap, there is a 1px border added and overlaps are substracted from the binary mask. Be aware that because of this the binary mask is not a 100% precise, which might be a problem for some organelles located on the very edge of the cell."
            },
            {
                requiredInput:dataKeys.cells,
                exporterParams:{type:'mask'},
                suggestDestinationOutput:{
                    pipelineInputKey:dataKeys.img,
                    transform:suggestModifiedFilename(/(.*)\..*/g,'$1.mask'),
                },
                title: 'Cell Boundary File containing exact outlines ',
                description: "Stores a file containing the exact outlines detected in this pipeline. Use this file as an input to the PreProcessing pipeline. (Note: in Harley versions before 1.1.5 the binary mask was used as input to preprocessing, which is discouraged due to not being very precise)"
            }
        ],
        steps: steps,
        descriptions:{
            thumb: <img src={thumb}/>,
            title:'Cell Detection',
            description:'This pipeline goes from brightfield images to cell outlines. In the process you can filter detected cells and adjust parameters to detect the most cells in your images.',
            helpscreen:helpScreen
        }
    }
}

export default getPipeline;