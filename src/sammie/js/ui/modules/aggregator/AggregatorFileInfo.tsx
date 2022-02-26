import React from "react"
import {AggregateDataInfo, EelResponse} from "../../../eel/eel";
import {atomFamily, useRecoilValue} from "recoil";
import * as alg from "../../../state/algstate";
import * as ui from "../../../state/uistates";
import {convertPythonTimestamp} from "../../../util";
import ConfirmToolTip from "../../elements/ConfirmToolTip";
import * as server from "../../../eel/eel";
import * as eventbus from "../../../state/eventbus";
import {EventTypes, ToastEventPayload} from "../../../state/eventbus";
import {LocalFilePath, PipelineDataAggregatorID} from "../../../types/datatypes";
import {useLocalStoreRecoilHook} from "../../uihooks";
import AnimateHeight from "react-animate-height";

interface IAggregatorFileInfoProps{
    info:AggregateDataInfo,
    id:PipelineDataAggregatorID
    deleteBatch:(batchKey:string[]) => any
}

const asIsOpen = atomFamily<LocalFilePath,PipelineDataAggregatorID>({key: 'aggregator_info_open', default: ''});
const AggregatorFileInfo:React.FC<IAggregatorFileInfoProps> = ({id,info,deleteBatch}) => {
    const curPipeline = useRecoilValue(ui.selectedPipeline);
    const [isOpen,setIsOpen] = useLocalStoreRecoilHook(asIsOpen(id))
    
	if(!info) return;
    const inputKeys = curPipeline.inputs.map((pli)=>pli.title);
	return (<div className={'aggregator-step__info pad-50-top'}>
        <div className="pad-50-bottom fl-row-between">
            <span>{info.info}</span>
            {info.batchInfo.length > 0 &&
                <span className={'details-btn'} onClick={e=>setIsOpen(!isOpen)}>{!isOpen ? '[Show Details]' : '[Hide Details]'}</span>
            }
        </div>
        <AnimateHeight height={isOpen ? 'auto' : 0} >
            {info.batchInfo.map((binfo,i)=>{
                return (<div className="batch-info pad-50" key={i}>
                    <div className="title fl-row-between">
                        <span>
                            Batch #{i+1} ({convertPythonTimestamp(binfo.timestamp)})
                        </span>
                        <ConfirmToolTip tooltipParams={{placement: 'top', arrow:true}}
                                        question={'Do you really want to delete this batch from the file?'}
                                        options={['Delete','Cancel']} onConfirm={()=>deleteBatch(binfo.batchKey)}>
                            <span className="deletebtn">[Delete Batch]</span>
                        </ConfirmToolTip>
                    </div>
                    
                    {binfo.batchKey.map((bk,j)=><div key={j}><span>{inputKeys[j]}:</span>{bk}</div>
                    )}
                </div>)
            })}
        </AnimateHeight>
	</div>);
}

export default AggregatorFileInfo;