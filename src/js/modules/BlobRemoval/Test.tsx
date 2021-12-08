import React from "react";
import {ccl} from "../../../sammie/js/util";
import './scss/TEst.scss'

interface ITEstProps{
	
	/**Additional classnames for this component*/
	className?:string
}
/**
 * TEst
 * @author Ilya Shabanov
 */
const cl = ccl('t-est--')
const TEst:React.FC<ITEstProps> = ({className}) => {
	
	return (
		<div className={`t-est ${className || ''}`}>
			This is my new TEst component
		</div>
	);
}
export default TEst;