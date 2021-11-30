import React from 'react';
import ReactDOM from 'react-dom';
import './scss/index.scss';
import App from "./js/App";
import './js/eel/eelJsFunctions'
import {RecoilRoot} from "recoil";
import {createTheme} from "@material-ui/core";
import {ThemeProvider} from '@material-ui/core/styles';
import {SnackbarProvider} from "notistack";
import {Zoom} from "@mui/material";


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
            <SnackbarProvider maxSnack={3}
                              autoHideDuration={3000}
                              TransitionComponent={Zoom} anchorOrigin={ { vertical: 'bottom', horizontal: 'right'}}>
                <App/>
            </SnackbarProvider>
        </RecoilRoot>
    </ThemeProvider>, document.getElementById('root'));