import {createTheme} from "@material-ui/core";
import {getPipelineDefinitions} from "./js/pipelines/init";


/**Main function to initialize all pipelines*/
export const pipelineDefinitions = getPipelineDefinitions;

/**A Material UI theme that governs part of the UI*/
export const theme = createTheme({
    palette: {
        primary: {
            main: '#FF7F50',
        },
        secondary: {
            main: '#4A5568',
            // main: '#9eb8de',
        }
    },
    typography: {
        fontFamily: [
            'OpenSans',
            'sans-serif'
        ].join(','),
    },
});

