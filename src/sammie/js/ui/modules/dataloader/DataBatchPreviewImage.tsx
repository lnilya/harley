import React from "react";
import {ccl} from "../../../util";
import '../../../../scss/modules/DataLoader/DataBatchPreviewImage.scss'
import * as ui from '../../../state/uistates'
import * as alg from '../../../state/algstate'
import {LocalFileWithPreview} from "../../../types/datatypes";
import {Tooltip} from "@mui/material";

interface IDataBatchPreviewImageProps {
    
    /**Additional classnames for this component*/
    className?: string
    img: LocalFileWithPreview,
    onClick: () => void
    title: string
}

/**
 * DataBatchPreviewImage
 * @author Ilya Shabanov
 */
const DataBatchPreviewImage: React.FC<IDataBatchPreviewImageProps> = ({img, onClick, title, className}) => {
    
    if (!img) {
        var content = (<div className={`data-batch-preview-image ${className || ''} pad-100`}
                            onClick={onClick}>
            Add<br/>{title}
        </div>)
    } else {
        content = (<div className={`data-batch-preview-image ${className || ''} selected`}
                        onClick={onClick}>
            <img src={img.previewURL} alt=""/>
            <span>{img.file.name}</span>
        </div>)
    }
    
    if(!img) return content;
    
    const metaData = Object.keys(img.meta).map((name) => {
            
            //By convention meta fields starting with __ will not be displayed on the frontend.
            if (name.indexOf('__') == 0) return null;
            
            return (<div key={name} className={'data-batch-preview-image__tooltipel'}>
                <strong>{name}:</strong>
                <span>{img.meta[name]}</span>
            </div>)
        }
    )
    return (<Tooltip title={metaData} arrow placement={'bottom'}>
        {content}
    </Tooltip>);
}

export default DataBatchPreviewImage;