const colors = require('colors');
const fs = require('fs');
const input = require('input');

const createPipelineStep = require('./scripts/create_pipelinestep')
const createPipelineComponent = require('./scripts/create_file_in_pipelinestep')
const createSammieComponent = require('./scripts/create_sammie_file')
const createPipeline = require('./scripts/create_pipeline')

async function askInput() {
    console.log(`\nThis script creates common elements in development. Refer to .templates and .templates_py folders to see the used templates.\n`.blue);
    const options = {
        'New Pipeline Step':createPipelineStep,
        'New React Component (TSX/SCSS) for a Pipeline Step':createPipelineComponent,
        'New React Component (TSX/SCSS) for Sammie':createSammieComponent,
        'New Pipeline':createPipeline,
    }
    let t = await input.select('What do you want to create?', Object.keys(options) );

    //Call the script:
    options[t]();
}

askInput();