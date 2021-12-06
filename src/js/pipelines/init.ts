import {Pipeline} from "../../sammie/js/types/pipelinetypes";
import cellDetectionPipeline from "./cellDetectionPipeline";
import preprocessingPipeline from "./dvPreprocessingPipeline";
import fociDetectionPipeline from "./fociDetectionPipeline";
import modelPipeline from "./modelTrainingPipeline";


/**Main Function to initialize pipelines*/
export function getPipelineDefinitions() {
    const cd: Pipeline = cellDetectionPipeline()
    const dvs: Pipeline = preprocessingPipeline()
    const fds: Pipeline = fociDetectionPipeline()
    const svm: Pipeline = modelPipeline()
    return [cd,dvs,svm,fds];
}
