import {LocalFileWithPreview, PipelineDataKey, PipelineImage} from "../types/datatypes";

/**
 * Loaded File was an image and is used as such 
 * @param pv
 * @param plk
 */
export function postProcessForImage(pv:LocalFileWithPreview, plk:PipelineDataKey){
    var pl:PipelineImage = {
        url:pv.previewURL,
        w: parseInt(pv.meta['Width']),
        h: parseInt(pv.meta['Height'])
    }
    return pl
}

export function suggestSuffixedFileName(suffix:string, extension:string){
    return suggestModifiedFilename(/(.*)\..*/g,'$1'+suffix+'.'+extension)
}
/**
 * Basic function for filename replacement, returns a function that can be used for
 * PipelineOutput Defintions.
 * @example:
  *  suggestModifiedFilename(/(.*)\.(.*)/g,'$1_modified.$2')
 *  Will replace "test.jpg" => "test_modified.jpg"
 *
 * @example:
 *  suggestModifiedFilename(/(.*)/g,'Results.csv')
 *  Will replace "test.jpg" => "Results.csv"
 * */
export function suggestModifiedFilename(pattern:RegExp,replacement:string){
    return (lfp:LocalFileWithPreview)=> {
        
        if(lfp?.file?.name && lfp?.file?.folder)
            return lfp.file.folder + lfp.file.name.replace(pattern, replacement)
        
        return ''
    }
}
