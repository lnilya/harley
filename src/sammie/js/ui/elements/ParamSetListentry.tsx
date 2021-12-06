import React from "react";
import {ParamSet} from "../../state/persistance";
import "../../../../scss/elements/ParamSetListentry.scss";
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

interface IParamSetListentryProps {
    
    /**Additional classnames for this component*/
    className?: string
    ps: ParamSet,
    onClick: (p: ParamSet) => any
    onDelete: (p:ParamSet) => any
}

/**
 * ParamSetListentry
 * @author Ilya Shabanov
 */
const ParamSetListentry: React.FC<IParamSetListentryProps> = ({onClick, onDelete, ps, className}) => {
    
    var dt: any = new Date(ps.timestamp);
    dt = dt.toLocaleDateString() + ' - ' + dt.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    return (
        <div className="param-set fl-row" key={ps.name} >
            <div className="inner-container pad-100 fl-grow fl-align-center" onClick={k => onClick(ps)}>
                <div className="fl-row-between pad-25-bottom">
                    <div className="param-set__title">{ps.name || 'Unnamed Parameter Set'}</div>
                    <div className="param-set__date">{dt}</div>
                </div>
                <div className="param-set__desc">{ps.desc || 'No description given.'}</div>
            </div>
            <div className="delete-btn pad-50" onClick={k=>onDelete(ps)}>
                <DeleteForeverIcon/>
            </div>
            
        </div>);
}
export default ParamSetListentry;