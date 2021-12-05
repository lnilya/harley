import React from "react";
import step1 from './imgs/step1.jpg'
import step2 from './imgs/step2.jpg'
import step3 from './imgs/step3.jpg'
import step4 from './imgs/step4.jpg'
import step5a from './imgs/step5a.jpg'
import step5b from './imgs/step5b.jpg'
import AnimImg from "./AnimImg";
import ButtonIcon from "../../ui/elements/ButtonIcon";
import {Dialog} from "@material-ui/core";
import './scss/HelpDialogue.scss'

interface IHelpDialogueProps{
	open:boolean
	/**Additional classnames for this component*/
	onClose?:()=>void
}
/**
 * HelpDialogue
 * @author Ilya Shabanov
 */
const HelpDialogue:React.FC<IHelpDialogueProps> = ({open,onClose}) => {
	
	return (
        <Dialog open={open} onClose={e=>onClose()} maxWidth={'md'}>
        
		<div className="fl-col help-dialogue pad-200">
            <h2 className={'text-center pad-200-bottom'}>Labeling Help</h2>
                    <div className="tut-step">
                        <img src={step1} alt=""/>
                        <div className="pad-100-left">
                            {/* eslint-disable-next-line react/no-unescaped-entities */}
                            Drag your mouse on foci, to set their size. Foci will be displayed in magenta.
                            Try to be consistent with size and choice of foci. The more consistent you are, the better the trained model
                            will refelct your performance. Sometimes foci might appear off-center which is an artifact of scaling the cell images.
                            <br/>
                            <br/>
                            Clicking on foci again, will remove them.
                        </div>
                    </div>
                    <div className="tut-step">
                        <img src={step2} alt=""/>
                        <div className="pad-100-left">
                            Once you have marked all foci, press the "NEXT CELL" to save the result. If the cell image
                            seems cropped, incomplete or depicts a dead cell, you can skip it by using the "SKIP CELL" button.
                            <br/>
                            Do not skip cells that have no foci, only those that you deem invalid data. The model learns equally from accepted and rejected foci.
                        </div>
                    </div>
                    <div className="tut-step">
                        <AnimImg imgSrc={[step5a,step5b]} speed={1000}/>
                        <div className="pad-100-left">
                            Some Foci contain multiple peaks and can be split. If this is possible the outline will be dashed
                            and a click will display the split peaks in orange. Another click will delete this spot again.
                        </div>
                    </div>
                        <div className="tut-step">
                            <img src={step3} alt=""/>
                            <div className="pad-100-left">
                                Pressing the <ButtonIcon btnText={'1'}/> key will make all possible foci-seeds visible.
                            </div>
                            
                        </div>
                        <div className="tut-step">
                            <img src={step4} alt=""/>
                            <div className="pad-100-left">
                                Pressing the <ButtonIcon btnText={'2'}/> key will display the cell without any foci, which
                                is useful to get a better glance at your result, before saving.
                            </div>
                        </div>
                </div>
            </Dialog>
	);
}
export default HelpDialogue;