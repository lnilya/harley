import React from "react";
import {PipelineEllipses, PipelineImage} from "../../types/datatypes";
import {PointStyle} from "./PointCloud";
import {ccl} from "../../util";

export type EllipseStyle = Partial<{
    /**[red] CSS value for fill*/
    fillcolor: string,
    /**[white] CSS value for color*/
    outlineColor: string,
    /**[1] Width in px of outline*/
    outlineWidth:number,
    /**[none] Wether or not to add a border*/
    outlineStyle:'none'|'solid'|'dashed',
    /**[true] Wether or not to fill, will not work for all markers.*/
    fill:boolean,
}>
const defaultStyle:EllipseStyle = {
    fillcolor:'red',
    outlineColor:'white',
    outlineStyle:'none',
    outlineWidth:1,
    fill:true,
}
interface IEllipseCloudProps{
	
	/**Additional classnames for this component*/
	className?:string
    
    ellipses:PipelineEllipses,
    /**A dimension of the canvas, since points are transformed to % coordinates of this */
    canvasDim:{w:number,h:number}|PipelineImage,
    
    /**An optional style object for defining how ellipses look*/
    ellipseStyle?:PointStyle,
    
    /**Callback click for a single ellipse*/
    onClick?:(id:number) => void,
    
    /**A unique ID is required for the styles to work*/
    id:string,
}
/**
 * EllipseCloud
 * @author Ilya Shabanov
 */
const ecl = ccl('ellipse-cloud--');
const EllipseCloud:React.FC<IEllipseCloudProps> = ({onClick, ellipseStyle,ellipses,canvasDim,id,className}) => {
	
    var es:EllipseStyle = {...defaultStyle,...ellipseStyle||{}}
    
    //Make styling classes
    className = className || '';
    className += ecl(es.fill,'filled') + 'ellipse-cloud--'+es.outlineStyle
    
    
    var styleTag = `
        #${id} > div{
            border-width:${es.outlineWidth}px;
            background-color:${es.fillcolor};
            border-color:${es.outlineColor};
            border-style:${es.outlineStyle};
        }
    `;
    
    if(!ellipses || ellipses.length == 0) return null;
	return (
		<div id={id} className={`ellipse-cloud ${className} `}>
            {/*<svg width={canvasDim.w+'px'} height={canvasDim.h+'px'} xmlns="http://www.w3.org/2000/svg">*/}
            {/*    {ellipses.map((p,i)=>{*/}
            {/*        if(!p) return null;*/}
            {/*        var  points = '';*/}
            {/*        for (let j = 0; j < p.coordsX.length; j++) {*/}
            {/*            points += printf('%.2f %.2f ' ,p.coordsX[j],p.coordsY[j])*/}
            {/*        }*/}
            {/*        return <polygon key={i} points={points} />*/}
            {/*    })}*/}
            {/*</svg>*/}
            <style>{styleTag}</style>
			{ellipses.map((p,i)=>{
			    if(!p) return null;
                var s = {
                    left: (100*p.x/canvasDim.w) + '%',
                    top: (100*p.y/canvasDim.h) + '%',
                    width: (200*p.a/canvasDim.w) + '%',
                    height: (200*p.b/canvasDim.h) + '%',
                    transform: 'translate(-50%,-50%) rotate('+((-p.rot))+'rad)'
                }
                const cl = onClick ? ()=>onClick(i) : null;
                return <div onClick={cl} key={i} style={s}/>
            })}
		</div>
	);
}

export default EllipseCloud;