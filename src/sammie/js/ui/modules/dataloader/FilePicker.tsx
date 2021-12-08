import React, {useEffect, useState} from "react";
import FileTable from "./FileTable";
import {useRecoilValue} from "recoil";
import * as server from "../../../eel/eel";
import {EelResponse} from "../../../eel/eel";
import {ccl} from "../../../util";
import {LocalFile, LocalFileWithPreview, LocalFolder} from "../../../types/datatypes";
import {Input} from "@mui/material";
import * as storage from '../../../state/persistance'
import FilePreview from "./FilePreview";
import ToolTipHint from "../../elements/ErrorHint";
import * as ui from '../../../state/uistates'
import {PipelineInput} from "../../../types/pipelinetypes";

interface IFilePickerProps {
    /**This file will be selected, overrides initial Folder*/
    initialFile?: LocalFileWithPreview,
    
    /**The input for which this dialog is shown.*/
    input: PipelineInput,
    
    /**When fetching previews, we need unique identifiers for each batch, since they must be different filenames on the server.*/
    batchID: number,
    
    /**Called when Pipeline inputs are changed, i.e. when a file is selected and a preview has been loaded.*/
    updateFunction?: (inp: PipelineInput, data: LocalFileWithPreview, add: boolean) => void
}

/**
 * FilePicker
 * @author Ilya Shabanov
 */
const cl = ccl('file-picker--')

// const asFilter = atomFamily<string, string>({key: 'file_picker_filter', default: ''});
// const asSelectedFile = atomFamily<LocalFile,string>({key:'file_picker_selected',default:null});
// const asCurrentFolder = atomFamily<string,string>({key:'file_picker_folder',default:''});
// const asFilesInFolder = atomFamily<{ folder:string, files:LocalFile[] },string>({key:'file_picker_all_files',default:null});

var timeout = {}
const FilePicker: React.FC<IFilePickerProps> = ({batchID, input, initialFile, updateFunction}) => {
    
    const pipeName = useRecoilValue(ui.selectedPipelineName);
    const k = pipeName + '_' + input.key;
    
    const [filter, setFilter] = useState<string>('');
    const [selFile, setSelFile] = useState<LocalFile>(null)
    const [allFiles, setAllFiles] = useState<{ folder: string, files: LocalFile[], folders: LocalFolder[] }>(null);
    const [isLoading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<EelResponse<any>>(null);
    
    const [curUpFolder, setUpFolder] = useState<LocalFolder>(null)
    const [curFolder, setCurFolder] = useState('')
    
    const fetchFolderContents = async (folder: string, selectFile: LocalFile = null) => {
        if (!folder) { //unselection
            setAllFiles(null)
            setSelFile(null)
            return;
        }
        console.log(`[FilePicker]: Fetching: ${folder}`);
        setLoading(true)
        const res = await server.getFolderContents(folder, getAvailableExtensions(input))
        
        setAllFiles(!res.error ? {folder: curFolder, ...res.data} : null)
        setError(res.error ? res : null)
        setLoading(false)
        
        //save the last used folder for this pipeline input
        if (!res.error) {
            storage.saveDataForPipeline(folder, k + '_folder',pipeName)
            setCurFolder(folder)
            var liof = folder.lastIndexOf('/')
            if (liof == -1) liof = folder.lastIndexOf('\\')
            
            if (liof == -1) setUpFolder(null)
            else setUpFolder({path: folder.substr(0, liof), name: '..'});
            
        }
        
        console.log(`[FilePicker]: Fetched and selFile:`, selectFile);
        if (selectFile) {
            //check if file is still in folder
            const foundFile = res?.data?.files?.find((flfp) => flfp.path == selectFile.path)
            if (foundFile) setSelFile(foundFile)
            else setSelFile(null)
        } else
            setSelFile(null) //unselect if we had a file previously
    }
    
    /*INIT HOOK */
    useEffect(() => {
        
        //Filter is always shared for all batches, just load it from cookie.
        setFilter(storage.loadDataForPipeline(k + '_filter',pipeName))
        
        //Reload folder contents, then
        //select the file we are looking for for, if we have a file.
        const initFolder = initialFile?.file.folder;
        if (initFolder)
            fetchFolderContents(initFolder, initialFile.file);
        else {
            //no file or folder passed, use the old folder stored in cookie
            const lastUsedFolder = storage.loadDataForPipeline(k + '_folder',pipeName)
            fetchFolderContents(lastUsedFolder);
        }
    }, [])
    
    
    //Change of Filter
    const setAndStoreFilter = (fv: string) => {
        setFilter(fv)
        storage.saveDataForPipeline(fv, k + '_filter',pipeName)
    }
    
    //Change of file Selection
    const onSelectedAFile = (f: LocalFile | null) => {
        if (selFile != f) setSelFile(f)
    }
    
    //Folder TextField handling, fetch the folder when pressing enter, or loosing focus
    const onInputSubmit = (e) => fetchFolderContents(e.target.value)
    const onKeyUpInput = (e) => {
        if (e.keyCode == 13) e.target.blur();
    }
    const onSelectFolder = (e: LocalFolder) => {
        fetchFolderContents(e.path)
    }
    return (
        <div className={`file-picker` + cl(isLoading, ' loading')}>
            <h2>{input.title}</h2>
            
            {input.description &&
            <div className="desc">{input.description}</div>
            }
            <div className="file-picker__table pad-100 margin-100-top">
                <div className="fl-row fl-align-center">
                    <strong className="file-picker__label margin-50-right">Folder:</strong>
                    <Input className={'full-w'} placeholder={'Data Folder...'}
                           value={curFolder}
                           onChange={e => setCurFolder(e.target.value)}
                           onKeyUp={onKeyUpInput}
                           onBlur={onInputSubmit}/>
                    <strong className="file-picker__label margin-50-hor">Filter:</strong>
                    <Input className={''} placeholder={'Filter...'} value={filter}
                           onChange={e => setAndStoreFilter(e.target.value)}
                           onBlur={e => setAndStoreFilter(e.target.value)}/>
                </div>
                {error &&
                <>
                    <div className="file-picker__separator margin-100-neg-hor margin-100-ver"/>
                    <ToolTipHint error={error}/>
                </>
                }
                {(allFiles?.files || allFiles?.folders) &&
                <>
                    <div className="file-picker__separator margin-100-neg-hor margin-100-ver"/>
                    <div className="fl-row-between fl-equal-size">
                        <FileTable className={'pad-50-right'} allFiles={allFiles.files} selectedFile={selFile}
                                   allFolders={allFiles.folders}
                                   upFolder={curUpFolder}
                                   onSelectFolder={onSelectFolder}
                                   onSelectFile={onSelectedAFile} filter={filter}/>
                        <FilePreview updateFunction={updateFunction} className={'pad-50-left'} selFile={selFile}
                                     initialPreview={initialFile}
                                     batchID={batchID}
                                     input={input}/>
                    </div>
                </>
                }
            </div>
        
        </div>
    );
}
export default FilePicker;


/**Retrieve the loader from the defined list of loaders by their exension*/
function getAvailableExtensions(input: PipelineInput): string[] {
    var allExtensions: string[] = []
    Object.keys(input.loaders).map((extlist) => {
        extlist.split(',').forEach((e) => {
            allExtensions.push(e.toLowerCase())
        })
    })
    return allExtensions
}