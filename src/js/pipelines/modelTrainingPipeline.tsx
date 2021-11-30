import React from "react";
import * as util from './pipelineutil'
import {Pipeline} from "../types/pipelinetypes";
import * as FociDetectionParams from '../modules/FociDetection/params'
import FociDetection from "../modules/FociDetection/FociDetection";
import {suggestModifiedFilename, suggestSuffixedFileName} from "./pipelineutil";
import thumb from '../../assets/images/svm_thumb.jpg'
import * as FociCandidatesParams from '../modules/FociCandidates/params'
import FociCandidates from "../modules/FociCandidates/FociCandidates";
import * as LabelingParams from '../modules/Labeling/params'
import Labeling from "../modules/Labeling/Labeling";
import * as TrainingParams from '../modules/Training/params'
import Training from "../modules/Training/Training";
//%NEWMODULE_IMPORT%

const inputKeys = {
    dataset: 'Dataset',
}
const dataKeys = {
    cellImages: 'Cell Images',
    candidateSizes: 'Candidate Sizes',
    foci: 'Foci',
    labels: 'Labels',
    trainingData: 'Training Data',
    model: 'Model',
}

function getPipeline(): Pipeline {
    const datasetDesc = 'A *.cells file that was exported via the preprocessing pipeline aggregator. This file contains images of single cells, that the model will be trained on.'
    
    return {
        steps: [
        { 
            title:'Foci Candidates',
            moduleID:'FociCandidates',
            renderer: <FociCandidates/>,
            parameters:FociCandidatesParams.parameters,
            inputKeys:{dataset:inputKeys.dataset},
            outputKeys:{cellImages:dataKeys.cellImages,sizes:dataKeys.candidateSizes}
        } as FociCandidatesParams.Step,
        { 
            title:'Labeling',
            moduleID:'Labeling',
            renderer: <Labeling/>,
            parameters:LabelingParams.parameters,
            inputKeys:{cellImages:dataKeys.cellImages, sizes:dataKeys.candidateSizes},
            outputKeys:{labels:dataKeys.labels, trainingData:dataKeys.trainingData}
        } as LabelingParams.Step,
        { 
            title:'Training',
            moduleID:'Training',
            renderer: <Training/>,
            parameters:TrainingParams.parameters,
            inputKeys:{labels:dataKeys.labels, trainingData:dataKeys.trainingData, sizes:dataKeys.candidateSizes},
            outputKeys:{model:dataKeys.model}
        } as TrainingParams.Step,
        //%NEWMODULE_STEP%
        ],
        disableBatchMode:true,
        name: 'Model Training',
        inputs: [
            {
                key: inputKeys.dataset,
                title: 'Dataset file', description: datasetDesc,
                loaders: {'cells': 'loadCells'},
                postProcessForJS: util.postProcessForImage //postprocessing fairly irrelevant
            }
        ],
        outputs: [
            {
                requiredInput: dataKeys.model,
                title:'Model File',
                description:'A file containing the trained model (and its training data) that can be used for automated classification in the Foci Detection pipeline.',
                suggestDestinationOutput:{
                    pipelineInputKey:inputKeys.dataset,
                    transform:suggestSuffixedFileName('_model','model')
                },
            }
        ],
        descriptions:{
            title:'Model Training',
            description:'This pipeline takes the dataset of cells and trains a model. The user is prompted to decide which parts of the cells are valid foci and the model learns this behaviour. Labelling at least 10-20 cells is recommended. The result is a model configuration that can be used in another pipeline to automatically classify foci.',
            thumb:<img src={thumb}/>
        }
    }
}

export default getPipeline;