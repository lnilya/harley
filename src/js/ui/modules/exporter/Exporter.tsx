import React from "react"
import ExportStep from "./ExportStep";
import * as ui from '../../../state/uistates'
import * as alg from '../../../state/algstate'
import * as server from '../../../eel/eel'
import {useRecoilValue} from "recoil";
import {PipelineOutput, PipelineStep} from "../../../types/pipelinetypes";
import {LocalFilePath} from "../../../types/datatypes";
import {SingleDataBatch} from "../../../state/algstate";

interface IExporterProps{

}
const Exporter:React.FC<IExporterProps> = () => {
    
    const curPipeline = useRecoilValue(ui.selectedPipeline);
    const curBatch:SingleDataBatch = useRecoilValue(alg.curLoadedBatch)
    
    const onExportsingleStep = async (owner:PipelineStep<any, any>, exporter:PipelineOutput, filePath:LocalFilePath,overwrite:boolean) =>{
        return server.exportData(owner.moduleID,exporter.requiredInput,filePath,overwrite,curBatch.batchParameters,exporter.exporterParams)
    }
    
	return (<div className={'exporter site-block narrow'}>
        {curPipeline.outputs.map((e,i)=>{
            return <ExportStep key={i} step={e} onExport={onExportsingleStep}/>
        })}
	</div>);
}

export default Exporter;