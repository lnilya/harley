import React, {useState} from "react";
import {ccl} from "../../../util";
import '../../../../../scss/modules/BatchCreator.scss'
import * as ui from '../../../state/uistates'
import {Button, FormControl, NativeSelect, TextField} from "@material-ui/core";
import {atom, useRecoilValue} from "recoil";
import {useToggle} from "react-use";
import AnimateHeight from "react-animate-height";
import {LocalFile, PipelineDataKey} from "../../../types/datatypes";
import {useLocalStoreRecoilHook} from "../../uihooks";
import * as server from '../../../eel/eel'
import {EelResponse} from '../../../eel/eel'
import {DataGrid, GridColDef} from '@mui/x-data-grid';
import ConfirmToolTip from "../../elements/ConfirmToolTip";
import {addBatches} from "../../../pipelines/pipeline";
import * as store from "../../../state/persistance";
import {PARAM_SET_NAME_CURRENT, ParamSet} from "../../../state/persistance";

interface IBatchCreatorProps {
    
    /**Additional classnames for this component*/
    className?: string,
    
    /**Called when batch creator dialogue is closed.*/
    onDone: () => void
}

/**
 * BatchCreator
 * @author Ilya Shabanov
 */
const cl = ccl('batch-creator--')

const asInputs = atom<Record<PipelineDataKey, string>>({key: 'bcreator_input', default: {}});
const BatchCreator: React.FC<IBatchCreatorProps> = ({onDone, className}) => {
    
    const pipe = useRecoilValue(ui.selectedPipeline);
    const [allInputs, setAllInputs] = useLocalStoreRecoilHook(asInputs, 'pipeline');
    const [showingHelp, toggleHelp] = useToggle(false);
    const [result, setResult] = useState<EelResponse<LocalFile[][]>>(null);
    const [errorString, setErrorString] = useState<string>(null);
    const [tableData, setTableData] = useState([]);
    const [selection, setSelection] = React.useState([]);
    const [allParamSets, setAllParamSets] = useState<ParamSet[]>(() => Object.values(store.loadParameterSets(true)) || []);
    const [selectedParamSet, setSelectedParamSet] = useState<string>('');
    
    const loadBatches = async () => {
        var allExt = [];
        pipe.inputs.forEach((pinp) => {
            if (!pinp.loaders) allExt.push([]);
            var ae = Object.keys(pinp.loaders).join(',').split(',');
            allExt.push(ae);
        });
        const inpArr = pipe.inputs.map((pinp) => allInputs[pinp.key])
        
        const r = await server.getBatchGlobs(inpArr, allExt)
        if (!r.error) {
            var selection = [];
            const rows = r.data.map((lfs, idx) => {
                var rd = {id: idx};
                lfs.forEach((lf, i) => rd[i] = lf?.name || '-');
                if (lfs.indexOf(null) == -1) selection.push(idx);
                return rd
            })
            setSelection(selection);
            setTableData(rows);
            if(rows.length == 0) setErrorString('No files found for this pattern ' + inpArr[0])
            else setErrorString(null)
        } else {
            setErrorString('Error: '+r.error)
            setTableData(null)
        }
        setResult(r);
    };
    
    const columns: GridColDef[] = pipe?.inputs.map((pinp, idx) => {
        return {field: '' + idx, headerName: pinp.title, flex: 1}
    })
    
    const onApplyFoundFiles = (overwrite: boolean) => {
        const filesToAdd = result.data.filter((e, i) => selection.indexOf(i) != -1)
        addBatches(pipe, filesToAdd, overwrite,selectedParamSet);
        onDone();
    }
    
    const canAdd = selection?.length > 0 && tableData?.length > 0 && selectedParamSet != '';
    
    return (
        <div className={`batch-creator pad-200`}>
            <h2>Advanced Batch Creator</h2>
            <p>This tool allows to create many batches at once using "globs", a form of search and replace patterns. Use
                a star <em>*</em> as a wildcard to match a part of a filename or <em>**</em> to match a folder.<br/></p>
            <div className={'batch-creator__helptoggle'}
                 onClick={toggleHelp}>{showingHelp ? 'Hide Example' : 'Show Example'}</div>
            <AnimateHeight height={showingHelp ? 'auto' : 0}>
                <div className="batch-creator__help pad-100-top">
                    <p>
                        Pattern:<br/> <strong>/experiment/<em>**</em>/img_<em>*</em>_denoised.jpg </strong><br/><br/>
                        Possible Matches:<br/>
                        experiment/<em>28aug</em>/img_<em>01</em>_denoised.jpg<br/>
                        experiment/<em>12sep</em>/img_<em>abcd</em>_denoised.jpg<br/>
                        ...
                        <br/>
                    </p>
                    {pipe.inputs.length > 1 &&
                    <p>
                        When batches need multiple files, these usually follow a pattern like "img_1.jpg" will go with
                        "mask_1.png".<br/><br/>
                        Whatever the variable part is, is replaced with a <em>*</em>.<br/><br/>
                        For Example: "<strong>img_<em>*</em>.jpg</strong>" and "<strong>mask_<em>*</em>.png</strong>"
                        would be the input to achieve the above case.
                    </p>
                    }
                </div>
            
            </AnimateHeight>
            <div className="batch-creator__inputs margin-200-top">
                {pipe.inputs.map((pinp) => {
                        var allowedExtensions = '';
                        if (pinp.loaders) {
                            var allExt = Object.keys(pinp.loaders).join(',').split(',');
                            allowedExtensions = allExt.map(s => '*.' + s).join(', ')
                        }
                        return (<div className="batch-creator__single-input margin-100-bottom" key={pinp.key}>
                            <TextField value={allInputs[pinp.key]}
                                       onChange={e => setAllInputs({...allInputs, [pinp.key]: e.currentTarget.value})}
                                       label={!allowedExtensions ? pinp.title : `${pinp.title} (${allowedExtensions})`}
                                       variant={'outlined'}/>
                        </div>)
                    }
                )}
            </div>
            <AnimateHeight height={tableData?.length ? 400 : 0}>
                <div className="batch-creator__table-wrapper pad-100-bottom">
                    <DataGrid columns={columns}
                              onSelectionModelChange={(i) => setSelection(i)}
                              selectionModel={selection}
                              pageSize={5}
                              checkboxSelection
                              rowsPerPageOptions={[5]}
                              rows={tableData}/>
                </div>
            </AnimateHeight>
            {errorString !== null &&
                <div className="pad-100-bottom">
                    {errorString}
                </div>
            }
            <div className="batch-creator__btns fl-row fl-align-center">
                <Button color={'secondary'} variant={'contained'} onClick={loadBatches}>Find Files</Button>
                <div className="fl-grow"/>
                
                <span className={'pad-50-right'}>Parameter Set:</span>
                <FormControl variant="outlined">
                    <NativeSelect value={selectedParamSet} onChange={e => setSelectedParamSet(e.target.value)}>
                        <option key={'none'} value={''}>Please Select...</option>
                        <option key={'cur'} value={PARAM_SET_NAME_CURRENT}>Current Parameters</option>
                        {allParamSets.map((k, i) => {
                                return <option key={k.name} value={k.name}>{k.name}</option>
                            }
                        )}
                    </NativeSelect>
                </FormControl>
                <div className="margin-100-right"/>
                <ConfirmToolTip question={'Are you sure ypu want to overwrite current batches?'}
                                tooltipParams={{arrow: true, placement: 'top'}} options={['overwrite', 'cancel']}
                                onConfirm={() => onApplyFoundFiles(true)}>
                    <Button disabled={!canAdd} color={'secondary'} variant={'outlined'}>Overwrite Batches</Button>
                </ConfirmToolTip>
                <div className="margin-100-right"/>
                <Button disabled={!canAdd} color={'primary'} variant={'contained'}
                        onClick={() => onApplyFoundFiles(false)}>Add Batches</Button>
            </div>
        </div>
    );
}
export default BatchCreator;