import React from "react";
import Styles from "./SalesHeader.module.scss";

const SalesHeader = ({salesInfo}) => {
    const { activeSales, YTDProfit, profitPerItem, totalListed, totalSold } = salesInfo
    return (
        <div className={Styles.wrapper}>
            <h5>Listed 
                <span>{totalListed}</span>
            </h5>
            <h5>Active sales 
                <span>{`$${activeSales[0].toFixed(2)} /`}
                    <span style={{color: "green", display: "inline"}}>{`$${activeSales[1].toFixed(2)}`}
                    </span>
                </span>
            </h5>
            <h5>Sold 
                <span>{totalSold}</span>
            </h5>
            <h5>Avg profit/item 
                <span style={{color: "green"}}>{profitPerItem}</span>
            </h5>
            <h5>YTD Profit 
                <span style={{color: "green"}}>{`$${YTDProfit.toFixed(2)}`}</span>
            </h5>
            
        </div>
    );
}

export default SalesHeader;