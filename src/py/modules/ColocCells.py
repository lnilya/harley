import pickle
from typing import List, Tuple, Dict

import matplotlib.pyplot as plt
from numpy.core.records import ndarray
from shapely.geometry import Polygon

from src.py.modules.ColocCellsUtil.colocutil import identifyCellPartners, getColocImages
from src.py.types.CellsDataset import CellsDataset
from src.sammie.py.modules.ModuleBase import ModuleBase
from src.sammie.py.util import imgutil
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
    alignedDataSets:List[Tuple[CellsDataset,CellsDataset]]
    cellImages:List[Tuple[ndarray,ndarray,ndarray,ndarray]] #PreviewImages for each cell, both channels, mix and coloc only
    cellContours:List[Dict] #Outlines of each cell
    cellFoci:Tuple[List[List[Dict]],List[List[Dict]]] #For each channel, each cell a list of contours
    selectedCells:List[int] #Indices of cells selected

    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.log = 'ColocCells'
        self.trace('initialized')

    def unpackParams(self,color,**other):
        """unpack and possibly parse/cast all parameters coming from JS. The parameters from JS are defined in the params.tsx file of the respective step.
        The arrive as a dictionary on the py side and sometimes need some parsing. In any way this function provides a simple method to extract
        these parameters as named variables rather than using params['paramName1'] you can run it through this function."""
        #
        #respective

        c = [None,None]
        if color[0] == 'r': c[0] = (255,0,0)
        elif color[0] == 'g': c[0] = (0,255,0)
        elif color[0] == 'b': c[0] = (0,0,255)
        if color[1] == 'r': c[1] = (255,0,0)
        elif color[1] == 'g': c[1] = (0,255,0)
        elif color[1] == 'b': c[1] = (0,0,255)

        return c

    def addGeneratedData(self,params):

        #Parse into polygons
        foci0 = []
        foci1 = []
        for i in self.selectedCells:
            foci0 += [[Polygon(np.array([focus['x'],focus['y']]).T) for focus in self.cellFoci[0][i]]]
            foci1 += [[Polygon(np.array([focus['x'],focus['y']]).T) for focus in self.cellFoci[1][i]]]

        """Add the selected cells' foci into the pipeline for coloc analysis"""
        self.onGeneratedData(self.keys.outIncludedCells,
                             [ foci0, foci1 ]
                             ,params)

    def run(self, action, params, inputkeys,outputkeys):
        self.keys = ColocCellsKeys(inputkeys, outputkeys)

        #This is a stub and simply displays best practices on how to structure this function. Feel free to change it
        if action == 'select':
            self.selectedCells = params['select']
            self.addGeneratedData(params)
            return True
        elif action == 'apply':

            col = self.unpackParams(**params)

            #get the input that this step is working on
            self.alignedDataSets = self.session.getData(self.keys.inAlignedDatasets)

            #Identify which cell numbers correspond to which in two aligned batches
            self.cellImages = []
            self.cellContours = []
            self.cellFoci = [[],[]]
            dsnum = 0
            for ds1,ds2 in self.alignedDataSets:
                p = identifyCellPartners(ds1,ds2)
                p1 = [i for i,j in p] #cellnumbers in ds1
                p2 = [j for i,j in p] #cellnumbers in ds2
                self.cellContours += ds1.getSingleCellContours(p1)
                colocImgs = getColocImages(ds1,ds2,p,'%s_%d'%(self.keys.outIncludedCells,dsnum),col)
                dsnum += 1
                self.cellImages += colocImgs[0]
                self.cellFoci[0] += ds1.getFociContours(p1)
                self.cellFoci[1] += ds2.getFociContours(p2)
            self.selectedCells = list(range(0,len(self.cellContours)))
            self.addGeneratedData(params)

            #Generate an output that will go to javascript for displaying on the UI side
            return {'foci':self.cellFoci, 'imgs':self.cellImages,'cnts':self.cellContours, 'selected':self.selectedCells}

    def exportData(self, key: str, path: str, **args):
        #Get the data that needs to be exported
        data = self.session.getData(key)
        res = {
            'fociInChannel0':data[0],
            'fociInChannel1':data[1],
            'imgs': [img for i,img in enumerate(self.cellImages) if i in self.selectedCells]
        }
        with open(path, 'wb') as handle:
            pickle.dump(res, handle, protocol=pickle.HIGHEST_PROTOCOL)
        #Write a file with this data or postprocess it in some way
        #...

