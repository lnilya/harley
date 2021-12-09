import React from "react";
import {cl, copyRemove} from "../../../sammie/js/util";
import './scss/CellResult.scss'
import {PipelineImage, PipelinePolygons, PolygonData} from "../../../sammie/js/types/datatypes";
import PolygonCloud from "../../../sammie/js/ui/elements/PolygonCloud";
import styled from "@emotion/styled";
import {Autorenew, Cancel, DeleteForever, RestoreFromTrash, Visibility, VisibilityOff} from "@mui/icons-material";
import ToolTipIconButton from "../../../sammie/js/ui/elements/ToolTipIconButton";
import _ from "lodash";
import {OutlinePolygonLabeling} from "../Labeling/_polygons";
import {OutlinePolygon} from "../FociCandidates/FociCandidates";

interface ICellResultProps{
	
	/**Additional classnames for this component*/
	className?:string,
    img:PipelineImage,
    cellOutline:PolygonData
    foci:PipelinePolygons,
    curSelection:number[], //foci as modified by user later on
    modelSelection:number[], //foci as selected by model
    excluded:boolean,
    onToggleCellInclusion:()=>void
    onChangeSelection:(newSel:number[]) => void
}
/**
 * CellResult
 * @author Ilya Shabanov
 */
const SelectedPolygon = styled.polygon({
    cursor:'not-allowed',
    stroke:'#99ff00',
    fill:'none',
    strokeWidth:0.7,
})
const AvailablePolygon = styled.polygon({
    cursor:"cell",
    stroke:'#ff00ff',
    opacity:0,
    fill:'none',
    strokeWidth:0.7,
    transition: 'all 0.2s',
    '&:hover':{
        opacity:1,
    }
})
const CellResult:React.FC<ICellResultProps> = ({cellOutline, modelSelection, onChangeSelection,curSelection, img,foci,excluded,onToggleCellInclusion,className}) => {
	const selFoci = foci.map((pd,j)=>curSelection.indexOf(j) == -1 ? null : pd)
	const avFoci = foci.map((pd,j)=>curSelection.indexOf(j) == -1 ? pd : null)
    const onToggleFoci = (f:number)=>{
        if(curSelection.indexOf(f) == -1) //adding new foci to selection
            onChangeSelection([...curSelection,f])
        else //removing exiting foci
            onChangeSelection(copyRemove(curSelection,f))
    }
    const removeAllFoci = () => onChangeSelection([])
    const resetFoci = () => onChangeSelection(modelSelection)
    
    const isModelSelection = _.isEmpty(_.xor(curSelection, modelSelection))
    
	return (
		<div className={`cell-result ${className || ''} ` + cl(excluded,'is-excluded')}>
			<div className="rel lh-0">
                <img src={img.url} />
                <PolygonCloud className={'outline'} polygons={[cellOutline]} canvasDim={img} PolyComp={OutlinePolygon}/>
                {selFoci.length > 0 && !excluded &&
                    <PolygonCloud className={'selected-foci'} onClick={onToggleFoci} polygons={selFoci} canvasDim={img} PolyComp={SelectedPolygon}/>
                }
                {avFoci.length > 0 && !excluded &&
                    <PolygonCloud className={'available-foci'} onClick={onToggleFoci} polygons={avFoci} canvasDim={img} PolyComp={AvailablePolygon}/>
                }
            </div>
            <div className="cell-result__footer">
                {!excluded &&
                    <>
                    <ToolTipIconButton onClick={onToggleCellInclusion} className={'del-btn'}  Icon={VisibilityOff} tooltipText={'Exclude this cell from export'} tooltipDelay={1000}/>
                    <ToolTipIconButton onClick={removeAllFoci} className={'del-btn' + cl(curSelection.length <= 0, 'disabled')}  Icon={Cancel} tooltipText={'Unselect all foci in this cell'} tooltipDelay={1000}/>
                    <ToolTipIconButton onClick={resetFoci} className={'del-btn' + cl(isModelSelection, 'disabled')}  Icon={Autorenew} tooltipText={'Reset foci selection to inital model selection'} tooltipDelay={1000}/>
                    <div className="fl-grow"/>
                    </>
                }
                
                {excluded &&
                    <Visibility onClick={onToggleCellInclusion} className={'del-btn'} sx={{ color: 'white' }} />
                }
                {excluded && <span>Excluded</span>}
                {!excluded && curSelection.length == 0 && <span className={'no-foci'}>No Foci</span>}
                {!excluded && curSelection.length > 0 && <span>{curSelection.length} Foci</span>}
                
            </div>
		</div>
	);
}
export default CellResult;