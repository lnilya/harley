import React from "react";
import {cl} from "../../util";
import {useRecoilValue} from "recoil";
import * as ui from "../../state/uistates";

export type MaskOverImageMask = {
    /**The url for the mask image to display*/
    url:string,
    /**Filters to apply to mask. Works only for binary masks*/
    col:'black'|'blue'|'red'|'white'|'original',
    /**Opacity of mask*/
    opacity?:number,
    /**Shift the mask by an amount of pixels*/
    shift?:[number,number]|number[],
    /**Additional class names of the mask image*/
    className?:string
}
interface IMasksOverImageProps{
	
	/**Additional classnames for this component*/
	className?:string
    originalURL:string,
    showOriginal:boolean,
    masks:Array<MaskOverImageMask|null|false>
}
/**
 * MasksOverImage
 * @author Ilya Shabanov
 */
const MasksOverImage:React.FC<IMasksOverImageProps> = ({ className,originalURL,showOriginal,masks}) => {
    const overlay = useRecoilValue(ui.overlay);
    const algRunning = !!overlay;
	return (
		<div className={`masks-over-image ${className} ` + cl(algRunning,'alg-running')}>
			<img key={'original'} src={originalURL} alt={'Source Image'}
                     className={'original-img' + cl(!showOriginal, 'disabled')}/>
    
            {masks.map((m,i)=>{
                if(m === null || m === false) return;
                
                var maskStyle = {opacity:1,transform:'none'};
                if(m.opacity !== undefined) maskStyle.opacity = m.opacity;
                if(m.shift !== undefined) maskStyle.transform = `translate(${m.shift[0]}px,${m.shift[1]}px)`;
                
                return <img key={i} src={m.url} alt={'Mask Image'}
                         className={`mask-img ${m.col} ${m.className}`}
                            style={maskStyle}/>
            }
            )}
        </div>
	);
}
export default MasksOverImage;