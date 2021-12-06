# Main file containing the link to the SAMMIE framework
from typing import Dict

from src.sammie.py.SessionData import SessionData
from src.sammie.py.modules.ModuleBase import ModuleBase


def getLoaderFunction(loaderName):
    pass
def getAggregatorFunction(agName):
    pass

def initializeModule(moduleID: str, moduleName: str, params: Dict, session: SessionData)->ModuleBase:
    """Main function for initializing the modules as they will be required by framework"""
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
