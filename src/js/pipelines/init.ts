import {Pipeline} from "../../sammie/js/types/pipelinetypes";
import cellDetectionPipeline from "./cellDetectionPipeline";
import preprocessingPipeline from "./dvPreprocessingPipeline";
import fociDetectionPipeline from "./fociDetectionPipeline";
import fociDetectionPipelineAlt from "./ParametrizedFociDetectionPipeline";
import modelPipeline from "./modelTrainingPipeline";
import colocPipeline from "./ColocalizationPipeline";


/**Main Function to initialize pipelines*/
export function getPipelineDefinitions() {
    const cd: Pipeline = cellDetectionPipeline()
    const dvs: Pipeline = preprocessingPipeline()
    const fds: Pipeline = fociDetectionPipeline()
    const fps: Pipeline = fociDetectionPipelineAlt()
    const svm: Pipeline = modelPipeline()
    const clc: Pipeline = colocPipeline()
    return [cd,dvs,svm, {'via Model':fds, 'via Parameters':fps},clc];
}
