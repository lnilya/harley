import pickle
from typing import List, Tuple, Dict

import matplotlib.pyplot as plt
from numpy.core.records import ndarray
from scipy.stats import pearsonr
from shapely.geometry import Polygon

from src.py.modules.ColocCellsUtil.colocdatatypes import CCCells
from src.py.modules.ColocCellsUtil.colocutil import identifyCellPartners, getColocImages
from src.py.types.CellsDataset import CellsDataset
from src.sammie.py.modules.ModuleBase import ModuleBase
from src.sammie.py.util import imgutil, shapeutil
from src.sammie.py.util.imgutil import getPreviewImage
import numpy as np


class ColocCellsKeys:
    """Convenience class to access the keys as named entities rather than in an array"""
    inAlignedDatasets: str
    outIncludedCells: str

    def __init__(self, inputs, outputs):
        self.inAlignedDatasets = inputs[0]
        self.outIncludedCells = outputs[0]


class ColocCells(ModuleBase):
    keys: ColocCellsKeys
    alignedDataSets: List[Tuple[CellsDataset, CellsDataset]]
    cellImages: List[
        Tuple[ndarray, ndarray, ndarray, ndarray]]  # PreviewImages for each cell, both channels, mix and coloc only
    cellContours: List[Dict]  # Outlines of each cell
    cellFoci: Tuple[List[List[Dict]], List[List[Dict]]]  # For each channel, each cell a list of contours
    selectedCells: List[int]  # Indices of cells selected

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.log = 'ColocCells'
        self.trace('initialized')

    def __letterToCol(self,col:str):
        if   col == 'r': return (255, 0, 0)
        elif col == 'g': return (0, 255, 0)
        elif col == 'b': return (0, 0, 255)
        elif col == 'y': return (255, 255, 0)
        elif col == 'o': return (255, 169, 0)

    def unpackParams(self, color, shift,scale, **other):
        """unpack and possibly parse/cast all parameters coming from JS. The parameters from JS are defined in the params.tsx file of the respective step.
        The arrive as a dictionary on the py side and sometimes need some parsing. In any way this function provides a simple method to extract
        these parameters as named variables rather than using params['paramName1'] you can run it through this function."""
        #
        # respective
        c = [self.__letterToCol(color[0]), self.__letterToCol(color[1])]

        s = [0, 0]
        if shift is not None and len(shift) > 0:
            ranges = [float(r.strip()) for r in shift.split(';')]
            if len(ranges) != 2:
                raise RuntimeError('Format of Shift Parameter needs to be <Number>;<Number>')
            else:
                s = (ranges[0],ranges[1])
                if scale:
                    s = (s[0]/scale,s[1]/scale)

        return c, s

    def addGeneratedData(self, params):

        # Parse into polygons
        foci0 = []
        foci1 = []
        for i in self.selectedCells:
            foci0 += [[Polygon(np.array([focus['x'], focus['y']]).T) for focus in self.cellFoci[0][i]]]
            foci1 += [[Polygon(np.array([focus['x'], focus['y']]).T) for focus in self.cellFoci[1][i]]]

        data = CCCells(foci0,
                       foci1,
                       [img for i, img in enumerate(self.rawImages) if i in self.selectedCells],
                       [pcc for i, pcc in enumerate(self.pcc) if i in self.selectedCells],
                       [fpcc for i, fpcc in enumerate(self.fpcc) if i in self.selectedCells],
                       )
        """Add the selected cells' foci into the pipeline for coloc analysis"""
        self.onGeneratedData(self.keys.outIncludedCells,
                             data
                             , params)

    def __getCorrelationInFoci(self, img1: np.ndarray, img2: np.ndarray, f1: List[Dict], f2: List[Dict]):

        allFoci = f1 + f2
        if len(allFoci) == 0: return None
        corrCorrds0 = []
        corrCorrds1 = []
        for focus in allFoci:
            mp, offx, offy = shapeutil.getPolygonMaskPatch(np.array(focus['x']), np.array(focus['y']), 0)
            corrCorrds0 += img1[offy:mp.shape[0] + offy, offx:mp.shape[1] + offx][mp == True].tolist()
            corrCorrds1 += img2[offy:mp.shape[0] + offy, offx:mp.shape[1] + offx][mp == True].tolist()

        pcc = pearsonr(corrCorrds0, corrCorrds1)
        if pcc[0] == pcc[0]:  # NaN check
            return pcc

        return None

    def run(self, action, params, inputkeys, outputkeys):
        self.keys = ColocCellsKeys(inputkeys, outputkeys)

        # This is a stub and simply displays best practices on how to structure this function. Feel free to change it
        if action == 'select':
            self.selectedCells = params['select']
            self.addGeneratedData(params)
            return True
        elif action == 'apply':

            col,shift = self.unpackParams(**params)

            # get the input that this step is working on
            self.alignedDataSets = self.session.getData(self.keys.inAlignedDatasets)

            # Identify which cell numbers correspond to which in two aligned batches
            self.cellImages = []
            self.rawImages = []
            self.cellContours = []
            self.cellFoci = [[], []]
            self.pcc = []
            self.fpcc = []
            dsnum = 0
            dsborder = 3 #Dataset has an internal offset, unfortunately, should be stored in dataset not here.
            border = 7 #border we wish. Important for channel shift, if it is too large errors will be generated - increase border if out of bounds erorrs occur
            for ds1, ds2 in self.alignedDataSets:
                p = identifyCellPartners(ds1, ds2)
                p1 = [i for i, j in p]  # cellnumbers in ds1
                p2 = [j for i, j in p]  # cellnumbers in ds2
                self.cellContours += ds1.getSingleCellContours(p1,border)
                colocImgs = getColocImages(ds1, ds2, p, '%s_%d' % (self.keys.outIncludedCells, dsnum), col,border,shift)
                dsnum += 1
                self.cellImages += colocImgs[0]
                self.rawImages += colocImgs[1]
                fociContours1 = ds1.getFociContours(p1,True,(border - dsborder,border - dsborder))
                fociContours2 = ds2.getFociContours(p2, True, (border+shift[0] - dsborder,border+shift[1] - dsborder))
                self.cellFoci[0] += fociContours1
                self.cellFoci[1] += fociContours2
                self.pcc += colocImgs[2]
                for i, ci in enumerate(colocImgs[1]):
                    i1, i2, _ = ci
                    self.fpcc += [self.__getCorrelationInFoci(i1, i2, fociContours1[i], fociContours2[i])]
            self.selectedCells = list(range(0, len(self.cellContours)))
            self.addGeneratedData(params)

            # Generate an output that will go to javascript for displaying on the UI side
            return {'foci': self.cellFoci,
                    'imgs': self.cellImages,
                    'pccs': self.pcc,
                    'fpccs': self.fpcc,
                    'cnts': self.cellContours,
                    'cellAreas': [Polygon(np.array([p['x'], p['y']]).T).area for p in self.cellContours],
                    'selected': self.selectedCells}

    def exportData(self, key: str, path: str, **args):
        # Get the data that needs to be exported
        data = self.session.getData(key)
        res = {
            'fociInChannel0': data[0],
            'fociInChannel1': data[1],
            'imgs': [img for i, img in enumerate(self.rawImages) if i in self.selectedCells]
        }
        with open(path, 'wb') as handle:
            pickle.dump(res, handle, protocol=pickle.HIGHEST_PROTOCOL)
        # Write a file with this data or postprocess it in some way
        # ...
