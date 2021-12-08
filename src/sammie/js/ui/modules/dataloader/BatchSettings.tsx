import React, {useState} from "react"
import * as store from "../../../state/persistance";
import {PARAM_SET_NAME_CURRENT, ParamSet} from "../../../state/persistance";
import "../../../../scss/modules/DataLoader/BatchSettings.scss";
import {FormControl, NativeSelect} from "@mui/material";
import ParamHelpBtn from "../../elements/ParamHelpBtn";
import {useLocalStoreRecoilHook} from "../../uihooks";
import * as alg from "../../../state/algstate";
import {SingleDataBatch} from "../../../state/algstate";
import {copyChange} from "../../../util";

interface IBatchSettingsProps {
    className?:string,
    batchIdx:number
}

const explanation = <div>
    Each pipeline has parameters that you can store and load. When running in batch mode you might want to use different sets of parameters for different data.
    <br/>
    <br/>
    An example would be if you have a multi-channel image file, you might save a parameter set to work on one channel and another on another, while the input file stays the same.
    <br/>
    This would not be possible without separate sets of parameters.
    <br/>
    A good idea is to simply run the pipeline, tune parameters and once done store them for later use, leaving a note what this parameter set does.
</div>;

const BatchSettings: React.FC<IBatchSettingsProps> = ({className,batchIdx}) => {
    const [allParamSets, setAllParamSets] = useState<ParamSet[]>(()=>Object.values(store.loadParameterSets(true))||[]);
    const [allBatches, setAllBatches] = useLocalStoreRecoilHook(alg.allPipelineBatches,'pipeline',false);
    const thisBatch:SingleDataBatch = allBatches[batchIdx];
    
    //Load available parameter sets initially.
    
    const onChangedSelection = (v) => {
        //overwrite the current Settings for this databatch, it will be stored to localstore automatically.
        var nb:SingleDataBatch = {...thisBatch,settingsSetName:v};
        setAllBatches(copyChange(allBatches,batchIdx,nb));
    };
    
    if(!allParamSets) return null;
    
    return (<div className={'batch-settings fl-row fl-align-center' + className}>
        <FormControl variant="outlined">
            <NativeSelect value={thisBatch.settingsSetName} onChange={e=>onChangedSelection(e.target.value)}>
                <option key={'none'} value={PARAM_SET_NAME_CURRENT}>Current Parameters</option>
                {allParamSets.map((k,i) =>{
                    return <option key={k.name} value={k.name}>{k.name}</option>
                }
                )}
            </NativeSelect>
        </FormControl>
        <ParamHelpBtn className={'margin-50-left'}
                      content={explanation}/>
    </div>);
}
export default BatchSettings;