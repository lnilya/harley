import React, {useState} from "react";
import {ccl} from "../../../sammie/js/util";
import './scss/FociScatterChart.scss'
import {FociScatter} from "./server";
import ScatterChartChoice, {ScatterPlotPoint} from "./ScatterChartChoice";
import titleImg from '../../../assets/images/graph-scatter.svg'
import {CartesianGrid, ScatterChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Scatter} from "recharts";
import {printf} from "fast-printf";
import {ColocCellsResult} from "../ColocCells/server";
import PolygonCloud from "../../../sammie/js/ui/elements/PolygonCloud";
import {OutlinePolygon} from "../FociCandidates/FociCandidates";
import styled from "@emotion/styled";

interface IFociScatterChartProps {
    
    /**Additional classnames for this component*/
    className?: string
    
    unit: string
    names: [string, string]
    
    data: { c0: FociScatter[], c1: FociScatter[] }
    
    cellImageData: ColocCellsResult
}

export type GraphData = {
    points: ScatterPlotPoint[],
    xPropName: string,
    xPropUnits: string,
    yPropName: string,
    yPropUnits: string,
}

/**
 * ScatterChart
 * @author Ilya Shabanov
 */
const cl = ccl('scatter-chart--')
const FociScatterChart: React.FC<IFociScatterChartProps> = ({cellImageData, data, className, names, unit}) => {
    
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
                            <YAxis type="number" dataKey="y" name={graphData.yPropName} unit={graphData.yPropUnits}/>
                            <Tooltip content={CustomTooltipWithData(cellImageData)}/>
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

const MagentaPolygon = styled.polygon({
    fill:'none',
    stroke:'#b132cd',
    strokeWidth:2,
})
const NeighbourPolygon = styled.polygon({
    fill:'none',
    stroke:'#66cd32',
    strokeWidth:1,
    strokeDasharray: '3 3'
})
const CustomTooltipWithData = (cellImgData: ColocCellsResult) => {
    return (props) => CustomTooltip({...props, cellImgData: cellImgData})
}
function fociEq(fcx:FociScatter, fcy:FociScatter|FociScatter[]){
    if(Array.isArray(fcy)) return false;
    return fcx.area == fcy.area && fcx.focusNum == fcy.focusNum && fcx.cellNum == fcy.cellNum;
}
const CustomTooltip = (props: { active?: any, payload?: any, label?: any, cellImgData: ColocCellsResult }) => {
    if (props.active && props.payload && props.payload.length) {
        const {x, y, fcx, fcy} = props.payload[0].payload
        const cellIdx = props.cellImgData.selected[(fcx as FociScatter).cellNum];
        const cellImg = props.cellImgData.imgs[cellIdx]
        const foci0 = props.cellImgData.foci[0][cellIdx]
        const foci1 = props.cellImgData.foci[1][cellIdx]
        const cellOutline = props.cellImgData.cnts[cellIdx]
        
        var showFoci = {primary:[props.cellImgData.foci[0][cellIdx][(fcx as FociScatter).focusNum]],sec:[]}
        if(!fociEq(fcx,fcy)){
            var fociY:FociScatter[] = !Array.isArray(fcy) ? [fcy] : fcy;
            showFoci.sec = fociY.map((f)=>props.cellImgData.foci[1][cellIdx][f.focusNum])
        }
        
        return (
            <div className="custom-tooltip">
                <div className={'pad-100-right data'}>
                    <div className={'val-primary'}>
                        <div className={'title'}>{props.payload[0].name}:</div> <strong>{printf('%.2f', x)}</strong> {props.payload[0].unit}
                    </div>
                    <div className={'margin-100-top ' + (!fociEq(fcx,fcy) ? 'val-secondary' : 'val-primary') }>
                        <div className={'title'}>{props.payload[1].name}:</div> <strong>{printf('%.2f', y)}</strong> {props.payload[1].unit}
                    </div>
                </div>
                <div className="rel cell-preview">
                    <img src={cellImg[3].url} />
                    {showFoci.primary &&
                        <PolygonCloud className={'primary-cloud'} polygons={showFoci.primary} canvasDim={cellImg[3]} PolyComp={MagentaPolygon}/>
                    }
                    {showFoci.sec &&
                        <PolygonCloud className={'primary-cloud'} polygons={showFoci.sec} canvasDim={cellImg[3]} PolyComp={NeighbourPolygon}/>
                    }
                    <PolygonCloud polygons={[cellOutline]} canvasDim={cellImg[3]} PolyComp={OutlinePolygon}/>
                    <div className="cell-num">#{cellIdx}</div>
                    {/*<PolygonCloud polygons={foci1} canvasDim={cellImg[3]}/>*/}
                </div>
                {/*<div>{`Mean: ${printf('%.2f',mean)} `}</div>*/}
                {/*<div>{`Std: ${printf('%.2f',std)} `}</div>*/}
            </div>
        );
    }
    
    return null;
};
