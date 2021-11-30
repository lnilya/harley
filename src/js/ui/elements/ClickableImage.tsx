import React from "react";
import {PipelineImage} from "../../types/datatypes";

interface IClickableImageProps{
	
    src:PipelineImage,
    onRelease:(x:number,y:number) => void
	/**Additional classnames for this component*/
	className?:string
}
/**
 * ClickableImage
 * @author Ilya Shabanov
 */
const ClickableImage:React.FC<IClickableImageProps> = ({src,onRelease, className}) => {
    
    const onClicked = (e)=>{
        console.log(`E`);
    }
    
	return (
		<div className={`clickable-image ${className}`} onClick={onClicked}>
			<img src={src.url} alt={'Source Image'}/>
		</div>
	);
}
export default ClickableImage;