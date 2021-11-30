import React, {useEffect, useState} from "react";
import {ccl, copyRemove} from "../../util";
import {FociInCell} from './server'
import PolygonCloud from "../../ui/elements/PolygonCloud";
import {printf} from "fast-printf";
import {atomFamily, useRecoilState} from "recoil";
import {DeleteForever, RestoreFromTrash} from "@mui/icons-material";
import styled from "@emotion/styled";

const deepEqual = require('deep-equal')

interface ISingleCellWithBasinsProps{
	res:FociInCell
    uniqueID:string
    onChangeFociInclusion:(accepted:boolean[],deleted) => any
    
	/**Additional classnames for this component*/
	className?:string
    
    /**Settings coming from global*/
    globalBrightnessLimit:number
    minInclusionBrightness:number
    globalDropofLimit:number
}
const stroke = 0.5;
const fillAlpha = '88';

export const AcceptedPolygon = styled.polygon({
    stroke:'#00e800',
    strokeWidth:stroke,
    fill:'none',
    cursor:'not-allowed',
    '&:hover':{
        fill:'#00e800'+fillAlpha,
    }
})
export const ManRejPolygon = styled.polygon({
    stroke:'#ff0000',
    strokeWidth:stroke,
    fill:'none',
    cursor:'crosshair',
    '&:hover':{
        fill:'#ff0000'+fillAlpha,
    }
})
export const RejDropoffPolygon = styled.polygon({
    stroke:'#ff00ff',
    strokeWidth:stroke,
    fill:'none',
    cursor:'crosshair',
    '&:hover':{
        fill:'#ff00ff'+fillAlpha,
    }
})

export const RejBrightnessPolygon = styled.polygon({
    stroke:'#FFA500',
    strokeWidth:stroke,
    fill:'none',
    cursor:'crosshair',
    '&:hover':{
        fill:'#FFA500'+fillAlpha,
    }
})
//
// const basinStyle:PolygonStyle = {
//     outlineColor:'#00e800',
//     fillcolor:'#00e800' + fillAlpha,
//     outlineStyle:'solid',
//     outlineWidth: stroke,
//     fill:false,
// }
// const rejectedStyleManually:PolygonStyle = {
//     outlineColor:'#ff0000',
//     fillcolor:'#ff0000' + fillAlpha,
//     outlineStyle:'solid',
//     outlineWidth: stroke,
//     fill:false,
// }
// const rejectedStyleDropoff:PolygonStyle = {
//     outlineColor:'#ff00ff',
//     fillcolor:'#ff00ff' + fillAlpha,
//     outlineStyle:'solid',
//     outlineWidth: stroke,
//     fill:false,
// }
// const rejectedStyleBrightness:PolygonStyle = {
//     outlineColor:'#FFA500',
//     fillcolor:'#FFA500' + fillAlpha,
//     outlineStyle:'solid',
//     outlineWidth: stroke,
//     fill:false,
// }

/**
 * SingleCellWithBasins
 * @author Ilya Shabanov
 */
