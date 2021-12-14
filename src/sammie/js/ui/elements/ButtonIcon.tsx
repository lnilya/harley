import React from "react";

interface IButtonIconProps{
	
	/**Additional classnames for this component*/
	className?:string
    
    btnText:string
    icon?:any
}
/**
 * ButtonIcon
 * @author Ilya Shabanov
 */
const ButtonIcon:React.FC<IButtonIconProps> = ({icon,btnText, className}) => {
	
	return (
		<div className={`button-icon ${className || ''}`}>
            <div className="fl-row">
                {icon &&
                    <img src={icon} alt=""/>
                }
                <span>
                    {btnText}
                </span>
            </div>
		</div>
	);
}
export default ButtonIcon;