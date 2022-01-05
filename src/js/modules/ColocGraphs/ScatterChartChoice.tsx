import React, {useEffect, useState} from "react";
import {ccl} from "../../../sammie/js/util";
import './scss/ScatterChartChoice.scss'
import {FociScatter} from "./server";
import {FormControl, NativeSelect} from "@mui/material";
import * as util from '../../util/math'
import {GraphData} from "./FociScatterChart";


/**Properties description*/
const basicProps = {
    area:(unit:string)=>`Focus area in ${unit}²`,
    overlappedArea:(unit:string, oppFoci:string)=>`Area overlapped by ${oppFoci}`,
    contourDistToNN:(unit:string,oppFoci:string)=>`Contour Distance to Nearest ${oppFoci} in ${unit}`,
    centroidDistToNN:(unit:string,oppFoci:string)=>`Centroid Distance to Nearest ${oppFoci} in ${unit}`,
    // cellArea:(unit:string)=>`Enclosing Cell's area in ${unit}²`,
    numOverlapPartners:(unit:string,oppFoci:string)=>'Number overlapping ' + oppFoci,
}

function transformByValue(prop:string, val:number){
    if(prop == 'overlappedArea')
        return val * 100;
    
    return val;
}
function filterByValue(prop:string, val:number){
    if(prop == 'contourDistToNN' || prop == 'centroidDistToNN')
        return val != -1;
    
    return true;
}
function getUnitsLabel(prop:string, unit:string){
    if(prop == 'area') return `${unit}²`
    else if(prop == 'overlappedArea') return `%`
    else if(prop == 'contourDistToNN' || prop == 'centroidDistToNN') return unit;
    return ``
}
function getAxisLabel(prop:string, unit:string,focusName:string,oppFocusName:string){
    if(prop == 'area') return `${focusName} area in ${unit}²`
    else if(prop == 'overlappedArea') return `${focusName} area overlapped by ${oppFocusName} in %`
    else if(prop == 'contourDistToNN') return `Contour distance ${focusName} to nearest ${oppFocusName} in ${unit}`
    else if(prop == 'centroidDistToNN') return `Centroid distance ${focusName} to nearest ${oppFocusName} in ${unit}`
    else if(prop == 'numOverlapPartners') return `Number ${oppFocusName} overlapping ${focusName}`
}
function getBasicProps(unit:string,oppFoci:string){
    var ret = {'none':'Please select...'};
    const base = Object.keys(basicProps).map((k)=>{
        ret[k] = basicProps[k](unit,oppFoci)
    })
    return ret;
}


export type ScatterPlotPoint = {
    x:number,
    y:number,
    fcx:FociScatter|FociScatter[]
    fcy:FociScatter|FociScatter[],
}
interface IScatterChartChoiceProps{
	
	/**Additional classnames for this component*/
	className?:string
    
    unit:string
    names:[string,string]
    
    data:{c0:FociScatter[],c1:FociScatter[]}
    onDataChanged:(graph:GraphData)=>void
}
/**
 * ScatterChartChoice
 * @author Ilya Shabanov
 */
