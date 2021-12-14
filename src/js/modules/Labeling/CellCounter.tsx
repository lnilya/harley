import React, {Suspense, useState} from "react";
import {
    OutlinePolygonLabeling,
    SeedPolygon,
    SelectedPolygon,
    SplitablePolygon,
    SplitPolygon,
    SplitSeedPolygon
} from "./_polygons";
import {useToggleKeys} from "../../../sammie/js/modules/modulehooks";
import {copyChange, doesPolygonContain} from "../../../sammie/js/util";
import {PipelineImage, PolygonData} from "../../../sammie/js/types/datatypes";
import PolygonCloud from "../../../sammie/js/ui/elements/PolygonCloud";
import {LabelingResult, SingleCellLabelingData} from "./server";
import './scss/CellCounter.scss'
import {Button} from "@mui/material";

interface ICellCounterProps {
    
    /**Additional classnames for this component*/
    className?: string,
    cellImg:PipelineImage,
    cellContour:PolygonData
    curCell:SingleCellLabelingData,
    
    onNext:(res:LabelingResult) => void
}


const pxPerLoop = 10
/**
 * CellCounter
 * @author Ilya Shabanov
 */


const CellCounter: React.FC<ICellCounterProps> = ({cellContour, onNext, className,cellImg,curCell}) => {
    
    const [loading, setLoading] = useState(true);
    const [curSelectedFoci, setCurSelFoci] = useState<number[]>([])
    const [fociSplits, setFociSplits] = useState<boolean[]>([])
    
    const onNextCell = async (classified: boolean) => {
        var result:LabelingResult = {
            cellNum:curCell.cellNum,
            foci:null,
            splits:null,
            rejected:!classified,
            labelingData:curCell,
        }
        if(classified){
            result.foci = curCell?.foci?.map((e, i) => {
                if (curSelectedFoci[i] == undefined || i > curSelectedFoci.length) return -1
                else return curSelectedFoci[i];
            })
            result.splits = fociSplits.map((e, i) => e ? i : -1).filter(k=>k>=0)
        }
        //reset selections
        setFociSplits([])
        setCurSelFoci([])
        onNext(result)
    }
    
    //All outlines that have been selected, but not split
    const selectedOutlines: PolygonData[] = curCell?.foci?.map((e, i) => {
        if (curSelectedFoci[i] == undefined || i > curSelectedFoci.length) return null
        else return e[curSelectedFoci[i]];
    })
    const splittingSeeds: PolygonData[] = curCell?.foci?.map((e, i) => {
        //Check if this seed is contained by a selectedOutline that is split
        if(!e) return null
        for(let s in selectedOutlines){
            //check all selectedoutlines, if they are split and contain this seed...
            if(fociSplits[s] && doesPolygonContain(selectedOutlines[s],e[0])){
                return e[0] //they do so return this seed to display it
            }
        }
        return null
    })
    const selectedOutlinesStyle = (idx)=>{
        if(fociSplits[idx])
            return SplitPolygon
        
        for (let i = 0; i < curCell.foci.length; i++) {
            if (i == idx || !curCell.foci[i]) continue;
            var c = doesPolygonContain(selectedOutlines[idx],curCell.foci[i][0])
            if(c) return SplitablePolygon
        }
        return SelectedPolygon
    }
    const seeds: PolygonData[] = curCell?.foci?.map(
        (e, i) => {
            if (selectedOutlines[i] != null || fociSplits[i]) return null
            //Disable seed if it is contained inside a selected outline already
            for (let j = 0; j < selectedOutlines?.length; j++) {
                if (!selectedOutlines[j] || i == j) continue
                if(doesPolygonContain(selectedOutlines[j],e[0])) return null
            }
            return e[0]
        }
    )
    
    const onUnSelectSeed = (idx: number) => {
        
        if(!fociSplits[idx]){ //if possible to split and not split, then split first.
            for (let i = 0; i < seeds.length; i++) {
                if (i == idx || !curCell.foci[i]) continue;
                var c = doesPolygonContain(selectedOutlines[idx],curCell.foci[i][0])
                if(c){
                    setFociSplits(copyChange(fociSplits,idx,true))
                    return
                }
            }
        }
        setFociSplits(copyChange(fociSplits,idx,false))
        setCurSelFoci(copyChange(curSelectedFoci, idx, null))
    }
    const onSelectSeed = (idx: number) => {
        var curValue = curSelectedFoci[idx] ?? -1
        if (curValue == (curCell.foci[0].length - 1)) curValue = null
        else curValue = (curValue + 1) % curCell.foci[0].length
        setCurSelFoci(copyChange(curSelectedFoci, idx, curValue))
    }
    const numSelected = curCell?.foci.filter((p, i) =>
        curSelectedFoci[i] !== undefined && curSelectedFoci[i] !== null
    ).length;
    
    
    const mod = useToggleKeys(['1', '2','3'])
    const onMouseDownIn = (idx, e) => {
        const originalX = e.clientX ?? e.touches.item(0).clientX
        var outlineNumber = 0;
        const moveListenerMobile = (ev) => moveListener(ev.touches.item(0));
        const moveListener = (ev) => {
            const d = Math.abs(ev.clientX - originalX)
            outlineNumber = Math.floor(d / pxPerLoop)
            const numLoops = curCell?.foci[0].length
            if (outlineNumber >= numLoops) outlineNumber = numLoops - 1
            
            if (curSelectedFoci[idx] != outlineNumber){
                setCurSelFoci(copyChange(curSelectedFoci, idx, outlineNumber))
            }
        }
        const upListener = (ev) => {
            window.removeEventListener('mousemove', moveListener)
            window.removeEventListener('mouseup', upListener)
            e.target.removeEventListener('touchmove', moveListener)
            e.target.removeEventListener('touchend', upListener)
        }
        window.addEventListener('mousemove', moveListener)
        window.addEventListener('mouseup', upListener)
        e.target.addEventListener('touchmove', moveListenerMobile)
        e.target.addEventListener('touchend', upListener)
    }
    
    return (
        <Suspense fallback={'Loading...'}>
            <div
                className={`cell-counter pad-50-hor ${className} ${loading ? 'is-loading' : ''} ${(mod['2']) ? 'hide-all' : ''} pad-100-top`}>
                <div className="rel">
                    <img src={cellImg.url} alt=""/>
                    {curCell &&
                    <>
                        <PolygonCloud polygons={[cellContour]} canvasDim={cellImg} PolyComp={OutlinePolygonLabeling}/>
                        <PolygonCloud onClick={onUnSelectSeed} className={''} polygons={selectedOutlines} canvasDim={cellImg} PolyCompFactory={selectedOutlinesStyle}/>
                        <PolygonCloud polygons={splittingSeeds} canvasDim={cellImg} PolyComp={SplitSeedPolygon}/>
                        <PolygonCloud onMouseDown={onMouseDownIn} onClick={onSelectSeed}
                                      className={mod['1'] ? 'all-show' : ''} polygons={seeds} canvasDim={cellImg}
                                      PolyComp={SeedPolygon}/>
                    </>
                    }
                </div>
                
                <div className="hide smallhint pad-100-ver">Num Foci: {numSelected}</div>
                <div className="fl-col fl-grow pad-100-top">
                    <div className="fl-row-end full-w margin-50-top margin-100-bottom">
                                               <div className="fl-grow"/>
                        <Button variant={"outlined"} onClick={e => onNextCell(false)} color={"secondary"}>
                            Skip cell</Button>
                        <div className="margin-25-hor"/>
                        <Button variant={"contained"} onClick={e => onNextCell(true)} color={"primary"}>Next
                            Cell</Button>
                    </div>
                    <div className="fl-grow"/>
                </div>
            
            </div>
        </Suspense>
    );
}
export default CellCounter;