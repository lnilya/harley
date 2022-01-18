import React from "react";
import * as util from '../../sammie/js/pipelines/pipelineutil'
import * as server from '../../sammie/js/eel/eel'
import {suggestModifiedFilename, suggestSuffixedFileName} from '../../sammie/js/pipelines/pipelineutil'
import {Pipeline} from "../../sammie/js/types/pipelinetypes";
import ResponsiveEmbed from 'react-responsive-embed'
import * as DatasetAlignmentParams from '../modules/DatasetAlignment/params'
import DatasetAlignment from "../modules/DatasetAlignment/DatasetAlignment";
import {LocalFileWithPreview, PipelineData, PipelineDataKey} from "../../sammie/js/types/datatypes";
import * as ColocCellsParams from '../modules/ColocCells/params'
import ColocCells from "../modules/ColocCells/ColocCells";
import {getTextfieldInputParams} from "../../sammie/js/modules/paramutil";
import * as ColocGraphsParams from '../modules/ColocGraphs/params'
import ColocGraphs from "../modules/ColocGraphs/ColocGraphs";
import thumb from "../../assets/images/coloc_thumb.jpg";
//%NEWMODULE_IMPORT%

const inputKeys = {
    dataset1: 'Labeled Dataset 1',
    dataset2: 'Labeled Dataset 2',//these are example inputs
}
const dataKeys = {
    matchedDatasets: 'Matched Datasets', //example, some step for example adds these two images into one.
    colocCells: 'Included Cells', //example, some step for example adds these two images into one.
    graphData: 'Graph Data', //example, some step for example adds these two images into one.
}

const helpScreen = <div>
    Todo: Create Help Video for Colocalization
    <ResponsiveEmbed src='https://www.youtube.com/embed/QtzI1SwOdbY' allowFullScreen/>
</div>

/**Type for the Input Parameter of the whole pipeline*/
export type ColocalizationBatchParameters = {
    name0: string,
    name1: string
    '1px': number
}

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
                title: 'Cell Overview',
                moduleID: 'ColocCells',
                renderer: <ColocCells/>,
                parameters: ColocCellsParams.parameters,
                inputKeys: {alignedDatasets: dataKeys.matchedDatasets},
                outputKeys: {colocResult: dataKeys.colocCells}
            } as ColocCellsParams.Step,
            {
                title: 'Graphs',
                moduleID: 'ColocGraphs',
                renderer: <ColocGraphs/>,
                parameters: ColocGraphsParams.parameters,
                inputKeys: {colocResult: dataKeys.colocCells},
                outputKeys: {graphdata: dataKeys.graphData}
            } as ColocGraphsParams.Step,
            //%NEWMODULE_STEP%
        ],
        
        disableBatchMode: true, //wether or not batch mode is allowed.
        
        name: 'Colocalization', //name of your pipeline
        
        //Define what data needs to be provided in DataInput screen to start the pipeline
        inputs: [
            {
                key: inputKeys.dataset1,
                title: 'Labeled Dataset 1', description: datasetDesc,
                loaders: {'cells': ['loadCells',{normalize:false}]}, //this loader does not exist and is just for Demo purposes
                postProcessForJS: util.postProcessForImage, //postprocessing
                modifyBatchParameters:util.mergeMetaInformationWithBatchSettings
            },
            {
                key: inputKeys.dataset2,
                title: 'Labeled Dataset 2', description: datasetDesc,
                loaders: {'cells': ['loadCells',{normalize:false}]}, //this loader does not exist and is just for Demo purposes
                postProcessForJS: util.postProcessForImage //postprocessing
            }
        ],
        //Define what the outputs of this Pipeline are
        outputs: [
            {
                requiredInput: dataKeys.graphData,
                title:'Excel Graph Data',
                description:'Data used to generate the histograms. In Excel format, one sheet per graph',
                exporterParams: {format:'xlsx'},
                suggestDestinationOutput:{
                    pipelineInputKey:inputKeys.dataset1,
                    transform:suggestModifiedFilename(/(.*)\..*/g,'Graphs_$1.xlsx'),
                },
            },
            {
                requiredInput: dataKeys.graphData,
                title:'JSON Graph Data',
                description:'Data used to generate the histograms. In JSON format.',
                exporterParams: {format:'json'},
                suggestDestinationOutput:{
                    pipelineInputKey:inputKeys.dataset1,
                    transform:suggestModifiedFilename(/(.*)\..*/g,'Graphs_$1.json'),
                },
            },
            {
                requiredInput: dataKeys.colocCells,
                title:'Raw Data',
                description:<>
                        A Python <a href={"https://docs.python.org/3/library/pickle.html"} target={'_blank'} rel={'noreferrer'}>pickle</a> of foci as <a href="https://shapely.readthedocs.io/en/stable/manual.html#polygons" target={'_blank'} rel={'noreferrer'}>Shapely Polygon</a> instances
                        sorted by channel and cells. Images of single cells are included as well as displayed in the Cell Overview Step
                        Only cells selected in in Cell Overview step are included. For any post processing of colocalization.
                    </>,
                //Should define a suggestion function for naming the output, makes it a lot easier for user to store files.
                suggestDestinationOutput:{
                    pipelineInputKey:inputKeys.dataset1,
                    transform:suggestModifiedFilename(/(.*)\..*/g,'Foci_$1.pickle'),
                },
            }
        ],
        inputParameters: [
            getTextfieldInputParams('name0', 'Name Channel 1', 'You can give a name to Dataset 1, e.g. "Stress Granules". This will make the evaluation more legible.', 'Name...', ''),
            getTextfieldInputParams('name1', 'Name Channel 2', 'You can give a name to Dataset21, e.g. "P-Bodies". This will make the evaluation more legible.', 'Name...', ''),
            getTextfieldInputParams('1px','1px in nm','How many nanometers correspond to 1px. This is useful for your dataset to have the proper scale and allow downstream processing steps to access this information. If blank no conversion will be used and all downstream values will be in px.','Scale...','',null,false,'number'),
        ],
        //Info for user
        descriptions: {
            title: 'Colocalization',
            description: 'After processing two datasets through the Foci Detection Pipeline you can load them here and perform different colocalization measures, as well as evaluate different properties of overlapping/neighbouring foci against one another.',
            thumb:<img src={thumb}/>, //an optional thumb image to appear in switch pipeline screen
            helpscreen: helpScreen
        }
    }
}

export default getPipeline;