import math

import cv2
import numpy as np
import skimage
from numpy import ndarray
import skimage.filters
from skimage.segmentation import active_contour

from src.sammie.py.util.imgutil import setUpSubplot


class MaskShrinkParams:
    # Mask Tightening Parameters
    snakeAlpha: float  # activeContour Length Shape parameter
    snakeBeta: float  # activeContour Smoothness, higher values mean smoother
    snakeGamma: float  # activeContour time step
    snakeIterations: int  # core activeContour Parameter, determines how strong contraction can be in pixels from boundary

    def __init__(self, alpha=0.01, beta=0.01, gamma=0.005, iterations=15):
        self.snakeAlpha, self.snakeBeta, self.snakeGamma = alpha, beta, gamma
        self.snakeIterations = iterations


class MaskShrink:
    __params: MaskShrinkParams
    debugTitle: str

    def __init__(self, params: MaskShrinkParams):
        self.__params = params
        self.debugTitle = 'Mask Tightening'

    def run(self,img:ndarray, mask:ndarray, debug: bool = False, windowTitle:str = 'Mask Tightening'):
        self.debugTitle = windowTitle

        # normalize iamge such that portion of mask is 0-1
        minIntensity = img[mask].min()
        img = (img - minIntensity) / (img.max() - minIntensity)
        img[mask == False] = 0

        if debug:
            self.__tightenMaskSnakeDebug(img, mask)

        tightMask, contour = self.__tightenMaskSnake(img, mask)

        return tightMask, contour

    def __tightenMaskSnakeDebug(self, img: ndarray, mask: ndarray):
        """
        Plotting of results of mask tightening for different snake parameters
        """
        contour = cv2.findContours(mask.astype('uint8') * 255, cv2.RETR_TREE, cv2.CHAIN_APPROX_NONE)[0][0]
        # contour pixels
        cpx = contour[:, 0, :]
        grad = skimage.filters.sobel(img, mask)

        # subsample. base subsampling is 3, to save some speed. We add a factor depending on maxIterations
        # determine subsampling size by assuming the boundary is a circle with equidistant points
        # it has the radius of r = N / 2pi
        # assuming the we shrink the radius by max_iterations the number of points change to
        # N' = N - m*2*pi
        # adding subsampling N'/N avoids loops, since we can only shrink here.
        subsampling = math.ceil(3 * len(cpx) / (len(cpx) - self.__params.snakeIterations * 2 * math.pi))

        cpx = np.flip(cpx[1::2], axis=1)
        betas = np.linspace(0.01, 1, 4)
        alphas = np.linspace(0.005, 0.02, 9)
        gammas = np.linspace(0.001, 0.005, 5)
        bc = ['r-', 'g-', 'b-', 'm-']
        for ig, g in enumerate(gammas):
            ax = setUpSubplot(3, 3, axisTitles=alphas, fullH=True, fullW=True, windowTitle='GAMMA = %.3f' % g)
            for ia, a in enumerate(alphas):
                ax[ia].imshow(img, cmap='gray')
                ax[ia].plot(cpx[:, 1], cpx[:, 0], 'y:')
                for ib, b in enumerate(betas):
                    snake = active_contour(grad,
                                           cpx,
                                           w_edge=0,
                                           w_line=1,
                                           alpha=alphas[0],
                                           beta=b,
                                           gamma=g,
                                           boundary_condition='periodic')
                    ax[ia].plot(snake[:, 1], snake[:, 0], b[ib])


    def __tightenMaskSnake(self, img: ndarray, mask: ndarray):
        """
        Tightens the given mask using the gradient of the given image and returns a new tightened mask
        Args:
            img (ndarray): The image
            mask (ndarray): The untightened mask
        Returns:
            Tightened Binary mask, shape of img

        """
        contour = cv2.findContours(mask.astype('uint8') * 255, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)[0][0]
        # contour pixels
        cpx = contour[:, 0, :]
        # gradient wrt to mask, will have zeros along mask boundaries, necessary to work
        grad = skimage.filters.sobel(img, mask)

        # subsample. base subsampling is 3, to save some speed. We add a factor depending on maxIterations
        # determine subsampling size by assuming the boundary is a circle with equidistant points
        # it has the radius of r = N / 2pi
        # assuming the we shrink the radius by max_iterations the number of points change to
        # N' = N - m*2*pi
        # adding subsampling N'/N avoids loops, since we can only shrink here.
        subsampling = math.ceil(3 * len(cpx) / (len(cpx) - self.__params.snakeIterations * 2 * math.pi))

        cpx = np.flip(cpx[1::subsampling], axis=1)
        snake = active_contour(grad,
                               cpx,
                               max_iterations=self.__params.snakeIterations,
                               w_edge=0, w_line=1,
                               # use only intensity, which is gradient, since we pass gradient image
                               alpha=self.__params.snakeAlpha,
                               beta=self.__params.snakeBeta,
                               gamma=self.__params.snakeGamma)

        # create a binary mask out of the snake
        newMask = np.zeros_like(img, dtype='float64')
        newContour = np.round(np.flip(snake, axis=1)).astype('int')
        cv2.fillPoly(newMask, [newContour], (255, 255, 255))
        return newMask > 1, newContour # convert to boolean
