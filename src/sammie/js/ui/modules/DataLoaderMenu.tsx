import React, {useState} from "react";
import {ccl, copyChange} from "../../util";
import '../../../scss/modules/DataLoaderMenu.scss'
import * as ui from '../../state/uistates'
import {UIPopups} from '../../state/uistates'
import * as alg from '../../state/algstate'
import {SingleDataBatch} from '../../state/algstate'
import {Button, Dialog, Tooltip} from "@mui/material";
import AddBoxIcon from "@mui/icons-material/AddBox";
import BallotIcon from "@mui/icons-material/Ballot";
import ConfirmToolTip from "../elements/ConfirmToolTip";
import {DeleteForever} from "@mui/icons-material";
import BatchCreator from "./dataloader/BatchCreator";
import {useLocalStoreRecoilHook} from "../uihooks";
import {getBlankBatch, unloadPipeline} from "../../pipelines/pipeline";
import {Pipeline} from "../../types/pipelinetypes";
import {useRecoilValue, useSetRecoilState} from "recoil";
import * as store from "../../state/persistance";
import {ParamSet} from "../../state/persistance";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import {IParamLoaderDialogProps} from "./ParamLoaderDialog";
import {showToast} from "../../state/eventbus";

interface IDataLoaderMenuProps {
    
    /**Additional classnames for this component*/
    className?: string
    scrollToBottom: () => void
}

/**
 * DataLoaderMenu
 * @author Ilya Shabanov
 */
const cl = ccl('data-loader-menu--')
const DataLoaderMenu: React.FC<IDataLoaderMenuProps> = ({scrollToBottom, className}) => {
    
    const curPipeline: Pipeline = useRecoilValue(ui.selectedPipeline)
    const [allBatches, setAllBatches] = useLocalStoreRecoilHook(alg.allPipelineBatches, 'pipeline', false, curPipeline.name);
    const [multiBatchDialog, setMultiBatchDialog] = useState(false);
    const [allParamSets, setAllParamSets] = useState<ParamSet[]>(()=>Object.values(store.loadParameterSets(true))||[]);
    const setPopupOpen = useSetRecoilState(ui.popupOpen);
    
    const addNewBatch = () => {
        const nb: SingleDataBatch = getBlankBatch(curPipeline)
        setAllBatches([...allBatches, nb])
        scrollToBottom();
    }
    const deleteAllBatches = () => {
        //delete with an empty batch
        setAllBatches([getBlankBatch(curPipeline)])
        unloadPipeline();
    };
    
    const openPopup = ()=>{
        const config:IParamLoaderDialogProps = {
            title:`Select Parameters to apply to ${allBatches.length} batches`,
            loadSettingCallback: (e)=>{
                setAllBatches(
                    allBatches.map((ob)=>{
                        return {...ob,settingsSetName:e.name}
                    })
                )
                showToast(`Switched Parameters for all ${allBatches.length} batches to ${e.name}.`)
            }
        }
        setPopupOpen({type:UIPopups.paramload, popupParams:config})
    }
    
    
    return (
        <>
            <div className={`data-loader-menu fl-row-start bg-bgwhite pad-50-ver margin-100-bottom ${className || ''}`}>
                <Tooltip title={'Add a new empty batch'} placement={'bottom'} arrow>
                    <Button variant={"contained"} color={'secondary'} onClick={addNewBatch}><AddBoxIcon/>Add
                        Batch</Button>
                </Tooltip>
                <div className="margin-100-right"/>
                <Tooltip title={'Batch Creator: Allows to add multiple batches at once using placeholders'}
                         placement={'bottom'} arrow>
                    <Button variant={"contained"} color={'secondary'}
                            onClick={() => setMultiBatchDialog(true)}><BallotIcon/>Batch Creator</Button>
                </Tooltip>
                <div className="margin-100-right"/>
                <ConfirmToolTip onConfirm={deleteAllBatches} question={`Delete all batches?`}
                                options={['Delete', 'Cancel']} tooltipParams={{placement: 'bottom', arrow: true}}>
                    <Button variant={"outlined"} color={'secondary'}><DeleteForever/>Clear All</Button>
                </ConfirmToolTip>
                <div className="fl-grow"/>
                <Tooltip title={'Configure all batches to use a set of previously stored pipeline parameters. You can set choose pipeline parameters manually for each batch via the drop down below or for all batches at once here. A parameter set stores all parameter values used in this pipeline. You can save them via an option in the main menu (left) in any step of the pipeline.'}
                         placement={'top'} arrow>
                    <Button variant={"contained"} color={'secondary'}
                            onClick={openPopup}><UploadFileIcon/>Change Parameters</Button>
                </Tooltip>
                
            </div>
            <Dialog open={multiBatchDialog} maxWidth={'md'} onClose={() => setMultiBatchDialog(false)}>
                <BatchCreator onDone={() => setMultiBatchDialog(false)}/>
            </Dialog>
        </>
    );
}

export default DataLoaderMenu;