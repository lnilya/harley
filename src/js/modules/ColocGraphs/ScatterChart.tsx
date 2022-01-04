import React, {useState} from "react";
import {ccl} from "../../../sammie/js/util";
import './scss/ScatterChart.scss'
import {FormControl, NativeSelect} from "@mui/material";
import {UIScreens} from "../../../sammie/js/state/uistates";
import {FociScatter} from "./server";

interface IScatterChartProps {
    
    /**Additional classnames for this component*/
    className?: string
    
    unit:string
    names:[string,string]
    
    data:{c0:FociScatter[],c1:FociScatter[]}
}

/**Properties description*/
const basicProps = {
    size:(unit:string)=>`Focus area in ${unit}²`,
    overlappedAreaPerc:(unit:string, oppFoci:string)=>`Area overlapped by ${oppFoci}`,
    distanceToNN:(unit:string,oppFoci:string)=>`Contour Distance to Nearest ${oppFoci} in ${unit}`,
    centroidDistanceToNN:(unit:string,oppFoci:string)=>`Centroid Distance to Nearest ${oppFoci} in ${unit}`,
    // cellArea:(unit:string)=>`Enclosing Cell's area in ${unit}²`,
    numOverlapPartners:(unit:string,oppFoci:string)=>'Number overlapping ' + oppFoci,
}
function getBasicProps(unit:string,oppFoci:string){
    var ret = {}
    const base = Object.keys(basicProps).map((k)=>{
        ret[k] = basicProps[k](unit,oppFoci)
    })
    return ret;
}

/**
 * ScatterChart
 * @author Ilya Shabanov
 */
const cl = ccl('scatter-chart--')
const ScatterChart: React.FC<IScatterChartProps> = ({className, names,unit}) => {
    
    const [xFociType,setXFociType] = useState(-1);
    const [xFociProp,setXFociProp] = useState(null);
    const [yFociProp,setYFociProp] = useState(null);
    const [yFociType,setYFociType] = useState(0);
    const [yMultiHandling,setYMultiHandling] = useState('avg');
    
    const xChoices = {0:names[0],
                      1:names[1]}
    
    const yChoices = {0:`these foci`,
                      1:`their nearest neighbours (${names[(xFociType+1)%2]})`,
                      2:`their overlap partners (${names[(xFociType+1)%2]})`}
    
    const multiChoices = {
        avg:`Average Value`,
        min:`Min Value`,
        max:`Max Value`,
        sep:`Separate Datapoints`
    }
    
    const onChangeXFoci = (xft) => setXFociType(parseInt(xft));
    const onChangeYFoci = (yft) => setYFociType(parseInt(yft));
    const onChangeXFociProp = (xfp) => setXFociProp(xfp);
    const onChangeYFociProp = (yfp) => setYFociProp(yfp);
    
    const baseX = getBasicProps(unit,names[(xFociType+1)%2])
    const baseY = getBasicProps(unit,names[xFociType])
    
    //Generate Data
    
    return (
        <div className={`scatter-chart ${className || ''}`}>
            <div className="axis-input">
                <span>X-Axis</span>
                For each focus of
                <ScatterChartChoice choices={xChoices} val={xFociType} onChange={onChangeXFoci}/>
                display
                <ScatterChartChoice choices={baseX} val={xFociProp} onChange={onChangeXFociProp}/>.
            </div>
            <div className="axis-input">
                <span>Y-Axis</span>
                For each of<ScatterChartChoice choices={yChoices} val={yFociType} onChange={onChangeYFoci}/>
                display
                <ScatterChartChoice choices={baseY} val={yFociProp} onChange={onChangeYFociProp}/>
                {yFociType == 2 &&
                    <>
                    <br/>
                    For multiple entries use
                    <ScatterChartChoice choices={multiChoices} val={yMultiHandling} onChange={setYMultiHandling}/>.
                    </>
                }
            </div>
        </div>
    );
}
export default ScatterChart;


interface IScatterChartChoice{
    choices: Record<string, string>,
    val: any,
    onChange: (string) => void
}

const ScatterChartChoice: React.FC<IScatterChartChoice> = ({choices,val,onChange})=>{
    return (
        <div className="scatter-chart__choice">
            <FormControl variant="standard">
                <NativeSelect value={val} onChange={e => {
                    onChange(e.target.value)
                }}>
                    {Object.keys(choices).map((k) =>
                        <option key={k} value={k}>{choices[k]}</option>
                    )}
                </NativeSelect>
            </FormControl>
        </div>
    );
}