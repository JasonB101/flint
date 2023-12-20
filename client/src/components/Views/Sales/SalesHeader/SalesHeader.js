import React from "react";
import Styles from "./SalesHeader.module.scss";

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

const SalesHeader = ({ salesInfo }) => {
    const { YTDProfit, profitPerItem, totalSold, roi } = salesInfo
    return (
        <div className={Styles.wrapper}>
            
            <h5>Sold YTD
                <span>{totalSold}</span>
            </h5>
            <h5>Avg ROI
                <span style={{ color: "green" }}>{`${roi}%`}</span>
            </h5>
            <h5>YTD Profit
                <span style={{ color: "green" }}>{currencyFormatter.format(YTDProfit.toFixed(2))}</span>
            </h5>

        </div>
    );
}

export default SalesHeader;