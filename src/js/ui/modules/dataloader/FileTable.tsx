import React from "react";
import {Button} from "@material-ui/core";
import {LocalFile, LocalFolder} from "../../../types/datatypes";
import {cl} from "../../../util";
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
interface IFileTableProps{
    className?:string,
    allFiles:Array<LocalFile>,
    allFolders:Array<LocalFolder>,
    filter:string,
    upFolder:LocalFolder,
    selectedFile:LocalFile,
    onSelectFile:(f:LocalFile) => void,
    onSelectFolder:(f:LocalFolder) => void
}
/**
 * FileTable
 * @author Ilya Shabanov
 */
const FileTable:React.FC<IFileTableProps> = ({upFolder, onSelectFolder, allFolders, className, allFiles,filter,onSelectFile,selectedFile}) => {
	
    const getFilteredFiles = ():LocalFile[]=>{
        if(!allFiles) return null;
        if(!filter) return allFiles;
        const regex = new RegExp(filter.replace('.','\.').replace('*','.*?'))
        return allFiles.filter((f)=>(f.name.match(regex) !== null));
    }
    
    if(!allFiles && !allFolders) return null;
    
    const onClickFile = (f:LocalFile)=>{
        onSelectFile(f.name == selectedFile?.name ? null : f);
    }
    
    
	return (
		<div className={`file-table ` + className}>
            <div onClick={()=>onSelectFolder(upFolder)}  className={'fl-row-start folder'} key={'bck'}>
                <KeyboardBackspaceIcon/>
                <span>..</span>
            </div>
            {allFolders.map(e=>
                <div onClick={()=>onSelectFolder(e)} className={'fl-row-start folder'} key={e.name}>
                    <FolderOpenIcon/>
                    <span>{e.name}</span>
                </div>
            )}
            {getFilteredFiles().map((e) =>
                <div onClick={()=>onClickFile(e)} className={'fl-row-start file ' + cl(e.name == selectedFile?.name,'is-selected')} key={e.name}>
                    <DescriptionOutlinedIcon/>
                    <span>{e.name}</span>
                </div>
            )}
		</div>
	);
}
export default FileTable;