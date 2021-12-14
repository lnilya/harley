import React, {ReactNode} from "react";
import {FormControlLabel, Switch, Tooltip} from "@mui/material";
import ButtonIcon from "../elements/ButtonIcon";

interface IDisplayOptionsProps {
    
    /**Additional classnames for this component*/
    className?: string
    settings?: Array<DisplayOptionSetting>,
    modKeys?: Array<DisplayOptionModKey>,
    activeModKeys?:string[]
}

export type DisplayOptionModKey = {
    name: string
    desc: ReactNode,
}
export type DisplayOptionSetting = {
    color?: 'primary' | 'secondary' | 'default',
    label: string,
    setter?: (val: boolean) => void,
    checked: boolean
}
/**
 * DisplayOptions is a board of true/false switches to direct the display of images or anything else.
 * @author Ilya Shabanov
 */
const DisplayOptions: React.FC<IDisplayOptionsProps> = ({activeModKeys, modKeys, className, settings}) => {
    
    return (
        <div className={`display-options fl-row-start pad-25-left pad-50-ver ${className}`}>
            {settings?.map((s, i) =>
                <FormControlLabel key={i}
                                  control={
                                      <Switch
                                          checked={s.checked}
                                          onChange={(e) => s.setter(e.target.checked)}
                                          name={'s' + i}
                                          size={'small'}
                                          color={s.color || "primary"}
                                      />
                                  }
                                  label={s.label}
                />
            )}
            {modKeys &&
                <>
                    <div className="fl-grow"/>
                    <div className={'display-options__mods'}>
                        <strong>Mod keys:</strong>
                        {modKeys?.map((mc)=>
                            <Tooltip title={mc.desc} placement={'bottom'} key={mc.name} arrow>
                                <div className={`btnicon ${activeModKeys.indexOf(mc.name) != -1 ? 'active' : ''}`}>{mc.name}</div>
                            </Tooltip>
                        )}
                    </div>
                </>
            }
        </div>
    );
}
export default DisplayOptions;