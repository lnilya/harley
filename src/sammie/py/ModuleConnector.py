import abc
from typing import Dict, Callable

from src.sammie.py.SessionData import SessionData
from src.sammie.py.modules.ModuleBase import ModuleBase


class AggregatorFileInfo:
    exists: bool  # Wether or not the file already exists
    ready: bool  # Wether or not the filename/path are valid, regardless wether it exists
    info: str  # Info regarding the file, displayed to the user (e.g. "file contains already 4 batches" or "file doesnt exists")

    def __init__(self, exists:bool, ready:bool, info:str):
        self.exists = exists
        self.ready = ready
        self.info = info


    def toDict(self):
        return {'info':self.info, 'exists':self.exists, 'ready':self.ready}

class AggregatorReturn:
    msg: str  # Message to be displayed in a toast in the aggregator screen upon success
    info: AggregatorFileInfo  # Info on the file after successful aggergation

    def __init__(self, msg:str, info:AggregatorFileInfo):
        self.msg = msg
        self.info = info

    def toDict(self):
        return {'info':self.info.toDict(), 'msg':self.msg}

class LoaderResult:
    """Result of loading a file, consisting of a preview/metadata for JS and whatever data is to be pushed into the pipeline"""

    metaData:Dict #Dictionary of meta data for loaded file
    previewURL:str #An optional URL for the image to use as thumbnail for this file
    data:any #The actual Data to be pushed into SessionData, will not be sent to JS
    def __init__(self, data:any, preview:str,meta:Dict = None):
        self.metaData = meta if meta is not None else {}
        self.previewURL = preview
        self.data = data


# Signature for the aggregator function
TAggregatorFunction = Callable[[str, SessionData, Dict[str, ModuleBase], int, Dict], AggregatorReturn]


class ModuleConnector(metaclass=abc.ABCMeta):
    """Interface used to specify how the Sammies server side is accessing the modules, loaders and aggregators
    created for a specific algorithm by the developer"""

    @abc.abstractmethod
    def runLoader(self, loaderName: str, asPreview:bool, key:str, filePath:str) -> LoaderResult:
        """
        Loads a file and returns data and previews. Should throw an error if anything goes wrong.
        Args:
            loaderName (str): ID for the loader, usually a function name. Provided by JS see PipelineInput.loaders in JS.
            asPreview (bool): A file is loaded as preview during DataInput on JS side. If for example the content is parsed in a time intensive manner, it can be skipped when just loading the preview. The loader is ran again with preview disabled once the data is actually loaded and pipeline started.
            The size of preview images needs not to be larger than 300x300px.
            key (str): The Key for this datafile. This is a unique key that should be used for generating filenames for preview images. Will depend on pipeline step, batchnumber and such.
            filePath (str): The path to load the data from.

        Returns:
            A LoaderResult containing metadata,previewURL and data for session
        """
        pass

    @abc.abstractmethod
    def resetAggregatorFile(self, aggregatorID: str, destinationPath:str, ) -> bool:
        """
        Resets the aggregatorfile. Can be by simply deleting it or clearing it of any data.
        Args:
            aggregatorID (str): ID for this function, usually the function name. It is provided by JS as the aggregatorID field in PipelineAggregatorOutput datatype.
            destinationPath (str): Path of the file to write to

        Returns:

        """
        pass

    @abc.abstractmethod
    def getAggregatorFileInfo(self, aggregatorID: str, destinationPath:str, ) -> AggregatorFileInfo:
        """
        Returns information on a file the user has chosen as destination for the aggregator.
        Args:
            aggregatorID (str): ID for this function, usually the function name. It is provided by JS as the aggregatorID field in PipelineAggregatorOutput datatype.
            destinationPath (str): Path of the file to write to
        Returns:
            An AggregatorFileInfo instance containing info on the file.
        """
        pass

    @abc.abstractmethod
    def runAggregator(self, aggregatorID: str, destinationPath:str, data:SessionData, modulesById:Dict[str, ModuleBase], batchNum:int, adtlParams:Dict = None) -> AggregatorReturn:
        """
        An aggregator function will append data from a pipeline to a file provided by user.
        See PipelineAggregatorOutput datatype on js side.
        Args:
            aggregatorID (str): ID for this function, usually the function name. It is provided by JS as the aggregatorID field in PipelineAggregatorOutput datatype.
            destinationPath (str): Path of the file to write to
            data (SessionData): SessionData containing current pipeline state
            modulesById (Dict[str,ModuleBase]): Dictionary containing active module instances in the pipeline. Sometimes an aggregator need to communicate with the module directly, to get more than just the pipelinedata in SessionData.
            batchNum (int): The index of the batch this data is coming from. This is used so that if the same batch is run multiple times, the aggregator can overwrite previous outputs, rather than appending them to the file.
            adtlParams (Dict): Additional parameters passed to the exporter by JS. These are static parameters defined in the pipeline (See PipelineAggregatorOutpur.exporterParams in JS) merged with with the parameters for the batch (see Pipeline.inputParameters in JS).

        Returns:
            An AggregatorReturn, instance containing info on the aggregation and new file info after aggregation.

        """
        pass

    @abc.abstractmethod
    def initializeModule(self, moduleID: str, moduleName: str, params: Dict, session: SessionData) -> ModuleBase:
        """
        creates an instance of module given its id.
        Args:
            moduleID (str): The ID the module has been given in the pipeline settings on JS side.
            moduleName (str): Name of the module, defined in the params file of the module on JS side. This identifies the class to be instantiated on py side.
            params (Dict): A dictionary with parameters passed from JS. They are defined in the serverParameters field of the PipelineStep type in the pipeline definition.
            Useful especially if you have multiple modules with different IDs but same name. That is you are using the same class but different instances on py side. Parameters allow
            you to configure these somehow.
            session (SessionData): The SessionData object, storing and receiving inputs/outputs of the whole pipeline.

        Returns:
            A new instance of a Module (subclass of ModuleBase)
        """
        pass
