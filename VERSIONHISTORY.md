# Harley - Version history
Updates by version

### Version: 1.0.0
- First major release with 4 pipelines.

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
  
---
- The Brightness mode for foci detection is now work in progress. It is unreliable. Maybe do not rely on it for now.
- Brightnessmode now produces consistently tight outlines for foci. 

### Version: 0.0.1
 
- Initial release 