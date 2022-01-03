import React, {useState} from "react"
import {atomFamily, useRecoilState} from "recoil";
import * as server from "./server";
import {FociInCell} from "./server";
import * as self from "./params";
import './scss/FociCandidates.scss'
import {useStepHook, useToggleKeys} from "../../../sammie/js/modules/modulehooks";
import {PipelineImage, PipelinePolygons} from "../../../sammie/js/types/datatypes";
import {EelResponse} from "../../../sammie/js/eel/eel";
import ErrorHint from "../../../sammie/js/ui/elements/ErrorHint";
import {cl} from "../../../sammie/js/util";
import PolygonCloud from "../../../sammie/js/ui/elements/PolygonCloud";
import styled from "@emotion/styled";
import ButtonIcon from "../../../sammie/js/ui/elements/ButtonIcon";


export const MinPolygon = styled.polygon({
    fill:'#9ACD3266',
    stroke:'greenyellow',
    strokeWidth:1,
    '&:hover':{
        fill:'#9ACD32EE',
    }
})
export const OutlinePolygon = styled.polygon({
    stroke:'#d3c000',
    strokeWidth:1,
    fill:'none',
    strokeDasharray:'2 4'
})
export const MaxPolygon = styled.polygon({
    fill:'#ff000011',
    stroke:'red',
    strokeWidth:1,
    '&:hover':{
        fill:'#ff000099',
    }
})

/**PERSISTENT UI STATE DEFINITIONS*/
const asCellImages = atomFamily<PipelineImage[],string>({key:'foci-candidates-images',default:null});
const asCellContours = atomFamily<PipelinePolygons,string>({key:'foci-candidates-contours',default:null});
const asSelectedResult = atomFamily<FociInCell,string>({key:'foci-in-cell',default:null});
const asSelectedCell = atomFamily<number,string>({key:'foci-candidates-selcell',default:-1});
const asLastRunSettings = atomFamily< {batchTimeStamp:number, inputs: self.Inputs, params: self.Parameters},string>({key:'foci-candidates_initial',default:null});

interface IFociCandidatesProps{}
const FociCandidates:React.FC<IFociCandidatesProps> = () => {
    
    /**CLEANUP CALLBACK WHEN INPUTS HAVE CHANGED*/
    const onInputChanged = async ()=>{
        setCellImages(null)
        setSelectedCell(-1)
    };
    
    /**RUNNING ALGORITHM CALLBACK*/
    const runMainAlgorithm = async (params:self.Parameters,step:self.Step)=>{
        // if(cellImages != null){ //images aren't loaded yet, load them first before continuing
        // const res = await server.runFociCandidates(params,step);
        var loadCell = selectedCell;
        if(cellImages == null){ //Images need to be loaded first
            const res = await server.loadCellImages(curParams,curStep)
            setCellImages(res.error ? null : res.data.imgs)
            setCellContours(res.error ? null : res.data.contours)
            if(res.error) return res;
            //Load a random cell
            loadCell = Math.floor(Math.random()*res.data.imgs.length)
            setSelCell(loadCell)
        }else{
            //remove the overlay, to prevent it from coming when selected Cell outlines are reloaded
            setOverlay(null)
            const res = await server.runFociCandidates(curParams,curStep,selectedCell)
            if(!res.error) setFociInSelCell(res.data)
        }
        
        return true;
        // const res = await server.runFociCandidates(curParams,curStep)
        
        // const res = await runFociCandidates(params,step);
        // setError(res.error ? res : null)
        // if(res.error) {
        //     console.log(`Error...`);
        // }else {
        //     console.log(`Success...`);
        // }
        // return res.error ? {error:res.error} : true;
    };
    
    /**CORE HOOK FOR SETTING UP STATE*/
    const {curInputs,curStep,curParams,isRunning, setOverlay} = useStepHook<self.Inputs, self.Parameters,self.Step>(asLastRunSettings,
        onInputChanged,
        // @ts-ignore
        runMainAlgorithm,
        {msg: 'Foci Candidate Detection', display: "overlay", progress:0});
    
    /**UI SPECIFIC STATE*/
    const [cellImages,setCellImages] = useRecoilState(asCellImages(curStep.moduleID))
    const [cellContours,setCellContours] = useRecoilState(asCellContours(curStep.moduleID))
    const [selectedCell,setSelectedCell] = useRecoilState(asSelectedCell(curStep.moduleID))
    const [fociInSelCell,setFociInSelCell] = useRecoilState(asSelectedResult(curStep.moduleID))
    const [error,setError] = useState<EelResponse<any>>(null)
    const hideMask = useToggleKeys(['1','2'])
    
    const setSelCell = async (idx) => {
        if(idx  == selectedCell) return
        
        setSelectedCell(idx)
        setFociInSelCell(null)
        //Load the data for this foci candidate
        const res = await server.runFociCandidates(curParams,curStep,idx)
        if(res.error) setError(res)
        else{
            setFociInSelCell(res.data)
        }
    };
    
	return (<div className={'foci-candidates margin-100-neg pad-100 pad-200-top'}>
	    {error && <ErrorHint error={error}/> }
        {!error &&
            <>
                {selectedCell != -1 &&
                    <div className="foci-candidates__demo-cell rel">
                        {fociInSelCell && !hideMask['1'] &&
                            <PolygonCloud polygons={fociInSelCell.fociMax} PolyComp={MaxPolygon}
                                          canvasDim={cellImages[selectedCell]}/>
                        }
                        {fociInSelCell && !hideMask['2'] &&
                            <PolygonCloud polygons={fociInSelCell.fociMin} PolyComp={MinPolygon} canvasDim={cellImages[selectedCell]}/>
                        }
                        
                        <PolygonCloud polygons={[cellContours[selectedCell]]} PolyComp={OutlinePolygon} canvasDim={cellImages[selectedCell]}/>
                        <img src={cellImages[selectedCell].url} />
                    </div>
                }
                {cellImages &&
                    <>
                        {selectedCell == -1 &&
                            <div className="text-center pad-100 col-white">
                                Click on cells in dataset to see the detected foci outlines.
                            </div>
                        }
                        {selectedCell != -1 &&
                            <div className="text-center pad-100 col-white font-small site-block narrow">
                                Use the <ButtonIcon btnText={'1'}/> and <ButtonIcon btnText={'2'}/> keys to hide the foci outlines.
                                <br/>
                                Do not worry about dead, cropped or in any way invalid cells, you will have the opportunity to exclude them later.
                            </div>
                        }
                        <div className="foci-candidates__all-cells">
                            {cellImages.map((c, idx) =>
                                <div className={'cell-img' + cl(idx == selectedCell, 'selected')} key={c.url}
                                     onClick={e => setSelCell(idx)}>
                                    <img src={c.url} alt="" key={c.url}/>
                                </div>
                            )}
                        </div>
                    </>
                }
            </>
        }
	</div>);
}
export default FociCandidates