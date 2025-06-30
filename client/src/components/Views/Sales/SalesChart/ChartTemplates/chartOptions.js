const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

const customColors = [
    'blue',
    'red',
    'black',
    // Add more colors as needed
  ]

class ChartOptions {
    constructor(title) {
        this.animationEnabled = true;
        this.exportEnabled = true;
        this.theme = "light2" // "light1", "dark1", "dark2";
        this.title = {
            text: title
        };

    }
}

export class MultiYearSalesChart extends ChartOptions {
    constructor(years, soldItems, profitSetToTrue, salesSetToTrue) {
        const metricName = salesSetToTrue ? "Sales Count" : profitSetToTrue ? "Profits" : "Revenue";
        super(`${metricName} by Year`);
        this.axisY = {
            title: metricName,
            includeZero: true,
            prefix: salesSetToTrue ? "" : "$"
        }
        this.data = [{
            type: "column",
            toolTipContent: salesSetToTrue ? "{label}: {y} items" : "{label}: ${y}",
            dataPoints: getYearlyDataPoints(years, soldItems, profitSetToTrue, salesSetToTrue),
        }]
        this.axisX = {
            title: "Year",
            interval: 1
        }

        function getYearlyDataPoints(years, soldItems, profitSetToTrue, salesSetToTrue) {
            return years.map(year => {
                const yearItems = soldItems.filter(item => {
                    const relevantDate = item.sold ? item.dateSold : item.dateWasted;
                    return relevantDate && new Date(relevantDate).getFullYear() === year;
                });
                
                let totalValue;
                if (salesSetToTrue) {
                    totalValue = yearItems.filter(item => item.sold).length;
                } else if (profitSetToTrue) {
                    totalValue = yearItems.reduce((sum, item) => sum + Number(item.profit), 0);
                } else { // Revenue
                    totalValue = yearItems.reduce((sum, item) => sum + (item.sold ? Number(item.priceSold) : 0), 0);
                }

                return {
                    label: year.toString(),
                    y: Number(totalValue.toFixed(2))
                };
            }).sort((a, b) => Number(a.label) - Number(b.label));
        }
    }
}

export class YearSalesChart extends ChartOptions {
    constructor(year, soldItems, profitSetToTrue, salesSetToTrue) {
        const metricName = salesSetToTrue ? "Sales Count" : profitSetToTrue ? "Profit" : "Revenue";
        super("");
        this.axisY = {
            title: metricName,
            includeZero: false,
            prefix: salesSetToTrue ? "" : "$"
        }
        
        const dataPoints = fillInMissingDays(getYearDataPoints(soldItems), year);
        
        this.data = [{
            type: "column",
            toolTipContent: salesSetToTrue ? " {x}: {y} items" : " {x}: ${y}",
            dataPoints: dataPoints,
            backgroundColor: customColors
        }]
        this.axisX = {
            title: `Average ${metricName.toLowerCase()} per day: ${getAverage(dataPoints, salesSetToTrue)}`,
            interval: 7,
            xValueType: "date",
            xValueFormatString: "MM/dd"
        }

        function getYearDataPoints(soldItems) {
            // Better date filtering - check actual year instead of string includes
            const filteredItems = soldItems.filter(item => {
                try {
                    const relevantDate = item.sold ? item.dateSold : item.dateWasted;
                    const itemYear = relevantDate ? new Date(relevantDate).getFullYear() : null;
                    return itemYear === year;
                } catch (e) {
                    console.log("Item with invalid Date Sold", item);
                    return false;
                }
            });

            const dataPoints = filteredItems.reduce((dataPoints, item) => {
                const relevantDate = item.sold ? item.dateSold : item.dateWasted;
                const dateSold = standardDate(relevantDate);
                
                let value;
                if (salesSetToTrue) {
                    value = item.sold ? 1 : 0;
                } else if (profitSetToTrue) {
                    value = +item.profit;
                } else { // Revenue
                    value = item.sold ? +item.priceSold : 0;
                }
                
                const itemFoundIndex = dataPoints.findIndex(x => x.x.getTime() === new Date(dateSold).getTime());
                
                if (itemFoundIndex !== -1) {
                    dataPoints[itemFoundIndex] = { 
                        x: new Date(dateSold), 
                        y: dataPoints[itemFoundIndex].y + value 
                    };
                    return dataPoints;
                } else {
                    dataPoints.push({ x: new Date(dateSold), y: value });
                    return dataPoints;
                }
            }, []);

            // Sort by date before returning
            return dataPoints.sort((a, b) => a.x.getTime() - b.x.getTime())
                            .map(j => ({ x: j.x, y: +j.y.toFixed(2) }));
        }
    }
}

