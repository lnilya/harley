import React from 'react';
import ReactDOM from 'react-dom';
import './sammie/scss/index.scss';
import App from "./sammie/js/App";
import './sammie/js/eel/eelJsFunctions'
import {RecoilRoot} from "recoil";
import {SnackbarProvider} from "notistack";
import {ThemeProvider, Zoom} from "@mui/material";
import {pipelineDefinitions, theme} from "./js/__config";

window['eel']?.set_host('ws://localhost:1234');

ReactDOM.render(
    <ThemeProvider theme={theme}>
        <SnackbarProvider maxSnack={3}
                          autoHideDuration={3000}
                          TransitionComponent={Zoom} anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}>
            <RecoilRoot>
                <App getPipelineDefinitions={pipelineDefinitions}/>
            </RecoilRoot>
        </SnackbarProvider>
    </ThemeProvider>, document.getElementById('root'));