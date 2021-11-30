import glob
import os
import re
from typing import Dict, List

from src.py.modules.ModuleBase import ModuleBase
from src.py import loaders

class FileLoader(ModuleBase):
    """
    Simply a mock module for the FileLoader, which is not 
    """
    def __init__(self, sessionData):
        super().__init__('FileLoader',sessionData)

    def __getFiles(self, fromPattern: str):
        #Given a glob pattern 'path/**/file_*.jpg' will return a list of lists
        #with the filename and whatever the ** and * matched for each file
        #[filename,**,*]
        files = glob.glob(fromPattern)

        # p1Re: str = p1.replace('.', '\.')
        p1Re = fromPattern.replace('**', '(---)') \
            .replace('*', '(---)'). \
            replace('**', '(---)') \
            .replace('(---)', '(.*?)')
        return [[f] + list(re.search(p1Re, f).groups()) for f in files]

    def __findInFileList(self, fileList, patternList: List[str] = None):
        # fileList is the form [filename,wildcard1,wildcard2...] while patternList is [wildcard1,wildcard2...]
        for f in fileList:
            if f[1:] == patternList:
                return f[0]
        return None

    def getFileGlob(self, patterns: List[str], extenstions: List[List[str]]):
        allGlobs = []
        for p in patterns:
            allGlobs += [self.__getFiles(p)]

        result = []
        if len(allGlobs) == 1:
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
                    k += [{'name': s[-1], 'folder': os.path.sep.join(s[:-1]), 'path': file}]
            parsed += [k]

        return parsed

    def getFolderContents(self, folder: str, extenstions: List[str]):
        if folder[-1] != os.path.sep:
            folder += os.path.sep
        allFiles = []
        allFolders = []
        for x in os.listdir(folder):
            if os.path.isdir(folder + x):
                allFolders += [{'name': x, 'path': folder + x}]
                continue  # is a folder

            s = x.split('.')
            if s[1] not in extenstions: continue  # is not a file this pipeline can load
            allFiles += [{'name': x, 'folder': folder, 'path': folder + x}]
        return {'files': allFiles, 'folders': allFolders}

    #Load as Preview, these files do not need to be processed or anything, and is simply for the user as a feedback
    def loadFilePreview(self,pipelinekey:str,batchID:int,path:str,loaderName:str,loaderArgs:Dict):
        loaderFun = getattr(loaders, loaderName)  # will throw an error if doesnt exist
        res: loaders.LoaderResult = loaderFun(True, pipelinekey + '_preview_' + str(batchID), path, **loaderArgs)

        # return preview
        return {'previewURL': res.previewURL, 'meta': res.metaData}

    def loadFile(self,pipelinekey,path:str,loaderName:str,loaderArgs:Dict):
        loaderFun = getattr(loaders, loaderName)  # will throw an error if doesnt exist
        res: loaders.LoaderResult = loaderFun(False, pipelinekey, path, **loaderArgs)

        # push data into the pipeline, for loaders the parameters is simply a dump for any metadata
        self.session.onDataAdded(pipelinekey,self,res.data, {'path':path, 'meta':res.metaData})

        # return preview
        return {'previewURL': res.previewURL, 'meta': res.metaData}

    def run(self, action: str, params: Dict[str, any], inputkeys: List[str], outputkeys: List[str]):
        pass

