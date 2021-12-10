from typing import List, Tuple

from src.py.modules.ColocCellsUtil.colocutil import identifyCellPartners, getColocImages
from src.py.types.CellsDataset import CellsDataset
from src.sammie.py.modules.ModuleBase import ModuleBase
from src.sammie.py.util.imgutil import getPreviewImage


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

    def run(self, action, params, inputkeys,outputkeys):
        self.keys = ColocCellsKeys(inputkeys, outputkeys)

        #This is a stub and simply displays best practices on how to structure this function. Feel free to change it
        if action == 'apply':

            col = self.unpackParams(**params)

            #get the input that this step is working on
            self.alignedDataSets = self.session.getData(self.keys.inAlignedDatasets)

            #Identify which cell numbers correspond to which in two aligned batches
            self.cellPartners = []
            self.cellImages = []
            self.cellContours = []
            self.cellFoci = []
            for ds1,ds2 in self.alignedDataSets:
                p = identifyCellPartners(ds1,ds2)
                self.cellPartners += [p]
                p1 = [i for i,j in p] #cellnumbers in ds1
                p2 = [j for i,j in p] #cellnumbers in ds2
                self.cellContours += ds1.getSingleCellContours(p1)
                self.cellImages += getColocImages(ds1,ds2,p,self.keys.outIncludedCells,col)
                self.cellFoci += [ds1.getFociContours(p1),ds2.getFociContours(p2)]


            #Identify and extract single cell Images and foci contours

            #do something with it...

            #Required: Notify the pipeline that the processed data is now available, so that the user can step to the next step
            #of the UI.
            # self.onGeneratedData(self.keys.outBorderedImage, someInput, params)

            #Generate an output that will go to javascript for displaying on the UI side
            return {'foci':self.cellFoci, 'imgs':self.cellImages,'cnts':self.cellContours, 'selected':list(range(0,len(self.cellContours)))}

    def exportData(self, key: str, path: str, **args):
        #Get the data that needs to be exported
        data = self.session.getData(key)

        #Write a file with this data or postprocess it in some way
        #...

