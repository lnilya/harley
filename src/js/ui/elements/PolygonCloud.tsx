import React, {ReactNode, SVGProps, useEffect, useRef, useState} from "react";
import {printf} from "fast-printf";
import styled from "@emotion/styled";
import {PolygonData} from "../../types/datatypes";


const DefaultPolygon = styled.polygon({
    cursor:'pointer',
    strokeWidth:1,
    stroke:'red',
    '&:hover':{
        fill:'red',
    }
})

interface IPolygonCloudProps{
	
	/**Additional classnames for this component*/
	className?:string
    
    polygons:Array<PolygonData>,
    
    /**A dimension of the canvas, since points are transformed to % coordinates of this */
    canvasDim:{w:number,h:number},
    
    /**An emotion styled.polygon to be used to draw polygons*/
    PolyComp?:React.FC<SVGProps<SVGPolygonElement>>,
    
    PolyCompFactory?:(idx:number) => React.FC<SVGProps<SVGPolygonElement>>,
    
    /**Callback click for a single ellipse*/
    onClick?:(id:number) => void,
    
    /**Callback hover for a single ellipse*/
    onMouseEnter?:(id:number) => void,
    
    /**Callback hover for a single ellipse*/
    onMouseDown?:(id:number,e) => void,
}
/**
 * PolygonCloud
 * @author Ilya Shabanov
 */
const PolygonCloud:React.FC<IPolygonCloudProps> = ({onMouseDown, onMouseEnter, onClick, polygons,PolyCompFactory, PolyComp,canvasDim,className}) => {
    
    if(!PolyComp){
        PolyComp = DefaultPolygon
    }
    if(!PolyCompFactory){
        PolyCompFactory = (idx)=>PolyComp
    }
    
    
    
	return (
		<div className={`polygon-cloud ${className} `}>
            {polygons?.length > 0 &&
                <svg viewBox={`0 0 ${canvasDim.w} ${canvasDim.h}`}  xmlns="http://www.w3.org/2000/svg">
                    {polygons.map((p,i)=>{
                        if(!p) return null;
                        
                        //Mapping into SVG coordinates format
                        const points = p.x.map((x,i)=>printf('%.2f %.2f ' ,x,p.y[i])).join(' ')
                        const Comp = PolyCompFactory(i)
                        return <Comp key={i}
                                         points={points}
                                         onMouseEnter={!!onMouseEnter ? ()=>onMouseEnter(i) : null}
                                         onMouseDown={!!onMouseDown ? (e)=>onMouseDown(i,e) : null}
                                         onTouchStart={!!onMouseDown ? (e)=>onMouseDown(i,e) : null}
                                         onClick={!!onClick ? ()=>onClick(i) : null} />
                    })}
                </svg>
            }
		</div>
	);
}

export default PolygonCloud;