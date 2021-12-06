import React, {useEffect, useState} from "react";
import {ccl, copyRemove} from "../../util";
import "../../../../scss/modules/ParamLoaderDialog.scss";
import {Dialog} from "@material-ui/core";
import * as ui from '../../state/uistates'
import * as store from '../../state/persistance'
import {deleteStoredParameterSet, ParamSet} from '../../state/persistance'
import {useRecoilState, useRecoilValue} from "recoil";
import {loadStoredParametersIntoPipeline} from "../../pipelines/pipeline";
import ParamSetListentry from "../elements/ParamSetListentry";
import {EventTypes, fireEvent, ToastEventPayload} from "../../state/eventbus";

interface IParamLoaderDialogProps{
	
	/**Additional classnames for this component*/
	className?:string
}
/**
 * ParamLoaderDialog Loads parameters stored in local storage
 * @author Ilya Shabanov
 */
const cl = ccl('param-loader-dialog--')
const ParamLoaderDialog:React.FC<IParamLoaderDialogProps> = ({className}) => {
    
    const [popupOpen, setPopupOpen] = useRecoilState(ui.popupOpen);
    const pipelineName = useRecoilValue(ui.selectedPipelineName);
    const [allParamSets,setAllParamSets] = useState<ParamSet[]>([]);
    
    useEffect(()=>{
        setAllParamSets(Object.values(store.loadParameterSets(true)))
    },[])
    
    const deleteEntry = (e:ParamSet) => {
        deleteStoredParameterSet(e.name);
        const nv = copyRemove(allParamSets,e);
        setAllParamSets(nv)
        fireEvent<ToastEventPayload>(EventTypes.ToastEvent, {severity: 'info', msg: 'Deleted Setting Set: '+e.name})
    }
    const onLoadSettings = (e:ParamSet) => {
        const success = loadStoredParametersIntoPipeline(e.name,true)
        setPopupOpen(null)
    }
    
	return (
		<Dialog open={true} onClose={e=>setPopupOpen(null)}>
            <div className="param-loader-dialog">
                <h2 className={'pad-100 margin-0'}>Load settings for {pipelineName}</h2>
                <div className={'param-loader-dialog__content'}>
                    {allParamSets.map((e)=>
                        <ParamSetListentry onDelete={deleteEntry} key={e.name} ps={e} onClick={onLoadSettings} />)
                    }
                    {allParamSets.length == 0 &&
                        <div className="pad-100">
                            No Saved Parameter sets found...
                        </div>
                    }
                </div>
            </div>
		</Dialog>
	);
}
export default ParamLoaderDialog;