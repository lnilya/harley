import React from "react";
import {ccl} from "../../../util";
import '../../../../scss/modules/aggregator/Aggregator.scss'
import * as ui from '../../../state/uistates'
import {useRecoilValue} from "recoil";
import AggregatorStep from "./AggregatorStep";

interface IAggregatorProps{
	
	/**Additional classnames for this component*/
	className?:string
}
/**
 * Aggregator
 * @author Ilya Shabanov
 */
const cl = ccl('aggregator--')
const Aggregator:React.FC<IAggregatorProps> = ({className}) => {
	const curPipeline = useRecoilValue(ui.selectedPipeline);
 
    return (<div className={'aggregator site-block narrow'}>
        {curPipeline.aggregatorOutputs?.map((e,i)=>{
            return <AggregatorStep key={i} step={e} onExport={null}/>
        })}
	</div>);
}
export default Aggregator;