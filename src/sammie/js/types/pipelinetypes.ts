import * as datatypes from "./datatypes";
import {
    LocalFileWithPreview,
    PipelineData,
    PipelineDataAggregatorID,
    PipelineDataKey,
    PipelineDataLoaderID,
    PipelineName
} from "./datatypes";
import {ReactNode} from "react";
import {ModuleID} from "./uitypes";
import {Parameter, ParameterKey} from "../modules/paramtypes";


export type PipelineDataLoader = PipelineDataLoaderID|[PipelineDataLoaderID,Record<string, any>]

/**Describes an Input into the pipeline*/
export type PipelineInput = {
    key: PipelineDataKey,
    /**UI Title for this Input*/
    title?: string,
    /**UI Description/Help for this Input*/
    description?: ReactNode,
    /**A dictionary of fileExtensions and loaders to use for this type of file
     * A loader can either be just the ID or a tuple of ID and parameters dictionary to pass to loader funciton in python*/
    loaders: Record<string, PipelineDataLoader >
    
    /**A function that will parse the loaded File with its preview into an atom of pipelinedata.
     *
     * If the input is an image for example: A localfile will contain the URL of the image, and it will contain width and height as meta-data components
     * This function will then transform this format into a PipelineImage, which generally only contains url, width and height
     * for an image. All it has to do then is to copy and paste Width and Height metadata entry and
     * put them into the correct structure for PipelineImage datatype.
     * In other cases this might be more complicated. For example if we are loading a dataset file like a CSV that has a preview image but some unrelated data.
     * The data parameter here will simply contain the CSV file and none of the actual content.
     * Sine this function is asynchroneous it can at this point use any communication to actually load the data and bring it into a format required.
     * It will run once the batch is loaded into the pipeline and start executing.
     * */
    postProcessForJS:(data:LocalFileWithPreview, plk:PipelineDataKey)=>Promise<PipelineData>
    
    /**
     * When a file is loaded we can use some of its metadata to set parameters for this batch. An example is when the
     * loaded microscopy image contains a scale e.g. "1px = 40.9nm". In that case we might want to set
     * the scale automatically to the settings of this batch, without the user having to put it manually.
     * This function asynchroneously transforms the current settings given the file data.
     * The metadata in the preview can come from any of file loaders on py side. It is probably mostly useful if you are writing
     * your own loaders, since the default loaders don't give more than very basic metadata.
     * */
    modifyBatchParameters?:(data:LocalFileWithPreview,currentSettings:Record<ParameterKey, any>,inputParams:Array<Parameter<any>>)=>Promise<Record<ParameterKey, any>>
}

/**Aggregates are similar outputs with the difference that they do not overwrite a file, but append the results of
 * the current batch to it. An example is a CSV file that simply grows as new batches are processed. They
 * are a way to join the outputs of multiple batches run through the pipeline into a single output, that can in turn
 * be used in another pipeline as input.*/
export type PipelineAggregatorOutput = {
    /**All required keys that need to be ready in order for this Aggregate to be available/exportable.*/
    requiredInputs:Array<PipelineDataKey>
    
    /**The name of the funciton on py side to call for this export*/
    aggregatorID:PipelineDataAggregatorID,
    
    /**Optional parameters that will be passed to the aggregator function*/
    exporterParams?:Record<string, any>
    
    /**Title for Exporter UI*/
    title:string,
    
    /**Description for Exporter UI*/
    description: ReactNode
    
}

/**Defines the way data is exported*/
export type PipelineOutput = {
    
    /**The key of the data to export, must exist in pipeline as output of some step.
     * When this key becomes available in the pipeline this output can be exported.
     * This key will also identify which modul on py side to ask to commence the export*/
    requiredInput:PipelineDataKey
    
    /**Optional parameters that will be passed to the modules runExport function*/
    exporterParams?:Record<string, any>
    
    /**
     * If provided will be called by exporter to generate a name suggestion for output destination
     * for the output file based on the inputfile used. If not user will have to input it manually.
     * Designed to create a new output path that will appear in the destination textfield of this pipelineoutput.
     */
    suggestDestinationOutput?:{
        /**The key of pipelineData that was loaded via DataLoader in first step before pipeline,
         * since only them have LocalFilePreviews, that contain things like a path.*/
        pipelineInputKey:PipelineDataKey,
        /**FileName Transformation function recieves the LFWP and generates a new full output path from it*/
        transform:(lfp:LocalFileWithPreview)=>string
    }
    
    
    /**Title for Exporter UI*/
    title:string,
    
    /**Description for Exporter UI*/
    description: ReactNode
}

/**Describes the UI at one step of the pipeline*/
export type PipelineStep<PipelineInputs,PipelineOutputs> = {
    title:string,
    moduleID:ModuleID,//any name that uniquely identifies this module
    renderer:ReactNode
    parameters:Array<Parameter<any>>,
    inputKeys?: Record<keyof PipelineInputs,datatypes.PipelineDataKey>
    outputKeys?: Record<keyof PipelineOutputs, datatypes.PipelineDataKey>
    
    /**Parameters passed to the server to initialize the respective module*/
    serverParameters?: Record<string, any>
}

/**Describes total settings for a single Pipeline*/
export type Pipeline = {
    /**A unique name for the Pipeline used in the UI, should be short to appear for example in dropdowns.*/
    name: PipelineName
    
    /**Array of input files to put into the pipeline*/
    inputs: Array<PipelineInput>
    
    /**Parameters set for one batch of data. Usually reserved for something related to input data.
     * for example the resolution of images (e.g. 1px = 40.9nm). FileLoaders have the possibility to change these parameter when a file is loaded.*/
    inputParameters?: Array<Parameter<any>>
    
    /**Array of available outputs for this pipeline batch, user might not use all*/
    outputs: Array<PipelineOutput>
    
    /**Array of available aggreagator outputs for this pipeline. Similar to outputs, but aggregators append data to a file, rather than simply creating new files with outputs.
     * A CSV growing as batch by batch gets processed is a n example. */
    aggregatorOutputs?: Array<PipelineAggregatorOutput>
    
    /**Steps of pipeline*/
    steps: Array<PipelineStep<any, any>>
    
    /**Help String */
    descriptions?:{
        /**The possibly longer title of this pipeline*/
        title?:ReactNode
        /**Long Description of what this pipeline is doing in a paragraph or two.*/
        description?:ReactNode
        /**Thumbnail for this Pipeline*/
        thumb?:ReactNode
        /**Helpscreen Component*/
        helpscreen?:ReactNode
    },
    
    /**Default:false. If set to true, will not allow users to run in batchmode. Makes sense for pipelines requiring manual inputs (e.g. labeling, choosing). A pipeline not allowing batchmode can be sometimes faster to implement.*/
    disableBatchMode?:boolean
}

/**Settings related to the whole pipeline. Like wether or not to run exports or aggregators*/
export type GlobalPipelineSettings = {
    /**Which batch exports to run*/
    runBatchExports:Array<PipelineDataKey>,
    
    /**Which pipeline aggregators to run*/
    runAggregatorExports:Array<PipelineDataAggregatorID>,
    
    /**Milliseconds of pause between steps, allows to see results while running batchmode*/
    pauseUIToSeeResults:number,
}