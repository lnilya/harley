# HARLEY
Human Augmented Recognition of LLPS Ensembles in Yeast

# Quick Start for Users

1. Download the latest version for Windows or Mac OS in the _releases folder of this repositroy and launch it on your machine.
2. Using any browser navigate to http://localhost:1234 which is the local server started by the application.
3. Use the data files in _demo to explore software with different fluorescence data.

Please watch the introductionary videos on how to use the software:

**Detecting Cells:** https://www.youtube.com/watch?v=gTJQOmeUkso

**Preprocessing:** https://www.youtube.com/watch?v=RjvG61KGxZI

**Model Training:** https://www.youtube.com/watch?v=QtzI1SwOdbY

**Automated Foci Detection:** https://www.youtube.com/watch?v=KRvW-F2ED6g
 

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