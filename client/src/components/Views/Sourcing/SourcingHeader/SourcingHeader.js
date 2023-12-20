import React from "react";
import Styles from "./SourcingHeader.module.scss";
const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

const SourcingHeader = ({sourcingInfo}) => {
    const { totalCost, totalPurchased } = sourcingInfo
    return (
        <div className={Styles.wrapper}>
            
            <h5>Purchased YTD
                <span>{totalPurchased}</span>
            </h5>
            <h5>Cost YTD
                <span>{`${currencyFormatter.format(totalCost)}`}</span>
            </h5>

        </div>
    );
}

export default SourcingHeader;