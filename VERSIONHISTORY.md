# Harley - Version history
Updates by version

### Version: 1.1.6

Minor:
- Foci Detection: Brightness values exported are not normalized.
- Colocalization: Added parameter to toggle normalizaton of images 
- Colocalization: Fixed crash in scatter plot 
- Colocalization: Various changes in wording/explanations 

### Version: 1.1.5

Major:
- Cell Detection: Now possible to export mask files, with precise masks, instead of mask images. This gives ~2px more precise outlines.
- Pre Processing: Suggested to use new mask files now. Now possible to overlay reference images and fluorescence for better insight into data.

Minor: 
- Pre Processing: Output cells file now also contains ref images, for further use in the future. 
- Pre Processing: Added possibility to shift detected masks against fluorescence image.
- Bugfix: crash due to bug in mask import.
- Bugfix: Batch file selection did not work properly for some patterns. 

### Version: 1.1.4

Minor:
- Coloc: Added scatter plot regression
- Coloc: Added scatter plot export
- Coloc: Raw data export extended with foci details
- Foci Detection: Possibility to sort out cells by max intensity
- Foci Detection: Temporary adjustment of contrast slider to better pick quality cells.

### Version: 1.1.3

Major:
- Added scatter plots to Coocalization Pipeline 

Minor:
- Foci Detection changed CSV to XLSX and added more evaluations
- Added XLSX Export of Colocalization Data
- Bugfixes in pipelinehandling 

### Version: 1.1.2
Major:
- Added Pearson Correlation to Coloc Pipeline 

Minor:
- Improvements in Colocalization Pipeline UI


### Version: 1.1.1
Minor:
- Bugfix with BatchCreator fixed on Windows
- Bugfix with restarting software on Windows

### Version: 1.1.0
Major: 
- Added Colocalization pipeline to Harley

Minor:
- Varius small bugfixes in UI 

### Version: 1.0.1
Major:
- Added possibility to manually add/remove foci after model detection
- Added scale parameters to batches, so outputs are in nm instead of pixels

Minor:
- Fixed missing library bug in cell fitting
- Integration of Youtubetube tutorials into UI and added intro screen

### Version: 1.0.0

- First major release with 4 pipelines.
- Along with [Paper](https://www.biorxiv.org/content/10.1101/2021.11.29.470484v1?rss=1) publication

### Version: 0.0.6

Minor:
- Fixed bugs with Polygon Displays, where the mask would not sit aligned with image.
- Fixed some typos and extended some Help strings

### Version: 0.0.5

Major:
- Add new Ridge Detection, can detect lawns of yeast really well.
- Dramatically increased speed of cell detection about 10x faster 

Minor:
- Fixed bug in mask export, if no selection has been made
- Now saving the last used pipeline, and not starting always in default
- In CellFitting and MaskTightening steps: Displays cell count in top left and you can toggle mask by pressing "1" and "2" keys

### Version: 0.0.4

- Added possibility to ignore cells during foci detection
- Added possibility to hold SHIFT key to temporary make foci invisible, for better usability.
- Modified export to mention ignored cells and cells with no foci, by adding a new comment column

### Version: 0.0.3

- Completely redid foci detection algorithm, seems to work a lot better now
- Improved UI and new parameters for foci detection

### Version: 0.0.2

- Fixed Sliders. They won't trigger algorithm rerun, until user let's go mouse or leaves textfield.
- Added scale to outputs and inputs, so that Foci output is now in µm instead of px. The scale comes from the metadata of the original DV image.
- Improved UI for Foci Detection in Curvature Mode. Now possible to add/remove single foci.
- The Brightness mode for foci detection is now work in progress. It is unreliable. Maybe do not rely on it for now.
- Brightnessmode now produces consistently tight outlines for foci. 

### Version: 0.0.1
 
- Initial release 