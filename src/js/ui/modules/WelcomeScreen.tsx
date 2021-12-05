import React from "react";
import {ccl} from "../../util";
import '../../../scss/modules/WelcomeScreen.scss'
import * as ui from '../../state/uistates'
import {UIScreens} from '../../state/uistates'
import packageJson from '../../../../package.json';
import {Button} from "@material-ui/core";
import {useRecoilState} from "recoil";

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
                refer to <a href="https://www.biorxiv.org/content/10.1101/2021.11.29.470484v1">[Shabanov and Buchan, 2021, Paper]</a> for information
                about the surprising discrepancies between human experimenters and what this software can do better.
                <br/>
                You will find information about how to use the software integrated into the next screen.
            </div>
            <div className="text-center margin-300-top">
                <Button variant={"contained"} color={'primary'} onClick={e=>setUIScreen(UIScreens.pipelineswitch)}>Start Harley</Button>
            </div>
		</div>
	);
}
export default WelcomeScreen;