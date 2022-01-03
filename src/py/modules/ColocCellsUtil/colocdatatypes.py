from typing import List, Tuple

import attr
import numpy as np
from attr import define,field, Factory
from shapely.geometry import Polygon


@define
class CCCells:

    # Cell x Foci Polygons in Channel 1
    foci1: List[List[Polygon]]

    # Cell x Foci Polygons in Channel 2
    foci2: List[List[Polygon]]

    # Images 0 => Channel 0, 1=> Channel 1, 2 => Mixed
    imgs: List[Tuple[np.ndarray, np.ndarray, np.ndarray]]

    # Pearson correlations inside cells, with first value being r and second value being the confidence p
    pcc: List[Tuple[float, float]] = field(metadata={'info':'Pearson correlation of cell area, with first value being r and second value being the confidence p'})

    # Pearson correlations inside foci area, with first value being r and second value being the confidence p
    fpcc: List[Tuple[float, float]] = field(metadata={'info':'Pearson correlations inside foci area only, with first value being r and second value being the confidence p'})

    def getExportJSON(self):
        json = {'pcc':self.pcc, 'fpcc':self.fpcc}
        infos = {}
        for k in json:
            infos[k + 'Info'] = getattr(attr.fields(CCCells),k).metadata['info']

        json.update(infos)
        return json

