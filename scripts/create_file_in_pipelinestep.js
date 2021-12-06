/*CREATES TSX AND SCSS FILES, ADDS TO app.scss for ease of use*/

const colors = require('colors');
const _ = require('lodash');
const fs = require('fs');
const input = require("input");

const toSnakeCase = (str) =>{
    return str.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
        .map(x => x.toLowerCase())
        .join('-');
}

async function writeModel(folder,name){

    //different template files for different types.
    var tsxTemplates = ['./.templates/moduledefault.tsx'];


    var pathSCSS = folder+'scss/'+name+'.scss';

    await writeTSX(getExistingTemplate(tsxTemplates), folder + name + '.tsx',name);
    await writeSCSS(pathSCSS,name);
}



//TSX FILE
async function writeTSX(templatePath,resultPath,componentName){
    const fullName =require('fullname') ;
    var  authorName = await fullName();
    if(fs.existsSync(resultPath)){
        const overwrite = await input.confirm(`${resultPath} exists, overwrite?`);
        if(!overwrite){
            console.log('Skipped creation of TSX file, it already exists.'.bold.red);
            return;
        }else{
            console.log(`File ${resultPath} already exists and will be overwritten.`.bold.yellow);
        }
    }
    return new Promise((resolve)=>{
        fs.readFile(templatePath,'utf8',(err,data)=>{
            if(err) throw err;

            var replacements = [
                { regex: /__NAME__/g, replacement:componentName },
                { regex: /__NAME_LC__/g, replacement:toSnakeCase(componentName) },
                { regex: /__AUTHOR__/g, replacement:authorName },
            ];

            for (let i = 0; i < replacements.length; i++) {
                data = data.replace(replacements[i].regex, replacements[i].replacement);
            }

            fs.writeFile(resultPath, data, function (err) {
                if (err) throw err;
                console.log(`Success: TSX File created at ${resultPath}`.green + ` (Template: ${templatePath})`);
                resolve();
            });

        })
    })
}

async function writeSCSS(pathSCSS,name){
    /* SCSS FILE */
    if(fs.existsSync(pathSCSS)){
        const overwrite = await input.confirm(`${pathSCSS} exists, overwrite?`);
        if(!overwrite){
            console.log('Skipped creation of SCSS file, it already exists.'.bold.red);
            return;
        }else{
            console.log(`File ${pathSCSS} already exists and will be overwritten.`.bold.yellow);
        }
    }

    fs.writeFile(pathSCSS, `
@import '../../../../sammie/scss/global/variables';
@import '../../../../sammie/scss/global/mixins';

.${toSnakeCase(name)}{\n\n}`, function (err) {
        if (err) throw err;
        console.log('Success: SCSS File created'.green);
    });

}

function getExistingTemplate(templateFiles){
    for (let i = 0; i < templateFiles.length; i++) {
        if(fs.existsSync(templateFiles[i]))return templateFiles[i];
    }
    console.log('Error:'.bold.red + ' There seem to be no template files defined at all. ');
    return null; //no templates found at all...
}



async function askInput(){
    const moduleFolder = './src/js/modules/';
    var modules = fs.readdirSync(moduleFolder)
    var module = await input.select(`To Which Pipelinestep do you want to add a Component?`, modules);
    const name = await input.text(`Name your component. (Do not include file extension, use CamelCase.)`)

    writeModel(moduleFolder+module+'/',name)


}
module.exports = askInput;