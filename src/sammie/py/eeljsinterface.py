import eel

#This file contains functions that can be called from PY to JS.

#Sends progress of current step to JS interface
def eeljs_sendProgress(progress:float, msg:str = None):
    eel.progress(progress,msg)