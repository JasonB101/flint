import React, { useState } from "react";
import Styles from "./Sourcing.module.scss";
import SourcingChart from "./SourcingChart/SourcingChart";
import { YearSourcingChart, YearSourcingChartByWeek, YearSourcingChartByMonth } from "./SourcingChart/ChartTemplates/chartOptions";

const Sourcing = (props) => {
    const [dateType, setDateType] = useState("week");
    const [year, setYear] = useState(new Date().getFullYear());

    const { items } = props;

    // Get available years from items
    const availableYears = [...new Set(items.filter(item => item.datePurchased).map(item => 
        new Date(item.datePurchased).getFullYear()
    ))].sort((a, b) => b - a);

    // Chart options based on selected period
    const getChartOptions = () => {
        switch (dateType) {
            case "day":
                return new YearSourcingChart(year, items);
            case "week":
                return new YearSourcingChartByWeek(year, items);
            case "month":
                return new YearSourcingChartByMonth(year, items);
            default:
                return new YearSourcingChartByWeek(year, items);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(value);
    };

    const sourcingInfo = assembleSourcingInfo(items);

    // Calculate current year metrics
    const currentYearItems = items.filter(item => 
        item.datePurchased && new Date(item.datePurchased).getFullYear() === year
    );

    const currentYearPurchased = currentYearItems.length;
    const currentYearCost = currentYearItems.reduce((sum, item) => 
        sum + (item.purchasePrice || 0), 0
    );
    const currentYearShipping = currentYearItems.reduce((sum, item) => 
        sum + (item.shippingCost || 0), 0
    );
    const totalCost = currentYearCost + currentYearShipping;

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
                    <h2>Sourcing Trends</h2>
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
                    <SourcingChart options={chartOptions} />
                </div>
            </div>

            {/* Key Metrics Cards */}
            <div className={Styles.metricsGrid}>
                <div className={Styles.metricCard}>
                    <div className={Styles.metricIcon}>🛒</div>
                    <div className={Styles.metricContent}>
                        <span className={Styles.metricLabel}>Items Sourced</span>
                        <span className={Styles.metricValue}>{currentYearPurchased}</span>
                    </div>
                </div>
                
                <div className={Styles.metricCard}>
                    <div className={Styles.metricIcon}>💰</div>
                    <div className={Styles.metricContent}>
                        <span className={Styles.metricLabel}>Purchase Cost</span>
                        <span className={Styles.metricValue}>{formatCurrency(currentYearCost)}</span>
                    </div>
                </div>
                
                <div className={Styles.metricCard}>
                    <div className={Styles.metricIcon}>📦</div>
                    <div className={Styles.metricContent}>
                        <span className={Styles.metricLabel}>Shipping Cost ({year})</span>
                        <span className={`${Styles.metricValue} ${Styles.shipping}`}>
                            {formatCurrency(currentYearShipping)}
                        </span>
                    </div>
                </div>
                
                <div className={Styles.metricCard}>
                    <div className={Styles.metricIcon}>📊</div>
                    <div className={Styles.metricContent}>
                        <span className={Styles.metricLabel}>Avg per Item</span>
                        <span className={`${Styles.metricValue} ${Styles.average}`}>
                            {formatCurrency(currentYearPurchased ? totalCost / currentYearPurchased : 0)}
                        </span>
                    </div>
                </div>
            </div>

            <div className={Styles.projectionSection}>
                <div className={Styles.projectionCard}>
                    <div className={Styles.projectionContent}>
                        <span className={Styles.projectionLabel}>Projected {year} Sourcing</span>
                        <span className={Styles.projectionValue}>{Math.floor(getProjected(currentYearPurchased))}</span>
                    </div>
                </div>
                <div className={Styles.projectionCard}>
                    <div className={Styles.projectionContent}>
                        <span className={Styles.projectionLabel}>Projected {year} Cost</span>
                        <span className={`${Styles.projectionValue} ${Styles.cost}`}>
                            {formatCurrency(getProjected(totalCost))}
                        </span>
                    </div>
                </div>
            </div>

            {/* Add bottom padding */}
            <div className={Styles.bottomPadding}></div>
        </div>
    );

    function assembleSourcingInfo(items) {
        const sourcingObj = {
            totalPurchased: 0,
            totalCost: 0,
        };

        const info = items.reduce((sourcingInfo, x) => {
            const { datePurchased, purchasePrice } = x;
            let isThisYear = datePurchased && new Date(datePurchased).getFullYear() === year;
            if (datePurchased && isThisYear) {
                sourcingInfo.totalCost += purchasePrice || 0;
                sourcingInfo.totalPurchased += 1;
            }
            return sourcingInfo;
        }, sourcingObj);
        return info;
    }
};

export default Sourcing;