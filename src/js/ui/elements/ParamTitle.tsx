import React from "react";
import {SeparatorParams} from "../../modules/_shared";
import ParamHelpBtn from "./ParamHelpBtn";
import {IParamUISettingBase} from "../../types/uitypes";

interface IParamTitleProps extends IParamUISettingBase<SeparatorParams>{
    //Required only because of the ParameterInterface
    curVal?:any
}
/**
 * ParamTitle
 * @author Ilya Shabanov
 */
const ParamTitle:React.FC<IParamTitleProps> = ({conf,className}) => {
	
	return (
		<div className={`param-title fl-row-between pad-100-hor pad-50-ver ${className}`}>
            <h4 className="param-title__title">{conf.display.title}</h4>
            <ParamHelpBtn content={conf.display.hint}/>
		</div>
	);
}
export default ParamTitle;