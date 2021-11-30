from sklearn.metrics import matthews_corrcoef

#All accept an sklearn model a freature set and the training labels.

#Matthews correlation coefficient.
def mcc(model,X,ytrue):
    ypred = model.predict(X)
    return matthews_corrcoef(ytrue, ypred)