export class YearSalesChartByWeek extends YearSalesChart {
    constructor(year, soldItems, profitSetToTrue, salesSetToTrue) {
        super(year, soldItems, true, false);
        const metricName = salesSetToTrue ? "Sales Count" : profitSetToTrue ? "Profit" : "Revenue";

        // Define week calculation for Sunday-Saturday weeks
        Date.prototype.getWeek = function () {
            const onejan = new Date(this.getFullYear(), 0, 1);
            const dayOfYear = Math.floor((this - onejan) / 86400000) + 1;
            
            // Adjust for Sunday start (getDay() returns 0 for Sunday)
            const janFirst = onejan.getDay(); // 0 = Sunday, 1 = Monday, etc.
            const daysToFirstSunday = (7 - janFirst) % 7;
            
            if (dayOfYear <= daysToFirstSunday) {
                return 1; // First partial week
            }
            
            return Math.ceil((dayOfYear - daysToFirstSunday) / 7) + 1;
        }

        this.data = [{
            type: "column",
            toolTipContent: salesSetToTrue ? " {label}: {y} items" : " {label}: ${y}",
            dataPoints: fillInMissingWeeks(getYearDataPointsByWeek(soldItems), year),
        }]

        this.axisX = {
            title: `Average ${metricName.toLowerCase()} per week: ${getAverage(this.data[0].dataPoints, salesSetToTrue)}`,
            interval: 1
        }
        this.axisY = {
            includeZero: true,
            prefix: salesSetToTrue ? "" : "$"
        }

        function getYearDataPointsByWeek(soldItems) {
            const filteredItems = soldItems.filter(item => {
                try {
                    const relevantDate = item.sold ? item.dateSold : item.dateWasted;
                    const itemYear = relevantDate ? new Date(relevantDate).getFullYear() : null;
                    return itemYear === year;
                } catch (e) {
                    console.log("Item with invalid Date Sold", item);
                    return false;
                }
            });
            
            filteredItems.sort((a, b) => {
                let valA = a.dateSold || a.dateWasted
                let valB = b.dateSold || b.dateWasted
                function dateToTime(value) {
                    return Number(new Date(String(value)).getTime())
                }
                return dateToTime(valA) - dateToTime(valB)
            })

            const dataPoints = filteredItems.reduce((dataPoints, item) => {
                const relevantDate = item.sold ? item.dateSold : item.dateWasted;
                const dateSold = standardDate(relevantDate);
                
                let value;
                if (salesSetToTrue) {
                    value = item.sold ? 1 : 0;
                } else if (profitSetToTrue) {
                    value = +item.profit;
                } else { // Revenue
                    value = item.sold ? +item.priceSold : 0;
                }
                
                const week = new Date(dateSold).getWeek()
                const month = new Date(dateSold).toLocaleString('default', { month: 'short' });

                const itemFoundIndex = dataPoints.findIndex(x => +x.label.replace('W', '') === week);
                if (itemFoundIndex !== -1) {
                    const dP = dataPoints[itemFoundIndex];
                    dataPoints[itemFoundIndex] = { 
                        label: `W${week}`, 
                        y: dataPoints[itemFoundIndex].y + value 
                    };
                    return dataPoints;
                } else {
                    dataPoints.push({ label: `W${week}`, y: value });
                    return dataPoints;
                }
            }, []);

            return dataPoints;
        }
    }
}

