import {Button, Dialog} from "@material-ui/core";
import React, {useState} from "react"
import {Pipeline} from "../../../types/pipelinetypes";

interface IPipelineListEntryProps{
    pl:Pipeline,
    onChoose:()=>void,
}
const PipelineListEntry:React.FC<IPipelineListEntryProps> = ({pl, onChoose}) => {
	
    const [showingHelp,setShowingHelp] = useState(false);
    
	return (<div className={'pipeline-list-entry margin-200-bottom full-w'}>
        <div className="fl-row bg-bglight">
            <div className="pipeline-list-entry__thumb">
                {pl.descriptions?.thumb}
            </div>
            <div className={'pipeline-list-entry__text pad-100 fl-grow'}>
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
            
            <Button variant={"contained"} color={'primary'} onClick={onChoose}>Start {pl.name}</Button>
        </div>
        
	</div>);
}
export default PipelineListEntry;