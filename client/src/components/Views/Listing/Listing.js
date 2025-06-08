import React, { useState } from "react";
import Styles from "./Listing.module.scss";
import ListingChart from "./ListingChart/ListingChart";
import { YearListingChart, YearListingChartByWeek, YearListingChartByMonth } from "./ListingChart/ChartTemplates/chartOptions";

const Listing = (props) => {
    const [dateType, setDateType] = useState("week");
    const [year, setYear] = useState(new Date().getFullYear());

    const { items } = props;

    // Get available years from items
    const availableYears = [...new Set(items.filter(item => item.dateListed).map(item => 
        new Date(item.dateListed).getFullYear()
    ))].sort((a, b) => b - a);

    // Chart options based on selected period
    const getChartOptions = () => {
        switch (dateType) {
            case "day":
                return new YearListingChart(year, items);
            case "week":
                return new YearListingChartByWeek(year, items);
            case "month":
                return new YearListingChartByMonth(year, items);
            default:
                return new YearListingChartByWeek(year, items);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(value);
    };

    const listingInfo = assembleListingInfo(items);

    // Calculate current year metrics
    const currentYearItems = items.filter(item => 
        item.dateListed && new Date(item.dateListed).getFullYear() === year
    );

    const currentYearListed = currentYearItems.length;
    const currentYearExpectedProfit = currentYearItems.reduce((sum, item) => 
        sum + (item.expectedProfit || 0), 0
    );
    const currentYearValue = currentYearItems.reduce((sum, item) => 
        sum + (item.priceSold || item.askingPrice || 0), 0
    );

    // Projection calculation
    function getProjected(value) {
        const now = new Date();
        const start = new Date(year, 0, 0);
        const diff = now - start;
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        const average = value / dayOfYear;
        const remainingDays = 366 - dayOfYear;
        const projected = value + (remainingDays * average);
        return projected;
    }

    const renderPeriodButton = (period, label) => (
        <button
            key={period}
            onClick={() => setDateType(period)}
            className={`${Styles.periodButton} ${dateType === period ? Styles.active : ''}`}
        >
            {label}
        </button>
    );

    // Get chart options once to avoid multiple calls
    const chartOptions = getChartOptions();

    return (
        <div className={Styles.wrapper}>
            {/* Chart Section */}
            <div className={Styles.chartCard}>
                <div className={Styles.chartHeader}>
                    <h2>Listing Trends</h2>
                    <div className={Styles.chartControls}>
                        <div className={Styles.periodSelector}>
                            {renderPeriodButton("day", "Daily")}
                            {renderPeriodButton("week", "Weekly")}
                            {renderPeriodButton("month", "Monthly")}
                        </div>
                        
                        <div className={Styles.yearSelector}>
                            <select 
                                value={year} 
                                onChange={(e) => setYear(Number(e.target.value))}
                                className={Styles.yearSelect}
                            >
                                {availableYears.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className={Styles.chartContainer}>
                    <ListingChart options={chartOptions} />
                </div>
            </div>

            {/* Key Metrics Cards */}
            <div className={Styles.metricsGrid}>
                <div className={Styles.metricCard}>
                    <div className={Styles.metricIcon}>📝</div>
                    <div className={Styles.metricContent}>
                        <span className={Styles.metricLabel}>Items Listed</span>
                        <span className={Styles.metricValue}>{currentYearListed}</span>
                    </div>
                </div>
                
                <div className={Styles.metricCard}>
                    <div className={Styles.metricIcon}>💰</div>
                    <div className={Styles.metricContent}>
                        <span className={Styles.metricLabel}>Expected Value</span>
                        <span className={Styles.metricValue}>{formatCurrency(currentYearValue)}</span>
                    </div>
                </div>
                
                <div className={Styles.metricCard}>
                    <div className={Styles.metricIcon}>📈</div>
                    <div className={Styles.metricContent}>
                        <span className={Styles.metricLabel}>Expected Profit ({year})</span>
                        <span className={`${Styles.metricValue} ${Styles.profit}`}>
                            {formatCurrency(currentYearExpectedProfit)}
                        </span>
                    </div>
                </div>
                
                <div className={Styles.metricCard}>
                    <div className={Styles.metricIcon}>📊</div>
                    <div className={Styles.metricContent}>
                        <span className={Styles.metricLabel}>Avg per Item</span>
                        <span className={`${Styles.metricValue} ${Styles.average}`}>
                            {formatCurrency(currentYearListed ? currentYearExpectedProfit / currentYearListed : 0)}
                        </span>
                    </div>
                </div>
            </div>

            <div className={Styles.projectionSection}>
                <div className={Styles.projectionCard}>
                    <div className={Styles.projectionContent}>
                        <span className={Styles.projectionLabel}>Projected {year} Listings</span>
                        <span className={Styles.projectionValue}>{Math.floor(getProjected(currentYearListed))}</span>
                    </div>
                </div>
                <div className={Styles.projectionCard}>
                    <div className={Styles.projectionContent}>
                        <span className={Styles.projectionLabel}>Projected {year} Profit</span>
                        <span className={`${Styles.projectionValue} ${Styles.profit}`}>
                            {formatCurrency(getProjected(currentYearExpectedProfit))}
                        </span>
                    </div>
                </div>
            </div>

            {/* Add bottom padding */}
            <div className={Styles.bottomPadding}></div>
        </div>
    );

    function assembleListingInfo(items) {
        const ListingObj = {
            totalListed: 0,
            totalExpectedProfit: 0,
        };

        const info = items.reduce((listingInfo, x) => {
            const { dateListed, expectedProfit } = x;
            let isThisYear = dateListed && new Date(dateListed).getFullYear() === year;
            if (dateListed && isThisYear) {
                listingInfo.totalExpectedProfit += expectedProfit || 0;
                listingInfo.totalListed += 1;
            }
            return listingInfo;
        }, ListingObj);
        return info;
    }
};

export default Listing;