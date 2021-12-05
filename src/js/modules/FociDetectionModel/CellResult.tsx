import React from "react";
import {cl} from "../../util";
import './scss/CellResult.scss'
import {PipelineImage, PipelinePolygons} from "../../types/datatypes";
import PolygonCloud from "../../ui/elements/PolygonCloud";
import styled from "@emotion/styled";
import {DeleteForever, RestoreFromTrash} from "@mui/icons-material";

interface ICellResultProps{
	
	/**Additional classnames for this component*/
	className?:string,
    img:PipelineImage,
    foci:PipelinePolygons,
    excluded:boolean,
    onToggleCellInclusion:()=>void
}
/**
 * CellResult
 * @author Ilya Shabanov
 */
const SelectedPolygon = styled.polygon({
    cursor:'not-allowed',
    stroke:'#ff00ff',
    fill:'none',
    strokeWidth:0.5,
})
const CellResult:React.FC<ICellResultProps> = ({img,foci,excluded,onToggleCellInclusion,className}) => {
	
	return (
		<div className={`cell-result ${className || ''} ` + cl(excluded,'is-excluded')}>
			<div className="rel lh-0">
                <img src={img.url} />
                {foci.length > 0 && !excluded &&
                    <PolygonCloud polygons={foci} canvasDim={img} PolyComp={SelectedPolygon}/>
                }
            </div>
            <div className="cell-result__footer">
                {!excluded &&
                    <DeleteForever onClick={onToggleCellInclusion} className={'del-btn'} sx={{ color: 'white' }} />
                }
                
                {excluded &&
                    <RestoreFromTrash onClick={onToggleCellInclusion} className={'del-btn'} sx={{ color: 'white' }} />
                }
                {excluded && <span>Excluded</span>}
                {!excluded && foci.length == 0 && <span className={'no-foci'}>No Foci</span>}
                {!excluded && foci.length > 0 && <span>{foci.length} Foci</span>}
                
            </div>
		</div>
	);
}
export default CellResult;