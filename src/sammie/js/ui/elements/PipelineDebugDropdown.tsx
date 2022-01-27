import React, {useState} from "react";
import {ccl} from "../../util";
import '../../../scss/elements/PipelineDebugDropdown.scss'
import * as ui from '../../state/uistates'
import * as alg from '../../state/algstate'
import Menu from '@mui/material/Menu';
import {Button, FormControl, MenuItem, NativeSelect, Tooltip} from "@mui/material";
import {useToggleKeys} from "../../modules/modulehooks";
import {Pipeline} from "../../types/pipelinetypes";
import {clearPipelineStore} from "../../state/persistance";

interface IPipelineDebugDropdownProps {
    
    /**Additional classnames for this component*/
    className?: string
    pipe:Pipeline
}

/**
 * PipelineDebugDropdown
 * @author Ilya Shabanov
 */
const cl = ccl('pipeline-debug-dropdown--')
const PipelineDebugDropdown: React.FC<IPipelineDebugDropdownProps> = ({pipe,className}) => {
    
    const isDown = useToggleKeys('d')
    // if(!isDown) return null;
    
    const onDeleteCookies = (action:string) => {
        if(action == 'del')
            clearPipelineStore(pipe.name)
    };
    
    return (
        <div className={`pipeline-debug-dropdown ${className || ''} ${isDown ? 'show' : ''}`}>
            <div className="pdd__header text-center text-bold">
                Debug Menu
            </div>
            <Tooltip arrow placement={'left'} title={'Deletes all caches associated with this pipeline('+pipe.descriptions.title+'). Includes current/stored parameter settings, links to folders and files for this pipeline. Use this as a first attemt to fix things, if a pipeline crashes upon opening.'}>
                <div className="entry" onClick={e=>onDeleteCookies('del')}>
                    Clear Pipeline Data
                </div>
            </Tooltip>
        </div>
    );
}

export default PipelineDebugDropdown;