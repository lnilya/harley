import React from "react";
import * as util from '../../sammie/js/pipelines/pipelineutil'
import * as server from '../../sammie/js/eel/eel'
import {suggestSuffixedFileName} from '../../sammie/js/pipelines/pipelineutil'
import {Pipeline} from "../../sammie/js/types/pipelinetypes";
import ResponsiveEmbed from 'react-responsive-embed'
import * as DatasetAlignmentParams from '../modules/DatasetAlignment/params'
import DatasetAlignment from "../modules/DatasetAlignment/DatasetAlignment";
import {LocalFileWithPreview, PipelineData, PipelineDataKey} from "../../sammie/js/types/datatypes";
import * as ColocCellsParams from '../modules/ColocCells/params'
import ColocCells from "../modules/ColocCells/ColocCells";
//%NEWMODULE_IMPORT%

const inputKeys = {
    dataset1: 'Labeled Dataset 1',
    dataset2: 'Labeled Dataset 2',//these are example inputs
}
const dataKeys = {
    matchedDatasets: 'Matched Datasets', //example, some step for example adds these two images into one.
    includedCells: 'Included Cells', //example, some step for example adds these two images into one.
}

const helpScreen = <div>
    Todo: Create Help Video for Colocalization
    <ResponsiveEmbed src='https://www.youtube.com/embed/QtzI1SwOdbY' allowFullScreen/>
</div>


function getPipeline(): Pipeline {
    
    const datasetDesc = 'The dataset is a *.cells file as exported by the FociDetection pipeline, it will contain the labels for the foci you identified. Both files should obviously originate from different channels fo the same microscopy picture.'
    
    return {
        steps: [
            //No Steps defined yet. Use the main create Script to add Steps automatically.
            //This will work, as long as you keep the comment below.
            {
                title: 'Dataset Alignment',
                moduleID: 'DatasetAlignment',
                renderer: <DatasetAlignment/>,
                parameters: DatasetAlignmentParams.parameters,
                inputKeys: {set0: inputKeys.dataset1, set1: inputKeys.dataset2},
                outputKeys: {alignedDatasets: dataKeys.matchedDatasets}
            } as DatasetAlignmentParams.Step,
            {
                title: 'ColocCells',
                moduleID: 'ColocCells',
                renderer: <ColocCells/>,
                parameters: ColocCellsParams.parameters,
                inputKeys: {alignedDatasets:dataKeys.matchedDatasets},
                outputKeys: {includedCells:dataKeys.includedCells}
            } as ColocCellsParams.Step,
            //%NEWMODULE_STEP%
        ],
        
        disableBatchMode: true, //wether or not batch mode is allowed.
        
        name: 'Colocalization', //name of your pipeline
        
        //Define what data needs to be provided in DataInput screen to start the pipeline
        inputs: [
            {
                key: inputKeys.dataset1,
                title: 'Labeled Dataset 1', description: datasetDesc,
                loaders: {'cells': 'loadCells'}, //this loader does not exist and is just for Demo purposes
                postProcessForJS: util.postProcessForImage //postprocessing
            },
            {
                key: inputKeys.dataset2,
                title: 'Labeled Dataset 2', description: datasetDesc,
                loaders: {'cells': 'loadCells'}, //this loader does not exist and is just for Demo purposes
                postProcessForJS: util.postProcessForImage //postprocessing
            }
        ],
        //Define what the outputs of this Pipeline are
        outputs: [
            // {
            //     requiredInput: dataKeys.matchedDatasets,
            //     title:'Sum of Two images',
            //     description:'This is the description that appears in the Export file screen.',
            //
            //     //Should define a suggestion function for naming the output, makes it a lot easier for user to store files.
            //     suggestDestinationOutput:{
            //         pipelineInputKey:inputKeys.img1,
            //         transform:suggestSuffixedFileName('_sum','png')
            //     },
            // }
        ],
        
        //Info for user
        descriptions: {
            title: 'Colocalization',
            description: 'After processing two datasets through the Foci Detection Pipeline you can load them here and perform differen colocalization measures.',
            //thumb:<img src={thumb}/>, //an optional thumb image to appear in switch pipeline screen
            helpscreen: helpScreen
        }
    }
}

export default getPipeline;