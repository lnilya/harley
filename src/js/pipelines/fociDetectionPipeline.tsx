import React from "react";
import * as util from '../../sammie/js/pipelines/pipelineutil'
import {suggestModifiedFilename, suggestSuffixedFileName} from '../../sammie/js/pipelines/pipelineutil'
import {Pipeline} from "../../sammie/js/types/pipelinetypes";
import thumb from '../../assets/images/fd_thumb.jpg'
import * as FociDetectionModelParams from '../modules/FociDetectionModel/params'
import FociDetectionModel from "../modules/FociDetectionModel/FociDetectionModel";
import ResponsiveEmbed from 'react-responsive-embed'
import {getSliderParams, getTextfieldInputParams} from "../../sammie/js/modules/paramutil";

//%NEWMODULE_IMPORT%

const inputKeys = {
    model: 'Trained Model',
    dataset: 'Dataset'
}
const dataKeys = {
    foci: 'Foci',
}

const helpScreen = <div>
    <ResponsiveEmbed src='https://www.youtube.com/embed/1aMCvWfax6s' allowFullScreen/>
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
                key: inputKeys.dataset,
                title: 'Dataset file', description: datasetDesc,
                loaders: {'cells': ['loadCells',{normalize:false}]},
                postProcessForJS: util.postProcessForImage,
                modifyBatchParameters: util.mergeMetaInformationWithBatchSettings
            },
            {
                key: inputKeys.model,
                title: 'Model File', description: modelDesc,
                loaders: {'model': 'loadModel'},
                postProcessForJS: util.postProcessForImage
            }
        ],
        inputParameters: [
            getTextfieldInputParams('1px', '1px in nm', 'How many nanometers correspond to 1px. This is useful for your dataset to have the proper scale and allow downstream processing steps to access this information. If blank no conversion will be used and all downstream values will be in px.', 'Scale...', '', null, false, 'number'),
            getSliderParams('cellstoprocess', 'Use Subset in %', 'If your dataset is large, you might only want to process the first x% of it, to get a feel for the result. At this point you might determine to use another model, or process the whole dataset. Use this slider to adjust the percentage of cells to process.', 1, 100, 0.5, 100),
        ],
        outputs: [
            {
                requiredInput: dataKeys.foci,
                title: 'Foci Table',
                description: <>
                    An excel file with foci stats. Cells that are excluded are not counted/mentioned in the file. All cell numbers relate to the set without excluded cells (They will only correspond to the numbers you see in the UI up until the first excluded cell).
                    <br/><br/>
                    <strong>Brightness values</strong>: While the microscope delivers data as a 16-bit (0-65535) or 8-bit (0-255) integer, all values in this table are scaled 0-1. However
                    they are not normalized/modified cell by cell. If you need integers simply multiply the 0-1 numbers in this table with 65535 (or 255 respectively).
                    </>,
                suggestDestinationOutput: {
                    pipelineInputKey: inputKeys.dataset,
                    transform: suggestSuffixedFileName('_foci', 'xlsx')
                },
                exporterParams:{type:'xlsx'}
            },
            {
                requiredInput: dataKeys.foci,
                title:'Labeled Dataset',
                description:'This output is a copy of the original dataset enriched with the foci you identified. You can therefore safely overwrite the old dataset file.\nDoing this allows you to use two dataset files in the colocalisation pipeline later on.',
                suggestDestinationOutput: {
                    pipelineInputKey: inputKeys.dataset,
                    transform: suggestSuffixedFileName('', 'cells')
                },
                exporterParams:{type:'cells'}
            }
        ],
        descriptions: {
            title: 'Foci Detection (using model)',
            description: 'This pipeline detects foci in a dataset using a trained model. You have the option to remove erroneous images as well. The result is a XLSX file with information on each foci in each cell.',
            thumb: <img src={thumb}/>,
            helpscreen: helpScreen
        },
        disableBatchMode: true
    }
}

export default getPipeline;