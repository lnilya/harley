import React, {ReactNode} from "react";
import {FormControl, FormControlLabel, NativeSelect, Slider, Switch, Tooltip} from "@mui/material";
import ButtonIcon from "../elements/ButtonIcon";
import {cl} from "../../util";

interface IDisplayOptionsProps {
    
    /**Additional classnames for this component*/
    className?: string
    settings?: Array<DisplayOptionSetting<any>>,
    modKeys?: Array<DisplayOptionModKey>,
    /**Either an array corresponding to "name" field of modKeys array, or a record coming from useToggleKeys hook*/
    activeModKeys?:string[]|Record<string, boolean>
    children?:any,
    col?:'black'|null
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
    /**For sliders only, min,max,step*/
    sliderParams?:[number,number,number]
}
/**
 * DisplayOptions is a board of true/false switches to direct the display of images or anything else.
 * @author Ilya Shabanov
 */
const DisplayOptions: React.FC<IDisplayOptionsProps> = ({col,children,activeModKeys, modKeys, className, settings}) => {
    
    if(activeModKeys && !Array.isArray(activeModKeys)){
        activeModKeys = Object.keys(activeModKeys).filter(k=>activeModKeys[k])
    }
    
    return (
        <div className={`display-options fl-row-start pad-25-left pad-50-ver ${className} col-${col||'default'}`}>
            {settings?.map((s, i) => {
                    if(!s.type || s.type == 'binary'){
                        return <div className="display-options__binary" key={i}>
                            <span>{s.label}</span>
                            <FormControlLabel key={i}
                                              label={''}
                                              control={
                                                  <Switch checked={s.value}
                                                      onChange={(e) => s.setter(e.target.checked)}
                                                      name={'s' + i} size={'small'} color={s.color || "primary"} />
                                              }/>
                        </div>
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
                    }else if(s.type == 'slider'){
                        return <div key={i} className={'display-options__slider'}>
                            <span>{s.label}</span>
                            <Slider valueLabelDisplay={'auto'} size={'small'} value={s.value} min={s.sliderParams[0]} max={s.sliderParams[1]} step={s.sliderParams[2]} onChange={(e, v) =>  s.setter(v as number)}/>
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
                            //@ts-ignore
                            const isActive = activeModKeys.indexOf(mc.name) != -1;
                                return (<Tooltip title={mc.desc} placement={'bottom'} key={mc.name} arrow>
                                    <div
                                        className={`btnicon ${cl(isActive,'active')}`}>{mc.name}</div>
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

