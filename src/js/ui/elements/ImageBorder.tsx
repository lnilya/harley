import React, {useEffect, useState} from "react";
import {PipelineImage} from "../../types/datatypes";
import {cl} from "../../util";

interface IImageBorderProps{
	
    img:PipelineImage
    
    /**Border either uniform, [ver,hor] or [top,right,bottom,left]*/
    border:number|[number,number]|[number,number,number,number]
    
    /**If set will fade the border out after the given amount of ms after last parameter change*/
    hideAfter?:number
	/**Additional classnames for this component*/
	className?:string
}
/**
 * ImageBorder
 * @author Ilya Shabanov
 */
const ImageBorder:React.FC<IImageBorderProps> = ({hideAfter, border,img,className}) => {
	
    var b = []
    if(!Array.isArray(border)) b = [border,border,border,border];
    else if(Array.isArray(border) && border.length == 2) b = [border[0],border[1],border[0],border[1]];
    else b = border;
    
    const [faded,setFaded] = useState(false);
    const [to,setTo] = useState(null);
    
    useEffect(()=>{
        if(!hideAfter) return
        clearTimeout(to);
        setFaded(false)
        const t = setTimeout(()=>{
            setFaded(true)
        },hideAfter);
        setTo(t)
    },[border])
    
    const s = {
        top: 100 * b[0]/img.h + '%',
        right: 100 * b[1]/img.w + '%',
        bottom: 100 * b[2]/img.h + '%',
        left: 100 * b[3]/img.w + '%'
    }
	return (
		<div style={s} className={`image-border ` + className + cl(faded,'is-faded')} />
	);
}
export default ImageBorder;