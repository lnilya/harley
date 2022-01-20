from src.sammie.py.modules.ModuleBase import ModuleBase

class FociDetectionParamsKeys:
    """Convenience class to access the keys as named entities rather than in an array"""
    inSomeInputKey: str
    outSomeOutputKey: str

    def __init__(self, inputs, outputs):
        self.inSomeInputKey = inputs[0]
        self.outSomeOutputKey = outputs[0]

class FociDetectionParams(ModuleBase):

    keys: FociDetectionParamsKeys

    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.log = 'FociDetectionParams'
        self.trace('initialized')

    def unpackParams(self,paramName1,paramName2,**other):
        """unpack and possibly parse/cast all parameters coming from JS. The parameters from JS are defined in the params.tsx file of the respective step.
        The arrive as a dictionary on the py side and sometimes need some parsing. In any way this function provides a simple method to extract
        these parameters as named variables rather than using params['paramName1'] you can run it through this function."""
        #
        #respective
        return paramName1[0],paramName2

    def run(self, action, params, inputkeys,outputkeys):
        self.keys = FociDetectionParamsKeys(inputkeys, outputkeys)

        #This is a stub and simply displays best practices on how to structure this function. Feel free to change it
        if action == 'apply':

            #Parse Parameters out of the dictionary arriving from JS
            param1, param2 = self.unpackParams(**params)

            #get the input that this step is working on
            someInput = self.session.getData(self.keys.inPreprocessedImg)

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

