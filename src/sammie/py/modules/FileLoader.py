import glob
import os
import re
from typing import Dict, List

from src.sammie.py.ModuleConnector import ModuleConnector, LoaderResult
from src.sammie.py.modules.ModuleBase import ModuleBase

class FileLoader(ModuleBase):

    moduleConnector: ModuleConnector

    def __init__(self, sessionData, moduleConnector:ModuleConnector):
        super().__init__('FileLoader',sessionData)
        self.moduleConnector = moduleConnector

    def __getFiles(self, fromPattern: str):
        #Given a glob pattern 'path/**/file_*.jpg' will return a list of lists
        #with the filename and whatever the ** and * matched for each file
        #[filename,**,*]
        files = glob.glob(fromPattern)

        # p1Re: str = p1.replace('.', '\.')
        p1Re = fromPattern.replace('**', '(---)') \
            .replace('*', '(---)'). \
            replace('**', '(---)') \
            .replace('(---)', '(.*?)').replace(os.path.sep,';;;')

        return [[f] + list(re.search(p1Re, f.replace(os.path.sep,';;;')).groups()) for f in files]

    def __findInFileList(self, fileList, patternList: List[str] = None):
        # fileList is the form [filename,wildcard1,wildcard2...] while patternList is [wildcard1,wildcard2...]
        for f in fileList:
            # we do not have any patterns to match, so just use the file

            if len(f) == 1: return f[0]
            #patternlist has more wildcoards, int hat case we match the first (which would usually be ** (or folder) and not *)
            if len(f) == 2 and len(patternList) == 2 and patternList[0] == f[1]: #we have 2 placeholders in one and
                return f[0]

            #same number of wildcoards
            if len(f) == (len(patternList)+1) and f[1:] == patternList: return f[0]
        return None

    def getFileGlob(self, patterns: List[str], extenstions: List[List[str]]):
        #Get a list of files that matches each given pattern in list
        allGlobs = []
        for p in patterns:
            allGlobs += [self.__getFiles(p)]

        result = []
        if len(allGlobs) == 1: #if only one glob, no match is needed and we return whatever files match it
            result = [[f[0]] for f in allGlobs[0]]; # simply take the filename, we don't need any matching or wildcards
        else:
            # To find matches all wildcard characters have to match
            for i, gl in enumerate(allGlobs[0]):
                batch = [gl[0]]
                # loop through the first of the file lists
                patternList = gl[1:]  # this is the pattern we try to match

                for g2 in range(1, len(allGlobs)):
                    gl2 = allGlobs[g2]
                    foundPartnerFile = self.__findInFileList(gl2, patternList)
                    batch += [foundPartnerFile]

                if len(batch) == len(allGlobs):
                    result += [batch]

        #Now check if all files match the required extension filters
        def checkExtensions(fileNames: List[str]):
            for i, f in enumerate(fileNames):
                if extenstions[i] is None: continue #no restrictions on extensions
                elif f is None: continue #no file

                if f.split('.')[-1] not in extenstions[i]: return False

            return True

        result = list(filter(checkExtensions, result))

        #parse each file into the LocalFile JS Format
        parsed = []
        for batch in result:
            k = []
            for file in batch:
                if file is None:
                    k += [None]
                else:
                    s = file.split(os.path.sep)
                    k += [{'name': s[-1], 'folder': os.path.sep.join(s[:-1]) + os.path.sep, 'path': file}]
            parsed += [k]

        return parsed

    def getFolderContents(self, folder: str, extenstions: List[str]):
        if folder is None or len(folder) == 0:
            return {'files':[],'folders':[]}

        if folder[-1] != os.path.sep:
            folder += os.path.sep
        allFiles = []
        allFolders = []

        dirlist = os.listdir(folder)

        for x in dirlist:
            if os.path.isdir(folder + x):
                accessR = os.access(folder+x, os.R_OK)
                accessW = os.access(folder+x, os.W_OK)
                allFolders += [{'name': x, 'path': folder + x, 'access':[accessR,accessW]}]
                continue  # is a folder

            s = x.split('.')
            if len(s) != 2: continue
            if s[1] not in extenstions: continue  # is not a file this pipeline can load
            allFiles += [{'name': x, 'folder': folder, 'path': folder + x}]
        return {'files': allFiles, 'folders': allFolders}

    #Load as Preview, these files do not need to be processed or anything, and is simply for the user as a feedback
    def loadFilePreview(self,pipelinekey:str,batchID:int,path:str,loaderName:str,loaderArgs:Dict):
        res: LoaderResult = self.moduleConnector.runLoader(loaderName,True,pipelinekey + '_preview_' + str(batchID),path,loaderArgs)
        # return preview
        return {'previewURL': res.previewURL, 'meta': res.metaData}

    def loadFile(self,pipelinekey,path:str,loaderName:str,loaderArgs:Dict):

        res: LoaderResult = self.moduleConnector.runLoader(loaderName,False,pipelinekey,path,loaderArgs)
        # push data into the pipeline, for loaders the parameters is simply a dump for any metadata
        self.session.onDataAdded(pipelinekey,self,res.data, {'path':path, 'meta':res.metaData})

        # return preview
        return {'previewURL': res.previewURL, 'meta': res.metaData}

    def run(self, action: str, params: Dict[str, any], inputkeys: List[str], outputkeys: List[str]):
        pass

