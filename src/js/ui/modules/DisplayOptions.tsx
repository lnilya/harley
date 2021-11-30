import React from "react";
import {FormControlLabel, Switch} from "@material-ui/core";

interface IDisplayOptionsProps{
	
	/**Additional classnames for this component*/
	className?:string
    settings:Array<DisplayOptionSetting>,
}
export type DisplayOptionSetting = {
    color?:'primary'|'secondary'|'default',
    label:string,
    setter?:(val:boolean) => void,
    checked:boolean
}
/**
 * DisplayOptions is a board of true/false switches to direct the display of images or anything else.
 * @author Ilya Shabanov
 */
const DisplayOptions:React.FC<IDisplayOptionsProps> = ({className,settings}) => {
	
	return (
		<div className={`display-options fl-row-start pad-25-left pad-50-ver ${className}`}>
			{settings.map((s,i)=>
            <FormControlLabel key={i}
					control={
					  <Switch
						checked={s.checked}
						onChange={(e)=>s.setter(e.target.checked)}
						name={'s'+i}
                        size={'small'}
						color={s.color || "primary"}
					  />
					}
					label={s.label}
				  />
        )}
		</div>
	);
}
export default DisplayOptions;