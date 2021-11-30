import React from "react";
import {PipelineImage} from "../../types/datatypes";
import {ccl} from "../../util";

export type PointStyle = Partial<{
    /**[red] CSS value for fill*/
    fillcolor: string,
    /**[-] CSS value for color*/
    outlinecolor: string,
    /**[1] Width in px of outline*/
    outlinewidth:number,
    /**[false] Wether or not to add a border*/
    outline:boolean,
    /**[true] Wether or not to fill, will not work for all markers.*/
    fill:boolean,
    /**[false] Adding a shadow*/
    shadow:boolean,
    /**[circle] Type of marker*/
    marker:'circle'|'square'|'diamond'|'cross',
    /**[4]Size in pixels of markers*/
    size:number
}>
const defaultPointStyle:PointStyle = {
    fillcolor:'red',
    outline:false,
    fill:true,
    shadow:false,
    marker:'circle',
    size: 4
}
interface IPointCloudProps{
	
	/**Additional classnames for this component*/
	className?:string
    /**x,y coordinates of points*/
    points:Array<[number,number]>,
    
    /**Optional array of strings that will be placed next to the points*/
    annotations?:Array<string>
    
    /**A dimension of the canvas, since points are transformed to % coordinates of this */
    canvasDim:{w:number,h:number}|PipelineImage,
    
    /**An optional style object for definint how points look*/
    pointStyle?:PointStyle,
    
    /**A unique ID is required for the styles to work*/
    id:string,
}
const pcl = ccl('point-cloud--');
/**
 * PointCloud
 * @author Ilya Shabanov
 */
const PointCloud:React.FC<IPointCloudProps> = ({id,pointStyle, canvasDim, points, className}) => {
	
    var ps:PointStyle = {...defaultPointStyle,...pointStyle||{}}
    
    //Make styling classes
    className = className || '';
    className += pcl(ps.fill,'filled') + pcl(ps.shadow,'shadow')
    + pcl(ps.outline, 'outlined') + 'point-cloud--'+ps.marker;
    
    var styleTag = `
        #${id} > div{
            border-width:${ps.outlinewidth}px;
            background-color:${ps.fillcolor};
            border-color:${ps.outlinecolor};
            width:${ps.size}px;
            height:${ps.size}px;
        }
        #${id} > div:before,#${id} > div:after{
            height:${ps.outlinewidth}px;
            background-color:${ps.fillcolor};
        }
    `;
    
    if(!points || points.length == 0) return null;
	return (
		<div id={id} className={`point-cloud ${className}`}>
            <style>{styleTag}</style>
            {points.map((p,i)=>{
                var s = {
                    left: (100*p[0]/canvasDim.w) + '%',
                    top: (100*p[1]/canvasDim.h) + '%',
                }
                return <div key={i} style={s}/>
            })}
		</div>
	);
}
export default PointCloud;