export class YearSalesChartByMonth extends YearSalesChart {
    constructor(year, soldItems, profitSetToTrue, salesSetToTrue) {
        super(year, soldItems, true, false);
        const metricName = salesSetToTrue ? "Sales Count" : profitSetToTrue ? "Profit" : "Revenue";

        this.data = [{
            type: "column",
            toolTipContent: salesSetToTrue ? " {label}: {y} items" : " {label}: ${y}",
            dataPoints: fillInMissingMonths(getYearDataPointsByMonth(soldItems), year)
                .sort((a, b) => {
                    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                    return months.indexOf(a.label) - months.indexOf(b.label);
                }),
        }]

        this.axisX = {
            title: `Average ${metricName.toLowerCase()} per month: ${getAverage(this.data[0].dataPoints, salesSetToTrue)}`,
            interval: 1
        }
        this.axisY = {
            includeZero: true,
            prefix: salesSetToTrue ? "" : "$"
        }
        
        function fillInMissingMonths(dataPoints, year) {
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const newDataPoints = [];
            
            // Determine maximum month to show
            let maxMonth;
            if (year < new Date().getFullYear()) {
                // For past years, show all 12 months
                maxMonth = 11; // December (0-indexed)
            } else {
                // For current year, show up to current month
                maxMonth = new Date().getMonth();
            }
            
            // Show months up to maxMonth
            for (let i = 0; i <= maxMonth; i++) {
                const foundIndex = dataPoints.findIndex(x => x.label === months[i])
                if (foundIndex !== -1) {
                    newDataPoints.push(dataPoints[foundIndex])
                } else {
                    newDataPoints.push({ label: months[i], y: 0, color: customColors[ Math.floor(Math.random() * customColors.length)] })
                }
            }

            return newDataPoints;
        }

        function getYearDataPointsByMonth(soldItems) {
            // Better date filtering - check actual year instead of string includes
            const filteredItems = soldItems.filter(item => {
                try {
                    const relevantDate = item.sold ? item.dateSold : item.dateWasted;
                    const itemYear = relevantDate ? new Date(relevantDate).getFullYear() : null;
                    return itemYear === year;
                } catch (e) {
                    console.log("Item with invalid Date Sold", item);
                    return false;
                }
            });

            const dataPoints = filteredItems.reduce((dataPoints, item) => {
                const relevantDate = item.sold ? item.dateSold : item.dateWasted;
                const dateSold = standardDate(relevantDate);
                
                let value;
                if (salesSetToTrue) {
                    value = item.sold ? 1 : 0;
                } else if (profitSetToTrue) {
                    value = +item.profit;
                } else { // Revenue
                    value = item.sold ? +item.priceSold : 0;
                }
                
                const month = new Date(dateSold).toLocaleString('default', { month: 'long' });

                const itemFoundIndex = dataPoints.findIndex(x => x.label === month);
                if (itemFoundIndex !== -1) {
                    dataPoints[itemFoundIndex] = { label: month, y: dataPoints[itemFoundIndex].y + value };
                    return dataPoints;
                } else {
                    dataPoints.push({ label: month, y: value });
                    return dataPoints;
                }
            }, [])
                .map(j => ({ label: j.label, y: +j.y.toFixed(2) }));

            return dataPoints;
        }
    }
}

// New chart class for days range (7, 30, 90 days)
export class DaysRangeChart extends ChartOptions {
    constructor(days, soldItems, profitSetToTrue, salesSetToTrue) {
        const metricName = salesSetToTrue ? "Sales Count" : profitSetToTrue ? "Profit" : "Revenue";
        super(`${metricName} - Last ${days} Days`);
        
        this.axisY = {
            title: metricName,
            includeZero: true,
            prefix: salesSetToTrue ? "" : "$"
        }
        
        const dataPoints = getDaysRangeDataPoints(days, soldItems, profitSetToTrue, salesSetToTrue);
        
        this.data = [{
            type: "column",
            toolTipContent: salesSetToTrue ? " {x}: {y} items" : " {x}: ${y}",
            dataPoints: dataPoints,
        }]
        
        this.axisX = {
            title: `Daily ${metricName}`,
            interval: days > 30 ? Math.ceil(days / 10) : 1,
            xValueType: "date",
            xValueFormatString: days <= 30 ? "MM/dd" : "MM/dd/yy"
        }

        function getDaysRangeDataPoints(days, soldItems, profitSetToTrue, salesSetToTrue) {
            const now = new Date();
            const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
            
            const filteredItems = soldItems.filter(item => {
                const relevantDate = item.sold ? item.dateSold : item.dateWasted;
                if (!relevantDate) return false;
                const itemDate = new Date(relevantDate);
                return itemDate >= startDate && itemDate <= now;
            });

            const dataPointsMap = {};
            
            // Initialize all days with 0
            for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
                const dateKey = new Date(d).toDateString();
                dataPointsMap[dateKey] = { x: new Date(d), y: 0 };
            }
            
            // Add actual data
            filteredItems.forEach(item => {
                const relevantDate = item.sold ? item.dateSold : item.dateWasted;
                const itemDate = new Date(relevantDate);
                const dateKey = itemDate.toDateString();
                
                if (dataPointsMap[dateKey]) {
                    let value;
                    if (salesSetToTrue) {
                        value = item.sold ? 1 : 0;
                    } else if (profitSetToTrue) {
                        value = +item.profit;
                    } else { // Revenue
                        value = item.sold ? +item.priceSold : 0;
                    }
                    dataPointsMap[dateKey].y += value;
                }
            });
            
            return Object.values(dataPointsMap)
                .sort((a, b) => a.x.getTime() - b.x.getTime())
                .map(point => ({ x: point.x, y: +point.y.toFixed(2) }));
        }
    }
}

