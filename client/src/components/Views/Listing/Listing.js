import React, { useState } from "react";
import Styles from "./Listing.module.scss";
import ListingHeader from "./ListingHeader/ListingHeader";
import ListingChart from "./ListingChart/ListingChart";
import { YearListingChart, YearListingChartByWeek, YearListingChartByMonth } from "./ListingChart/ChartTemplates/chartOptions";

const Listing = (props) => {
    const [dateType, setDateType] = useState("week");
    const [year, setYear] = useState(new Date().getFullYear());

    //dateType is day week year
    const { items } = props;

    //day, week, month, year
    const options = () => {
        switch (dateType) {
            case "day":
                return new YearListingChart(year, items);
            case "week":
                return new YearListingChartByWeek(year, items);
            case "month":
                return new YearListingChartByMonth(year, items);
            case "year":
                return {};
            default:
        }
    }

    const currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });

    const listingInfo = assembleListingInfo(items)


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
            <ListingHeader listingInfo={listingInfo}/>
            <hr></hr>
            <div className={Styles.annualChartContainer}>
                <div>
                    <span onClick={() => setDateType("day")} className={dateType === "day" ? Styles.glowSpan : ""}>Day</span>
                    <span onClick={() => setDateType("week")} className={dateType === "week" ? Styles.glowSpan : ""}>Week</span>
                    <span onClick={() => setDateType("month")} className={dateType === "month" ? Styles.glowSpan : ""}>Month</span>
                    <span onClick={() => setDateType("year")} className={dateType === "year" ? Styles.glowSpan : ""}>Year</span>
                </div>
                <ListingChart options={options()} />
                <br></br>
                <h5>{`Projected ${year} Listing: ${Math.floor(getProjected(listingInfo.totalListed))}`}</h5>
                <h5>{`Projected ${year} Profit: ${currencyFormatter.format(getProjected(listingInfo.totalExpectedProfit.toFixed(2)))}`}</h5>

            </div>


        </div>
    );

    function assembleListingInfo(items) {
        const ListingObj = {
            totalListed: 0,
            totalExpectedProfit: 0,
        }

        const info = items.reduce((listingInfo, x) => {
            const {dateListed, expectedProfit} = x
            let isThisYear = (new Date(dateListed).getFullYear() === year)
            if (dateListed && isThisYear) {
                listingInfo.totalExpectedProfit += expectedProfit
                listingInfo.totalListed += 1

            }


            return listingInfo;
        }, ListingObj);
        return info
    }
}

export default Listing;