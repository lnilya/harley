import React from "react";
import {ccl} from "../../util";
import '../../../scss/elements/InputWithShortening.scss'
import * as ui from '../../state/uistates'
import * as alg from '../../state/algstate'

interface IInputWithShorteningProps{
	
	/**Additional classnames for this component*/
	className?:string
}
/**
 * InputWithShortening
 * @author Ilya Shabanov
 */
const cl = ccl('input-with-shortening--')
const InputWithShortening:React.FC<IInputWithShorteningProps> = ({className}) => {
	
	return (
		<div className={`input-with-shortening ${className || ''}`}>
			This is my new InputWithShortening elements
		</div>
	);
}

export default InputWithShortening;