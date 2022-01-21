import {Button, Dialog} from "@mui/material";
import React, {useState} from "react"
import {Pipeline} from "../../../types/pipelinetypes";
import {cl} from "../../../util";
import {atomFamily} from "recoil";
import {useLocalStoreRecoilHook} from "../../uihooks";
import {PipelineName} from "../../../types/datatypes";

interface IPipelineListEntryProps{
    group:Record<string, Pipeline>,
    groupName:string,
    onChoose:(pname:Pipeline)=>void,
}
const groupSelectionAtom = atomFamily<string,string>({key:'groupselection',default:null})
const PipelineListEntry:React.FC<IPipelineListEntryProps> = ({groupName, group, onChoose}) => {
	
    const [groupSelection, setGroupSelection] = useLocalStoreRecoilHook(groupSelectionAtom(groupName),'global',true)
    const isGroup = Object.keys(group).length > 1;
    const pl = group[groupSelection] || group[Object.keys(group)[0]]; //if pipeline was removed, simply take the first
    
    const [showingHelp,setShowingHelp] = useState(false);
    
	return (<div className={'pipeline-list-entry margin-200-bottom full-w ' + cl(isGroup ,'is-grouped')}>
        <div className="fl-row bg-bglight">
            {pl.descriptions?.thumb &&
                <div className="pipeline-list-entry__thumb">
                    {pl.descriptions?.thumb}
                </div>
            }
            <div className={'pipeline-list-entry__text pad-100 fl-grow'}>
                {isGroup &&
                    <div className="fl-row-start margin-100-neg-exceptbottom margin-100-bottom pipeline-list-entry__group-selection">
                        {Object.keys(group).map((grname)=>{
                            return <div key={grname} onClick={()=>setGroupSelection(grname)} className={`homolog pad-25-ver pad-50-hor ${cl(grname == groupSelection,'active') }`}>{grname}</div>
                        })}
                    </div>
                }
                <h2>{pl.descriptions?.title || pl.name}</h2>
                <div className="pipeline-list-entry__desc">
                    {pl.descriptions?.description}
                </div>
            </div>
        </div>
        <div className="margin-50-top text-right fl-row-end">
            {pl?.descriptions?.helpscreen &&
                <>
                    <Dialog open={showingHelp} onClose={e=>setShowingHelp(false)} maxWidth={'md'} fullWidth={true}>
                        <div className="pad-200 pad-100-top">
                            <h1 className={'margin-0-top'}>Tutorial {pl.descriptions.title}</h1>
                            {pl.descriptions.helpscreen}
                        </div>
                    </Dialog>
                    <Button variant={"outlined"} color={'secondary'} onClick={e=>setShowingHelp(true)}>Show Tutorial</Button>
                    <div className="margin-100-right"/>
                </>
            }
            
            <Button variant={"contained"} color={'primary'} onClick={()=>onChoose(pl)}>Start {pl.name}</Button>
        </div>
        
	</div>);
}
export default PipelineListEntry;