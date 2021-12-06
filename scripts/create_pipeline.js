const input = require("input");
const fs = require("fs");

async function createPipelineFile(name) {
    const templateFile = './.templates/newpipeline.tsx';
    const folder = './src/js/pipelines/'
    var fileName = name;
    if(!name.endsWith('Pipeline'))
        fileName = name + 'Pipeline.tsx'

    if (fs.existsSync(folder + fileName)) {
        const overwrite = await input.confirm(`File ${fileName} exists, overwrite?`);
        if (!overwrite) {
            console.log('Did not create a Pipeline file, it already exists.'.bold.red);
            return;
        }
    }

    //Write
    fs.readFile(templateFile, 'utf8', (err, data) => {
        if (err) throw err;

            var replacements = [
                { regex: /__NAME__/g, replacement:name },
            ];

            for (let i = 0; i < replacements.length; i++) {
                data = data.replace(replacements[i].regex, replacements[i].replacement);
            }

        fs.writeFile(folder+fileName, data, function (err) {
            if (err) throw err;
            console.log(`Created file ${folder + fileName}`.green + ` (Template: ${templateFile})`);
            console.log(`Note: You need to add the initialization of this pipeline to your init file (${folder}init.ts) manually to see it.\n`.blue.bold);

        });
    })


}

async function askInput() {
    console.log(`Add pipeline`);
    const name = await input.text(`Name your new Pipeline (one word)`)
    await createPipelineFile(name);
}

module.exports = askInput;