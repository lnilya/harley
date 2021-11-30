from typing import List, Tuple, Any

import numpy as np
from numpy import ndarray

from src.py.eeljsinterface import eeljs_sendProgress
from src.py.modules.FociCandidatesUtil.ContourLoopDetector import ContourLoopDetectorParams, ContourLoopDetector
from src.py.modules.FociCandidatesUtil.ContourLoopsInCell import ContourLoopsInCell
from src.py.util import util, imgutil
import matplotlib.pyplot as plt

class FociCandidateData:
    #Stores all Images for a dataset, can extract contours cell by cell.

    images: List[ndarray]
    allContours: List[ContourLoopsInCell]

    def __init__(self, allImages:List[np.ndarray]):
        self.images = allImages
        self.allContours = []

    def extractSingleContour(self,circRange:Tuple[int,int], granularity:int, cell:int)->ContourLoopsInCell:
        cldp = ContourLoopDetectorParams(circRange,granularity)
        cld = ContourLoopDetector(cldp)
        return cld.run(self.images[cell])

    def showCell(self, cellNum:int,circRange:Tuple[int,int], granularity:int):
        plt.imshow(self.images[cellNum],'gray')
        cldp = ContourLoopDetectorParams(circRange, granularity)
        cld = ContourLoopDetector(cldp)
        r:ContourLoopsInCell = cld.run(self.images[cellNum])
        js = r.getJSLabelingContours(20)['foci']
        for f in js:
            cnt = np.column_stack((f[-1]['y'], f[-1]['x']))
            imgutil.plotContour(plt, cnt)


    def extractLabellingContour(self,forCell:int, circRange:Tuple[int,int], granularity:int, numLevelsPerFoci:int = 20):
        """
        Extracts a dictionary of JSON contours for all cells and returns them.
        Args:
            circRange ():
            granularity ():
            numLevelsPerFoci ():

        Returns: A List of JSONable dictionaries for labelling
        """
        cldp = ContourLoopDetectorParams(circRange, granularity)
        cld = ContourLoopDetector(cldp)
        self.allContours = []
        r:ContourLoopsInCell = cld.run(self.images[forCell])

        return r.getJSLabelingContours(numLevelsPerFoci)

    def extractContours(self,circRange:Tuple[int,int], granularity:int, forCells:List[int] = None, progressMsg:str = 'Extracting Contour Candidates'):
        """Extracts all contours in the dataset"""
        cldp = ContourLoopDetectorParams(circRange,granularity)
        cld = ContourLoopDetector(cldp)
        self.allContours = []
        if forCells is None:
            forCells = range(0,len(self.images))

        for i,c in enumerate(forCells):
            img = self.images[c]
            eeljs_sendProgress(i/len(forCells),progressMsg)
            self.allContours += [cld.run(img)]