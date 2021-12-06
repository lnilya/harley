from typing import Dict
from src.py import loaders
from src.py import aggregators

from src.sammie.py.ModuleConnector import ModuleConnector, AggregatorReturn, AggregatorFileInfo, LoaderResult
from src.sammie.py.SessionData import SessionData
from src.sammie.py.modules.ModuleBase import ModuleBase


class HarleyModuleConnector(ModuleConnector):
    def runLoader(self, loaderName: str, asPreview: bool, key: str, filePath: str) -> LoaderResult:
        loaderFun = getattr(loaders, loaderName)  # will throw an error if doesnt exist
        return loaderFun(asPreview, key, filePath)

    def resetAggregatorFile(self, aggregatorID: str, destinationPath: str) -> bool:
        aggregatorFun = getattr(aggregators, aggregatorID + '_Reset')
        return aggregatorFun(destinationPath)

    def getAggregatorFileInfo(self, aggregatorID: str, destinationPath: str) -> AggregatorFileInfo:
        aggregatorFun = getattr(aggregators, aggregatorID + '_Info')
        return aggregatorFun(destinationPath)

    def runAggregator(self, aggregatorID: str, destinationPath: str, data: SessionData,
                      modulesById: Dict[str, ModuleBase], batchNum: int, adtlParams: Dict = None) -> AggregatorReturn:
        aggregatorFun = getattr(aggregators, aggregatorID)
        return aggregatorFun(destinationPath, data, modulesById, batchNum, adtlParams)

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
        elif moduleName == 'CellFittingManual':
            from src.py.modules.CellFittingManual import CellFittingManual
            return CellFittingManual(moduleID, session, **params)
        elif moduleName == 'DVStacker':
            from src.py.modules.DVStacker import DVStacker
            return DVStacker(moduleID, session, **params)
        elif moduleName == 'Denoise':
            from src.py.modules.Denoise import Denoise
            return Denoise(moduleID, session)
        elif moduleName == 'MaskTightening':
            from src.py.modules.MaskTightening import MaskTightening
            return MaskTightening(moduleID, session)
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
        # %NEW_MODULE%
        # Keep the New Module Comment at this location, for automatically adding new modules via scripts. Do not delete it, or the script will not work.