import {getPipelineDefinitions} from "./pipelines/init";
import {createTheme} from "@mui/material";
import packageJson from "../../package.json";
import React, {ReactNode} from "react";


/**Main function to initialize all pipelines*/
export const pipelineDefinitions = getPipelineDefinitions;

/**A Material UI theme that governs part of the UI. Most UI is set in SCSS*/
export const theme = createTheme({
    palette: {
        primary: {
            main: '#FF7F50ff',
        },
        secondary: {
            main: '#4A5568',
        }
    },
    typography: {
        fontFamily: [
            'OpenSans',
            'sans-serif'
        ].join(','),
    },
});

/**Name for algoithm displayed in top left corner*/
export const algorithmName: string = `HARLEY (${packageJson.version})`;

/**Logo for algoithm displayed in top left corner*/
export const algorithmLogo: ReactNode = (
    <svg width="25px" height="25px" viewBox="0 0 25 25" version="1.1" xmlns="http://www.w3.org/2000/svg">
        <g id="Group" transform="translate(0.500030, 0.500000)" fillRule="nonzero">
            <path fill="#ffffff"
                  d="M18.8572776,3.42842449 L19.6646629,4.23598128 C21.229719,5.80103735 21.6171503,8.19262995 20.6281963,10.1723502 L20.5715657,10.2856163 L12.0000759,10.2856163 L5.14288408,13.7142122 L5.14288408,22.285702 C5.14288408,23.2319945 5.91088957,24 6.85718204,24 C7.80347451,24 8.57148,23.2319945 8.57148,22.285702 L8.57148,19.7142551 C8.57148,18.2948164 9.72348823,17.1428082 11.1429269,17.1428082 L18.0001188,17.1428082 C19.4195575,17.1428082 20.5715657,18.2948164 20.5715657,19.7142551 L20.5715657,22.285702 C20.5715657,23.2319945 21.3395712,24 22.2858637,24 C23.2321561,24 24.0001616,23.2319945 24.0001616,22.285702 L24.0001616,8.57131837 C24.0001616,5.73067767 21.6979085,3.42842449 18.8572678,3.42842449 L18.8572776,3.42842449 Z"
                  id="Path"></path>
            <path fill="#ffffff"
                  d="M6.00004286,0 L5.14289388,3.42859592 L0,5.14289388 L0.627384073,7.65081383 C0.76972958,8.22343833 1.19829427,8.68110691 1.75891869,8.86458577 L4.14345817,9.64116274 L4.74517675,12.0000367 L11.1429367,8.88006343 L6.00004286,0 Z"
                  id="Path"></path>
        </g>
    </svg>
);

/**Content of the algorithm description screen (click on logo in top left)*/
export const welcomeScreen: ReactNode = (
    <>
        <div className="text-center">
            <h1>HARLEY</h1>
            <span className={'col-main'}>v. {packageJson.version}</span>
            <h4><em>H</em>uman <em>A</em>ugmented <em>R</em>ecognition of <em>L</em>LPS Ensembles in <em>Y</em>east</h4>
        </div>
        <div className={'pad-300-top main-text'}>
            Harley is a software platform for working with yeast microscopy data,
            developed at the Buchan Lab at the University of Arizona by Ilya Shabanov and Ross Buchan.
            <br/>
            The software was developed to elimenate experimenter bias in yeast microscopy data quantification. Please
            refer to <a href="https://www.biorxiv.org/content/10.1101/2021.11.29.470484v1">[Shabanov and Buchan, 2021,
            Paper]</a> for information
            about the surprising discrepancies between human experimenters and what this software can do better.
            <br/>
            You will find information about how to use the software integrated into the next screen.
        </div>
    </>
);