import React, {ReactNode} from "react";
import {ccl} from "../../../sammie/js/util";
import './scss/StatDisplay.scss'
import {Tooltip} from "@material-ui/core";

interface IStatDisplayProps{
	
	/**Additional classnames for this component*/
	className?:string,
    explanation:ReactNode,
    formattedVal:string,
    normVal:number,
    title:string
}
/**
 * StatDisplay
 * @author Ilya Shabanov
 */
const cl = ccl('stat-display--')
const StatDisplay:React.FC<IStatDisplayProps> = ({title,explanation,formattedVal,normVal,className}) => {
	
	return (
        <Tooltip title={explanation} arrow placement={'bottom'}>
            <div className={`stat-display ${className} pad-100 margin-100-hor text-center bg-bglight`}>
                <div>{title}</div>
                <h3>{formattedVal}</h3>
            </div>
        </Tooltip>
	);
}
export default StatDisplay;


export const cvExplanation =
<>
<strong>Cross Validation Matthews Correlation:</strong><br/><br/>
Measures how closely correlated model results and your labels are. Values range from -1 to 1. Good values are somewhere above 0.7.<br/><br/>
Cross validation is a technique where the model is trained on a subset of data, while the rest is used for determining the error. This is done
multiple times for different subsets and the result is the mean of these splits.
CVMCC therefore measures how well the model generalized your dataset.
</>

export const testExplanation =
<>
<strong>Test Set Matthews Correlation:</strong><br/><br/>
Measures how closely correlated model results and your labels are. Values range from -1 to 1.
The test score will always be above the Cross Validation error. A value of 1 means that the model does exactly replicate your labels, which
is not a good thing, since it can be on overfit to the data.
Test scores for small datasets will fluctuate.
</>
