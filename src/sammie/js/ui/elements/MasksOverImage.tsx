import React from "react";
import {cl} from "../../util";
import {useRecoilValue} from "recoil";
import * as ui from "../../state/uistates";

export type MaskOverImageMask = {
    url:string,
    col:'black'|'blue'|'red'|'white'|'original',
    opacity?:number,
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
                return <img key={i} src={m.url} alt={'Mask Image'}
                         className={`mask-img ${m.col} ${m.className}`}
                            style={m.opacity !== undefined ? {opacity:m.opacity} : {}}/>
            }
            )}
        </div>
	);
}
export default MasksOverImage;