# coding: utf-8
import sys

from src.py import eelutil, settings
from src.py.eelinterface import *

if __name__ == '__main__':
    if '--develop' in sys.argv:
        while True:
            print("(RE) STARTING SERVER IN DEV MODE on http://localhost:3000")
            eel.init('public')
            eelutil.emptyTmpFolder(settings.TMP_FOLDER)
            k = eel.start(port = settings.EEL_PORT,
                      host = settings.EEL_HOST)
    else:
        print('Visit http://%s:%d in your browser to use software' % (settings.EEL_HOST, settings.EEL_PORT))
        print('Sometimes you need to restart this app a few times and wait a bit on first load.')
        eel.init('build')
        eelutil.emptyTmpFolder(settings.TMP_FOLDER)
        eel.start(port = settings.EEL_PORT,
                  host = settings.EEL_HOST)
        # eel.start('index.html',
        #           port = settings.EEL_PORT,
        #           host = settings.EEL_HOST)
