import React from "react";
import {ccl} from "../../util";
import '../../../scss/elements/SuperButton.scss'
import * as ui from '../../state/uistates'
import * as alg from '../../state/algstate'

interface ISuperButtonProps{
	
	/**Additional classnames for this component*/
	className?:string
}
/**
 * SuperButton
 * @author Ilya Shabanov
 */
const cl = ccl('super-button--')
const SuperButton:React.FC<ISuperButtonProps> = ({className}) => {
	
	return (
		<div className={`super-button ${className || ''}`}>
			This is my new SuperButton elements
		</div>
	);
}

export default SuperButton;