import React, {useEffect, useState} from "react";
import {LocalFile, LocalFileWithPreview} from "../../../types/datatypes";
import {atomFamily} from "recoil";
import * as server from "../../../eel/eel";
import {EelResponse} from "../../../eel/eel";
import ToolTipHint from "../../elements/ErrorHint";
import {PipelineInput} from "../../../types/pipelinetypes";
import {getLoaderFromFileName} from "../../../pipelines/pipeline";

interface IFilePreviewProps {
    /**A file selected by user*/
    selFile: LocalFile,
    /**If a preview was loaded previously it can be passed here and we can skip inital preview fetch*/
    initialPreview:LocalFileWithPreview,
    
    /**Description of the input*/
    input: PipelineInput,
    
    /**When fetching previews, we need unique identifiers for each batch, since they must be different filenames on the server.*/
    batchID:number,
    
    /**Additional classnames for this component*/
    className?: string,
    
    /**Called when file preview was fetched*/
    updateFunction?: (inp: PipelineInput, data: LocalFileWithPreview, add: boolean) => void
}

/**
 * FilePreview
 * @author Ilya Shabanov
 */
const asSelectedFilePreview = atomFamily<LocalFileWithPreview, string>({key: 'file_preview_preview', default: null});

const FilePreview: React.FC<IFilePreviewProps> = ({batchID, updateFunction, initialPreview, input, selFile, className}) => {
    
    const [selFilePreview, setSelFilePreview] = useState<LocalFileWithPreview>(initialPreview);
    const [error, setError] = useState<EelResponse<any>>(null);
    useEffect(() => {
        
        if (selFile === null) {
            setError(null)
            setSelFilePreview(null)
            updateFunction(input, null, false)
        } else if (selFile.path == initialPreview?.file?.path) {
            setError(null)
            setSelFilePreview(initialPreview)
            updateFunction(input, initialPreview, true)
        } else if (selFile.path != (selFilePreview || initialPreview)?.file?.path) {
            //Load preview for selected file and initalize the pipeline. Probably needs to go out of the component
            //code at some point.
            const loader = getLoaderFromFileName(selFile.name, input);
            server.loadInputFile(input.key, selFile.path, loader,batchID).then((res) => {
                setError(res.error ? res : null)
                const lfp: LocalFileWithPreview = res.error ? null : {file: selFile, ...res.data}
                setSelFilePreview(lfp)
                //Tell upwards, that data has been successfully loaded,
                updateFunction(input, lfp, !res.error)
            })
        }
    }, [selFile])
    
    if (!selFile) return null
    return (
        <div className={`file-preview ` + className}>
            <ToolTipHint error={error}/>
            {selFilePreview &&
            <>
                <img src={selFilePreview.previewURL}/>
                {selFilePreview.meta &&
                <div className="file-preview__meta fl-row-start fl-align-start">
                    {Object.keys(selFilePreview.meta).map((name) => {
                            
                            //By convention meta fields starting with __ will not be displayed on the frontend.
                            if (name.indexOf('__') == 0) return null;
                            
                            return (<div key={name}>
                                <strong>{name}:</strong>
                                <span>{selFilePreview.meta[name]}</span>
                            </div>)
                        }
                    )}
                </div>
                }
            </>
            }
        </div>
    );
}
export default FilePreview;