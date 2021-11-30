import eel


#Sends progress of current step to JS interface
def eeljs_sendProgress(progress:float, msg:str = None):
    eel.progress(progress,msg)