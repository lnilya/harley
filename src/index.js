import React from 'react';
import ReactDOM from 'react-dom';
import './scss/index.scss';
import App from "./sammie/js/App";
import './sammie/js/eel/eelJsFunctions'
import {RecoilRoot} from "recoil";
import {createTheme} from "@material-ui/core";
import {ThemeProvider} from '@material-ui/core/styles';
import {SnackbarProvider} from "notistack";
import {Zoom} from "@mui/material";
import {getPipelineDefinitions} from "./js/pipelines/init";


window['eel']?.set_host('ws://localhost:1234');

const theme = createTheme({
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

ReactDOM.render(
    <ThemeProvider theme={theme}>
        <RecoilRoot>
            {/*Add Configuration for Toast display here */}
            <SnackbarProvider maxSnack={3}
                              autoHideDuration={3000}
                              TransitionComponent={Zoom} anchorOrigin={ { vertical: 'bottom', horizontal: 'right'}}>
                <App getPipelineDefinitions={getPipelineDefinitions}/>
            </SnackbarProvider>
        </RecoilRoot>
    </ThemeProvider>, document.getElementById('root'));