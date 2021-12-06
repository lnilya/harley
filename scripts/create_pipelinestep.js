/*CREATES TSX AND SCSS FILES, ADDS TO app.scss for ease of use*/

const input = require('input');
const colors = require('colors');
const fs = require('fs');
const ncp = require('ncp').ncp;

const moduleTemplateFolderJS = './.templates/PipelineModule/'
const moduleTemplatePY = './.templates_py/PipelineModule.py'
const moduleFolderJS = './src/js/modules/'
const moduleFolderPY = './src/py/modules/'
const eelinterfacePY = './src/py/eelinterface.py'
const pipelineJSFolder = './src/js/pipelines/'
const excludedInPipelineFolder = ['pipelineutil.ts']

const toSnakeCase = (str) => {
    return str.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
        .map(x => x.toLowerCase())
        .join('-');
}
var template = {
    pyfiles: {
        main: 'PipelineModule.py',
    },
    jsfiles: {
        main: 'PipelineModule.tsx',
        scss: 'scss/PipelineModule.scss',
        server: 'server.ts',
        params: 'params.tsx'
    }
}
var params = {
    modulename: '',
    modulefolder: '',
}

async function askInput() {

    var pipefiles = fs.readdirSync(pipelineJSFolder)
    pipefiles = pipefiles.filter((fn)=>excludedInPipelineFolder.indexOf(fn) == -1)
    pipefiles = pipefiles.map((f)=>f.split('.')[0])
    var pipeline = await input.select(`Choose Pipeline to add the module to`, pipefiles);
    pipeline = pipelineJSFolder + pipeline + '.tsx'

    params.modulename = await input.text('Name of the Module?', {default: 'Module'});
    if (fs.existsSync(moduleFolderJS + params.modulename)) {
        const overwrite = await input.confirm(`${params.modulename} exists, overwrite?`);
        if(overwrite){
            fs.rmdirSync(moduleFolderJS + params.modulename+'/',{ recursive: true })
            fs.unlinkSync(moduleFolderPY + params.modulename+'.py')
            console.log(`Removed old files`.yellow);
        }else{
            console.log(`Ok, then not.`.green);
            return;
        }
    }
    await copyModuleTemplateJS();
    copyModuleTemplatePY();
    renameFiles();
    replacePlaceholders();
    extendEeelInterfacePy();
    extendPipeline(pipeline);
    console.log(`-------------`);
    console.log(`Successfully created new Module: ${params.modulename}`.bgGreen);
}

async function copyModuleTemplatePY() {
    fs.copyFileSync(moduleTemplatePY, moduleFolderPY + params.modulename + '.py')
}

async function copyModuleTemplateJS() {
    if (fs.existsSync(moduleFolderJS + params.modulename)) {
        console.log(`Module ${params.modulename} already exists`.bold.red);
        return;
    }
    return new Promise((resolve, reject) => {
        // fs.mkdir(moduleFolderJS + params.modulename);
        ncp(moduleTemplateFolderJS, moduleFolderJS + params.modulename, function (err) {
            if (err) {
                console.error(err.bold.red);
            }
            params.modulefolder = moduleFolderJS + params.modulename + '/';
            console.log(`Successfully Copied Template`.bold.green);
            resolve()
        })
    })
}

/**Rename main py, tsx and scss file*/
function renameFiles() {
    fs.renameSync(params.modulefolder + template.jsfiles.main, params.modulefolder + params.modulename + '.tsx',)
    fs.renameSync(params.modulefolder + template.jsfiles.scss, params.modulefolder + 'scss/' + params.modulename + '.scss')
}

/**Will replace placeholders*/
function replacePlaceholders() {
    var replacements = [
        {regex: /__NAME__/g, replacement: params.modulename},
        {regex: /__NAME_LC__/g, replacement: toSnakeCase(params.modulename)}
    ];
    const replaceInSingleFile = (fname) => {
        var data = fs.readFileSync(fname, 'utf8')
        for (let i = 0; i < replacements.length; i++) {
            data = data.replace(replacements[i].regex, replacements[i].replacement);
        }
        fs.writeFileSync(fname, data);
    }
    for (let jsf in template.jsfiles) {
        let path = template.jsfiles[jsf].replace('PipelineModule', params.modulename)
        replaceInSingleFile(params.modulefolder + path)
    }
    for (let pyf in template.pyfiles) {
        let path = template.pyfiles[pyf].replace('PipelineModule', params.modulename)
        replaceInSingleFile(moduleFolderPY + path)
    }
    console.log(`Successfully Replaced Placeholders`.bold.green);
}


function extendEeelInterfacePy(){
    var data = fs.readFileSync(eelinterfacePY, 'utf8')
    var placeholder = '#%NEW_MODULE%';

    var newData = `elif moduleName == '${params.modulename}':
            from src.py.modules.${params.modulename} import ${params.modulename}
            modulesById[moduleID] = ${params.modulename}(moduleID,session)`

    if(data.indexOf(placeholder) == -1){
        console.log('Error:'.bold.red + ' eelinterface.py seems not to have the placeholder tag '.red + placeholder.red);
        return;
    }
    data = data.replace(placeholder, newData + "\n        " + placeholder );

    fs.writeFileSync(eelinterfacePY, data);
    console.log(`Successfully added ModuleImport to eelinterface.py`.bold.green);
}

function extendPipeline(pipeFile){
   var data = fs.readFileSync(pipeFile, 'utf8')
    var importPlaceholder = '//%NEWMODULE_IMPORT%';
    var stepPlaceholder = '//%NEWMODULE_STEP%';

    var newImport = `import * as ${params.modulename}Params from '../modules/${params.modulename}/params'`;
    newImport += `\nimport ${params.modulename} from "../modules/${params.modulename}/${params.modulename}";`

    var newStep = `{ 
            title:'${params.modulename}',
            moduleID:'${params.modulename}',
            renderer: <${params.modulename}/>,
            parameters:${params.modulename}Params.parameters,
            inputKeys:{},
            outputKeys:{}
        } as ${params.modulename}Params.Step,`

    if(data.indexOf(importPlaceholder) == -1){
        console.log('Error:'.bold.red + ' pipeline.tsx seems not to have the placeholder tag '.red + importPlaceholder.red);
        return;
    }
    if(data.indexOf(stepPlaceholder) == -1){
        console.log('Error:'.bold.red + ' pipeline.tsx seems not to have the placeholder tag '.red + stepPlaceholder.red);
        return;
    }
    data = data.replace(importPlaceholder, newImport + "\n" + importPlaceholder );
    data = data.replace(stepPlaceholder, newStep + "\n        " + stepPlaceholder );


    fs.writeFileSync(pipeFile, data);
    console.log(`Successfully added new Module as last step in pipeline`.bold.green);
}

module.exports = askInput;