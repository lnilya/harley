import {LocalFileWithPreview, PipelineDataKey, PipelineImage} from "../types/datatypes";
import {Parameter, ParameterKey} from "../modules/_shared";
import {parseValueToParamType} from "../state/stateutil";

/**
 * Merges the settings for a pipeline batch with the metadata data coming from a local file with preview
 * @param pv The loaded local file with its preview and metadata
 * @param curSettings The current settings object for the BATCH
 * @param paramConfig All configs of batch parameters, (comes from the pipeline definition)
 * a copy of the settings object, to be set into the SingleBatch Object. May or may not have been be modified.
 */
export async function mergeMetaInformationWithBatchSettings(pv:LocalFileWithPreview, curSettings:Record<ParameterKey, any>, paramConfig:Array<Parameter<any>>){
    
    var newSettings = {...curSettings}
    //overwrite every key from metadata into current settings
    for (let metaKey in pv.meta) {
        if(newSettings[metaKey] !== undefined){
            const config:Parameter<any> = paramConfig.find(pc=>pc.key == metaKey)
            newSettings[metaKey] = parseValueToParamType(config.dtype,pv.meta[metaKey])
        }
    }
    
    return newSettings;
}
/**
 * Loaded File was an image and is used as such
 * @param pv
 * @param plk
 */
export async function postProcessForImage(pv:LocalFileWithPreview, plk:PipelineDataKey){
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
