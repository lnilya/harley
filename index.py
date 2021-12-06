# coding: utf-8
import sys

from src.py import settings
from src.sammie.py import eelutil
from src.sammie.py.eelinterface import *

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
        print('On first run it may take a while for the server to be receptive. So if you can\'t reach the site in your browser wait a little bit and reload.')
        print('Please report any bugs or suggestions to: http://github.com/lnilya/harley')
        eel.init('build')
        eelutil.emptyTmpFolder(settings.TMP_FOLDER)
        eel.start(port = settings.EEL_PORT,
                  host = settings.EEL_HOST)
        # eel.start('index.html',
        #           port = settings.EEL_PORT,
        #           host = settings.EEL_HOST)
