import React from "react";
import {ccl, copyRemove} from "../../util";
import {FociInCell} from "./server";
import EllipseCloud, {EllipseStyle} from "../../ui/elements/EllipseCloud";
import {PipelineEllipses} from "../../types/datatypes";
import {printf} from "fast-printf";
import {DeleteForever, RestoreFromTrash} from "@mui/icons-material";

interface ISingleCellProps{
	res:FociInCell
    threshhold:number,
    showTS:boolean,
    exclusions:number[],
    changeTS:(nv:number)=>void,
    onExcludeFoci:(nv:number[])=>void,
    size:[number,number]
	/**Additional classnames for this component*/
	className?:string
}
/**
 * Display the results of a single cell
 * @author Ilya Shabanov
 */
const cl = ccl('single-cell--')

const acceptedStyle:EllipseStyle = {
    outlineColor: '#8afa40',
    outlineStyle:'solid',
    outlineWidth:2,
    fill:false,
}
const rejStyle:EllipseStyle = {
    outlineColor:'red',
    outlineStyle:'dashed',
    outlineWidth:1,
    fill:false,
}
const scaleStyle:EllipseStyle = {
    outlineColor:'yellow',
    outlineStyle:'solid',
    outlineWidth:1,
    fill:false,
}

const SingleCell:React.FC<ISingleCellProps> = ({ size, exclusions, onExcludeFoci, showTS, changeTS, res, threshhold, className}) => {
    
    
    
    //Parse foci markers into ellipse format
    const acceptedFoci = res.foci.filter((f)=> {
         return f[3] > threshhold
    })
    var ellipses:PipelineEllipses = acceptedFoci.map((f)=>({origPos:res.foci.indexOf(f), x:f[1], y:f[0], rot:0, a:f[2],b:f[2]}))
    const acceptedEllipses = ellipses.filter((e)=>exclusions.indexOf(e['origPos']) == -1)
    const rejectedEllipses = ellipses.filter((e)=>exclusions.indexOf(e['origPos']) != -1)
    
    var scale = [{ x:size[1]+1, y:size[1]+1, a:size[1], b:size[1], rot: 0},
                 { x:size[1]+1, y:size[1]+1, a:size[0], b:size[0], rot: 0}];
    
    // if(exclusions.length > 0)
    //     console.log(`EXCLUDED `, exclusions);
    
    
    const onIncThreshhold = ()=>{
        //foci are ordered by curvature intensity, so we simply need to take one more and set
        //the new threshhold to a particular value
        const desiredLen = acceptedFoci.length - 1
        if (desiredLen == 0) changeTS(1)
        else changeTS((res.foci[desiredLen-1][3] + res.foci[desiredLen][3])/2)
    }
    const onDecThreshhold = ()=>{
        const desiredLen = acceptedFoci.length + 1
        if (desiredLen >= res.foci.length) changeTS(0)
        else changeTS((res.foci[desiredLen-1][3] + res.foci[desiredLen][3])/2)
    }
    
    const onExclude = (f)=>{
        const op = acceptedEllipses[f]['origPos']
        onExcludeFoci([...exclusions, op])
    }
    const onInclude = (f)=>{
        const op = rejectedEllipses[f]['origPos']
        onExcludeFoci(copyRemove(exclusions,op))
    }
    
    const isDeleted = threshhold < 0
    
	return (
		<div className={`single-cell pad-100-top margin-200-bottom  pad-50-hor `+className + cl(isDeleted, 'is-deleted')}>
            <div className="fl-grow"/>
            <div className="rel">
                <img src={res.img.url} alt=""/>
                {!isDeleted &&
                    <>
                        <EllipseCloud  onClick={onExclude} ellipseStyle={acceptedStyle} ellipses={acceptedEllipses} canvasDim={res.img} id={'accepted'}/>
                        <EllipseCloud  onClick={onInclude} ellipseStyle={rejStyle} ellipses={rejectedEllipses} canvasDim={res.img} id={'rejected'}/>
                        <EllipseCloud  ellipseStyle={scaleStyle} ellipses={scale} canvasDim={res.img} id={'scale'}/>
                    </>
                }
            </div>
            <div className="fl-grow"/>
            
            {showTS && !isDeleted &&
                <div className="ind-level">
                    Min Curvature Intensity:
                    <strong>{printf('%.3f',threshhold)}</strong>
                </div>
            }
            <div className="btn-container">
                {!isDeleted &&
                    <DeleteForever onClick={()=>changeTS(-1 * threshhold)} className={'del-btn'} sx={{ color: 'white' }} />
                }
                
                {isDeleted &&
                    <RestoreFromTrash onClick={()=>changeTS(-1 * threshhold)} className={'del-btn'} sx={{ color: 'white' }} />
                }
                <div className="fl-grow"/>
                <div className="btn" onClick={onDecThreshhold}>+</div>
                <span className={'counter'}>{acceptedFoci.length}</span>
                <div className="btn" onClick={onIncThreshhold}>-</div>
            </div>
		</div>
	);
}
export default SingleCell;