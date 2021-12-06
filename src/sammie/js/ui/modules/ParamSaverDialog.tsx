import React, {useEffect, useState} from "react";
import {ccl, copyRemove} from "../../util";
import "../../../../scss/modules/ParamSaverDialog.scss";
import {Button, Dialog, TextField} from "@material-ui/core";
import * as ui from '../../state/uistates'
import * as alg from '../../state/algstate'
import * as store from '../../state/persistance'
import {deleteStoredParameterSet, ParamSet, saveParameters} from '../../state/persistance'
import {useRecoilState, useRecoilValue} from "recoil";
import ParamSetListentry from "../elements/ParamSetListentry";
import {EventTypes, fireEvent, ToastEventPayload} from "../../state/eventbus";

interface IParamSaverDialogProps {
    
    /**Additional classnames for this component*/
    className?: string
}

/**
 * ParamLoaderDialog Loads parameters stored in local storage
 * @author Ilya Shabanov
 */
const cl = ccl('param-saver-dialog--')
const ParamSaverDialog: React.FC<IParamSaverDialogProps> = ({className}) => {
    
    const [popupOpen, setPopupOpen] = useRecoilState(ui.popupOpen);
    const pipelineName = useRecoilValue(ui.selectedPipelineName);
    const [allParamSets, setAllParamSets] = useState<ParamSet[]>([]);
    const params = useRecoilValue(alg.curPipelineParameterValues);
    
    const [curName, setName] = useState('');
    const [curDesc, setDesc] = useState('');
    
    useEffect(() => {
        setAllParamSets(Object.values(store.loadParameterSets(true)))
    }, [])
    
    const onSaveNewSettings = () => {
        saveParameters(params, curName, curName, curDesc);
        setPopupOpen(null)
        fireEvent<ToastEventPayload>(EventTypes.ToastEvent, {severity: 'success', msg: 'Saved New Setting Set: '+curName})
    }
     const deleteEntry = (e:ParamSet) => {
        deleteStoredParameterSet(e.name);
        setAllParamSets(copyRemove(allParamSets,e))
         fireEvent<ToastEventPayload>(EventTypes.ToastEvent, {severity: 'info', msg: 'Deleted Setting Set: '+e.name})
    }
    const onOverwriteSettings = (e: ParamSet) => {
        saveParameters(params, e.name);
        setPopupOpen(null)
        fireEvent<ToastEventPayload>(EventTypes.ToastEvent, {severity: 'success', msg: 'Overwritten Setting Set: '+e.name})
    }
    
    return (
        <Dialog open={true} onClose={e => setPopupOpen(null)}>
            <div className="param-saver-dialog">
                <h3 className={'pad-100 margin-0'}>Store Current Settings for {pipelineName}</h3>
                <div className="sep margin-100-bottom"/>
                <div className="new-param-set pad-100 pad-0-top">
                    <TextField value={curName} onChange={e => setName(e.currentTarget.value)} label={'Name'}
                               variant={'outlined'} size={'small'}/>
                    <div className="margin-100-bottom"/>
                    <TextField value={curDesc} onChange={e => setDesc(e.currentTarget.value)} multiline={true}
                               label={'Description'} rows={3} size={'small'} variant={'outlined'}/>
                </div>
                <div className="pad-100-bottom pad-100-right text-right col-white">
                    <Button onClick={onSaveNewSettings} color={'primary'} variant={"contained"}
                            size={'small'}>Save</Button>
                </div>
                {allParamSets.length > 0 &&
                <>
                    <div className="sep"/>
                    <h3 className={'pad-100 margin-0'}>Or overwrite existing set</h3>
                    <div className="sep"/>
                    <div className={'param-saver-dialog__content'}>
                        {allParamSets.map((e) =>
                            <ParamSetListentry onDelete={deleteEntry} key={e.name} ps={e} onClick={onOverwriteSettings} />)
                        }
                    </div>

                </>
                }
            </div>
        </Dialog>
    );
}
export default ParamSaverDialog;