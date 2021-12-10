from typing import List, Tuple

from src.py.modules.ColocCellsUtil.colocutil import identifyCellPartners
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

    def unpackParams(self,paramName1,paramName2,**other):
        """unpack and possibly parse/cast all parameters coming from JS. The parameters from JS are defined in the params.tsx file of the respective step.
        The arrive as a dictionary on the py side and sometimes need some parsing. In any way this function provides a simple method to extract
        these parameters as named variables rather than using params['paramName1'] you can run it through this function."""
        #
        #respective
        return paramName1[0],paramName2

    def run(self, action, params, inputkeys,outputkeys):
        self.keys = ColocCellsKeys(inputkeys, outputkeys)

        #This is a stub and simply displays best practices on how to structure this function. Feel free to change it
        if action == 'apply':

            #get the input that this step is working on
            self.alignedDataSets = self.session.getData(self.keys.inAlignedDatasets)

            self.cellPartners = []
            for ds1,ds2 in self.alignedDataSets:
                self.cellPartners += [identifyCellPartners(ds1,ds2)]


            allCellImgs = []
            allContours = []
            for ds1,ds2 in self.alignedDataSets:
                imgs,contours = ds1.getSingleCellImagesAndContours()
                allCellImgs += imgs
                allContours += contours

            #generate previews for cell images
            self.previews = [getPreviewImage(img, self.keys.outIncludedCells + '_%d' % i) for i, img in
                             enumerate(allCellImgs)]


            #Identify and extract single cell Images and foci contours

            #do something with it...

            #Required: Notify the pipeline that the processed data is now available, so that the user can step to the next step
            #of the UI.
            self.onGeneratedData(self.keys.outBorderedImage, someInput, params)

            #Generate an output that will go to javascript for displaying on the UI side
            return {'demoResult':'Somethign for JS'}

    def exportData(self, key: str, path: str, **args):
        #Get the data that needs to be exported
        data = self.session.getData(key)

        #Write a file with this data or postprocess it in some way
        #...

