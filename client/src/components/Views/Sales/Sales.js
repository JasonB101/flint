import React, { useState } from "react";
import Styles from "./Sales.module.scss";
import SalesHeader from "./SalesHeader/SalesHeader";
import SalesChart from "./SalesChart/SalesChart";
import { YearSalesChart, YearSalesChartByWeek } from "./SalesChart/ChartTemplates/chartOptions";

const Sales = (props) => {
    const [dateType, setDateType] = useState("week");

    const [profitTrue, setProfitState] = useState(true);

    //dateType is day week year
    const { items, expenses } = props;
    const soldItems = items.filter(x => x.sold)

    const salesInfo = assembleSalesInfo(items, expenses)
    //day, week, month, year
    const options = () => {
        switch (dateType){
            case "day":
            return new YearSalesChart(2020, soldItems, true);
            case "week":
            return new YearSalesChartByWeek(2020, soldItems, true);
            case "month":
            return {};
            case "year":
            return {};
            default:
        }
    }

    const currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });

    return (
        <div className={Styles.wrapper}>
            <SalesHeader salesInfo={salesInfo} />
            <hr></hr>
            <div className={Styles.annualChartContainer}>
                    <div>
                        <span onClick={() => setDateType("day")} className={dateType === "day" ? Styles.glowSpan : ""}>Day</span>
                        <span onClick={() => setDateType("week")} className={dateType === "week" ? Styles.glowSpan : ""}>Week</span>
                        <span onClick={() => setDateType("month")} className={dateType === "month" ? Styles.glowSpan : ""}>Month</span>
                        <span onClick={() => setDateType("year")} className={dateType === "year" ? Styles.glowSpan : ""}>Year</span>
                    </div>
                <SalesChart options={options()} />
                <br></br>
                <h4>{`Annual Sales: ${currencyFormatter.format(
                    soldItems.reduce((sales, item) =>
                        (sales += Number(item.priceSold)), 0)
                        .toFixed(2))
                    }`}</h4>
            </div>


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

        const expenseTotal = expenses[0] ? expenses.reduce((sum, x) => sum += x.amount, 0) : 0
        const info = items.reduce((salesInfo, x) => {
            if (x.sold) {
                salesInfo.YTDProfit += x.profit;
                salesInfo.allItemsProfit += x.profit;
                salesInfo.totalSold++
                salesInfo.profitPerItem = "$" + (salesInfo.allItemsProfit / salesInfo.totalSold).toFixed(2);
            } else {
                salesInfo.activeSales[0] += x.listedPrice;
                salesInfo.activeSales[1] += x.expectedProfit;
                salesInfo.YTDProfit -= x.purchasePrice;
                salesInfo.totalListed++

            }

            return salesInfo;
        }, salesObj);
        info.YTDProfit = info.YTDProfit - expenseTotal;
        return info
    }
}

export default Sales;