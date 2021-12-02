import React from "react";
import {ccl} from "../../util";
import * as state from './state'
import './scss/__NAME__.scss'
interface I__NAME__Props{
	
	/**Additional classnames for this component*/
	className?:string
}
/**
 * __NAME__
 * @author __AUTHOR__
 */
const cl = ccl('__NAME_LC__--')
const __NAME__:React.FC<I__NAME__Props> = ({className}) => {
	
	return (
		<div className={`__NAME_LC__`}>
			This is my new __NAME__ component
		</div>
	);
}
export default __NAME__;