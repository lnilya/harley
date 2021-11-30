/*CREATES TSX AND SCSS FILES, ADDS TO app.scss for ease of use*/

const colors = require('colors');
const _ = require('lodash');

const toSnakeCase = (str) =>{
    return str.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
        .map(x => x.toLowerCase())
        .join('-');
}



if(process.argv.length < 3){
    console.log('Error'.bold.red + 'Not enough arguments. first: M,E for type, second: Name of file'.red);
    return;
}

var type = process.argv[2];
var filename = process.argv[3];

var overwrite = process.argv.indexOf('-o') != -1;

//different template files for different types.
var tsxTemplates = [`./.templates/default-${type}.tsx`,'./.templates/default.tsx'];


var path = './src/js/ui/';
var pathSCSS = './src/scss/';
var compname = '';
if(type.toLowerCase() == 'e') compname = 'elements';
else if(type.toLowerCase() == 'm') compname = 'modules';
else{
    console.log('Error:'.bold.red+' Component name must be e=Element, m=Module'.red);
    return;
}


path += compname + '/';
pathSCSS += compname + '/' + filename + '.scss';
const fs = require('fs');

//TSX FILE
async function writeTSX(templatePath,resultPath,componentName){
    const fullName =require('fullname') ;
    var  authorName = await fullName();
    if(fs.existsSync(resultPath)){
        if(!overwrite){
            console.log('Error: '.bold.red + `Cannot create TSX file ${resultPath}. It already exists.`.red);
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

function writeSCSS(){
    /* SCSS FILE */
    if(fs.existsSync(pathSCSS)){
        if(!overwrite){
            console.log('Error: '.bold.red + `Cannot create SCSS file ${pathSCSS}. It already exists.`.red);
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


writeTSX(getExistingTemplate(tsxTemplates), path + filename + '.tsx',filename);
writeSCSS();