import React, {useMemo, useState} from "react";
import {ccl} from "../../../sammie/js/util";
import './scss/RegressionChoice.scss'
import {GraphData} from "./FociScatterChart";
import regression from 'regression'
import {FormControl, Input, NativeSelect, Tooltip} from "@mui/material";

export type RegressionResult = {
    predict:(n:number)=>number,
    r2:number
    string:string
    equation:number[]
    points:[number,number][]
    curve:{x:number,y?:number}[]
}
interface IRegressionChoiceProps{
	
	/**Additional classnames for this component*/
	className?:string
    graphData:GraphData,
    onSetRegression:(res:RegressionResult)=>void
}
/**
 * RegressionChoice
 * @author Ilya Shabanov
 */
const cl = ccl('regression-choice--')
const RegressionChoice:React.FC<IRegressionChoiceProps> = ({graphData,onSetRegression, className}) => {
	
    const [funType,setFunType] = useState('linear');
    const [polyOrder,setPolyOrder] = useState(2);
    
    const regResult:RegressionResult = useMemo(()=>{
        if(!graphData || funType == 'disable'){
            onSetRegression(null)
            return null;
        }
        const regPoints = graphData.points.map((pnt)=>[pnt.x,pnt.y])
        //do Regression
        var options = {precision:5};
        if(funType == 'polynomial') options['order'] = polyOrder;
        const regResult:RegressionResult = regression[funType](regPoints,options);
        
        //create an x,y array for plotting via recharts
        const minX = Math.min(...graphData.points.map((e)=>e.x));
        const maxX = Math.max(...graphData.points.map((e)=>e.x));
        const minY = Math.min(...graphData.points.map((e)=>e.y));
        const maxY = Math.max(...graphData.points.map((e)=>e.y));
        const rng = maxX - minX;
        const rngY = maxY - minY;
        
        regResult.curve = []
        for (let i = (minX - (rng*.1)); i <= (maxX + (rng*.1)) ; i += (maxX - minX)/30) {
            var y = regResult.predict(i)[1];
            //exclude points that are too far out of the range, to not skew the graph unnecessarily
            if(y < (minY - rngY*.5) || y > (maxY + rngY*.5)) regResult.curve.push({x:i})
            else regResult.curve.push({x:i, y:y})
        }
        
        onSetRegression(regResult)
        
        return regResult;
    },[graphData,funType,polyOrder])
    
    
    if(!graphData) return null;
    const rr = <>
        A regression function to use. A fit is not always possible, in that case you will not see a curve and a NaN is displayed as R² value.
        <ul>
            <li>
                <strong className={'pad-25-right'}>Linear:</strong>
                <em>y = a*x + b</em>
            </li>
            <li>
                <strong className={'pad-25-right'}>Exponential:</strong>
                <em>y = a * exp(bx)</em>
            </li>
            <li>
                <strong className={'pad-25-right'}>Polynomial: </strong>
                <em>y = a*x^p + b*x^(p-1) ... </em> with p being the order of the polynomial
            </li>
            <li>
                <strong className={'pad-25-right'}>Logarithmic:</strong>
                <em>y = a + b*ln(x)</em>
            </li>
            <li>
                <strong className={'pad-25-right'}>Power:</strong>
                <em>y = a * x^b</em>
            </li>
        </ul>
    </>
	return (
		<div className={`regression-choice ${className || ''} bg-bglight pad-50 pad-100-hor`}>
            <div className="row">
                <Tooltip title={rr} arrow>
                    <span className={'text-tooltip'}>Fit:</span>
                </Tooltip>
                <FormControl variant="standard">
                    <NativeSelect value={funType} placeholder={'Please select...'} onChange={e => {
                        setFunType(e.target.value)
                    }}>
                        <option key={'lin'} value={'linear'}>Linear</option>
                        <option key={'exp'} value={'exponential'}>Exponential</option>
                        <option key={'poly'} value={'polynomial'}>Polynomial</option>
                        <option key={'log'} value={'logarithmic'}>Logarithmic</option>
                        <option key={'power'} value={'power'}>Power</option>
                        <option key={'disable'} value={'disable'}>Disable</option>
                    </NativeSelect>
                </FormControl>
            </div>
            {funType == 'polynomial' &&
                <div className="row">
                    <Tooltip title={'The order of the polynomial curve you want to use. The order is the highest power of x used in the equation. Therefore order of 1 is a straight line, 2 is a parabola and so on.'} arrow >
                        <span className={'text-tooltip'}>Order:</span>
                    </Tooltip>
                    <Input type="number" value={polyOrder} onChange={e=>setPolyOrder(parseInt((e.target.value)))}/>
                </div>
            }
            <div className="row">
                <Tooltip title={'The coefficient of determination for the fit. A value of 1 indicates a perfect fit of the regression function to the data. Value can be negative if the fit is an anti-fit.'} arrow >
                    <span className={'text-tooltip'}>R²:</span>
                </Tooltip>
                    <strong>{!regResult ? <em>disabled</em> : regResult?.r2}</strong>
            </div>
		</div>
	);
}
export default RegressionChoice;