import React from "react"
import {algorithmLogo, algorithmName} from "../../../../js/__config";

interface IHarleyLogoProps {
    className?: string,
    onClick:(e:any)=>void
};
const MainLogo: React.FC<IHarleyLogoProps> = ({className, onClick}) => {
    return (
        <div className={`main-logo ${className}`} onClick={onClick}>
            {algorithmLogo}
            <span>
                {algorithmName}
            </span>
        </div>
    );
}
export default MainLogo;