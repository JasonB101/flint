import React from "react";
import Styles from "./ListingHeader.module.scss";
const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

const ListingHeader = ({listingInfo}) => {
    const { totalExpectedProfit, totalListed } = listingInfo
    return (
        <div className={Styles.wrapper}>
            
            <h5>Listed YTD
                <span>{totalListed}</span>
            </h5>
            <h5>Expected Profit YTD
                <span>{`${currencyFormatter.format(totalExpectedProfit)}`}</span>
            </h5>
            <h5>Average Listing Profit
                <span>{`${currencyFormatter.format(totalExpectedProfit / totalListed)}`}</span>
            </h5>

        </div>
    );
}

export default ListingHeader;