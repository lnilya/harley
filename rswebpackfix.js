/*CREATES TSX AND SCSS FILES, ADDS TO app.scss for ease of use*/

const fs = require('fs');
const colors = require('colors');

var wpFile = 'node_modules/react-scripts/config/webpackDevServer.config.js';

var data = fs.readFileSync(wpFile, 'utf8')
data = data.replace('ignored: ignoredFiles(paths.appSrc),', "ignored: [ignoredFiles(paths.appSrc),paths.appPublic+'/tmp'],");
fs.writeFileSync(wpFile, data);
console.log(`Successfully replaced wpconfig file`.bold.green);
