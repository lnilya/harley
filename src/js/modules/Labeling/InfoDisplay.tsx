import React from "react";
import {ccl} from "../../util";
import './scss/InfoDisplay.scss'
import {LabelingResult} from "./server";
import {Tooltip} from "@material-ui/core";
import {printf} from "fast-printf";

export type InfoObject= {
    totalCells:number,
    labeledCells:number,
    numFoci: number
}
interface IInfoDisplayProps{
	
	/**Additional classnames for this component*/
	result:LabelingResult[]
    totalCells:number
    
}
/**
 * InfoDisplay
 * @author Ilya Shabanov
 */
const cl = ccl('info-display--')
const InfoDisplay:React.FC<IInfoDisplayProps> = ({result,totalCells}) => {
	
    const info:InfoObject = getInfo(result,totalCells)
    if(!info) return null;
    
	return (
		<div className={`info-display`}>
            <div className="info-display__entry pad-100-hor">
                Quantified Cells: <strong>{info.labeledCells} / {info.totalCells} ({printf('%.2f%%',100*info.labeledCells/info.totalCells)})</strong>
            </div>
            <Tooltip title={'There is no certainty how many foci you should classify, it depends on the dataset and the human. In our experiments on stress granules a value of 200 yielded fairly good model performances. Check by clicking on the next step "Training" of this pipeline to get an evaluation. You can always come back to this step and continue labeling to improve model performance.'}
                     arrow >
            <div className="info-display__entry pad-100-hor">
                <span>
                    Foci Quantified:
                </span>
                <strong>{info.numFoci}</strong>
            </div>
            </Tooltip>
            
		</div>
	);
}
export default InfoDisplay;

function getInfo(results:LabelingResult[], totalCells:number):InfoObject{
    if(!results) return null;
    const accepted = results.filter(e=>!e.rejected)
    totalCells -= results.length - accepted.length
    var numFoci = 0;
    accepted.forEach((e)=>{numFoci += e.foci.length + e.splits.length})
    
    return {
        totalCells:totalCells,
        labeledCells:accepted.length,
        numFoci: numFoci
    }
}