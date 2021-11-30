import { Button } from "@material-ui/core";
import React from "react"
import {Pipeline} from "../../../types/pipelinetypes";

interface IPipelineListEntryProps{
    pl:Pipeline,
    onChoose:()=>void,
}
const PipelineListEntry:React.FC<IPipelineListEntryProps> = ({pl, onChoose}) => {
	
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
        <div className="margin-50-top text-right">
            <Button variant={"contained"} color={'primary'} onClick={onChoose}>Start {pl.name}</Button>
        </div>
        
	</div>);
}
export default PipelineListEntry;