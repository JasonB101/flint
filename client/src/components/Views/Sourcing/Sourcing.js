import React, { useState } from "react";
import Styles from "./Sourcing.module.scss";
import SourcingHeader from "./SourcingHeader/SourcingHeader";
import SourcingChart from "./SourcingChart/SourcingChart";
import { YearSourcingChart, YearSourcingChartByWeek, YearSourcingChartByMonth } from "./SourcingChart/ChartTemplates/chartOptions";

const Sourcing = (props) => {
    const [dateType, setDateType] = useState("week");
    const [year, setYear] = useState(Date().getFullYear());

    //dateType is day week year
    const { items } = props;

    //day, week, month, year
    const options = () => {
        switch (dateType) {
            case "day":
                return new YearSourcingChart(year, items);
            case "week":
                return new YearSourcingChartByWeek(year, items);
            case "month":
                return new YearSourcingChartByMonth(year, items);
            case "year":
                return {};
            default:
        }
    }

    const currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });

    const sourcingInfo = assembleSourcingInfo(items)


    function getProjected(amount) {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now - start;
        const oneDay = 1000 * 60 * 60 * 24;
        const day = Math.floor(diff / oneDay);
        const average = (+amount / day).toFixed(2);
        const difference = 366 - day;
        const projected = Number(+amount + difference * average);
        return projected;
    }

    return (
        <div className={Styles.wrapper}>
            <SourcingHeader sourcingInfo={sourcingInfo}/>
            <hr></hr>
            <div className={Styles.annualChartContainer}>
                <div>
                    <span onClick={() => setDateType("day")} className={dateType === "day" ? Styles.glowSpan : ""}>Day</span>
                    <span onClick={() => setDateType("week")} className={dateType === "week" ? Styles.glowSpan : ""}>Week</span>
                    <span onClick={() => setDateType("month")} className={dateType === "month" ? Styles.glowSpan : ""}>Month</span>
                    <span onClick={() => setDateType("year")} className={dateType === "year" ? Styles.glowSpan : ""}>Year</span>
                </div>
                <SourcingChart options={options()} />
                <br></br>
                <h5>{`Projected ${year} Sourcing: ${Math.floor(getProjected(sourcingInfo.totalPurchased))}`}</h5>
                <h5>{`Projected ${year} Cost: ${currencyFormatter.format(getProjected(sourcingInfo.totalCost.toFixed(2)))}`}</h5>

            </div>


        </div>
    );

    function assembleSourcingInfo(items) {
        const sourcingObj = {
            totalPurchased: 0,
            totalCost: 0,
        }

        const info = items.reduce((sourcingInfo, x) => {
            const {datePurchased, purchasePrice} = x
            let isThisYear = (new Date(datePurchased).getFullYear() === year)
            if (datePurchased && isThisYear) {
                sourcingInfo.totalCost += purchasePrice
                sourcingInfo.totalPurchased += 1

            }


            return sourcingInfo;
        }, sourcingObj);
        return info
    }
}

export default Sourcing;