// New chart class for months range (6, 12 months)
export class MonthsRangeChart extends ChartOptions {
    constructor(months, soldItems, profitSetToTrue, salesSetToTrue) {
        const metricName = salesSetToTrue ? "Sales Count" : profitSetToTrue ? "Profit" : "Revenue";
        super(`${metricName} - Last ${months} Months`);
        
        this.axisY = {
            title: metricName,
            includeZero: true,
            prefix: salesSetToTrue ? "" : "$"
        }
        
        const dataPoints = getMonthsRangeDataPoints(months, soldItems, profitSetToTrue, salesSetToTrue);
        
        this.data = [{
            type: "column",
            toolTipContent: salesSetToTrue ? " {label}: {y} items" : " {label}: ${y}",
            dataPoints: dataPoints,
        }]
        
        this.axisX = {
            title: `Monthly ${metricName}`,
            interval: 1
        }

        function getMonthsRangeDataPoints(months, soldItems, profitSetToTrue, salesSetToTrue) {
            const now = new Date();
            const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
            
            const filteredItems = soldItems.filter(item => {
                const relevantDate = item.sold ? item.dateSold : item.dateWasted;
                if (!relevantDate) return false;
                const itemDate = new Date(relevantDate);
                return itemDate >= startDate && itemDate <= now;
            });

            const monthsMap = {};
            
            // Initialize all months with 0
            for (let d = new Date(startDate); d <= now; d.setMonth(d.getMonth() + 1)) {
                const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
                const monthLabel = d.toLocaleString('default', { month: 'short', year: 'numeric' });
                monthsMap[monthKey] = { label: monthLabel, y: 0, sortDate: new Date(d) };
            }
            
            // Add actual data
            filteredItems.forEach(item => {
                const relevantDate = item.sold ? item.dateSold : item.dateWasted;
                const itemDate = new Date(relevantDate);
                const monthKey = `${itemDate.getFullYear()}-${itemDate.getMonth()}`;
                
                if (monthsMap[monthKey]) {
                    let value;
                    if (salesSetToTrue) {
                        value = item.sold ? 1 : 0;
                    } else if (profitSetToTrue) {
                        value = +item.profit;
                    } else { // Revenue
                        value = item.sold ? +item.priceSold : 0;
                    }
                    monthsMap[monthKey].y += value;
                }
            });
            
            return Object.values(monthsMap)
                .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime())
                .map(point => ({ label: point.label, y: +point.y.toFixed(2) }));
        }
    }
}

///Methods//////////////////////////

function checkAndMergeMonths(originalMonth, newMonth) {
    if (originalMonth === newMonth || originalMonth.includes("/")) return originalMonth;
    return `${originalMonth}/${newMonth}`
}
function fillInMissingDays(dataArray, year) {
    // If no year provided, return empty array
    if (!year) {
        console.log('No year provided to fillInMissingDays');
        return dataArray;
    }
    
    const currentYear = new Date().getFullYear();
    const today = new Date();
    
    // Determine how many days to show
    let maxDay;
    if (year < currentYear) {
        // For past years, show all 365/366 days
        const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        maxDay = isLeapYear ? 366 : 365;
    } else {
        // For current year, calculate days from Jan 1 to today
        const jan1 = new Date(year, 0, 1); // January 1st
        const diffTime = today.getTime() - jan1.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        maxDay = diffDays + 1; // +1 to include today
    }

    // Create a map of existing days for easy lookup
    const existingDaysMap = {};
    dataArray.forEach(dp => {
        const dayNum = getDay(dp.x);
        existingDaysMap[dayNum] = dp;
    });
    
    // Create complete year data
    const completeYear = [];
    for (let day = 1; day <= maxDay; day++) {
        if (existingDaysMap[day]) {
            completeYear.push(existingDaysMap[day]);
        } else {
            // Create missing day with zero value and proper date
            const date = new Date(year, 0, day);
            completeYear.push({ x: date, y: 0 });
        }
    }

    // Sort by date to ensure proper order
    return completeYear.sort((a, b) => a.x.getTime() - b.x.getTime());
}

