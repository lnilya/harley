import json
import os
from typing import Dict

import imageio
import numpy as np


def exportGrayScaleImage(filePath:str, intensityArray:np.ndarray, overwrite:bool = True, dtype = 'uint16', metaData:Dict = None):
    """
    Exports a grayscale intensity Image to a file
    Args:
        filePath (): File and Path to export to
        intensityArray (): 0-1 normed float/double numpy array
        overwrite (): wether or not to raise an error if file already exists
        dtype (): Output Bits either uint8 or uint16
        metaData (): A MetaData Object. ImWrite will not handle metadata gracefully and in most cases it just fails.
        Instead we use "description" field and write a JSON into it. This only works for TIFF files.

    Returns: True if success or raises an error
    """
    if os.path.exists(filePath) and not overwrite:
        raise RuntimeError('%s already exists'%filePath)
    if dtype != 'uint16' and dtype != 'uint8':
        raise RuntimeError('File %s cannot be exported: Dtype %s is not either "uint8" or "uint16"'%(filePath,dtype))

    mv = 2**8
    if dtype == 'uint16': mv = 2**16

    if metaData is not None:
        metaData = {'description':json.dumps(metaData)}

    wrt = imageio.get_writer(filePath)
    wrt.append_data((intensityArray * mv).astype(dtype), metaData)
    wrt.close()

    return True

def exportBinaryImage(filePath:str, binaryArray:np.ndarray, overwrite:bool = True):
    """
    Exportes a bool array into a black and white image
    Args:
        filePath (): Path to export to
        binaryArray (): numpy array with dtype='bool'
        overwrite (): wether or not to raise an error if file already exists

    Returns: True if success or raises an error

    """
    if os.path.exists(filePath) and not overwrite:
        raise RuntimeError('%s already exists'%filePath)

    imageio.imsave(filePath,binaryArray.astype('uint8')*255)
    return True