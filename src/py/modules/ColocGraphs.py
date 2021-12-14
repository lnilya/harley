import json
from typing import List, Dict

import matplotlib.pyplot as plt
import numpy as np
from scipy._lib._ccallback_c import plus1_t
from scipy.spatial import distance_matrix
from shapely.geometry import Polygon

from src.sammie.py.modules.ModuleBase import ModuleBase
from src.sammie.py.util import imgutil
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

    def __getDistToNearestNeighbor(self, src:List[List[Polygon]], dest:List[List[Polygon]], scale:float = 1):
        distancesFwd = [] #will contain nearest neighbour distances src->dist if foci are NOT overlapping
        distancesBck = [] #will contain nearest neighbout distances dist->src if not overlapping
        overlap = [] #Overlapping area in px^2 * scale^2
        overlapRelFwd = [] #overlap divided by src area
        overlapRelBck = [] #overlap divided by dist area
        for c,foci1 in enumerate(src):
            foci2 = dest[c]
            if len(foci1) <= 0 or len(foci2) <= 0: continue

            #calculate the distance matrix
            distMatrix = np.zeros((len(foci1),len(foci2)))
            for i in range(0,len(foci1)):
                for j in range(0,len(foci2)):
                    distMatrix[i,j] = foci1[i].distance(foci2[j])


            #distMatrix will have F1 x F2 dimension
            #We need to find the smalles value in each row
            nearestNeighbourDistancesFwd = np.min(distMatrix, axis=1)
            nearestNeighbourDistancesBck = np.min(distMatrix, axis=0)

            #Absolute distances in px or transformed by scale into nm/µm etc.
            distancesFwd += (nearestNeighbourDistancesFwd[nearestNeighbourDistancesFwd > 0] * scale).tolist()
            distancesBck += (nearestNeighbourDistancesBck[nearestNeighbourDistancesBck > 0] * scale).tolist()

            #Calculate overlaps
            for f1 in foci1:
                for f2 in foci2:
                    if f1.distance(f2) == 0: #overlap
                        ar = f1.intersection(f2).area
                        overlap += [ar * (scale**2)]
                        overlapRelFwd += [ar / f1.area]
                        overlapRelBck += [ar / f2.area]


        return distancesFwd,distancesBck,overlap,overlapRelFwd,overlapRelBck


    def run(self, action, params, inputkeys,outputkeys):
        self.keys = ColocGraphsKeys(inputkeys, outputkeys)

        #This is a stub and simply displays best practices on how to structure this function. Feel free to change it
        if action == 'apply':

            #get the input that this step is working on
            foci = self.session.getData(self.keys.inColocCells)

            scale = params['scale']

            #Foci by cell for btoh channels
            channel0 = foci[0]
            channel1 = foci[1]

            num0 = 0
            num1 = 0
            for c in channel0: num0 += len(c)
            for c in channel1: num1 += len(c)

            distancesFwd,distancesBck,overlap,overlapRelFwd,overlapRelBck = self.__getDistToNearestNeighbor(channel0,channel1,scale)
            #Required: Notify the pipeline that the processed data is now available, so that the user can step to the next step
            #of the UI.

            #Generate an output that will go to javascript for displaying on the UI side
            json = {
                'nn':{'fwd':distancesFwd,'bck':distancesBck},
                'overlap': {'abs':overlap,'fwd':overlapRelFwd,'bck':overlapRelBck},
                'stats':{
                    'cells': len(channel0),
                    'num0': num0,
                    'num1':num1
                }
            }
            self.onGeneratedData(self.keys.outGraphData, json, params)
            return json

    def exportData(self, key: str, path: str, **args):
        #Get the data that needs to be exported
        data = self.session.getData(key)
        data['explanation'] = 'Data for nn (Nearest Neighbour) and overlap. Absolute values are either in px or nm^2 depending wether the scale has been provided initially.' \
                              'fwd and bck are relative percentage value. nn-fwd means distance from channel0 to 1, nn-bck means distance from channel1 to 0. ' \
                              'Overlap fwd means overlapArea / channel0 foci area, and bck overlapArea / channel1 foci area'
        # Serializing json
        json_object = json.dumps(data, indent=4)

        # Writing to sample.json
        with open(path, "w") as outfile:
            outfile.write(json_object)

        #Write a file with this data or postprocess it in some way
        #...

