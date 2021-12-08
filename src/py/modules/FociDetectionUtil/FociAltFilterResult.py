from typing import List

import numpy as np
from numpy import ndarray
import src.sammie.py.util.imgutil as imgutil

class FociMinDistGraph:

    def __init__(self, edges):
        self.edges = edges

    def shiftEdge(self):
        if len(self.edges) == 0:
            return None
        return self.edges.pop(0)

    def disconnetNode(self,a:int):
        #remove all edges that this node is involved in
        self.edges = list(filter(lambda e: a not in e,self.edges))

    def removeEdge(self,a:int,b:int):
        #remove edges between a and b
        if [a,b] in self.edges : self.edges.remove([a,b])
        if [b,a] in self.edges : self.edges.remove([b,a])


class FociAltFilterResult:

    #Original array of candidate points Nx4 = r,c,radius,curvature
    __blobs:ndarray

    #Array of indices of accepted blobs
    __acceptedBlobs:List[int]

    __fociPos:ndarray #M x 2 array of foci maxima centers as global integer coordinates
    __contours:List[ndarray] # List of K x 2 Arrays of contour points for each accepted foci
    __intensities:ndarray #M x 2 of foci maximum values and contour level values

    def __init__(self, allBlobs):
        self.__blobs = allBlobs
        self.__fociPos = allBlobs[:,0:2].astype('int')
        self.__contours = [None] * len(self.__fociPos)
        self.__intensities = np.zeros((len(allBlobs),2))
        self.__acceptedBlobs = list(range(0,len(allBlobs)))

    def substractBorder(self,b):
        self.__blobs[:,0:2] -= b
        self.__fociPos -= b
        for c in self.__contours:
            if c is None: continue
            c -= b

    #JS object to be displayed as polygon cloud with intensities.
    def getJSDictionaries(self):
        ret = []
        for i in self.__acceptedBlobs:
            ret += [
                {'x':self.__contours[i][:,1].tolist(),'y':self.__contours[i][:,0].tolist(),
                 'vmax':self.__intensities[i][0],'lvl':self.__intensities[i][1],
                 'cx':self.__fociPos[i,1],'cy':self.__fociPos[i,0]}
            ]
        return ret

    def numAccpetedIndices(self):
        return len(self.__acceptedBlobs)

    def getAccpetedIndices(self):
        return self.__acceptedBlobs

    def __getitem__(self, indices):
        if not isinstance(indices, tuple):
            indices = (indices,)

        k = [
            {'pos': self.__fociPos[i],
             'cnt': self.__contours[i],
             'max': self.__intensities[i][0],
             'level': self.__intensities[i][1],
             'dropoff': self.__intensities[i,0] / self.__intensities[i,1] if self.__intensities[i,1] > 0  else 0}
            for i in indices]

        if len(k) == 1: return k[0]
        return k

    def getPoints(self,idx):
        return self.__fociPos[idx]

    def updatedEl(self,idx,contour,lvl,intensity):
        self.__intensities[idx,:] = [intensity,lvl]
        self.__contours[idx] = contour

    def discardElements(self,idx):
        self.__acceptedBlobs = list(set(self.__acceptedBlobs) - set(idx))

    def elimenateContoursWithLengthBelow(self, minLength):
        elimenateIndices = []
        for i,c in enumerate(self.__contours):
            if c is None: continue
            dif = (c - np.array([*c[1:, :], c[0, :]]))**2
            tooShort = np.sum(np.sqrt(dif[:, 0] + dif[:, 1])) < minLength
            if tooShort:
                elimenateIndices += [i]

        if len(elimenateIndices) > 0:
            self.discardElements(elimenateIndices)

        return elimenateIndices

    def __rank(self,intensityArr):
        return intensityArr[:,0]

    def getRankedAcceptedIndices(self):
        k = self.__intensities[self.__acceptedBlobs,:]
        res = np.argsort(self.__rank(k))[::-1]
        return np.array(self.__acceptedBlobs)[res]

    def plotDiscardedResult(self,img, ax):
        ax.set_title('Discarded Foci')
        ax.imshow(img, cmap='gray')
        for i in range(0,len(self.__fociPos)):
            if i in self.__acceptedBlobs: continue
            ix = '%.1f' % (self.__intensities[i, 0] / self.__intensities[i, 1])
            ax.plot(self.__fociPos[i, 1], self.__fociPos[i, 0], 'yx')
            if self.__contours[i] is not None:
                ax.plot(self.__contours[i][:, 1], self.__contours[i][:, 0], 'm-')
                ax.annotate(ix, (self.__fociPos[i, 1], self.__fociPos[i, 0]), color='m', fontsize=8)

    def plotCoreResult(self,img, ax):
        rankedIndices = self.getRankedAcceptedIndices()
        ax.imshow(img, cmap='gray')
        for i in rankedIndices:

            ix = '%.1f'%(self.__intensities[i,0]/self.__intensities[i,1])
            ax.plot(self.__contours[i][:, 1], self.__contours[i][:, 0], 'g-')
            ax.plot(self.__fociPos[i, 1], self.__fociPos[i, 0], 'gx')
            ax.annotate(ix, (self.__fociPos[i, 1], self.__fociPos[i, 0]), color='m', fontsize=8)

    def plotResult(self,img, title:str = 'Result', ax = None):
        if ax is None:
            ax = imgutil.setUpSubplot(1, 3, title, ['Foci', 'DropOffs', 'Intensities'])

        ax[0].set_title('Accepted Foci')
        ax[1].set_title('Dropoffs')
        ax[2].set_title('Intensities')
        rankedIndices = self.getRankedAcceptedIndices()
        self.plotCoreResult(img,ax[0])
        ax[1].bar(range(1, 1 + len(rankedIndices)), self.__intensities[rankedIndices,0]/self.__intensities[rankedIndices,1])
        ax[2].bar(range(1, 1 + len(rankedIndices)), self.__intensities[rankedIndices,0])