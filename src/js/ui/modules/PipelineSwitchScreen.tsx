import React from "react";
import {ccl} from "../../util";
import * as ui from '../../state/uistates'
import {useRecoilValue} from "recoil";
import PipelineListEntry from "./pipelineswitchscreen/PipelineListEntry";
import {PipelineName} from "../../types/datatypes";
import {loadPipeline} from "../../pipeline";

interface IPipelineSwitchScreenProps{
	
	/**Additional classnames for this component*/
	className?:string
}
/**
 * PipelineSwitchScreen
 * @author Ilya Shabanov
 */
const cl = ccl('pipeline-switch-screen--')
const PipelineSwitchScreen:React.FC<IPipelineSwitchScreenProps> = ({className}) => {
    
    const allPipelines = useRecoilValue(ui.allPipelines);
    
    const onLoadPipeline = (pl:PipelineName)=>{
        loadPipeline(allPipelines[pl])
    }
    
	return (
		<div className={`pipeline-switch-screen`}>
            {Object.keys(allPipelines).map((ok)=>
                <PipelineListEntry key={ok} pl={allPipelines[ok]} onChoose={()=>onLoadPipeline(ok)}/>
            )}
		</div>
	);
}
export default PipelineSwitchScreen;