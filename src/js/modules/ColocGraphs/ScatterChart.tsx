import React, {useState} from "react";
import {ccl} from "../../../sammie/js/util";
import './scss/ScatterChart.scss'
import {FormControl, NativeSelect} from "@mui/material";
import {UIScreens} from "../../../sammie/js/state/uistates";

interface IScatterChartProps {
    
    /**Additional classnames for this component*/
    className?: string
    
    names:[string,string]
}

/**Properties description*/
const basicProps = {
    size:(unit:string)=><>Cell size in {unit}<sup>2</sup></>,
    overlappedAreaPerc:(unit:string, oppFoci:string)=>`Area overlapped by ${oppFoci}`,
    distanceToNN:(unit:string)=>`Contour Distance to Nearest Neighbour in ${unit}`,
    centroidDistanceToNN:(unit:string)=>`Centroid distance to Nearest Neighbour in ${unit}`,
    cellArea:(unit:string)=><>Cell's area in {unit}<sup>2</sup></>,
    numOverlapPartners:(unit:string,oppFoci:string)=>'Number overlapping ' + oppFoci,
}

/**
 * ScatterChart
 * @author Ilya Shabanov
 */
const cl = ccl('scatter-chart--')
const ScatterChart: React.FC<IScatterChartProps> = ({className, names}) => {
    
    const [xFociType,setXFociType] = useState(-1);
    const [yFociType,setYFociType] = useState(0);
    const xChoices = {0:names[0],
                      1:names[1]}
    
    const yChoices = {0:names[xFociType],
                      1:`Nearest Neighbour ${names[(xFociType+1)%2]}`,
                      2:`Overlapping ${names[(xFociType+1)%2]}`}
    
    const onChangeXFoci = (xft) => setXFociType(parseInt(xft));
    const onChangeYFoci = (yft) => setYFociType(parseInt(yft));
    
    return (
        <div className={`scatter-chart ${className || ''}`}>
            <div className="axis-input">
                <span>X-Axis</span> display <ScatterChartChoice choices={xChoices} val={xFociType} onChange={onChangeXFoci}/>
                <span>Y-Axis</span> display <ScatterChartChoice choices={yChoices} val={yFociType} onChange={onChangeYFoci}/>
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
    console.log(`REPAING `, choices);
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