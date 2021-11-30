from typing import Tuple

import numpy as np


def __normImage(img, normVal:Tuple = (0., 1.), dtype:str= 'float32')->np.ndarray:
    """
        Normalizes a grayscale image to desired range, as well as changes type of it
        Args:
            img (ndarray): Loaded image as 2D or 3D numpy array
            normVal (): Tuple either Number,Number or None,Number.
                        For Num,Num min and max values of image will change
                        For None,Num only the max value will be stretched out, but the min value will not be set to 0
                        For None: no normalization occurs
            dtype (): New Typeof numpy array

        Returns: a numpy array with the image
        """
    if normVal is not None:
        img = img.astype('float32')
        if normVal[0] is not None:
            # norm 0-1
            img = (img - img.min()) / (img.max() - img.min())
            # norm to desired Value
            img = (img + normVal[0]) * (normVal[1] - normVal[0])
        else:
            img *= normVal[1] / img.max()

    if dtype != 'float32':
        img = img.astype(dtype)

    return img
