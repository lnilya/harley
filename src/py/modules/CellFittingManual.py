from src.py.modules.ModuleBase import ModuleBase


class CellFittingManualKeys:
    inSrcImg: str
    # outSomeOutputKey: str

    def __init__(self, inputs, outputs):
        self.inSomeInputKey = inputs[0]
        # self.outSomeOutputKey = outputs[0]

class CellFittingManual(ModuleBase):

    keys: CellFittingManualKeys
    previewThinnedImage = None #For Frontend: Cache of the Transparent ColorImage displaying Threshholded areas
    cleanedImage = None #Output: Binary file


    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.log = 'CellFittingManual'
        self.trace('initialized')


    def run(self, action, params, inputkeys,outputkeys):
        self.keys = CellFittingManualKeys(inputkeys, outputkeys)
        if action == 'apply':
            inputImg = self.session.getRawData(self.keys.inSrcImg) #binaryMask

            return self.getJSOutput()

    def getRawOutput(self, key: str):
        return None

    def getJSOutput(self):
        #Create transparent image
        return None



