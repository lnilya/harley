import React from "react";
import {ccl} from "../../../sammie/js/util";
import './scss/AlignmentPair.scss'
import {PipelineImage, PipelinePolygons} from "../../../sammie/js/types/datatypes";
import PolygonCloud from "../../../sammie/js/ui/elements/PolygonCloud";
import styled from "@emotion/styled";
import {FormControl, NativeSelect} from "@mui/material";
import ToolTipIconButton from "../../../sammie/js/ui/elements/ToolTipIconButton";
import {CheckCircle, Warning} from "@mui/icons-material";
import {printf} from "fast-printf";

interface IAlignmentPairProps {
    
    /**Additional classnames for this component*/
    className?: string
    dataLeft: { img: PipelineImage, contours: PipelinePolygons },
    dataRight?: { img: PipelineImage, contours: PipelinePolygons },
    match: number,
    
    curVal: any,
    dropDownSel: Record<any, string>
    batchNum:number,
    
    onChangeAlignment:(to:number)=>void
}

const OutlinePolygon = styled.polygon({
    stroke:'#ff00ffff',
    strokeWidth: 1,
    fill: 'none',
})
/**
 * AlignmentPair
 * @author Ilya Shabanov
 */
const cl = ccl('alignment-pair--')
const AlignmentPair: React.FC<IAlignmentPairProps> = ({ onChangeAlignment,
                                                            batchNum,
                                                          dataLeft, dataRight, match,
                                                          curVal, dropDownSel, className
                                                      }) => {
    
    const onHandleChange = (event) => {
        onChangeAlignment(parseInt(event.target.value))
    }
    console.log(`MATCH: `, match);
    return (
        <div className="margin-100-bottom rel">
            {dataRight && match < 0.9 &&
                <ToolTipIconButton className={'alignment-pair__check warning'} Icon={Warning} color={'white'} tooltipText={`The alignment between the two images is low (${printf('%.1f%%',100*match)}). Alignment however only measures the overlap between the cell (outlines) in one image with the other. So if one image simply has cells filtered out, the alignment will be low, but the colocalization is still possible. Double check that the two images indeed have the same origin.`} />
            }
            {dataRight && match >= 0.9 &&
                <ToolTipIconButton className={'alignment-pair__check success'} Icon={CheckCircle} color={'white'} tooltipText={'The overlap of cells in the images seem to be quite well. If this is not a coincidence because of high cell density, colocalization will work.'} />
            }
            
            <div className={`alignment-pair ${className || ''} grid cols-2 no-gap `}>
                <div className="rel lh-0 left">
                    <img src={dataLeft.img.url}/>
                    <PolygonCloud polygons={dataLeft.contours} canvasDim={dataLeft.img} PolyComp={OutlinePolygon}/>
                    <div className="alignment-pair__selector">
                        <div className={'batch-num'}>
                            Batch #{batchNum}
                        </div>
                    </div>
                </div>
                <div className="rel lh-0 right">
                    {dataRight &&
                        <>
                            <img src={dataRight.img.url}/>
                            <PolygonCloud polygons={dataRight.contours} canvasDim={dataRight.img} PolyComp={OutlinePolygon}/>
                            
                        </>
                    }
                    {!dataRight &&
                        <div className="hint">
                            Batch #{batchNum} will not participate in colocalization, since no partner is selected. Select a
                            partner image in the dropdown below if you want to change it.
                        </div>
                    }
                    <div className="alignment-pair__selector">
                        <FormControl variant="outlined">
                            <NativeSelect value={curVal} onChange={onHandleChange}>
                                {Object.keys(dropDownSel).map((k) =>
                                    <option key={k} value={k}>{dropDownSel[k]}</option>
                                )}
                            </NativeSelect>
                        </FormControl>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default AlignmentPair;