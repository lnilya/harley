import React from "react";
import * as util from '../../sammie/js/pipelines/pipelineutil'
import {suggestSuffixedFileName} from '../../sammie/js/pipelines/pipelineutil'
import {Pipeline} from "../../sammie/js/types/pipelinetypes";
import ResponsiveEmbed from 'react-responsive-embed'
import thumb from "../../assets/images/fd_thumb.jpg";
import {getSliderParams, getTextfieldInputParams} from "../../sammie/js/modules/paramutil";
import * as FociDetectionParamsParams from '../modules/FociDetectionParams/params'
import FociDetectionParams from "../modules/FociDetectionParams/FociDetectionParams";
import FociCandidates from "../modules/FociCandidates/FociCandidates";
import * as FociCandidatesParams from "../modules/FociCandidates/params";
//%NEWMODULE_IMPORT%

const inputKeys = {
    dataset: 'Dataset'
}
const dataKeys = {
    cellImages: 'Cell Images',
    cellContours: 'Cell Contours',
    candidateSizes: 'Candidate Sizes',
    foci: 'Foci',
}

const helpScreen = <div>
    This pipeline is used to detect foci, without using a trained model. Which is useful in a few instances.
    First of all if your data contains a very simple dataset, e.g. a single bright focus per cell, as is often the case
    with spindle pole bodies for example. In such cases there are few "wrong" foci which the model requres to learn.
    Using the parameter approach in this case is faster and more convenient than training a model.
    Video on Foci Detection using model (exports and general flow is same):
    <div className="pad-50-ver">
        <ResponsiveEmbed src='https://www.youtube.com/embed/KRvW-F2ED6g' allowFullScreen/>
    </div>
    Video on Foci Detection via paramters:
    TODO
</div>

/**Optional Typing for the Batch parameters*/
export type ParametrizedFociDetectionBatchParameters = {
    '1px': number
    cellstoprocess: number
}

function getPipeline(): Pipeline {
    
    const datasetDesc = 'This description appears in the file loader when loading this file.'
    
    return {
        steps: [
            {
                title: 'Foci Candidates',
                moduleID: 'FociCandidates',
                renderer: <FociCandidates/>,
                parameters: FociCandidatesParams.parameters,
                inputKeys: {dataset: inputKeys.dataset},
                outputKeys: {
                    cellImages: dataKeys.cellImages,
                    sizes: dataKeys.candidateSizes,
                    cellContours: dataKeys.cellContours
                }
            } as FociCandidatesParams.Step,
            {
                title: 'FociDetectionParams',
                moduleID: 'FociDetectionParams',
                renderer: <FociDetectionParams/>,
                parameters: FociDetectionParamsParams.parameters,
                inputKeys: {dataset: inputKeys.dataset,cellImages: dataKeys.cellImages,sizes: dataKeys.candidateSizes,cellContours: dataKeys.cellContours},
                outputKeys: {foci: dataKeys.foci}
            } as FociDetectionParamsParams.Step,
            //%NEWMODULE_STEP%
        ],
        
        disableBatchMode: true, //wether or not batch mode is allowed.
        
        name: 'Parametrized Foci Detection', //name of your pipeline
        
        //Define what data needs to be provided in DataInput screen to start the pipeline
        inputs: [
            
            {
                key: inputKeys.dataset,
                title: 'Dataset file', description: datasetDesc,
                loaders: {'cells': ['loadCells', {normalize: false}]},
                postProcessForJS: util.postProcessForImage,
                modifyBatchParameters: util.mergeMetaInformationWithBatchSettings
            },
        ],
        //Define what the outputs of this Pipeline are
        outputs: [
            {
                requiredInput: dataKeys.foci,
                title: 'Foci Table',
                description: 'An excel file with foci stats. Cells that are excluded are not counted/mentioned in the file. All cell numbers relate to the set without excluded cells. All foci have a cell number associated with them. If your dataset file had a scale associated with it, the result here will be in µm otherwise just pixels.',
                suggestDestinationOutput: {
                    pipelineInputKey: inputKeys.dataset,
                    transform: suggestSuffixedFileName('_foci', 'xlsx')
                },
                exporterParams: {type: 'xlsx'}
            },
            {
                requiredInput: dataKeys.foci,
                title: 'Labeled Dataset',
                description: 'This output is a copy of the original dataset enriched with the foci you identified. You can therefore safely overwrite the old dataset file.\nDoing this allows you to use two dataset files in the colocalisation pipeline later on.',
                suggestDestinationOutput: {
                    pipelineInputKey: inputKeys.dataset,
                    transform: suggestSuffixedFileName('', 'cells')
                },
                exporterParams: {type: 'cells'}
            }
        ],
        inputParameters: [
            getTextfieldInputParams('1px', '1px in nm', 'How many nanometers correspond to 1px. This is useful for your dataset to have the proper scale and allow downstream processing steps to access this information. If blank no conversion will be used and all downstream values will be in px.', 'Scale...', '', null, false, 'number'),
            getSliderParams('cellstoprocess', 'Use Subset in %', 'If your dataset is large, you might only want to process the first x% of it, to get a feel for the result. At this point you might determine to use another model, or process the whole dataset. Use this slider to adjust the percentage of cells to process.', 1, 100, 0.5, 100),
        ],
        
        //Info for user
        descriptions: {
            title: 'FociDetection (without model)',
            description: 'This pipeline detects foci in a dataset using a set of parameters. It is an alternative to using a trained model to detect foci. Use it when you tend to have a single bright focus per cell, there are few or no non-foci making model training impractical and the detection task can be easily handled by a simple threshhold. The result is a XLSX file with information on each foci in each cell.',
            thumb: <img src={thumb}/>,
            helpscreen: helpScreen
        }
    }
}

export default getPipeline;