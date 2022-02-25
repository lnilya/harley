import React, {useState} from "react";
import {ccl} from "../../../sammie/js/util";
import './scss/FociScatterChart.scss'
import * as server from "./server";
import {FociScatter} from "./server";
import ScatterChartChoice, {ScatterPlotPoint} from "./ScatterChartChoice";
import titleImg from '../../../assets/images/graph-scatter.svg'
import {CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis} from "recharts";
import {printf} from "fast-printf";
import {ColocCellsResult} from "../ColocCells/server";
import PolygonCloud from "../../../sammie/js/ui/elements/PolygonCloud";
import {OutlinePolygon} from "../FociCandidates/FociCandidates";
import styled from "@emotion/styled";
import * as ui from '../../../sammie/js/state/uistates'
import {UIScreens} from '../../../sammie/js/state/uistates'
import RegressionChoice, {RegressionResult} from "./RegressionChoice";
import {Button, Dialog} from "@mui/material";
import {Step} from "./params";
import {useRecoilState} from "recoil";

interface IFociScatterChartProps {
    
    /**Additional classnames for this component*/
    className?: string
    
    unit: string
    names: [string, string]
    
    data: { c0: FociScatter[], c1: FociScatter[] }
    
    cellImageData: ColocCellsResult
    
    curStep:Step
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
const FociScatterChart: React.FC<IFociScatterChartProps> = ({curStep,cellImageData, data, className, names, unit}) => {
    
    const [graphData, setGraphData] = useState<GraphData>(null);
    const [regResult, setRegresult] = useState<RegressionResult>(null);
    const [exportDownloadLink, setExportDownloadLink] = useState<string>(null);
    const [screen,setScreen] = useRecoilState(ui.appScreen)
    const runExport = async () => {
        const res = await server.runExportScatter(curStep,graphData,regResult);
        if(res.error) alert('Something went wrong: ' + res.error)
        else setExportDownloadLink(res.data)
    };
    const noData = graphData?.points?.length === 0;
    
    //Generate Data
    return (
        <div className={`scatter-chart ${className || ''} pad-200-bottom`}>
            <Dialog open={!!exportDownloadLink} onClose={(e)=>setExportDownloadLink(null)}>
                <div className="pad-200 fl-col text-center">
                    <strong>
                        XLSX File is ready and will only contain scatter plot data that you currently see on the screen.
                    </strong>
                    <br/>
                    <div className={'scatter-chart__dialog-help'}>
                        If you need the raw data that was used to generate this plot, go to the <span className="scatter-chart__dialog-link" onClick={e=>setScreen(UIScreens.output)}>output screen of this pipeline </span> and
                        export the graph data as either XLSX or JSON. Specifically the JSON file contains some explanation
                        about the structure and meaning of the data, that you can use for your post-processing.
                    </div>
                    <br/>
                    <a href={exportDownloadLink} target={'_blank'} rel="noreferrer" className={'margin-100-top no-underline'}>
                        <Button variant={'contained'}>Download Current Data</Button>
                    </a>
                </div>
            </Dialog>
            <h3>
                <img src={titleImg} className={'flex-bin-chart__title-img'}/>
                Scatter Plot
                <div className="fl-grow"/>
                <Button variant={'outlined'} onClick={runExport} disabled={graphData && noData}>Export Current Data</Button>
            </h3>
            <div className="fl-row-between pad-100-ver fl-align-center">
                <ScatterChartChoice onDataChanged={setGraphData} className={''} unit={unit} names={names}
                                    data={data}/>
                {graphData && !noData &&
                    <RegressionChoice onSetRegression={setRegresult} graphData={graphData}/>
                }
            </div>
            {graphData && noData &&
                <div className="scatter-chart__nodata pad-200">
                    <div>N/A</div>
                    No data
                </div>
            }
            {graphData && !noData &&
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
                            <Tooltip content={CustomTooltipWithData(cellImageData)} />
                            <Scatter name="Scatter" data={graphData.points} fill="#FF7F50"/>
                            {regResult &&
                                <Scatter  dataKey={'y'} line shape={(x)=>null}
                                  name={'Regression'} data={regResult.curve} fill={'#0000ff'} strokeWidth={2}/>
                            }
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
    fill: 'none',
    stroke: '#b132cd',
    strokeWidth: 2,
})
const NeighbourPolygon = styled.polygon({
    fill: 'none',
    stroke: '#66cd32',
    strokeWidth: 1,
    strokeDasharray: '3 3'
})
const CustomTooltipWithData = (cellImgData: ColocCellsResult) => {
    return (props) => CustomTooltip({...props, cellImgData: cellImgData})
}

function fociEq(fcx: FociScatter, fcy: FociScatter | FociScatter[]) {
    if (Array.isArray(fcy)) return false;
    return fcx.area == fcy.area && fcx.focusNum == fcy.focusNum && fcx.cellNum == fcy.cellNum;
}

const CustomTooltip = (props: { active?: any, payload?: any, label?: any, cellImgData: ColocCellsResult }) => {
    
    if (props.active && props.payload && props.payload.length) {
        const {x, y, fcx, fcy} = props.payload[0]?.payload
        if(!props.payload[1]?.name || !fcx ) return null;
        const cellIdx = props.cellImgData.selected[(fcx as FociScatter).cellNum];
        const cellImg = props.cellImgData.imgs[cellIdx]
        const foci0 = props.cellImgData.foci[0][cellIdx]
        const foci1 = props.cellImgData.foci[1][cellIdx]
        const cellOutline = props.cellImgData.cnts[cellIdx]
        
        var showFoci = {primary: [props.cellImgData.foci[0][cellIdx][(fcx as FociScatter).focusNum]], sec: []}
        if (!fociEq(fcx, fcy)) {
            var fociY: FociScatter[] = !Array.isArray(fcy) ? [fcy] : fcy;
            showFoci.sec = fociY.map((f) => props.cellImgData.foci[1][cellIdx][f.focusNum])
        }
        
        return (
            <div className="custom-tooltip">
                <div className={'pad-100-right data'}>
                    <div className={'val-primary'}>
                        <div className={'title'}>{props.payload[0].name}:</div>
                        <strong>{printf('%.2f', x)}</strong> {props.payload[0].unit}
                    </div>
                    <div className={'margin-100-top ' + (!fociEq(fcx, fcy) ? 'val-secondary' : 'val-primary')}>
                        <div className={'title'}>{props.payload[1].name}:</div>
                        <strong>{printf('%.2f', y)}</strong> {props.payload[1].unit}
                    </div>
                </div>
                <div className="rel cell-preview">
                    <img src={cellImg[3].url}/>
                    {showFoci.primary &&
                    <PolygonCloud className={'primary-cloud'} polygons={showFoci.primary} canvasDim={cellImg[3]}
                                  PolyComp={MagentaPolygon}/>
                    }
                    {showFoci.sec &&
                    <PolygonCloud className={'primary-cloud'} polygons={showFoci.sec} canvasDim={cellImg[3]}
                                  PolyComp={NeighbourPolygon}/>
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
