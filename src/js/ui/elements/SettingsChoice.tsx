import React from "react";

interface ISettingsChoiceProps{
	
	/**Additional classnames for this component*/
	className?:string
}
/**
 * Allows to choose current settings stack
 * @author Ilya Shabanov
 */
const SettingsChoice:React.FC<ISettingsChoiceProps> = ({className}) => {
	
	return (
		<div className={`settings-choice`}>
			This is my new SettingsChoice component
		</div>
	);
}
export default SettingsChoice;