import React from "react";
import * as util from '../../sammie/js/pipelines/pipelineutil'
import {suggestSuffixedFileName} from '../../sammie/js/pipelines/pipelineutil'
import {Pipeline} from "../../sammie/js/types/pipelinetypes";
import ResponsiveEmbed from 'react-responsive-embed'
//%NEWMODULE_IMPORT%

const inputKeys = {
    img1: 'Input File 1',
    img2: 'Input File 2',//these are example inputs
}
const dataKeys = {
    step1: 'Added Images', //example, some step for example adds these two images into one.
}

const helpScreen = <div>
    Here is the main Help Component for this Pipeline. You can even add a Video like so:
    <ResponsiveEmbed src='https://www.youtube.com/embed/QtzI1SwOdbY' allowFullScreen />
</div>

/**Optional Typing for the */
export type __NAME__BatchParameters = {

}

function getPipeline(): Pipeline {
    
    const datasetDesc = 'This description appears in the file loader when loading this file.'
    
    return {
        steps: [
            //No Steps defined yet. Use the main create Script to add Steps automatically.
            //This will work, as long as you keep the comment below.
            //%NEWMODULE_STEP%
        ],
        
        disableBatchMode:true, //wether or not batch mode is allowed.
        
        name: '__NAME__', //name of your pipeline
        
        //Define what data needs to be provided in DataInput screen to start the pipeline
        inputs: [
            {
                key: inputKeys.img1,
                title: 'First Image', description: datasetDesc,
                loaders: {'jpg,png,tif': 'loadImage'}, //this loader does not exist and is just for Demo purposes
                postProcessForJS: util.postProcessForImage //postprocessing
            },
            {
                key: inputKeys.img2,
                title: 'Second Image', description: datasetDesc,
                loaders: {'jpg,png,tif': 'loadImage'}, //this loader does not exist and is just for Demo purposes
                postProcessForJS: util.postProcessForImage //postprocessing
            }
        ],
        //Define what the outputs of this Pipeline are
        outputs: [
            {
                requiredInput: dataKeys.step1,
                title:'Sum of Two images',
                description:'This is the description that appears in the Export file screen.',
                
                //Should define a suggestion function for naming the output, makes it a lot easier for user to store files.
                suggestDestinationOutput:{
                    pipelineInputKey:inputKeys.img1,
                    transform:suggestSuffixedFileName('_sum','png')
                },
            }
        ],
        inputParameters:[
            /**If the single datbatches in this pipeline require inputs they go here.
             * The keys should be the same as defined by the __NAME__BatchParameters type above.*/
        ],
        
        //Info for user
        descriptions:{
            title:'__NAME__',
            description:'This description appears in switch pipeline screen.',
            //thumb:<img src={thumb}/>, //an optional thumb image to appear in switch pipeline screen
            helpscreen:helpScreen
        }
    }
}

export default getPipeline;