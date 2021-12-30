import React, {ReactNode, useState} from "react";
import {ccl} from "../../../sammie/js/util";
import './scss/FlexBinChart.scss'
import {Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, XAxisProps, YAxis} from "recharts";
import {FormControl, NativeSelect, Slider} from "@mui/material";
import {hist} from "../../util/math";
import ParamHelpBtn from "../../../sammie/js/ui/elements/ParamHelpBtn";
import {printf} from "fast-printf";

interface IFlexBinChartProps {
    
    /**Additional classnames for this component*/
    className?: string,
    /**Creates a Dropdown for different data, keys are used as dropdown labels*/
    data: Record<string, number[]>
    /**Main title for the graph*/
    title: string,
    /**Explanation texts either one for all data, or by data*/
    explanation: ReactNode | Record<string, ReactNode>,
    format?: Record<string, XAxisProps>
    
    titleImg?:any
    
    colFromEntry?: (x:number,y:number)=>string
}

/**
 * FlexBinChart
 * @author Ilya Shabanov
 */
const cl = ccl('flex-bin-chart--')
const FlexBinChart: React.FC<IFlexBinChartProps> = ({colFromEntry, titleImg,format, data, title, explanation, className}) => {
    
    const [dataKey, setDatakey] = useState<string>(Object.keys(data)[0]);
    const [numBins, setNumBins] = useState<number>(10);
    const curFormat = format ? (format[dataKey] || {}) : {}
    const bins = hist(data[dataKey], numBins, curFormat)
    const curEx = typeof explanation === 'string' ? explanation : explanation[dataKey];
    return (
        
        <div className={`flex-bin-chart ${className || ''}`}>
            <h3>
                <img src={titleImg} className={'flex-bin-chart__title-img'}/>
                {title}
            </h3>
            <div className="fl-row fl-align-center flex-bin-chart__title pad-100-ver">
                <div className="lbl">View:</div>
                <FormControl variant="outlined">
                    <NativeSelect size={'small'} value={dataKey} onChange={e => setDatakey(e.target.value)}>
                        {Object.keys(data).map((k) =>{
                            return <option key={k} value={k}>{k}</option>
                        }
                        )}
                    </NativeSelect>
                </FormControl>
                {curEx &&
                    <ParamHelpBtn className={'margin-100-left'} content={curEx}/>
                }
                <div className="fl-grow"/>
                <div className="lbl">Bins:</div>
                <Slider valueLabelDisplay={'auto'} size={'small'} value={numBins} min={3} max={40} step={1}
                        onChange={(e, v) => setNumBins(v as number)}/>
            </div>
            <ResponsiveContainer width="100%" height='100%'>
                <BarChart height={200} data={bins} margin={{left: -25}}>
                    <CartesianGrid strokeDasharray="3 3"/>
                    <Tooltip content={CustomTooltip}/>
                    <Bar dataKey="count">
                          {bins.map((entry, index) => {
                              const col = colFromEntry ? colFromEntry(entry.xmean,entry.count) : '#FF7F50';
                              return <Cell key={`cell-${index}`} fill={col}/>
                          })}
                    </Bar>
                    <XAxis {...{dataKey:'xmean',...curFormat}}/>
                    <YAxis dataKey='count'/>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
export default FlexBinChart;

const CustomTooltip = (props:{ active?:any, payload?:any, label?:any }) => {
  if (props.active && props.payload && props.payload.length) {
    const {xmean, xinterval,count} = props.payload[0].payload
    return (
      <div className="custom-tooltip">
        <div>Elements in Bin: {count}</div>
        <div>Range: {xinterval}</div>
        {/*<div>{`Mean: ${printf('%.2f',mean)} `}</div>*/}
        {/*<div>{`Std: ${printf('%.2f',std)} `}</div>*/}
      </div>
    );
  }

  return null;
};
