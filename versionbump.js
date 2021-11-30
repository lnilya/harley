/*CREATES TSX AND SCSS FILES, ADDS TO app.scss for ease of use*/

const input = require('input');
const colors = require('colors');
const fs = require('fs');
const ncp = require('ncp').ncp;

const htmlfile = './public/index.html'
const pacakgeJSON = './package.json'

function changeHTML(v) {
    var data = fs.readFileSync(htmlfile, 'utf8')
    data = data.replace(/<title>Harley - v.*?<\/title>/ig, "<title>Harley - v "+v+"</title>");
    fs.writeFileSync(htmlfile, data);
    console.log(`Replaced Index.html`);
}
function changePackage(v) {
    var data = fs.readFileSync(pacakgeJSON, 'utf8')
    data = data.replace(/("version":\s)"(.*?)"/ig, `$1"${v}"`);
    v = v.replace('.','-')
    data = data.replace(/harley-(.*?)\s/ig, `harley-${v} `);
    fs.writeFileSync(pacakgeJSON, data);
    console.log(`Replaced Package.json`);
}

async function askInput(){
    const newVersion = await input.text('New Version Num:', {default: '0.0.1'});
    changeHTML(newVersion)
    changePackage(newVersion)
}

askInput()