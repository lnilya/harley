import React, {ReactNode} from "react";
import {FormControl, FormControlLabel, NativeSelect, Switch, Tooltip} from "@mui/material";
import ButtonIcon from "../elements/ButtonIcon";

interface IDisplayOptionsProps {
    
    /**Additional classnames for this component*/
    className?: string
    settings?: Array<DisplayOptionSetting<any>>,
    modKeys?: Array<DisplayOptionModKey>,
    activeModKeys?:string[]
    children?:any,
}

export type DisplayOptionModKey = {
    name: string
    desc: ReactNode,
}
export type DisplayOptionSetting<T> = {
    type?:'binary'|'dropdown'|'slider',
    color?: 'primary' | 'secondary' | 'default',
    label: string,
    setter?: (val: T) => void,
    value: T,
    /**For dropdown type only, options to display*/
    options?:Record<string, string>
}
/**
 * DisplayOptions is a board of true/false switches to direct the display of images or anything else.
 * @author Ilya Shabanov
 */
const DisplayOptions: React.FC<IDisplayOptionsProps> = ({children,activeModKeys, modKeys, className, settings}) => {
    
    return (
        <div className={`display-options fl-row-start pad-25-left pad-50-ver ${className}`}>
            {settings?.map((s, i) => {
                    if(!s.type || s.type == 'binary'){
                        return <FormControlLabel key={i}
                                          control={
                                              <Switch checked={s.value}
                                                  onChange={(e) => s.setter(e.target.checked)}
                                                  name={'s' + i} size={'small'} color={s.color || "primary"} />
                                          } label={s.label} />
                    }else if(s.type == 'dropdown'){
                        return <div key={i} className={'display-options__dropdown'}>
                            <span>{s.label}</span>
                            <FormControl variant="outlined">
                                    <NativeSelect value={s.value} onChange={e=>s.setter(e.target.value)} size={'small'}>
                                        {Object.keys(s.options).map((k)=>
                                            <option key={k} value={k}>{s.options[k]}</option>
                                        )}
                                    </NativeSelect>
                                </FormControl>
                        </div>
                    }
                }
            )}
            {children}
            {modKeys &&
                <>
                    <div className="fl-grow"/>
                    <div className={'display-options__mods'}>
                        <strong>Mod keys:</strong>
                        {modKeys?.map((mc)=> {
                            if(!mc) return null;
                                return (<Tooltip title={mc.desc} placement={'bottom'} key={mc.name} arrow>
                                    <div
                                        className={`btnicon ${activeModKeys.indexOf(mc.name) != -1 ? 'active' : ''}`}>{mc.name}</div>
                                </Tooltip>)
                            }
                        )}
                    </div>
                </>
            }
        </div>
    );
}
export default DisplayOptions;