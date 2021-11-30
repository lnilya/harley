from typing import Dict

import numpy as np


class LoadedImage:
    """
    Data representing a loaded image
    """
    jsPreview:any
    normalizedData:np.ndarray
    meta:Dict
