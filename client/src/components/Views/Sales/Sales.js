import React, { useState } from "react";
import Styles from "./Sales.module.scss";
import SalesHeader from "./SalesHeader/SalesHeader";
import SalesChart from "./SalesChart/SalesChart";
import { YearSalesChart, YearSalesChartByWeek, YearSalesChartByMonth } from "./SalesChart/ChartTemplates/chartOptions";

const Sales = (props) => {
    const [dateType, setDateType] = useState("week");
    const [year, setYear] = useState(2024);

    const [profitTrue, setProfitState] = useState(true);

    //dateType is day week year
    const { items, expenses } = props;
    const soldItems = items.filter(x => x.sold)

    const salesInfo = assembleSalesInfo(items, expenses)
    //day, week, month, year
    const options = () => {
        switch (dateType) {
            case "day":
                return new YearSalesChart(year, soldItems, profitTrue);
            case "week":
                return new YearSalesChartByWeek(year, soldItems, profitTrue);
            case "month":
                return new YearSalesChartByMonth(year, soldItems, profitTrue);
            case "year":
                return {};
            default:
        }
    }

    const currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });

    const sales = soldItems.reduce((sales, item) => {
        let isThisYear = (new Date(item.dateSold).getFullYear() === year)
        return sales += isThisYear ? Number(item.priceSold) : 0
    }, 0)

    const profit = soldItems.reduce((profit, item) => {
        let isThisYear = (new Date(item.dateSold).getFullYear() === year)
        return profit += isThisYear ? Number(item.profit) : 0
    }, 0)


    function getProjected(profitOrSales) {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now - start;
        const oneDay = 1000 * 60 * 60 * 24;
        const day = Math.floor(diff / oneDay);
        const average = (+profitOrSales / day).toFixed(2);
        const difference = 366 - day;
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
                    soldItems.reduce((sales, item) => {
                        if (new Date(item.dateSold).getFullYear() === year) {
                            return (sales += Number(item.priceSold))
                        } else {
                            return sales
                        }
                    }, 0).toFixed(2))
                    }`}
                </h4>
                <h4>{`Annual Net Sales: ${currencyFormatter.format(
                    soldItems.reduce((sales, item) => {
                        if (new Date(item.dateSold).getFullYear() === year) {
                            return (sales += Number(item.profit))
                        } else {
                            return sales
                        }
                    }, 0).toFixed(2))
                    }`}
                </h4>
                <br></br>
                <h5>{`Projected ${year} Sales: ${getProjected(sales)}`}</h5>
                <h5>{`Projected ${year} Net Sales: ${getProjected(profit)}`}</h5>

            </div>


        </div>
    );

    function assembleSalesInfo(items) {
        const salesObj = {
            YTDProfit: 0,
            allItemsProfit: 0,
            profitPerItem: 0,
            totalSold: 0,
            totalCost: 0,
            roi: 0,
            inventoryCost: 0
        }

        const expenseTotal = expenses[0] ? expenses.reduce((sum, x) => {
            let isThisYear = (new Date(x.dateSold).getFullYear() === year)
            return sum += isThisYear ? x.amount : 0
        }, 0) : 0
        const info = items.reduce((salesInfo, x) => {
            const {purchasePrice, ebayFees, shippingCost} = x
            let isThisYear = (new Date(x.dateSold).getFullYear() === year)
            if (x.sold && isThisYear) {
                salesInfo.YTDProfit += isThisYear ? x.profit : 0;
                salesInfo.allItemsProfit += x.profit;
                salesInfo.totalCost += (purchasePrice + ebayFees + shippingCost)
                salesInfo.totalSold += isThisYear ? 1 : 0;
                salesInfo.profitPerItem = (salesInfo.allItemsProfit / salesInfo.totalSold).toFixed(2);
                salesInfo.roi = Math.floor(salesInfo.allItemsProfit / salesInfo.totalCost * 100)

            } else {
                if (x.listed) {
                    salesInfo.inventoryCost += x.purchasePrice
                }
                salesInfo.YTDProfit -= isThisYear ? x.purchasePrice + (x.shippingCost ? x.shippingCost : 0) : 0;
            }


            return salesInfo;
        }, salesObj);
        info.YTDProfit = info.YTDProfit - expenseTotal - info.inventoryCost;
        return info
    }
}

export default Sales;