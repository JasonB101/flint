import React, { useState } from "react";
import Styles from "./Sales.module.scss";
import SalesHeader from "./SalesHeader/SalesHeader";
import SalesChart from "./SalesChart/SalesChart";
import { YearSalesChart, YearSalesChartByWeek } from "./SalesChart/ChartTemplates/chartOptions";

const Sales = (props) => {
    const [dateType, setDateType] = useState("week");
    const [year, setYear] = useState(2020);

    const [profitTrue, setProfitState] = useState(true);

    //dateType is day week year
    const { items, expenses } = props;
    const soldItems = items.filter(x => x.sold)

    const salesInfo = assembleSalesInfo(items, expenses)
    //day, week, month, year
    const options = () => {
        switch (dateType) {
            case "day":
                return new YearSalesChart(year, soldItems, true);
            case "week":
                return new YearSalesChartByWeek(year, soldItems, true);
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

    const sales = soldItems.reduce((sales, item) => sales + Number(item.priceSold), 0).toFixed(2)
    const profit = soldItems.reduce((sales, item) => sales + Number(item.profit), 0).toFixed(2)


    function getProjected(profitOrSales) {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
        const oneDay = 1000 * 60 * 60 * 24;
        const day = Math.floor(diff / oneDay);
        const average = (+profitOrSales / day).toFixed(2);
        const difference = 365 - day;
        const projected = Number(+profitOrSales + difference * average);
        return currencyFormatter.format(projected);
    }

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
                    }`}
                </h4>
                <br></br>
                <h5>{`Projected ${year} Sales: ${getProjected(sales)}`}</h5>
                <h5>{`Projected ${year} Profit: ${getProjected(profit)}`}</h5>
                
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