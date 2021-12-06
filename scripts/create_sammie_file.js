/*CREATES TSX AND SCSS FILES, ADDS TO app.scss for ease of use*/

const colors = require('colors');
const _ = require('lodash');
const input = require('input');
const fs = require('fs');

const toSnakeCase = (str) =>{
    return str.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
        .map(x => x.toLowerCase())
        .join('-');
}

async function createFile(compname,filename){

    //different template files for different types.
    var tsxTemplates = [`./.templates/default-${compname}.tsx`,'./.templates/default.tsx'];

    var path = './src/sammie/js/ui/'+compname+'/';
    var pathSCSS = './src/sammie/scss/'+compname + '/' + filename + '.scss';

    await writeTSX(getExistingTemplate(tsxTemplates), path + filename + '.tsx',filename,compname);
    console.log(`\n`);
    await writeSCSS(pathSCSS,filename);
}



//TSX FILE
async function writeTSX(templatePath,resultPath,componentName,compname){
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

    fs.readFile(templatePath,'utf8',(err,data)=>{
        if(err) throw err;

        var replacements = [
            { regex: /__NAME__/g, replacement:componentName },
            { regex: /__NAME_LC__/g, replacement:toSnakeCase(componentName) },
            { regex: /__AUTHOR__/g, replacement:authorName },
            { regex: /__COMP__/g, replacement:compname },
        ];

        for (let i = 0; i < replacements.length; i++) {
            data = data.replace(replacements[i].regex, replacements[i].replacement);
        }

        fs.writeFile(resultPath, data, function (err) {
            if (err) throw err;
            console.log(`Success: TSX File created at ${resultPath}`.green + ` (Template: ${templatePath})`);
        });
    })
}

async function writeSCSS(pathSCSS,filename){
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

    const attachToGlobalSCSS = false;
    var fileContent = `.${toSnakeCase(filename)}{\n\n}`
    if(!attachToGlobalSCSS)
        fileContent = `@import "../global/variables";\n@import "../global/mixins";\n\n` + fileContent;

    fs.writeFile(pathSCSS, fileContent, function (err) {
        if (err) throw err;
        console.log('Success: SCSS File created'.green);
    });

    if(attachToGlobalSCSS){
        //ATTACH SCSS import TO app.scss
        var compnamePlaceholder = "/*@"+compname+"@*/";
        fs.readFile('./src/scss/index.scss', 'utf8',(err, data) => {
            if (err) throw err;
            var newLine = `@import "${compname}/${filename}";`
            if(data.indexOf(compnamePlaceholder) == -1){
                console.log('Error:'.bold.red + ' App.scss seems not to have the placeholder tag '.red + compnamePlaceholder.red);
                return;
            }

            data = data.replace(compnamePlaceholder, newLine + "\n" + compnamePlaceholder );
            fs.writeFile('./src/scss/index.scss', data,(err, data) => {
                if (err) throw err;
                console.log('Success: Adding import to app.scss'.green);
            });
        });
    }
}

function getExistingTemplate(templateFiles){
    for (let i = 0; i < templateFiles.length; i++) {
        if(fs.existsSync(templateFiles[i]))return templateFiles[i];
    }
    console.log('Error:'.bold.red + ' There seem to be no template files defined at all. ');
    return null; //no templates found at all...
}



async function askInput(){
    console.log(`\nBy convention Elements are small building blocks of the UI, that can be reused in different modules.\nModules on the other hand are bigger pieces of UI combining multiple elements.\nThose two are stored in different folders for a better structure of the project.\n`.blue);
    const type = await input.select('Create a Module or an Element?',['Module','Element'])
    const name = await input.text(`Name your ${type}. (Do not include file extension, use CamelCase.)`)

    var folder = '';
    switch(type){
        case 'Module': folder = 'modules'; break;
        case 'Element': folder = 'elements'; break;
    }

    createFile(folder,name);

}
module.exports = askInput;