import React from "react";
import Styles from "./SalesHeader.module.scss";

const SalesHeader = ({salesInfo}) => {
    const { activeSales, YTDProfit } = salesInfo
    return (
        <div className={Styles.wrapper}>
            <h4>Active sales 
                <span>{`  $${activeSales[0].toFixed(2)} /`}
                    <span style={{color: "green"}}>{`$${activeSales[1].toFixed(2)}`}
                    </span>
                </span>
            </h4>
            <h4>YTD Profit 
                <span style={{color: "green"}}>{`$${YTDProfit.toFixed(2)}`}</span>
            </h4>
            
        </div>
    );
}

export default SalesHeader;