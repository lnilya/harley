import React, {ReactNode} from "react";
import {ccl} from "../../../sammie/js/util";
import './scss/StatDisplay.scss'
import {Tooltip} from "@mui/material";

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
Measures how closely correlated model results and your labels are. Values range from -1 to 1. Good values start above 0.7.<br/><br/>
Cross validation is a technique where the model is trained on a subset of data, while the rest is used for determining the error. This is done
multiple times for different subsets and the result is the mean of these splits.
CVMCC therefore measures how well the model generalized your dataset.<br/><br/>
    <strong>Warning:</strong> It can occur that you get a great score here but a rather poor performance when using the model and seeing its results.
    This score is an indicator of good performance but not the absolute truth. So in such cases we suggest that you retrain the model with more data/labels.
</>

export const testExplanation =
<>
<strong>Test Set Matthews Correlation:</strong><br/><br/>
Measures how closely correlated model results and your labels are. Values range from -1 to 1.
The test score will always be above the Cross Validation error. A value of 1 means that the model does exactly replicate your labels, which
is not a good thing, since it can be on overfit to the data.
Test scores for small datasets will fluctuate.<br/><br/>
<strong>Warning:</strong> When you see a test score of a 100% in most cases your model simply doesn't have enough data to work with. While the Test Set Score will always be above the generalization score
it should also not reach 100%. We suggest that if the value seems too optimistic keep labeling more data.
</>
