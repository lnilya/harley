import React from "react";
import {ccl, copyChange} from "../../util";
import '../../../scss/elements/PipelineParamList.scss'
import * as ui from '../../state/uistates'
import {useRecoilValue} from "recoil";
import ParamSlider from "./ParamSlider";
import ParamTextInput from "./ParamTextInput";
import ParamDropdown from "./ParamDropdown";
import ParamCheckbox from "./ParamCheckbox";
import ParamTitle from "./ParamTitle";
import {TooltipPlacement} from "../../types/uitypes";
import {useLocalStoreRecoilHook} from "../uihooks";
import * as alg from "../../state/algstate";
import {SingleDataBatch} from "../../state/algstate";
import {Parameter} from "../../modules/paramtypes";

interface IPipelineParamListProps{
	
	/**Additional classnames for this component*/
	className?:string,
    
    /**Number of processed batch*/
    batchIdx:number,
}
/**
 * PipelineParamList - List of Parameters for the whole pipeline
 * @author Ilya Shabanov
 */
const cl = ccl('pipeline-param-list--')
const PipelineParamList:React.FC<IPipelineParamListProps> = ({batchIdx,className}) => {
    const pipe = useRecoilValue(ui.selectedPipeline);
    const [allBatches, setAllBatches] = useLocalStoreRecoilHook(alg.allPipelineBatches,'pipeline',false);
    const thisBatch:SingleDataBatch = allBatches[batchIdx];
    if(!thisBatch) return null;
    
    const onParameterChanged = (conf:Parameter<any>,val:any) => {
        //overwrite the current Parameters for this databatch, it will be stored to localstore automatically.
        var nb:SingleDataBatch = {...thisBatch,batchParameters:{...thisBatch.batchParameters, [conf.key]: val}};
        setAllBatches(copyChange(allBatches,batchIdx,nb));
        console.log(`CHANGED ${conf.key} => ${val}`);
    };
    
	return (
		<div className={`pipeline-param-list pad-100-exceptbottom pad-50-bottom margin-50-neg-hor margin-50-top`}>
            <div className="grid cols-2 half-gap">
                {pipe.inputParameters.map((s)=>{
                    let vis = s.conditional(thisBatch.batchParameters);
                    if( vis == 'hide') return null;
                    
                    //may happen if recoil update is not done in one chunk
                    if(thisBatch.batchParameters[s.key] === null || thisBatch.batchParameters[s.key] === undefined) return  null;
                    
                    const params = {onParameterChanged:onParameterChanged, key:s.key, conf:s,
                        curVal:thisBatch.batchParameters[s.key], disabled: vis == 'disable',
                    
                    tooltipPlacement:'top' as TooltipPlacement};
                    if(s.input.type == 'slider') return <ParamSlider {...params}/>;
                    else if( s.input.type == 'text_input') return <ParamTextInput {...params}/>;
                    else if(s.input.type == 'dropdown') return <ParamDropdown {...params}/>;
                    else if(s.input.type == 'checkbox') return <ParamCheckbox {...params}/>;
                    else if(s.input.type == 'separator') return <ParamTitle {...params}/>;
                    
                    return s.key;
                })}
            </div>
		</div>
	);
}
export default PipelineParamList;