const cl = ccl('single-cell-with-basins--')
const asRejected = atomFamily<number[], string>({key: 'single-cell-with-basin_rejects', default: []});
const asDeleted = atomFamily<boolean, string>({key: 'single-cell-with-basin_deleted', default: false});
const asLastParams = atomFamily<any, string>({key: 'single-cell-with-basin_lastparams', default:[] });
const SingleCellWithBasins:React.FC<ISingleCellWithBasinsProps> = ({minInclusionBrightness, onChangeFociInclusion, uniqueID, globalDropofLimit,globalBrightnessLimit, res, className}) => {
	
    const [rejected,setRejected] = useRecoilState(asRejected(uniqueID));
    const [lastParams,setLastParams] = useRecoilState(asLastParams(uniqueID));
    const [hoveredEl,setHovered] = useState(-1);
    
    const [isDeleted,setIsDeleted] = useRecoilState(asDeleted(uniqueID));
    
    useEffect(()=>{
        if(deepEqual(lastParams,[globalBrightnessLimit,globalDropofLimit,res,minInclusionBrightness])) return;
        
        //update all rejected basins when global parameters or inputs change
        var allRej = []
        res.basinmeta.map((bm,i)=>{
            const maxIntensity = bm[2]
            const lvlIntensity = bm[3]
            //will be included because it is above inclusion brightness
            if(maxIntensity > minInclusionBrightness) return;
            
            if(maxIntensity < globalBrightnessLimit) allRej.push(i)
            else if(maxIntensity/lvlIntensity < globalDropofLimit) allRej.push(i)
        })
        setRejected(allRej)
        setLastParams([globalBrightnessLimit,globalDropofLimit,res, minInclusionBrightness])
    },[globalBrightnessLimit,globalDropofLimit,res, minInclusionBrightness])
    useEffect(()=>{
        setIsDeleted(false)
    },[res])
    
    useEffect(()=>{
        if(!res?.basins) return
        onChangeFociInclusion(res.basins.map((f, i)=>rejected.indexOf(i) == -1),isDeleted)
    },[rejected,isDeleted])

    
    const onRemoveAcceptedBasin = async (id) => setRejected([...rejected,id])
    const onAddRejectedBasin = async (id) => setRejected(copyRemove(rejected,id))
    
    
    const acceptedBasins = res?.basins?.map((b,i)=>rejected.indexOf(i) == -1 ? b : null)
    const rejectedBasinsByBrightness = res?.basins?.map((b,i)=> {
        if(rejected.indexOf(i) != -1 && res.basinmeta[i][2] < globalBrightnessLimit) return b;
        return null;
    })
    const rejectedBasinsByDropoff = res?.basins?.map((b,i)=> {
        if(rejected.indexOf(i) != -1 && res.basinmeta[i][2]/res.basinmeta[i][3] < globalDropofLimit) return b;
        return null;
    })
    const rejectedBasinsManually = res?.basins?.map((b,i)=> {
        if(rejected.indexOf(i) != -1 && !rejectedBasinsByDropoff[i] && !rejectedBasinsByBrightness[i]) return b;
        return null
    })
    
    const numAccepted = acceptedBasins?.filter(k=>k!=null).length || 0
    
    
	return (
		<div className={`single-cell-with-basins pad-100-top margin-200-bottom  pad-50-hor ` +className + cl(isDeleted, 'is-deleted')} >
            <div className="fl-grow"/>
			<div className="rel">
                <img src={res.img.url} alt="" onMouseEnter={()=>setHovered(-1)}/>
                {acceptedBasins &&
                    <PolygonCloud onMouseEnter={setHovered} onClick={onRemoveAcceptedBasin} PolyComp={AcceptedPolygon} polygons={acceptedBasins} canvasDim={res.img}/>
                }
                {rejectedBasinsByBrightness &&
                    <PolygonCloud onMouseEnter={setHovered} onClick={onAddRejectedBasin} PolyComp={RejBrightnessPolygon}  polygons={rejectedBasinsByBrightness} canvasDim={res.img} className={'rej-foci'}/>
                }
                {rejectedBasinsByDropoff &&
                    <PolygonCloud onMouseEnter={setHovered} onClick={onAddRejectedBasin} PolyComp={RejDropoffPolygon}  polygons={rejectedBasinsByDropoff} canvasDim={res.img} className={'rej-foci'}/>
                }
                {rejectedBasinsManually &&
                    <PolygonCloud onMouseEnter={setHovered} onClick={onAddRejectedBasin} PolyComp={ManRejPolygon}  polygons={rejectedBasinsManually} canvasDim={res.img} className={'rej-foci'}/>
                }
            </div>
            <div className="fl-grow"/>
            <div className="btn-container fl-row-between">
                {!isDeleted &&
                    <DeleteForever onClick={()=>setIsDeleted(true)} className={'del-btn'} sx={{ color: 'white' }} />
                }
                
                {isDeleted &&
                    <RestoreFromTrash onClick={e=>setIsDeleted(false)} className={'del-btn'} sx={{ color: 'white' }} />
                }
                
                {(hoveredEl < 0 || !res?.basinmeta[hoveredEl]) &&
                    <span>{numAccepted}</span>
                }
                {hoveredEl >= 0 && res?.basinmeta[hoveredEl] &&
                    <div className={'el-info'}>
                        <div>Brightness: <strong>{
                            printf('%.2f',res.basinmeta[hoveredEl][2])
                        }</strong></div>
                        <div>BgRatio: <strong>{
                            printf('%.2f', res.basinmeta[hoveredEl][2] / res.basinmeta[hoveredEl][3])
                        }</strong></div>
                    </div>
                }
            </div>
		</div>
	);
}

export default SingleCellWithBasins;