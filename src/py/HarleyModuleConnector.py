from typing import Dict, List
from src.py import loaders
from src.py import aggregators

from src.sammie.py.ModuleConnector import ModuleConnector, AggregatorReturn, AggregatorFileInfo, LoaderResult
from src.sammie.py.SessionData import SessionData
from src.sammie.py.modules.ModuleBase import ModuleBase


class HarleyModuleConnector(ModuleConnector):
    def runLoader(self, loaderName: str, asPreview: bool, key: str, filePath: str, loaderArgs:Dict) -> LoaderResult:
        loaderFun = getattr(loaders, loaderName)  # will throw an error if doesnt exist
        return loaderFun(asPreview, key, filePath,**loaderArgs)

    def resetAggregatorFile(self, aggregatorID: str, destinationPath: str, batchKey:List[str] = None) -> bool:
        aggregatorFun = getattr(aggregators, aggregatorID + '_Reset')
        return aggregatorFun(destinationPath,batchKey)

    def getAggregatorFileInfo(self, aggregatorID: str, destinationPath: str) -> AggregatorFileInfo:
        aggregatorFun = getattr(aggregators, aggregatorID + '_Info')
        return aggregatorFun(destinationPath)

    def runAggregator(self, aggregatorID: str, destinationPath: str, data: SessionData,
                      modulesById: Dict[str, ModuleBase], batchKey: List[str], adtlParams: Dict = None) -> AggregatorReturn:
        aggregatorFun = getattr(aggregators, aggregatorID)
        return aggregatorFun(destinationPath, data, modulesById, batchKey, adtlParams)

    def initializeModule(self, moduleID: str, moduleName: str, params: Dict, session: SessionData) -> ModuleBase:
        if moduleName == 'Threshhold':
            from src.py.modules.Threshhold import Threshhold
            return Threshhold(moduleID, session, **params)
        elif moduleName == 'BlobRemoval':
            from src.py.modules.BlobRemoval import BlobRemoval
            return BlobRemoval(moduleID, session, **params)
        elif moduleName == 'Thinning':
            from src.py.modules.Thinning import Thinning
            return Thinning(moduleID, session, **params)
        elif moduleName == 'CellDetection':
            from src.py.modules.CellDetection import CellDetection
            return CellDetection(moduleID, session, **params)
        elif moduleName == 'CellFitting':
            from src.py.modules.CellFitting import CellFitting
            return CellFitting(moduleID, session, **params)
        elif moduleName == 'CellFittingHeatmap':
            from src.py.modules.CellFittingHeatmap import CellFittingHeatmap
            return CellFittingHeatmap(moduleID, session, **params)
        elif moduleName == 'DVStacker':
            from src.py.modules.DVStacker import DVStacker
            return DVStacker(moduleID, session, **params)
        elif moduleName == 'Denoise':
            from src.py.modules.Denoise import Denoise
            return Denoise(moduleID, session)
        elif moduleName == 'CellSelection':
            from src.py.modules.CellSelection import CellSelection
            return CellSelection(moduleID, session)
        elif moduleName == 'FociCandidates':
            from src.py.modules.FociCandidates import FociCandidates
            return FociCandidates(moduleID, session)
        elif moduleName == 'Labeling':
            from src.py.modules.Labeling import Labeling
            return Labeling(moduleID, session)
        elif moduleName == 'Training':
            from src.py.modules.Training import Training
            return Training(moduleID, session)
        elif moduleName == 'FociDetectionModel':
            from src.py.modules.FociDetectionModel import FociDetectionModel
            return FociDetectionModel(moduleID, session)
        elif moduleName == 'DatasetAlignment':
            from src.py.modules.DatasetAlignment import DatasetAlignment
            return DatasetAlignment(moduleID,session)
        elif moduleName == 'ColocCells':
            from src.py.modules.ColocCells import ColocCells
            return ColocCells(moduleID,session)
        elif moduleName == 'ColocGraphs':
            from src.py.modules.ColocGraphs import ColocGraphs
            return ColocGraphs(moduleID,session)
        elif moduleName == 'ColocGraphs':
            from src.py.modules.ColocGraphs import ColocGraphs
            return ColocGraphs(moduleID,session)
        elif moduleName == 'ColocGraphs':
            from src.py.modules.ColocGraphs import ColocGraphs
            return ColocGraphs(moduleID,session)
        elif moduleName == 'FociDetectionParams':
            from src.py.modules.FociDetectionParams import FociDetectionParams
            return FociDetectionParams(moduleID,session)
        # %NEW_MODULE%
        # Keep the New Module Comment at this location, for automatically adding new modules via scripts. Do not delete it, or the script will not work.