import json
from typing import Tuple, Optional, Dict

import imageio
import numpy as np
from mrc import mrc

from src.py.loaders.fileloaderutil import __normImage
from src.py.util.imgutil import getPreviewImage, getTransparentMask


class LoaderResult:
    """
    Result of a loader, consisting of a preview/metadata for JS and whatever data is to be pushed into the pipeline
    """
    metaData:Dict
    previewURL:str
    data:any
    def __init__(self, data:any, preview:str,meta:Dict = None):
        self.metaData = meta if meta is not None else {}
        self.previewURL = preview
        self.data = data


def loadBinaryImage(asPreviewOnly:bool, pipekey:str, filePath:str, intensityBoundary:float = 0.01)->Optional[LoaderResult]:
    print('[loadBinaryImage]: %s from %s'%(pipekey,filePath))
    g = imageio.imread(filePath)
    g = g > intensityBoundary

    preview = getTransparentMask(g,(255,0,0),pipekey,True)
    return LoaderResult(g,preview['url'],{'Width':g.shape[1],'Height':g.shape[0]})

def loadDVMultiChannelImage(asPreviewOnly:bool, pipekey:str, filePath:str, **addParams)->Optional[LoaderResult]:
    dvfile = mrc.imread(filePath)
    pxSize = dvfile.Mrc.header.d[0]
    cz = dvfile.shape[:-2]#channels and zstack
    numC = 1
    numZ = 1
    if(len(cz) == 1):
        numZ = cz[0]
        previewImg = dvfile[cz[0]>>1]
    else :
        numC = cz[0]
        numZ = cz[1]
        previewImg = dvfile[0][cz[1]>>1]

    #generate a JS Version preview
    preview = getPreviewImage(__normImage(previewImg),pipekey)

    return LoaderResult(dvfile,preview['url'],
                        {'Width':previewImg.shape[1],
                         'Height':previewImg.shape[0],
                         '1px': '%.1fnm'%(pxSize * 1000),
                         'Channels':numC,
                         'Z-Planes':numZ,
                         })

def loadDVIntensityImage(asPreviewOnly:bool, pipekey:str, filePath:str, **normalizationParams)->Optional[LoaderResult]:
    print('[loadDVIntensityImage]: %s from %s' % (pipekey, filePath))
    dvfile = mrc.imread(filePath)
    cz = dvfile.shape[:-2] #channels and zstack
    if cz == (1,): dvfile = dvfile[0]
    elif cz == (1,1): dvfile = dvfile[0][0]
    else:
        raise RuntimeError('DV File has multiple channels or zstacks. Convert to a tiff first or use a DV image with only one channel and zstack.')

    dvfile = __normImage(dvfile, **normalizationParams)
    preview = getPreviewImage(dvfile,pipekey)
    return LoaderResult(dvfile,preview['url'],{'Width':dvfile.shape[1],'Height':dvfile.shape[0]})

def loadIntensityImage(asPreviewOnly:bool, pipekey:str, filePath:str, **normalizationParams)->Optional[LoaderResult]:
    print('[loadIntensityImage]: %s from %s' % (pipekey, filePath))

    rdr = imageio.get_reader(filePath)
    meta = rdr.get_meta_data()
    if meta is not None and 'description' in meta:
        meta = json.loads(meta['description'])
    else:
        meta = {}

    g = rdr.get_data(0)
    if len(g.shape) == 3:  g = g[:,:,0];
    # g = imageio.imread(filePath, as_gray=True)
    g = __normImage(g, **normalizationParams)
    preview = getPreviewImage(g,pipekey)

    retMeta = {'Width':g.shape[1],'Height':g.shape[0]};
    if 'scale' in meta:
        retMeta['1px'] = '%.1f nm'%(float(meta['scale']) * 1000);
        retMeta['__1px'] = float(meta['scale']);


    return LoaderResult(g,preview['url'],retMeta)

