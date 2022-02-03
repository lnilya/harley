# HARLEY
Human Augmented Recognition of LLPS Ensembles in Yeast

Refer to our [paper (I.Shabanov and JR buchan, 2021)](https://www.biorxiv.org/content/10.1101/2021.11.29.470484v1?rss=1) 
for details on how Harley works internally.  

DOI: https://doi.org/10.1101/2021.11.29.470484

Harley is based on [SAMMIE](https://github.com/lnilya/sammie), which is a framework that anyone can use in order to add GUI to existing python algorithms as well as common functions such as managing inputs, outputs, algorithm parameters, pipeline dependencies etc and finally have the output be an executable file.

# Quick Start for Users


1. Download the latest version for Windows or Mac OS and demo data: https://drive.google.com/drive/folders/1G9lOVfcQwahqiYS3pKJ0UdHJ7_YmvG0A?usp=sharing and launch the program. **You need to have Google Chrome installed for this software to work.**
2. Using any browser (not necessarily Chrome) navigate to http://localhost:1234 which is the local server started by the application. If the site cannot be reached, simply wait a little bit. It sometimes takes up to 30-60s for the server to become responsive.
3. Use the demo data to explore the software with different fluorescence datasets.

Please watch the introductionary videos on how to use the software:

**Detecting Cells:** https://www.youtube.com/watch?v=gTJQOmeUkso

**Preprocessing:** https://www.youtube.com/watch?v=RjvG61KGxZI

**Model Training:** https://www.youtube.com/watch?v=QtzI1SwOdbY

**Foci Detection using model:** https://www.youtube.com/watch?v=1aMCvWfax6s

**Foci Detection using threhsholds, without model:** https://www.youtube.com/watch?v=088jeRmwMhc

**Colocalizaton:** https://www.youtube.com/watch?v=goTFsdEi1PU

(Some videos are made with older versions of Harley. The general flow of data and the influence of parameters are not affected by this.)

# Setting up Develompent Environment

It is much easier to use an IDE like pycharm, hence it will do most installation steps for you.

##1. Setting Up Virtual Environment
You should have python installed. If not here is a link: https://www.python.org/downloads/release/python-382/

All the below steps assume you are in the root folder, where this readme file is located. If not open the console and type in
```
cd path/to/my/folder
```

Supposing that the frontend code has already been compiled all you need to do is setup the python virtual environment.

This needs to be done only once, after that you go to step 2 directly.  

### For MacOS/Linux
Initialize Environment:
```
python3 -m venv .venv
```
Activate Environment:
```
source .venv/bin/activate
```
Upgrade Pip, optional:
```
python3 -m pip install --upgrade pip 
```
Install Required Python Packages: 
```
python3 -m pip install -r requirements.txt
```
### For Windows:
Initialize environment:
```
python -m venv .venv
```
Activate Environment:
```
.venv\Scripts\activate.bat
```
Upgrade Pip, optional:
```
python -m pip install --upgrade pip 
```
Install Required Python Packages: 
```
python -m pip install -r requirements.txt
```

## 2. Starting the frontend

Use yarn or npm to install the required packages. The node version used is 14.5.0 (npm 6.14.5) while it might work with other versions, please check for this verson if problems arise.
```
yarn install
```

To start the JS frontend use the following script:
```
yarn start:js
```

When running in development please use port 3000, instead of 1234: http://localhost:3000. 

## 3. Starting the backend

In an IDE like pycharm the best way is to simply debug/execute the index.py file using the buttons on the top right.

A second way is to use yarn/npm to start the python backend for windows or mac os respectively: 
```
yarn startwin:eel
yarn start:eel
```

When not working with PyCharm or an IDE that does it for you, you might to activate the virtual environment first.

#### For MacOS/Linux
```
source .venv/bin/activate
```
#### For Windows
```
.venv\Scripts\activate.bat
```

## Helpful Links

Regarding Virtual Environments:
https://docs.python.org/3/library/venv.html

Regarding PIP packages:
https://packaging.python.org/guides/installing-using-pip-and-virtual-environments/

##Caveats in current setup

### tmp folder
React-Scripts is configured to reload if any member of the public folder changes. However the tmp folder created by 
this framework will write temporary image files there, whenever they are needed. This would normally
reload the applicaiton, which is of course undesirable. To help with this, a script is used that will 
change the webpack config that is provided with react-scripts in your node-modules forlder: rswebpackfix.js.
This script is automatically prepended to the start:js command. So you do not need to deal with it explicitely. 

### eel shutdown on reload
Eel, the underlying framework fro py-js communication will shut down the process whenever all websockets are closed.
This can lead to you having to restart the py server when react is reloaded, which is terribly annoying and doesn't work with
hot reloading very well. To change this behaviour we edit the eel lab's init file, by simply disabling the _detect_shutdown function, like so: 
```
def _detect_shutdown():
    pass;
```
__You have to do this manually after installation!__ 
