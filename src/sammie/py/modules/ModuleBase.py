import abc
from typing import List, Dict, Callable

from src.sammie.py import SessionData
from src.sammie.py.util import util

class ModuleBase(metaclass=abc.ABCMeta):

    id:str
    log:str = None #if log is empty, no logs will happen
    session:SessionData
    __abortRequest:bool
    __abortRequested:Callable[[],bool]

    #id of a module is its unique identifier
    def __init__(self, id:str, session:SessionData):
        self.id = id
        self.session = session
        self.__abortRequest = False

    def abortSignal(self):
        return self.__abortRequest

    def trace(self,msg:str,params = None):
        if self.log is None: return

        msg = '[%s(%s)]: %s' % (self.log,self.id, msg)

        if params is None:
            print(msg)
        else:
            print(msg % params)

    def getChangedParametersFromLastRun(self,key:str, params:Dict)->List[str]:
        """
        Returns a list of parameters that have changed from last time onGeneratedData was run
        Useful for not rerun the whole step, if only parts of parameters change
        """
        lastParams = self.session.getParams(key)
        #no previous run, consider all parameters changed
        if lastParams == None or len(lastParams.keys()) == 0:
            return list(params.keys())

        #Filter out the ones that are not equal
        ret = []
        for key, value in params.items():
            if lastParams[key] != value:
                ret += [key]

        return ret

    def onGeneratedData(self,key,data,params):
        self.session.onDataAdded(key,self,data,params)

    def startingRun(self):
        self.__abortRequest = False

    def abort(self):
        self.trace('Abort execution requested')
        self.__abortRequest = True

    def tic(self):
        util.tic()

    def toc(self,task:str):
        mstime = util.tocr()
        self.trace('Ellpased Time for %s: %.2f ms',(task,mstime))

    @abc.abstractmethod
    def run(self,action:str,params:Dict[str,any],inputkeys:List[str],outputkeys:List[str]):
        """
        Called through JS and the essential function is to get data described in inputkeys
        And assign it to data described by outputkeys. Some other part of pipeline can then access
        the data described by outputkeys.
        """
        pass

    def exportData(self,key:str, path:str,**args):
        """
        When user wants to export data the module, that called onGeneratedData will be asked to write out
        the files here.
        Args:
            key (): The same key that was passed to onGeneratedData by this module
            path (): The destination file. Module doesn't need to check wether to overwrite or not, this will be done centrally
            and if user wished to overwrite this funciton will be invoked.

        Returns: True or raises an error
        """
        pass

