import React, {useEffect, useState} from "react"
import {atomFamily, useRecoilState, useRecoilValue} from "recoil";
import * as alg from "../../state/algstate";
import * as ui from "../../state/uistates";
import * as eventbus from "../../state/eventbus";
import * as self from "./params";
import {runTraining, TrainingResult} from "./server";
import './scss/Training.scss'
import {useStepHook} from "../_hooks";
import {PipelineImage} from "../../types/datatypes";
import {EelResponse} from "../../eel/eel";
import ErrorHint from "../../ui/elements/ErrorHint";
import StatDisplay, {cvExplanation, testExplanation} from "./StatDisplay";
import {printf} from "fast-printf";
import {AreaChart, Label, ComposedChart,Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line} from 'recharts';


/**PERSISTENT UI STATE DEFINITIONS*/
const asTrainingResult = atomFamily<TrainingResult, string>({key: 'training_result', default: null});
const asLastRunSettings = atomFamily<{ inputs: self.Inputs, params: self.Parameters }, string>({
    key: 'training_initial',
    default: null
});

interface ITrainingProps {
}

const Training: React.FC<ITrainingProps> = () => {
    
    /**CLEANUP CALLBACK WHEN INPUTS HAVE CHANGED*/
    const onInputChanged = () => {
        setError(null)
        setTrainingResult(null)
    };
    
    /**RUNNING ALGORITHM CALLBACK*/
    const runMainAlgorithm = async (params: self.Parameters, step: self.Step) => {
        
        const res = await runTraining(params, step);
        setError(res.error ? res : null)
        setTrainingResult(!res.error ? res.data : null)
        
        return {error: 'false'}
    };
    
    /**CORE HOOK FOR SETTING UP STATE*/
    const {
        curInputs,
        curStep,
        curParams,
        isRunning
    } = useStepHook<self.Inputs, self.Parameters, self.Step>(asLastRunSettings,
        onInputChanged,
        runMainAlgorithm,
        {msg: 'Analyzing Model', display: "overlay"});
    
    /**UI SPECIFIC STATE*/
    const [trainingResult, setTrainingResult] = useRecoilState(asTrainingResult(curStep.moduleID))
    const [error, setError] = useState<EelResponse<any>>(null)
    return (<div className={'training'}>
        {error && <ErrorHint error={error}/>}
        {!error && trainingResult &&
        <>
            <div className={'fl-row pad-100-top'}>
                <StatDisplay title={'Generalization Score'} formattedVal={printf('%.2f%%', 100 * trainingResult.cv)}
                             normVal={trainingResult.cv} explanation={cvExplanation}/>
                <StatDisplay title={'Test Score'} formattedVal={printf('%.2f%%', 100 * trainingResult.test)}
                             normVal={trainingResult.test} explanation={testExplanation}/>
            </div>
            {trainingResult.traincurve &&
                <div className="training__chart margin-200-top">
                     <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            width={600}
                            height={300}
                            data={parseChartData(trainingResult)}
                            margin={{
                                top: 5,
                                right: 0,
                                left: 0,
                                bottom: 5,
                            }}
                        >
                            <Area type="monotone" stackId={'1'} strokeDasharray={'3 6'} dataKey="negStd" stroke="#4A556899" fill="#E2E8F000"/>
                            <Area type="monotone" stackId={'1'} strokeDasharray={'3 6'} dataKey="posStd" stroke="#4A556899" fill="#E2E8F0ff"/>
                            <Line type="monotone" dataKey="mean" stroke="#FF7F50" fill="#8884d800" strokeWidth={2}/>
                            <YAxis />
                            <Tooltip  content={<CustomTooltip/>}/>
                            <XAxis  dataKey={'x'} label={{ value: "Num Foci in Training Set", position: "insideBottomRight", dy: -35}} />
                        </ComposedChart>
                     </ResponsiveContainer>
                    <p className={'pad-100'}>
                        The y-axis gives the training score (-1 to 1) on the full dataset of a model trained on a random subset of data of increasing size.
                        <br/>
                        For each subset size a total of 30 random samples is generated. The shaded area show +/- one standard deviations in these 30 samples.
                        <br/>
                        <br/>
                        The graph explains how much data you need for the model to learn your behaviour.
                        As the size of training data grows the model is able to learn your labeling preference with increasing accuracy. In most
                        cases this curve will level off, with more data barely giving any improvement.
                        <br/>
                        <br/>
                        When you see the curve leveling off you can stop adding data and export the model.
                    </p>
                    
                    
                </div>
            }
        </>
        }
    </div>);
}
export default Training

const CustomTooltip = (props:{ active?:any, payload?:any, label?:any }) => {
  if (props.active && props.payload && props.payload.length) {
    const {x, mean, negStd, posStd, std} = props.payload[0].payload
    return (
      <div className="custom-tooltip">
        <div>{`Num Foci in Training Set: ${x} `}</div>
        <div>{`Mean: ${printf('%.2f',mean)} `}</div>
        <div>{`Std: ${printf('%.2f',std)} `}</div>
      </div>
    );
  }

  return null;
};


function parseChartData(d:TrainingResult){
    const np = d.traincurve.std.length
    var ret = [];
    for (let i = 0; i < np; i++) {
        ret.push({
            x:d.traincurve.x[i],
            mean:d.traincurve.mean[i],
            std:d.traincurve.std[i],
            negStd:d.traincurve.mean[i] - d.traincurve.std[i],
            posStd:2*d.traincurve.std[i],
        });
    }
    return ret
}