import React from 'react';
import ReactDOM from 'react-dom';
import './scss/index.scss';
import App from "./sammie/js/App";
import './sammie/js/eel/eelJsFunctions'
import {RecoilRoot} from "recoil";
import {ThemeProvider} from '@material-ui/core/styles';
import {SnackbarProvider} from "notistack";
import {Zoom} from "@mui/material";
import {pipelineDefinitions, theme} from "./js/__config";

window['eel']?.set_host('ws://localhost:1234');

ReactDOM.render(
    <ThemeProvider theme={theme}>
        <RecoilRoot>
            <SnackbarProvider maxSnack={3}
                              autoHideDuration={3000}
                              TransitionComponent={Zoom} anchorOrigin={ { vertical: 'bottom', horizontal: 'right'}}>
                <App getPipelineDefinitions={pipelineDefinitions}/>
            </SnackbarProvider>
        </RecoilRoot>
    </ThemeProvider>, document.getElementById('root'));