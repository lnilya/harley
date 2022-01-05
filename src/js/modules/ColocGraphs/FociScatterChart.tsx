import React, {useState} from "react";
import {ccl} from "../../../sammie/js/util";
import './scss/FociScatterChart.scss'
import {FociScatter} from "./server";
import ScatterChartChoice, {ScatterPlotPoint} from "./ScatterChartChoice";
import titleImg from '../../../assets/images/graph-scatter.svg'
import {CartesianGrid, ScatterChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Scatter} from "recharts";
import {printf} from "fast-printf";

interface IFociScatterChartProps {
    
    /**Additional classnames for this component*/
    className?: string
    
    unit: string
    names: [string, string]
    
    data: { c0: FociScatter[], c1: FociScatter[] }
}

export type GraphData = {
    points:ScatterPlotPoint[],
    xPropName:string,
    xPropUnits:string,
    yPropName:string,
    yPropUnits:string,
}

/**
 * ScatterChart
 * @author Ilya Shabanov
 */
const cl = ccl('scatter-chart--')
const FociScatterChart: React.FC<IFociScatterChartProps> = ({data, className, names, unit}) => {
    
    const [graphData, setGraphData] = useState<GraphData>(null);
    
    //Generate Data
    return (
        <div className={`scatter-chart ${className || ''} pad-200-bottom`}>
            <h3>
                <img src={titleImg} className={'flex-bin-chart__title-img'}/>
                Scatter Plot
            </h3>
            <ScatterChartChoice onDataChanged={setGraphData} className={'pad-100-ver'} unit={unit} names={names}
                                data={data}/>
            {graphData &&
                <>
                <div className={'fl-row-start'}>
                    <div className="yaxis-lbl-container">
                        {graphData.yPropName}
                    </div>
                    <ResponsiveContainer className={'fl-grow scatter-plot-container'} width="100%" height="100%">
                        <ScatterChart height={300}>
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis type="number" dataKey="x" name={graphData.xPropName} unit={graphData.xPropUnits}/>
                            <YAxis type="number" dataKey="y" name={graphData.yPropName}  unit={graphData.yPropUnits}/>
                            <Tooltip content={CustomTooltip}/>
                            <Scatter name="A school" data={graphData.points} fill="#FF7F50"/>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
                <div className="xaxis-lbl">{graphData.xPropName}</div>
                </>
            }
            
            
        </div>
    );
}
export default FociScatterChart;

const CustomTooltip = (props:{ active?:any, payload?:any, label?:any }) => {
  if (props.active && props.payload && props.payload.length) {
    const {x,y} = props.payload[0].payload
    return (
      <div className="custom-tooltip">
        <div><span>{props.payload[0].name}:</span> <strong>{printf('%.2f',x)}</strong> {props.payload[0].unit}</div>
        <div><span>{props.payload[1].name}:</span> <strong>{printf('%.2f',y)}</strong> {props.payload[1].unit}</div>
        {/*<div>{`Mean: ${printf('%.2f',mean)} `}</div>*/}
        {/*<div>{`Std: ${printf('%.2f',std)} `}</div>*/}
      </div>
    );
  }

  return null;
};
