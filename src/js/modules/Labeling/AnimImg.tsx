import React, {useEffect, useState} from "react";

interface IAnimImgProps{
	
	/**Additional classnames for this component*/
	className?:string
    imgSrc:string[],
    speed:number
}
/**
 * AnimImg
 * @author Ilya Shabanov
 */
const AnimImg:React.FC<IAnimImgProps> = ({speed, imgSrc, className}) => {
	
    const [curFrame,setCurFrame] = useState(0);
    useEffect(()=>{
        const si = setInterval(()=>{
            setCurFrame((curFrame+1) % imgSrc.length)
        },speed)
        
        return ()=>clearInterval(si)
    })
    
	return <img src={imgSrc[curFrame]} alt=""/>;
}
export default AnimImg;