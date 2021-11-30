import random
from typing import List, Set

import numpy as np
from numpy import ndarray
from sklearn.metrics import matthews_corrcoef

from src.py.util.modelutil import getCutoffLevel


class LabelingResult:
    isModel: bool
    isRandom: bool
    contourChoices: List[ndarray]
    cellNumbers: List[int]

    # Stores the result of a quantification for a single user and dataset
    def __init__(self, cellNumbers: List[int] = None, contourChoices: List[np.ndarray] = None,
                 isModel: bool = False, isRandom:bool = False):
        self.isModel = isModel
        self.isRandom = isRandom
        self.cellNumbers = [] if cellNumbers is None else cellNumbers
        self.contourChoices = [] if contourChoices is None else contourChoices

    def addCell(self,cellContourChoices:np.ndarray):
        self.contourChoices += [cellContourChoices]
        self.cellNumbers += [len(self.cellNumbers)]


    def generateRandomisedCopy(self):
        """Generates a randomized result for this, with the same number of foci"""
        numFociInCell = self.getFociPerCell()[0]
        ncc = []
        for i, c in enumerate(self.cellNumbers):
            cc = self.contourChoices[i]
            r = numFociInCell[i]  # randomly generate that many pos foci
            rcc = [0] * r + [-1] * (len(cc) - r) #same number of foci, we keep 0s since we are not concerned with area
            random.shuffle(rcc)
            ncc += [rcc]
        return LabelingResult(self.cellNumbers.copy(),ncc,self.isModel,True)
    def generateBrightestQuantifierCopy(self):
        """Generates a result that quantifies same length brightest foci"""
        numFociInCell = self.getFociPerCell()[0]
        ncc = []
        for i, c in enumerate(self.cellNumbers):
            cc = self.contourChoices[i]
            r = numFociInCell[i]  # randomly generate that many pos foci
            rcc = [0] * r + [-1] * (len(cc) - r) #same number of foci, brightest are always first in array, we keep 0s since we are not concerned with area
            ncc += [rcc]
        return LabelingResult(self.cellNumbers.copy(),ncc,self.isModel,True)

    def getSharedCells(self, cells: Set = None):
        """Cells present in given set and this set. If none, then all cells are returned"""
        if cells is None:
            return set(self.cellNumbers)

        return set(self.cellNumbers).intersection(cells)

    def getFociPerCell(self, cells:List[int] = None):
        """
        Gets a percentage and absolute values of foci marked in each labeled cell.
        Args:
            cells (): If None all users cells are used.

        Returns: a List with counts, to be used in a violinplot

        """
        if cells is None: validIdx = range(0,len(self.contourChoices))
        else: validIdx = [i for i,c in enumerate(self.cellNumbers) if c in cells]

        fociMarkedInCell = [np.count_nonzero(np.array(self.contourChoices[j]) > -1) for j in validIdx]
        totalFociInCell = [len(self.contourChoices[j]) for j in validIdx]
        return fociMarkedInCell, [fociMarkedInCell[i] / f for i, f in enumerate(totalFociInCell)]

    def getFociAreas(self,dataset, cells:List[int], flatten:bool = False):
        """Computes foci areas for each foci in cell, 0 if contourChoice -1"""
        allAreas = dataset.getAreasForCells(cells)
        res = []
        for i,c in enumerate(cells):
            cc = self.contourChoices[self.cellNumbers.index(c)]
            areas = allAreas[i]
            if flatten:
                res += [areas[f,choice] if choice != -1 else 0 for f,choice in enumerate(cc) ]
            else:
                res += [[areas[f,choice] if choice != -1 else 0 for f,choice in enumerate(cc) ]]

        return res

    def getFociClasses(self, cells:List[int] = None):
        if cells is None: cells = self.cellNumbers
        cc = self.getFociChoices(cells)
        res = []
        for c in cc:
            res += [x > -1 for x in c]

        return  res

    def getFociChoices(self,cells:List[int], flatten:bool = False):
        c = [self.contourChoices[self.cellNumbers.index(i)] for i in cells if i in self.cellNumbers]
        if not flatten:
            return c
        res = []
        for arr in c: res += arr
        return res

    def compare(self, otherResult, cells:List[int] = None):
        """Compares cells of 2 results and returns the MCC for the result.
        Only cells in both sets and in cells array are considered."""

        if cells is None:
            cells = self.getSharedCells(set(otherResult.cellNumbers))


        # order of cells is not the same in both results
        foci1 = []
        foci2 = []
        for cc in cells:
            if cc not in self.cellNumbers or cc not in otherResult.cellNumbers: continue

            f1 = self.contourChoices[self.cellNumbers.index(cc)]
            f2 = otherResult.contourChoices[otherResult.cellNumbers.index(cc)]

            #Transform assignments to True/False
            foci1 += list(np.array(f1) != -1)
            foci2 += list(np.array(f2) != -1)


        mcc = matthews_corrcoef(foci1, foci2)
        # print('[%.4f] Compare %s in %s with %s in %s cells:'%(mcc,self.user,self.dataset,otherResult.user,otherResult.dataset),cells)
        return mcc

    @classmethod
    def generateRandomResult(cls,data, cells:List[int], percOfFociPerCell:float = 0.3)->Set:
        """Generates results randomly and returns a QuantificationResult to be compared with models"""
        fociPerCell = np.array(data.getFociPerCell(cells)).astype('int')
        numFociInCell = ( fociPerCell * percOfFociPerCell).astype('int')
        features = data.getFlatFeatures(cells)
        contourChoices = []
        for i,c in enumerate(cells):
            r = numFociInCell[i] #randomly generate that many pos foci
            cc = [0] * r + [-1] * (fociPerCell[i] - r)
            random.shuffle(cc)
            #randomly generated sequence of foci/non-foci
            for j,p in enumerate(cc):
                if p != -1:
                    cc[j] = getCutoffLevel(data.contourLevels[c][j], data.contours[c][j])[1]

            contourChoices += [cc]

        return contourChoices

    @classmethod
    def getAllSharedCells(cls,res:List)->Set:
        cells = None
        for r in res:
            cells = r.getSharedCells(cells)

        return cells