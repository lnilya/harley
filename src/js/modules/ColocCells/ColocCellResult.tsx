import React from "react";
import {ccl, cl} from "../../../sammie/js/util";
import './scss/ColocCellResult.scss'
import {ColocSingleCellImages} from "./server";
import {PipelinePolygons, PolygonData} from "../../../sammie/js/types/datatypes";
import PolygonCloud from "../../../sammie/js/ui/elements/PolygonCloud";
import {OutlinePolygon} from "../FociCandidates/FociCandidates";
import ToolTipIconButton from "../../../sammie/js/ui/elements/ToolTipIconButton";
import {Autorenew, Cancel, Visibility, VisibilityOff} from "@mui/icons-material";
import styled from "@emotion/styled";
import {printf} from "fast-printf";
import {Tooltip} from "@mui/material";

interface IColocCellResultProps{
	
	/**Additional classnames for this component*/
	className?:string
    res:ColocSingleCellImages,
    imgIdx:number,
    cnt:PolygonData
    excluded:boolean
    onToggleCellInclusion:()=>any
    foci0:PipelinePolygons
    foci1:PipelinePolygons,
    pcc:[number,number],
    fpcc:[number,number],
    colorSet:string
}

export const GreenPolygon = styled.polygon({
    fill:'none',
    stroke:'#9ACD32ff',
    strokeWidth:1,
})
export const RedPolygon = styled.polygon({
    fill:'none',
    stroke:'#cd3232',
    strokeWidth:1,
})
export const BluePolygon = styled.polygon({
    fill:'none',
    stroke:'#32a4cd',
    strokeWidth:1,
})
const ctop = {r:RedPolygon,g:GreenPolygon,b:BluePolygon}
/**
 * ColocCellResult
 * @author Ilya Shabanov
 */
const ColocCellResult:React.FC<IColocCellResultProps> = ({fpcc,pcc,colorSet, foci0, foci1, onToggleCellInclusion, excluded, cnt,imgIdx, res,className}) => {
 
 
	return (
		<div className={`coloc-cell-result ${className || ''} ${cl(excluded,'is-excluded')}`}>
			<div className="rel lh-0 img-container">
                <img src={res[imgIdx].url} />
                <PolygonCloud className={'stick-to-all'} polygons={[cnt]} canvasDim={res[0]} PolyComp={OutlinePolygon}/>
                {foci0.length > 0 &&
                    <PolygonCloud className={'foci-0 stick-to-all'} polygons={foci0} canvasDim={res[0]} PolyComp={ctop[colorSet.charAt(0)]}/>
                }
                {foci1.length > 0 &&
                    <PolygonCloud className={'foci-1 stick-to-all'} polygons={foci1} canvasDim={res[1]} PolyComp={ctop[colorSet.charAt(1)]}/>
                }
            </div>
            <div className="coloc-cell-result__footer">
                {!excluded &&
                    <ToolTipIconButton onClick={onToggleCellInclusion} className={'del-btn'}  Icon={VisibilityOff} color={'white'} tooltipText={'Exclude this cell from examination'} tooltipDelay={1000}/>
                }
                
                {excluded &&
                    <Visibility onClick={onToggleCellInclusion} className={'del-btn'} sx={{ color: 'white' }} />
                }
                {excluded && <span>Excluded</span>}
                {!excluded &&
                    <>
                        <div className="fl-grow"/>
                        
                        <Tooltip title={`Pearson correlation coefficient for pixels in cell bounds (p = ${pcc[1]})`} arrow>
                            <span className={'text-tooltip'}> r<sub>cell</sub> = {printf('%.3f',pcc[0])}</span>
                        </Tooltip>
                        {fpcc &&
                            <Tooltip title={`Pearson correlation coefficient for pixels in foci bounds (p = ${fpcc[1]})`} arrow>
                                <span className={'text-tooltip'}> r<sub>foci</sub> = {printf('%.3f',fpcc[0])}</span>
                            </Tooltip>
                        }
                        {!fpcc &&
                            <Tooltip title={`Pearson correlation coefficient for pixels in foci bounds. Can't be determined, usually because one of the channels is constant inside the foci area. Reasons for this are either absence of signal or low variation in signal paired with the discrete 8bit nature of images, that yields constant values.`} arrow>
                                <span className={'text-tooltip undef'}> r<sub>foci</sub> = ?</span>
                            </Tooltip>
                        }
                    </>
                }
                {/*{!excluded && curSelection.length == 0 && <span className={'no-foci'}>No Foci</span>}*/}
                {/*{!excluded && curSelection.length > 0 && <span>{curSelection.length} Foci</span>}*/}
                
            </div>
		</div>
	);
}
export default ColocCellResult;