function getDay(date) {
    if (typeof (date) === "string") date = new Date(date);
    const start = new Date(date.getFullYear(), 0, 1); // January 1st of the year
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const day = Math.floor(diff / oneDay) + 1; // +1 because Jan 1st should be day 1
    return day;
}
function fillInMissingWeeks(data, year) {
    const filledData = [];
    
    // Determine maximum week to show
    let maxWeek;
    if (year < new Date().getFullYear()) {
        // For past years, show all 52 weeks
        maxWeek = 52;
    } else {
        // For current year, show up to current week
        const now = new Date();
        maxWeek = now.getWeek ? now.getWeek() : getCurrentWeek();
    }
    
    let lastMonth = null;
    
    // Create weeks up to maxWeek
    for (let week = 1; week <= maxWeek; week++) {
        const existingWeek = data.find(item => +item.label.replace('W', '') === week);
        
        // Get the month for this week (approximate middle of week)
        const weekMonth = getMonthForWeek(week, year);
        
        // Determine label format
        let label;
        if (lastMonth === null || weekMonth !== lastMonth) {
            // First week or month changed - include month abbreviation
            label = week === 1 ? `W${week}` : `${weekMonth} W${week}`;
            lastMonth = weekMonth;
        } else {
            // Same month as previous week
            label = `W${week}`;
        }
        
        if (existingWeek) {
            filledData.push({
                label: label,
                y: +existingWeek.y.toFixed(2)
            });
        } else {
            filledData.push({
                label: label,
                y: 0
            });
        }
    }
    
    return filledData;
    
    // Helper function to get current week if getWeek is not available
    function getCurrentWeek() {
        const now = new Date();
        const onejan = new Date(now.getFullYear(), 0, 1);
        const dayOfYear = Math.floor((now - onejan) / 86400000) + 1;
        
        // Adjust for Sunday start
        const janFirst = onejan.getDay();
        const daysToFirstSunday = (7 - janFirst) % 7;
        
        if (dayOfYear <= daysToFirstSunday) {
            return 1;
        }
        
        return Math.ceil((dayOfYear - daysToFirstSunday) / 7) + 1;
    }
    
    // Helper function to get month abbreviation for a given week
    function getMonthForWeek(weekNumber, year) {
        // Calculate approximate date for middle of the week (Wednesday)
        const firstSunday = getFirstSundayOfYear(year);
        const weekStart = new Date(firstSunday.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000);
        const midWeek = new Date(weekStart.getTime() + 3 * 24 * 60 * 60 * 1000); // Wednesday
        
        return midWeek.toLocaleString('default', { month: 'short' });
    }
    
    // Helper function to find the first Sunday of the year
    function getFirstSundayOfYear(year) {
        const jan1 = new Date(year, 0, 1);
        const daysToFirstSunday = (7 - jan1.getDay()) % 7;
        return new Date(year, 0, 1 + daysToFirstSunday);
    }
}

function standardDate(value) {
    const dateArray = value.split("/");
    if (dateArray.length === 3) {
        dateArray[0] = dateArray[0].length === 1 ? `0${dateArray[0]}` : dateArray[0];
        dateArray[1] = dateArray[1].length === 1 ? `0${dateArray[1]}` : dateArray[1];
        const newValue = dateArray.join("/");
        return newValue;
    }

    return value;
}

function getAverage(dataPoints, salesSetToTrue = false) {
    let result = "";
    if (dataPoints) {
        const quantity = dataPoints.length;
        const sum = dataPoints.reduce((sum, dp) => sum + +dp.y, 0);
        const average = sum / quantity;
        
        if (salesSetToTrue) {
            result = average.toFixed(1) + " items";
        } else {
            result = currencyFormatter.format(average);
        }
    }

    return result;
}

function daysIntoYear(dateString) {
    const date = new Date(dateString);
    return (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 24 / 60 / 60 / 1000;
}
