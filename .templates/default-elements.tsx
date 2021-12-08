import React from "react";
import {ccl} from "../../util";
import '../../../scss/__COMP__/__NAME__.scss'
import * as ui from '../../state/uistates'
import * as alg from '../../state/algstate'

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
		<div className={`__NAME_LC__ ${className || ''}`}>
			This is my new __NAME__ __COMP__
		</div>
	);
}

export default __NAME__;