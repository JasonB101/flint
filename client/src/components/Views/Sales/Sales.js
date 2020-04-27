import React from "react";
import Styles from "./Sales.module.scss";
import SalesHeader from "./SalesHeader/SalesHeader";

const Sales = (props) => {

    const { items } = props;

    const salesInfo = assembleSalesInfo(items)

    return (
        <div className={Styles.wrapper}>
            <SalesHeader salesInfo={salesInfo} />
            <hr></hr>
        </div>
    );

    function assembleSalesInfo(items) {
        const salesObj = {
            activeSales: [0, 0],
            YTDProfit: 0,
            allItemsProfit: 0,
            profitPerItem: 0,
            totalSold: 0,
            totalListed: 0
        }

        //Once I add expenses I will be able to implement that into my YTD Profit
        const info = items.reduce((salesInfo, x) => {
            if (x.sold) {
                salesInfo.YTDProfit += x.profit;
                salesInfo.allItemsProfit += x.profit;
                salesInfo.totalSold++
                salesInfo.profitPerItem = "$" + (salesInfo.allItemsProfit / salesInfo.totalSold).toFixed(2); 
            } else {
                salesInfo.activeSales[0] += x.listedPrice;
                salesInfo.activeSales[1] += x.expectedProfit;
                salesInfo.totalListed++
                
            }

            return salesInfo;
        }, salesObj);

        return info
    }
}

export default Sales;