import React from "react";
import {ccl} from "../../../sammie/js/util";
import './scss/ColocOverview.scss'
import {ColocGraphsResult} from "./server";
import {mean} from "../../util/math";
import {printf} from "fast-printf";
import {Tooltip} from "@mui/material";
import {useRecoilValue} from "recoil";
import {curLoadedBatch, SingleDataBatch} from "../../../sammie/js/state/algstate";
import {ColocalizationBatchParameters} from "../../pipelines/ColocalizationPipeline";

interface IColocOverviewProps {
    
    /**Additional classnames for this component*/
    className?: string
    result: ColocGraphsResult,
    name0: string,
    name1: string,
    
}

/**
 * ColocOverview
 * @author Ilya Shabanov
 */
const cl = ccl('coloc-overview--')
const ColocOverview: React.FC<IColocOverviewProps> = ({name0, name1, result, className}) => {
    
    return (
        <div className={`coloc-overview ${className || ''} margin-100-neg-hor`}>
            <Box name0={name0} name1={name1} result={result} i={0}/>
            <Box name0={name1} name1={name0} result={result} i={1}/>
        </div>
    );
}
export default ColocOverview;

const Box = (props: { name0: string,name1:string, result: ColocGraphsResult,i:number}) => {
    
    const curBatch:SingleDataBatch<ColocalizationBatchParameters> = useRecoilValue(curLoadedBatch) as SingleDataBatch<ColocalizationBatchParameters>;
    const units = curBatch.batchParameters["1px"] ? 'nm' : 'px'
    
    const {name0, name1, result,i} = props
    const n = result.stats[i == 0 ? 'num0' : 'num1']
    const percOverlap = result.overlap.abs.length / n
    const avgOverlap = mean(result.overlap[i == 0 ? 'fwd':'bck'])
    const numInclusion = result.overlap[i == 0 ? 'fwd':'bck'].filter(o => o > 0.95).length / n
    const avgDist = mean(result.nn[i == 0 ? 'fwd':'bck'])
    
    const avgPCC = mean(result.pcc[i == 0 ? 'fwd':'bck'].filter(c=>!!c).map(c=>c[0]))
    
    var avgDistFormat:string = '%.2f'
    if(avgDist > 500) avgDistFormat = '%.0f'
    else if(avgDist > 50) avgDistFormat = '%.1f'
    
    return (
        <div className="coloc-overview__box pad-100 margin-100-hor">
            <h3>{name0} ({n} in {result.stats.cells} cells)</h3>
            <Tooltip title={`Percentage of ${name0} that overlap ${name1}.`}  placement={'bottom'}>
                <div className="box-row">
                    <span>Overlapping {name1}</span>
                    <span>{printf('%.2f %% (%d)', percOverlap * 100, percOverlap*n)}</span>
                </div>
            </Tooltip>
            <Tooltip title={`Percentage of ${name0} fully included (overlap of >95% of ${name0} area) in ${name1}.`}  placement={'bottom'}>
                <div className="box-row">
                    <span>Fully included in {name1}</span>
                    <span>{printf('%.2f %% (%d)', numInclusion * 100, numInclusion*n)}</span>
                </div>
            </Tooltip>
            <Tooltip title={`Average percentage of area of ${name0} covered by ${name1}. A value of 100% means that the focus is fully included.`} placement={'bottom'}>
                <div className="box-row">
                    <span>Avg. overlap</span>
                    <span>{printf('%.2f %%', avgOverlap * 100)}</span>
                </div>
            </Tooltip>
            <Tooltip title={`Average distance of ${name0} to nearest ${name1} inside the cell for non-overlapping foci only. A value of 0 indicates that the two foci are touching, but not overlapping.
            Cells with only ${name0} but no ${name1} are excluded.`} placement={'bottom'}>
                <div className="box-row">
                    <span>Avg. distance to {name1}</span>
                    <span>{printf(avgDistFormat + ' %s', avgDist,units)}</span>
                </div>
            </Tooltip>
            <Tooltip title={`Average Pearson Correlation of signal located inside ${name0} foci with signal of cell in ${name1} channel.`} placement={'bottom'}>
                <div className="box-row">
                    <span>Avg. Pearson Correlation</span>
                    <span>{printf('%.2f', avgPCC)}</span>
                </div>
            </Tooltip>
        </div>)
}
