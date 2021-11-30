import numpy as np


class NormalizerInterface:
    def __init__(self):
        pass

    def reset(self, X):
        pass

    def scale(self, X):
        pass


class DataWhitenerNorm(NormalizerInterface):
    #Whitens and norms 0-1
    def __init__(self):
        self.w = DataWhitener()
    def reset(self, X):
        XT = self.w.reset(X)
        mins = np.max(XT,axis=0)
        maxs = np.min(XT,axis=0)
        XT = (XT - mins) / (maxs - mins)

        self.mins, self.maxs = mins , maxs
        return XT

    def scale(self, X):
        XT = self.w.scale(X)
        XT = (XT -  self.mins) / (self.maxs - self.mins)
        return XT

class DataWhitener(NormalizerInterface):
    # Whitens only
    def reset(self, X):
        X = X.reshape((-1, np.prod(X.shape[1:])))
        mean = np.mean(X, axis=0)
        X_centered = X - mean
        Sigma = np.dot(X_centered.T, X_centered) / X_centered.shape[0]

        U, Lambda, _ = np.linalg.svd(Sigma)
        W = np.dot(np.diag(1.0 / np.sqrt(Lambda + 1e-5)), U.T)

        self.__mean = mean
        self.__W = W.T

        return np.dot(X_centered, W.T)

    def scale(self, X):
        X_centered = X - self.__mean
        return np.dot(X_centered, self.__W)