@define
class NNData:

    # Distance to Nearest Neighbour c0 -> c1
    nnDistFwd:List[float] = field(default=Factory(list),metadata={'info':'Distance to Nearest Neighbour c0 -> c1'})
    # Cell number corresponding to nnDistFwd Entry
    cellNumDistFwd:List[int] = field(default=Factory(list), metadata={'info':'Cell number corresponding to nnDistFwd Entry'})
    # Distance to Nearest Neighbour c1 -> c0
    nnDistBack:List[float] = field(default=Factory(list), metadata={'info':'Distance to Nearest Neighbour c1 -> c0'})
    # Cell number corresponding to nnDistBck Entry
    cellNumDistBack:List[int] = field(default=Factory(list), metadata={'info':'Cell number corresponding to nnDistBck Entry'})

    # Distance Centroid to Centroid c0 -> c1
    centroidDistFwd:List[float] = field(default=Factory(list), metadata={'info':'Distance Centroid to Centroid c0 -> c1'})
    # Cell number corresponding to centroidDistFwd Entry
    cellNumCentroidDistFwd:List[int] = field(default=Factory(list), metadata={'info':'Cell number corresponding to centroidDistFwd Entry'})
    # Distance Centroid to Centroid c1 -> c0
    centroidDistBack:List[float] = field(default=Factory(list), metadata={'info':'Distance Centroid to Centroid c1 -> c0'})
    # Cell number corresponding to centroidDistBck Entry
    cellNumCentroidDistBack:List[int] = field(default=Factory(list), metadata={'info':'Cell number corresponding to centroidDistBck Entry'})

    # Overlap in px^2 or nm^2
    overlapAbs:List[float] = field(default=Factory(list), metadata={'info':'Overlap in px^2 or nm^2 depending wether data was pr'})
    # Overlap as % of c0 foci size
    overlapRelFwd:List[float] = field(default=Factory(list), metadata={'info':'Overlap as % of c0 foci size'})
    # Overlap as % of c1 foci size
    overlapRelBck:List[float] = field(default=Factory(list), metadata={'info':'Overlap as % of c1 foci size'})
    # Cell number corresponding to overlapRel/AbsFwd/Bck Entry
    overlapCellNum:List[int] = field(default=Factory(list), metadata={'info':'Cell number corresponding to overlap(Rel/Abs)(Fwd/Bck) Entry'})

    #Pearson correlation in foci area of c0 foci for each cell
    pccBck:List[Tuple[float, float]] = field(default=Factory(list), metadata={'info':'Pearson correlation (r and p tuples) in foci area of c0 foci for each cell. Where value is null PCC could not be determined. Usually due to a constant signal in one of the channels or no foci.'})
    #Pearson correlation in foci area of c1 foci for each cell
    pccFwd:List[Tuple[float, float]] = field(default=Factory(list), metadata={'info':'Pearson correlation (r and p tuples) in foci area of c1 foci for each cell. Where value is null PCC could not be determined. Usually due to a constant signal in one of the channels or no foci.'})

    def __getFociFromCellNum(self, cellNums:List[int]):
        curNum = 0
        res = []
        for i,cn in enumerate(cellNums):
            if i > 0:
                if cn == cellNums[i - 1]: curNum += 1
                elif cn != cellNums[i - 1]: curNum = 0

            res += [curNum]

        return res

    def __getCSV(self, cell1,cell2,val1,val2):
        nnLines = max(len(cell1), len(cell2))
        fnum1 = self.__getFociFromCellNum(cell1)
        fnum2 = self.__getFociFromCellNum(cell2)
        res = []
        for i in range(0, nnLines):
            line = []
            if i < len(cell1): line = [cell1[i], fnum1[i], val1[i]]
            else: line = [''] * 3

            if i < len(self.cellNumDistBack): line += [cell2[i], fnum2[i], val2[i]]
            else: line += [''] * 3

            res += [line]
        return res

    def getPCCCSV(self, name0:str, name1:str, pccCell, pccFoci):
        res = [['Pearson correlation %s and %s'%(name0,name1)] + ['']*8]
        res += [['Cell','Full Cell Area','(P)','Foci Area Only','(P)','%s area only'%(name0),'(P)','%s area only'%(name1),'(P)']]
        for i in range(0,len(self.pccFwd)):
            pcc = list(pccCell[i]) if pccCell[i] is not None else [''] * 2
            fcc = list(pccFoci[i]) if pccFoci[i] is not None else [''] * 2
            pccfwd = list(self.pccFwd[i]) if self.pccFwd[i] is not None else [''] * 2
            pccbck = list(self.pccBck[i]) if self.pccBck[i] is not None else [''] * 2
            res += [[i] + pcc + fcc + pccfwd + pccbck ]

        return res



    def getOverlapCSV(self, name0:str, name1:str, units:str):
        res = [['Cell','Abs Overlap (in %s^2)'%(units),'Overlap as %% of %s area'%(name0),'Overlap as %% of %s area'%(name1)]]
        for i,c in enumerate(self.overlapCellNum):
            res += [[c,self.overlapAbs[i],self.overlapRelFwd[i],self.overlapRelBck[i]]]

        return res

    def getCentroidDistCSV(self, name0:str, name1:str, units:str):
        res = [['Distance Centroid to Centroid in %s'%units] + ['']*5]
        res += [['Cell','Foci','%s to %s (%s)'%(name0,name1,units),'Cell','Foci','%s to %s (%s)'%(name1,name0, units)]]
        res += self.__getCSV(self.cellNumCentroidDistFwd,self.cellNumCentroidDistBack, self.centroidDistFwd, self.centroidDistBack)
        return res

    def getNNDistCSV(self, name0:str, name1:str, units:str):
        res = [['Distance to Nearest Neighbour in %s'%units] + ['']*5]
        res += [['Cell','Foci','%s to %s (%s)'%(name0,name1,units),'Cell','Foci','%s to %s (%s)'%(name1,name0, units)]]
        res += self.__getCSV(self.cellNumDistFwd,self.cellNumDistBack, self.nnDistFwd, self.nnDistBack)
        return res

    def getExportJSON(self):
        json = attr.asdict(self)
        infos = {}
        for k in json:
            infos[k + 'Info'] = getattr(attr.fields(NNData),k).metadata['info']

        json.update(infos)
        return json

    def getJSDict(self):
        json = {
            'nn': {
                'fwd': self.nnDistFwd,
                'bck': self.nnDistBack
            },
            'pcc': {
                'fwd': self.pccFwd,
                'bck': self.pccBck
            },
            'nncentroid': {
                'fwd': self.centroidDistFwd,
                'bck': self.centroidDistFwd
            },
            'overlap': {
                'abs': self.overlapAbs,
                'fwd': self.overlapRelFwd,
                'bck': self.overlapRelBck
            }
        }
        return json