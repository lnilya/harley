import React from "react";
import * as util from './pipelineutil'
import {Pipeline} from "../types/pipelinetypes";
import * as FociDetectionParams from '../modules/FociDetection/params'
import FociDetection from "../modules/FociDetection/FociDetection";
import {suggestModifiedFilename, suggestSuffixedFileName} from "./pipelineutil";
import thumb from '../../assets/images/fd_thumb.jpg'
import * as FociDetectionModelParams from '../modules/FociDetectionModel/params'
import FociDetectionModel from "../modules/FociDetectionModel/FociDetectionModel";
import ResponsiveEmbed from 'react-responsive-embed'
//%NEWMODULE_IMPORT%

const inputKeys = {
    model: 'Trained Model',
    dataset: 'Dataset'
}
const dataKeys = {
    foci: 'Foci',
}

const helpScreen = <div>
    <ResponsiveEmbed src='https://www.youtube.com/embed/KRvW-F2ED6g' allowFullScreen/>
</div>

function getPipeline(): Pipeline {
    const datasetDesc = 'A dataset aggregated from the Pre-Procesing pipeline.'
    const modelDesc = 'A model exported from the Model training pipeline.'
    
    return {
        steps: [
            {
                title: 'Foci Detection',
                moduleID: 'FociDetectionModel',
                renderer: <FociDetectionModel/>,
                parameters: FociDetectionModelParams.parameters,
                inputKeys: {model: inputKeys.model, dataset: inputKeys.dataset},
                outputKeys: {foci: dataKeys.foci}
            } as FociDetectionModelParams.Step,
            //%NEWMODULE_STEP%
        ],
        name: 'Foci Detection',
        inputs: [
            {
                key: inputKeys.model,
                title: 'Model File', description: modelDesc,
                loaders: {'model': 'loadModel'},
                postProcessForJS: util.postProcessForImage
            },
            {
                key: inputKeys.dataset,
                title: 'Dataset file', description: datasetDesc,
                loaders: {'cells': 'loadCells'},
                postProcessForJS: util.postProcessForImage
            }
        ],
        outputs: [
            {
                requiredInput: dataKeys.foci,
                title: 'Foci Table',
                description: 'A CSV File with foci stats. Each Foci has a cell number associated with it. If your dataset file had a scale associated with it, the result here will be in µm otherwise just pixels.',
                suggestDestinationOutput: {
                    pipelineInputKey: inputKeys.dataset,
                    transform: suggestSuffixedFileName('_foci', 'csv')
                },
            }
        ],
        descriptions: {
            title: 'Foci Detection',
            description: 'This pipeline detects foci in a dataset using a trained model. You have the option to remove erroneous images as well. The result is a CSV file with information on each foci in each cell.',
            thumb: <img src={thumb}/>,
            helpscreen:helpScreen
        },
        disableBatchMode:true
    }
}

export default getPipeline;