const cl = ccl('scatter-chart-choice--')
const ScatterChartChoice:React.FC<IScatterChartChoiceProps> = ({onDataChanged, unit,names,data, className}) => {
	
    const [xFociProp,setXFociProp] = useState('area');
    const [yFociProp,setYFociProp] = useState('centroidDistToNN');
    const [xFociType,setXFociType] = useState(0);
    const [yFociType,setYFociType] = useState(0);
    const [yMultiHandling,setYMultiHandling] = useState('avg');
    
    useEffect(()=>{
        if(xFociType < 0  || xFociProp == 'none' || yFociProp == 'none' || yFociType < 0){
            onDataChanged(null)
            return
        }
        //Extract Data as required
        var graphData:Array<ScatterPlotPoint> = [];
        var channel0:FociScatter[] = data['c'+xFociType]
        channel0 = channel0.filter((c)=>filterByValue(xFociProp,c[xFociProp]))
        
        if(yFociType == 0){ //x and y feature same foci
            graphData = channel0.map((f)=>({
                x:f[xFociProp],
                y:f[yFociProp],
                fcx:f,
                fcy:f
            }))
        }else if(yFociType == 1){ //y is nearest neighbour
            //take only the ones with neighbours
            channel0 = channel0.filter((focus)=>focus.nearestNeighbour != -1)
            const c1:FociScatter[] = data['c'+((xFociType+1)%2)]
            
            graphData = channel0.map((f)=>({
                x:f[xFociProp],
                y:c1[f.nearestNeighbour][yFociProp],
                fcx:f,
                fcy:c1[f.nearestNeighbour]
            }))
            
        }else if(yFociType == 2){ //y are overlap partner(s)
            //take only the ones who have overlapping partners
            channel0 = channel0.filter((focus)=>focus?.overlapPartners?.length > 0)
            
            //extract partners from opposite channel
            const c1:FociScatter[] = data['c'+((xFociType+1)%2)]
            channel0.map((c0f)=>{
                const partners = c0f.overlapPartners.map((idx)=>c1[idx])
                //Add the
                const original = {x:c0f[xFociProp],fcx:c0f};
                
                if(yMultiHandling == 'min'){
                    const p = util.argmin<FociScatter>(partners,el=>el[yFociProp]);
                    graphData.push({...original, y:partners[p][xFociProp],fcy:partners[p]})
                }else if(yMultiHandling == 'max'){
                    const p = util.argmax<FociScatter>(partners,el=>el[yFociProp])
                    graphData.push({...original, y:partners[p][xFociProp],fcy:partners[p]})
                }else if(yMultiHandling == 'avg'){
                    graphData.push({...original, y:util.mean(partners.map(p=>p[yFociProp])),fcy:partners})
                }else if(yMultiHandling == 'sep'){
                    //Duplicate the datapoints on X axis
                    for (let i = 0; i < partners.length; i++) {
                        graphData.push({...original, y:partners[i][yFociProp], fcy:partners[i]})
                    }
                }
            })
        }
        
        
        graphData = graphData.map((fs)=>({
            ...fs,
            x:transformByValue(xFociProp,fs.x),
            y:transformByValue(yFociProp,fs.y),
        }))
        var gd = {
            points:graphData,
            xPropUnits:getUnitsLabel(xFociProp,unit),
            yPropUnits:getUnitsLabel(yFociProp,unit),
            xPropName:getAxisLabel(xFociProp,unit,names[xFociType],names[(xFociType+1)%2]),
            yPropName:''
        }
        
        if(yFociType != 0) gd.yPropName = getAxisLabel(yFociProp,unit,names[(xFociType+1)%2],names[xFociType])
        else gd.yPropName = getAxisLabel(yFociProp,unit,names[xFociType],names[(xFociType+1)%2])
        
        onDataChanged(gd)
        
    },[xFociProp,xFociType,yFociProp,yFociType,yMultiHandling])
    
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
    const baseY = getBasicProps(unit,yFociType == 0 ? names[(xFociType+1)%2] : names[xFociType])
    
    
	return (
		<div className={`scatter-chart-choice ${className || ''}`}>
			<div className="axis-input">
                <span>X-Axis</span>
                For each focus of
                <ScatterChartDropDown choices={xChoices} val={xFociType} onChange={onChangeXFoci}/>
                display
                <ScatterChartDropDown choices={baseX} val={xFociProp} onChange={onChangeXFociProp}/>.
            </div>
            <div className="axis-input">
                <span>Y-Axis</span>
                For each of<ScatterChartDropDown choices={yChoices} val={yFociType} onChange={onChangeYFoci}/>
                display
                <ScatterChartDropDown choices={baseY} val={yFociProp} onChange={onChangeYFociProp}/>
                {yFociType == 2 &&
                    <>
                    <br/>
                    For multiple entries use
                    <ScatterChartDropDown choices={multiChoices} val={yMultiHandling} onChange={setYMultiHandling}/>.
                    </>
                }
            </div>
		</div>
	);
}
export default ScatterChartChoice;

interface IScatterChartDropDown{
    choices: Record<string, string>,
    val: any,
    onChange: (string) => void
}

const ScatterChartDropDown: React.FC<IScatterChartDropDown> = ({choices,val,onChange})=>{
    return (
        <div className="scatter-chart__choice">
            <FormControl variant="standard">
                <NativeSelect value={val} placeholder={'please select...'} onChange={e => {
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