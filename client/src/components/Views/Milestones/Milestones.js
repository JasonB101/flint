import React, { useEffect, useState, useContext } from "react";
import Styles from "./Milestones.module.scss";
import CreateReport from "./CreateReport";
import DisplayCongrats from "../../Notifications/DisplayCongrats/DisplayCongrats";
import { storeContext } from "../../../Store";

const Milestones = (props) => {
    const {items, checkNewScores} = props;
    const { getNotifications, markNotificationAsViewed } = useContext(storeContext);
    const currentYear = new Date().getFullYear();
    const report = CreateReport(items, true, currentYear) // Use current year instead of hardcoded 2025
    const [prepObject, changePrepObject] = useState({
        day:{
            listed: {}, //Entry that has 'listed' in competition array
            sold: {}, //Entry that has 'sold' in competition array
            pulled: {}, //Entry that has 'pulled' in competition array
            sales: {}, //Entry that has 'sales' in competition array
            spent: {}
        },
        week:{
            listed: {}, //Entry that has 'listed' in competition array
            sold: {}, //Entry that has 'sold' in competition array
            pulled: {}, //Entry that has 'pulled' in competition array
            sales: {}, //Entry that has 'sales' in competition array
            spent: {}
        },
        month:{
            listed: {}, //Entry that has 'listed' in competition array
            sold: {}, //Entry that has 'sold' in competition array
            pulled: {}, //Entry that has 'pulled' in competition array
            sales: {}, //Entry that has 'sales' in competition array
            spent: {}
        },

    });
    
    const [showCongrats, setShowCongrats] = useState(false);
    const [latestMilestone, setLatestMilestone] = useState(null);
    const [lastCheckedData, setLastCheckedData] = useState(null);
    const [isCheckingMilestones, setIsCheckingMilestones] = useState(false);
    
    // Function to show milestone congrats - called from Header when notification is clicked
    useEffect(() => {
        window.showMilestoneCongrats = (milestone) => {
            setLatestMilestone(milestone);
            setShowCongrats(true);
        };
        
        // Cleanup function on unmount
        return () => {
            delete window.showMilestoneCongrats;
        };
    }, []);

    useEffect(() => {
        console.log("Raw report data:", JSON.stringify(report, null, 2));
        console.log("Items passed to CreateReport:", items?.length || 0, "items");
        console.log("Current year:", currentYear);
        
        let tempObject = {...prepObject}
        let todaysMilestones = { day: {}, week: {}, month: {} }
        
        // Get today's date for comparison
        const today = new Date().toLocaleDateString('en-US', { 
            month: '2-digit', 
            day: '2-digit', 
            year: 'numeric' 
        });
        
        for (let category in report){
            for (let date in report[category]){
                let competitions = report[category][date]['competition']
                competitions.forEach(winningStat => {
                    let newObject = report[category][date]
                    newObject.dateTitle = date
                    tempObject[category][winningStat] = newObject
                    
                    // Only include today's records for milestone checking
                    if (date === today) {
                        todaysMilestones[category][winningStat] = newObject
                    }
                })
            }
        }

        // Only check milestones for today's records if we have valid data and we're not already checking
        const todaysDataString = JSON.stringify(todaysMilestones);
        const hasTodaysData = Object.values(todaysMilestones).some(category => Object.keys(category).length > 0);
        
        if (hasTodaysData && todaysDataString !== lastCheckedData && !isCheckingMilestones) {
            console.log("Checking today's milestones against existing records");
            setIsCheckingMilestones(true);
            checkNewScores(todaysMilestones).finally(() => {
                setIsCheckingMilestones(false);
            });
            setLastCheckedData(todaysDataString);
        } else if (!hasTodaysData) {
            console.log("No milestone data for today");
        } else if (todaysDataString === lastCheckedData) {
            console.log("Today's milestone data unchanged");
        } else if (isCheckingMilestones) {
            console.log("Skipping milestone check - already in progress");
        }
        
        console.log("Processed milestone data:", JSON.stringify(tempObject, null, 2))
        console.log("Today's milestones for checking:", JSON.stringify(todaysMilestones, null, 2))
        changePrepObject(tempObject)

    }, [items, report])

    function formatCurrency(amount = 0) {
        return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
    }

    // Helper function to safely get metric data
    const getMetricData = (period, metric) => {
        const data = prepObject[period]?.[metric];
        if (!data || Object.keys(data).length === 0) {
            return { value: 0, date: 'No data available' };
        }
        
        switch(metric) {
            case 'pulled':
                return { value: data.pulled || 0, date: data.dateTitle || 'N/A' };
            case 'sold':
                return { value: data.sold || 0, date: data.dateTitle || 'N/A' };
            case 'sales':
                return { value: data.sales || 0, date: data.dateTitle || 'N/A' };
            case 'spent':
                return { value: data.spent || 0, date: data.dateTitle || 'N/A' };
            case 'listed':
                return { value: data.listed || 0, date: data.dateTitle || 'N/A' };
            default:
                return { value: 0, date: 'N/A' };
        }
    };

    const renderMetricCard = (title, period) => {
        const purchasedData = getMetricData(period, 'pulled');
        const soldData = getMetricData(period, 'sold');
        const profitData = getMetricData(period, 'sales');
        const spentData = getMetricData(period, 'spent');
        const listedData = getMetricData(period, 'listed');

        return (
            <div className={Styles.metricCard}>
                <div className={Styles.cardHeader}>
                    <h3>{title}</h3>
                </div>
                <div className={Styles.cardBody}>
                    <div className={Styles.metric}>
                        <div className={Styles.metricInfo}>
                            <span className={Styles.metricLabel}>Purchased</span>
                            <span className={Styles.metricDate}>{purchasedData.date}</span>
                        </div>
                        <span className={Styles.metricValue}>{purchasedData.value}</span>
                    </div>
                    <div className={Styles.metric}>
                        <div className={Styles.metricInfo}>
                            <span className={Styles.metricLabel}>Sold</span>
                            <span className={Styles.metricDate}>{soldData.date}</span>
                        </div>
                        <span className={Styles.metricValue}>{soldData.value}</span>
                    </div>
                    <div className={Styles.metric}>
                        <div className={Styles.metricInfo}>
                            <span className={Styles.metricLabel}>Profit</span>
                            <span className={Styles.metricDate}>{profitData.date}</span>
                        </div>
                        <span className={`${Styles.metricValue} ${Styles.currency}`}>
                            {formatCurrency(profitData.value)}
                        </span>
                    </div>
                    <div className={Styles.metric}>
                        <div className={Styles.metricInfo}>
                            <span className={Styles.metricLabel}>Spent</span>
                            <span className={Styles.metricDate}>{spentData.date}</span>
                        </div>
                        <span className={Styles.metricValue}>
                            {formatCurrency(spentData.value)}
                        </span>
                    </div>
                    <div className={Styles.metric}>
                        <div className={Styles.metricInfo}>
                            <span className={Styles.metricLabel}>Listed</span>
                            <span className={Styles.metricDate}>{listedData.date}</span>
                        </div>
                        <span className={Styles.metricValue}>{listedData.value}</span>
                    </div>
                </div>
            </div>
        );
    };
    
    return (
        <div className={Styles.wrapper}>
            <div className={Styles.pageHeader}>
                <h1>Performance Milestones</h1>
                <p>Track your best performance records across different time periods for {currentYear}</p>
            </div>
            
            <div className={Styles.metricsGrid}>
                {renderMetricCard("Daily Records", "day")}
                {renderMetricCard("Weekly Records", "week")}
                {renderMetricCard("Monthly Records", "month")}
            </div>
            
            {showCongrats && latestMilestone && (
                <div className={Styles.congratsOverlay} onClick={() => {
                    setShowCongrats(false);
                    setLatestMilestone(null);
                }}>
                    <div className={Styles.congratsModal} onClick={(e) => e.stopPropagation()}>
                        <DisplayCongrats 
                            milestone={latestMilestone}
                            onClose={() => {
                                setShowCongrats(false);
                                setLatestMilestone(null);
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default Milestones