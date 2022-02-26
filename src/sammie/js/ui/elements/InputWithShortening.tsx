import React, {useEffect, useRef, useState} from "react";
import {ccl, cl} from "../../util";
import * as ui from '../../state/uistates'
import * as alg from '../../state/algstate'
import {BaseTextFieldProps, Input, InputProps, TextField} from "@mui/material";

interface IInputWithShorteningProps extends InputProps {
    /**Additional classnames for this component*/
    className?: string
    shortenFun: (v) => void
}

interface ITextFieldWithShorteningProps extends BaseTextFieldProps {
    /**Additional classnames for this component*/
    className?: string
    shortenFun: (v) => void
    onChange?
}

interface IProps {
    elProps: any,
    shortenFun: (v) => void,
    type: 'input' | 'textfield'
}

export const InputWithShortening: React.FC<IInputWithShorteningProps> = (p)=>
    <ElWithShortening type='input' shortenFun={p.shortenFun} elProps={p}/>

export const TextFieldWithShortening: React.FC<ITextFieldWithShorteningProps> = (p)=>
    <ElWithShortening type='textfield' shortenFun={p.shortenFun} elProps={p}/>

 /**
 * InputWithShortening is an Material UI input, where the input is only displayed
 * fully once you click into it. otherwise a shortened version is displayed. Useful for
 * displaying folders for examples, where you only want 1 or 2 current folders to be displayed.
 * @author Ilya Shabanov
 */
const ElWithShortening: React.FC<IProps> = (props) => {
    
    const iref = useRef();
    const [hasFocus, setHasFocus] = useState(false);
    useEffect(() => {
        if(props.type == 'input')
            // @ts-ignore
            var ns = iref?.current?.children[0] === document.activeElement;
        else if(props.type == 'textfield')
            // @ts-ignore
            ns = iref?.current?.children[1].children[0] === document.activeElement;
        
        setHasFocus(ns)
    })
    
    const displayedVal = hasFocus ? props.elProps.value : props.shortenFun(props.elProps.value);
    
    const fullProps = {
        ...props.elProps,
        ref: iref,
        value: displayedVal,
        onClick: e => {
            setHasFocus(true);
            if (props.elProps.onClick) props.elProps.onClick(e)
        },
        onBlur:
            (e) => {
                setHasFocus(false);
                if (props.elProps.onBlur) props.elProps.onBlur(e)
            }
    }
     // console.log(`FULLPROPS: `, fullProps);
    if(props.type == "input") return <Input {...fullProps}/>
    else if(props.type == "textfield") return <TextField {...fullProps}/>
}

/**Shortening for folders*/
export function shortenFolders(s) {
    if(!s || s.length <= 0) return s
    const splitChar = s.indexOf('/') == -1 ? '\\' : '/';
    const folders = s.split(splitChar);
    
    if (folders.length > 2)
        return '[...]' + splitChar + folders.slice(-2).join(splitChar)
    
    return s;
}
