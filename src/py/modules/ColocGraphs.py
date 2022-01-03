import json
from typing import List, Dict

import matplotlib.pyplot as plt
import numpy as np
from scipy._lib._ccallback_c import plus1_t
from scipy.spatial import distance_matrix
from scipy.stats import pearsonr
from shapely.geometry import Polygon

from src.py.modules.ColocCellsUtil.colocdatatypes import CCCells, NNData
from src.py.modules.ColocCellsUtil.colocutil import writeXLSX
from src.sammie.py.modules.ModuleBase import ModuleBase
from src.sammie.py.util import imgutil, shapeutil
from src.sammie.py.util.shapeutil import contourLength


class ColocGraphsKeys:
    """Convenience class to access the keys as named entities rather than in an array"""
    inColocCells: str
    outGraphData: str

    def __init__(self, inputs, outputs):
        self.inColocCells = inputs[0]
        self.outGraphData = outputs[0]




class ColocGraphs(ModuleBase):

    keys: ColocGraphsKeys
    distData: NNData

    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.log = 'ColocGraphs'
        self.trace('initialized')

    def unpackParams(self,paramName1,paramName2,**other):
        """unpack and possibly parse/cast all parameters coming from JS. The parameters from JS are defined in the params.tsx file of the respective step.
        The arrive as a dictionary on the py side and sometimes need some parsing. In any way this function provides a simple method to extract
        these parameters as named variables rather than using params['paramName1'] you can run it through this function."""
        #
        #respective
        return paramName1[0],paramName2




    def __getFociCorrelations(self, src:CCCells):

        fwd = []
        bck = []
        for i,it in enumerate(src.imgs):
            img1, img2, _ = it

            corrCorrds0 = []
            corrCorrds1 = []

            if len(src.foci1[i]) > 0:
                #In area of Foci 1 only
                for f1 in src.foci1[i]:
                    x, y = f1.exterior.coords.xy
                    mp, offx, offy = shapeutil.getPolygonMaskPatch(np.array(x), np.array(y), 0)
                    corrCorrds0 += img1[offy:mp.shape[0] + offy, offx:mp.shape[1] + offx][mp == True].tolist()
                    corrCorrds1 += img2[offy:mp.shape[0] + offy, offx:mp.shape[1] + offx][mp == True].tolist()

                pcc = pearsonr(corrCorrds0,corrCorrds1)
                if pcc[0] == pcc[0]: fwd += [pcc]
                else: fwd += [None]
            else:
                fwd += [None]
            #In area of Foci 2 only
            corrCorrds0 = []
            corrCorrds1 = []
            if len(src.foci2[i]) > 0:
                for f2 in src.foci2[i]:
                    x, y = f2.exterior.coords.xy
                    mp, offx, offy = shapeutil.getPolygonMaskPatch(np.array(x), np.array(y), 0)
                    corrCorrds0 += img1[offy:mp.shape[0] + offy, offx:mp.shape[1] + offx][mp == True].tolist()
                    corrCorrds1 += img2[offy:mp.shape[0] + offy, offx:mp.shape[1] + offx][mp == True].tolist()

                pcc = pearsonr(corrCorrds0,corrCorrds1)
                if pcc[0] == pcc[0]: bck += [pcc]
                else: bck += [None]
            else:
                bck += [None]

        return fwd,bck

    def __getDistToNearestNeighbor(self, src:List[List[Polygon]], dest:List[List[Polygon]], scale:float = 1):
        res = NNData()

        for c,foci1 in enumerate(src):
            foci2 = dest[c]
            if len(foci1) <= 0 or len(foci2) <= 0: continue

            #calculate the distance matrix
            distMatrix = np.zeros((len(foci1),len(foci2)))
            distMatrixCentroid = np.zeros((len(foci1),len(foci2)))
            for i in range(0,len(foci1)):
                for j in range(0,len(foci2)):
                    distMatrix[i,j] = foci1[i].distance(foci2[j])
                    distMatrixCentroid[i,j] = foci1[i].centroid.distance(foci2[j].centroid)


            #distMatrix will have F1 x F2 dimension
            #We need to find the smalles value in each row
            nearestNeighbourDistancesFwd = np.min(distMatrix, axis=1)
            nearestNeighbourDistancesBck = np.min(distMatrix, axis=0)
            centroidNearestNeighbourDistancesFwd = np.min(distMatrixCentroid, axis=1)
            centroidNearestNeighbourDistancesBck = np.min(distMatrixCentroid, axis=0)

            #Absolute distances in px or transformed by scale into nm/µm etc.
            res.nnDistFwd += (nearestNeighbourDistancesFwd[nearestNeighbourDistancesFwd > 0] * scale).tolist()
            res.nnDistBack += (nearestNeighbourDistancesBck[nearestNeighbourDistancesBck > 0] * scale).tolist()
            res.cellNumDistFwd += [c] * len(nearestNeighbourDistancesFwd[nearestNeighbourDistancesFwd > 0])
            res.cellNumDistBack += [c] * len(nearestNeighbourDistancesBck[nearestNeighbourDistancesBck > 0])

            res.centroidDistFwd += (centroidNearestNeighbourDistancesFwd * scale).tolist()
            res.centroidDistBack += (centroidNearestNeighbourDistancesBck * scale).tolist()
            res.cellNumCentroidDistFwd += [c] * len(centroidNearestNeighbourDistancesFwd)
            res.cellNumCentroidDistBack += [c] * len(centroidNearestNeighbourDistancesBck)

            #Calculate overlaps
            for f1 in foci1:
                for f2 in foci2:
                    if f1.distance(f2) == 0: #overlap
                        ar = f1.intersection(f2).area
                        res.overlapAbs += [ar * (scale**2)]
                        res.overlapRelFwd += [ar / f1.area]
                        res.overlapRelBck += [ar / f2.area]
                        res.overlapCellNum += [c]


        return res


    def run(self, action, params, inputkeys,outputkeys):
        self.keys = ColocGraphsKeys(inputkeys, outputkeys)

        #This is a stub and simply displays best practices on how to structure this function. Feel free to change it
        if action == 'apply':

            #get the input that this step is working on
            colocdata:CCCells = self.session.getData(self.keys.inColocCells)

            scale = params['scale']
            #Foci by cell for btoh channels
            channel0 = colocdata.foci1
            channel1 = colocdata.foci2

            num0 = 0
            num1 = 0
            for c in channel0: num0 += len(c)
            for c in channel1: num1 += len(c)

            self.distData = self.__getDistToNearestNeighbor(channel0,channel1,scale)

            self.distData.pccFwd, self.distData.pccBck = self.__getFociCorrelations(colocdata)
            #Required: Notify the pipeline that the processed data is now available, so that the user can step to the next step
            #of the UI.

            #Generate an output that will go to javascript for displaying on the UI side
            json = self.distData.getJSDict()
            json['pcc']['cell'] = colocdata.pcc
            json['pcc']['foci'] = colocdata.fpcc
            json['stats'] = {
                'cells': len(channel0),
                'num0': num0,
                'num1':num1
            }
            self.onGeneratedData(self.keys.outGraphData, json, params)
            return json

    def exportData(self, key: str, path: str, **args):
        #Get the data that needs to be exported

        units = 'px'
        if '1px' in args: units = 'nm'

        colocdata: CCCells = self.session.getData(self.keys.inColocCells)

        if args['format'] == 'xlsx':
            nn = self.distData.getNNDistCSV(args['name0'],args['name1'],units)
            centroid = self.distData.getCentroidDistCSV(args['name0'],args['name1'],units)
            overlap = self.distData.getOverlapCSV(args['name0'],args['name1'],units)
            coloc = self.distData.getPCCCSV(args['name0'],args['name1'],colocdata.pcc,colocdata.fpcc)
            writeXLSX([nn,centroid,coloc, overlap],['Nearest Neighbours','Centroids','Pearson Correlation','Overlap'],path)
        elif args['format'] == 'json':
            fullJSON = colocdata.getExportJSON()
            fullJSON.update(self.distData.getExportJSON())

            # Serializing json
            json_object = json.dumps(fullJSON, indent=4)

            # Writing to sample.json
            with open(path, "w") as outfile:
                outfile.write(json_object)