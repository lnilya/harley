

//***************************************************************/
//* LOCAL FILES / INPUT DATA TYPES */
//***************************************************************/

export type LocalFileWithPreview = {
    previewURL:string,
    meta:Record<string, any>,
    file: LocalFile
};
export type LocalFilePath = string
export type LocalFolder = {
    name:string,
    path:LocalFilePath
}
export type LocalFile = {
    /**FileName with extension*/
    name:string
    /**Folder where file is located with tailing slash*/
    folder: string
    /**Full path of the file = folder + name (for convenience)*/
    path:LocalFilePath
}


//***************************************************************/
//* GENERAL DATA OF THE PIPELINE */
//***************************************************************/

/**Key identifying a pipeline itself*/
export type PipelineName = string;

/**Pipeline Keys identifiying input and output data for steps of pipeline*/
export type PipelineDataKey = string;
/**A marker type for something that goes into the pipeline, for legibility only*/
export type PipelineData = any;


/**An id identifying a loader for a file*/
export type PipelineDataLoaderID = string;

/**An id identifying a loader for a file*/
export type PipelineDataAggregatorID = string;



/**Types that are needed to use shared componented in the modules*/

/**An image*/
export type PipelineImage = { url:string, w:number, h:number }

/**A set of images with a location referring to a bigger canvas*/
export type PipelineBlobs = Array<{ x:number, y:number, img:PipelineImage }>;

/**A set of Ellipses*/
export type PipelineEllipses = Array<{ x:number, y:number, a:number, b:number, rot:number}>;

/**A set of Arbitrary Polygons*/

export type PolygonData = { x:number[], y:number[], lbl?:string };
export type PipelinePolygons = Array<PolygonData>;

