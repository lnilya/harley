import React from "react";
import {ccl} from "../../util";
import * as ui from '../../state/uistates'
import {useRecoilValue} from "recoil";
import PipelineListEntry from "./pipelineswitchscreen/PipelineListEntry";
import {PipelineName} from "../../types/datatypes";
import {loadPipeline} from "../../pipelines/pipeline";
import {Pipeline} from "../../types/pipelinetypes";

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
    
    const allPipelineGroups = useRecoilValue(ui.pipelineGroups);
    const onLoadPipeline = (pl:Pipeline)=>{
        loadPipeline(pl)
    }
    
	return (
		<div className={`pipeline-switch-screen`}>
            {allPipelineGroups.map((group,ok)=>
                <PipelineListEntry key={ok} groupName={''+ok} group={group} onChoose={onLoadPipeline}/>
            )}
		</div>
	);
}
export default PipelineSwitchScreen;