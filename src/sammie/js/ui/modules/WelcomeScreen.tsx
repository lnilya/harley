import React from "react";
import {ccl} from "../../util";
import '../../../scss/modules/WelcomeScreen.scss'
import * as ui from '../../state/uistates'
import {UIScreens} from '../../state/uistates'
import packageJson from '../../../../../package.json';
import {Button} from "@mui/material";
import {useRecoilState} from "recoil";
import {welcomeScreen} from "../../../../js/__config";

interface IWelcomeScreenProps{
	
	/**Additional classnames for this component*/
	className?:string
}
/**
 * WelcomeScreen
 * @author Ilya Shabanov
 */
const cl = ccl('welcome-screen--')
const WelcomeScreen:React.FC<IWelcomeScreenProps> = ({className}) => {
    const [uistate, setUIScreen] = useRecoilState(ui.appScreen);
    
	return (
		<div className={`welcome-screen site-block narrow`}>
            {welcomeScreen}
            <div className="text-center margin-300-top">
                <Button variant={"contained"} color={'primary'} onClick={e=>setUIScreen(UIScreens.pipelineswitch)}>Start</Button>
            </div>
		</div>
	);
}
export default WelcomeScreen;