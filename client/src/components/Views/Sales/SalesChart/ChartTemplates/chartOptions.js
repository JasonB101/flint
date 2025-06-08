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
    constructor(years, soldItems, profitSetToTrue) {
        super(`${profitSetToTrue ? "Profits" : "Sales"} by Year`);
        this.axisY = {
            title: profitSetToTrue ? "Profit" : "Sales",
            includeZero: true,
            prefix: "$"
        }
        this.data = [{
            type: "column",
            toolTipContent: "{label}: ${y}",
            dataPoints: getYearlyDataPoints(years, soldItems, profitSetToTrue),
        }]
        this.axisX = {
            title: "Year",
            interval: 1
        }

        function getYearlyDataPoints(years, soldItems, profitSetToTrue) {
            return years.map(year => {
                const yearItems = soldItems.filter(item => 
                    new Date(item.dateSold).getFullYear() === year
                );
                
                const totalValue = yearItems.reduce((sum, item) => {
                    return sum + (profitSetToTrue ? Number(item.profit) : Number(item.priceSold));
                }, 0);

                return {
                    label: year.toString(),
                    y: Number(totalValue.toFixed(2))
                };
            }).sort((a, b) => Number(a.label) - Number(b.label));
        }
    }
}

export class YearSalesChart extends ChartOptions {
    constructor(year, soldItems, profitSetToTrue) {
        super("");
        this.axisY = {
            title: "Sales",
            includeZero: false,
            prefix: "$"
        }
        
        const dataPoints = fillInMissingDays(getYearDataPoints(soldItems), year);
        
        this.data = [{
            type: "column",
            toolTipContent: " {x}: ${y}",
            dataPoints: dataPoints,
            backgroundColor: customColors
        }]
        this.axisX = {
            title: `Average ${profitSetToTrue ? "profit" : "sales"} per day: ${getAverage(dataPoints)}`,
            interval: 7,
            xValueType: "date",
            xValueFormatString: "MM/dd"
        }

        function getYearDataPoints(soldItems) {
            // Better date filtering - check actual year instead of string includes
            const filteredItems = soldItems.filter(item => {
                try {
                    const itemYear = new Date(item.dateSold).getFullYear();
                    return itemYear === year;
                } catch (e) {
                    console.log("Item with invalid Date Sold", item);
                    return false;
                }
            });

            const dataPoints = filteredItems.reduce((dataPoints, item) => {
                const dateSold = standardDate(item.dateSold);
                const price = profitSetToTrue ? +item.profit : +item.priceSold;
                const itemFoundIndex = dataPoints.findIndex(x => x.x.getTime() === new Date(dateSold).getTime());
                
                if (itemFoundIndex !== -1) {
                    dataPoints[itemFoundIndex] = { 
                        x: new Date(dateSold), 
                        y: dataPoints[itemFoundIndex].y + price 
                    };
                    return dataPoints;
                } else {
                    dataPoints.push({ x: new Date(dateSold), y: price });
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
    constructor(year, soldItems, profitSetToTrue) {
        super(year, soldItems, true);

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
            toolTipContent: " {label}: ${y}",
            dataPoints: fillInMissingWeeks(getYearDataPointsByWeek(soldItems), year),
        }]

        this.axisX = {
            title: `Average ${profitSetToTrue ? "profit" : "sales"} per week: ${getAverage(this.data[0].dataPoints)}`,
            interval: 1
        }
        this.axisY = {
            includeZero: true,
        }

        function getYearDataPointsByWeek(soldItems) {
            const filteredItems = soldItems.filter(item => {
                try {
                    const itemYear = new Date(item.dateSold).getFullYear();
                    return itemYear === year;
                } catch (e) {
                    console.log("Item with invalid Date Sold", item);
                    return false;
                }
            });
            
            filteredItems.sort((a, b) => {
                let valA = a.dateSold
                let valB = b.dateSold
                function dateToTime(value) {
                    return Number(new Date(String(value)).getTime())
                }
                return dateToTime(valA) - dateToTime(valB)
            })

            const dataPoints = filteredItems.reduce((dataPoints, item) => {
                const dateSold = standardDate(item.dateSold);
                const price = profitSetToTrue ? +item.profit : +item.priceSold;
                const week = new Date(dateSold).getWeek()
                const month = new Date(dateSold).toLocaleString('default', { month: 'short' });

                const itemFoundIndex = dataPoints.findIndex(x => +x.label.replace('W', '') === week);
                if (itemFoundIndex !== -1) {
                    const dP = dataPoints[itemFoundIndex];
                    dataPoints[itemFoundIndex] = { 
                        label: `W${week}`, 
                        y: dataPoints[itemFoundIndex].y + price 
                    };
                    return dataPoints;
                } else {
                    dataPoints.push({ label: `W${week}`, y: price });
                    return dataPoints;
                }
            }, []);

            return dataPoints;
        }
    }
}
export class YearSalesChartByMonth extends YearSalesChart {
    constructor(year, soldItems, profitSetToTrue) {
        super(year, soldItems, true);

        this.data = [{
            type: "column",
            toolTipContent: " {label}: ${y}",
            dataPoints: fillInMissingMonths(getYearDataPointsByMonth(soldItems), year)
                .sort((a, b) => {
                    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                    return months.indexOf(a.label) - months.indexOf(b.label);
                }),
        }]

        this.axisX = {
            title: `Average ${profitSetToTrue ? "profit" : "sales"} per month: ${getAverage(this.data[0].dataPoints)}`,
            interval: 1
        }
        this.axisY = {
            includeZero: true,
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
                    const itemYear = new Date(item.dateSold).getFullYear();
                    return itemYear === year;
                } catch (e) {
                    console.log("Item with invalid Date Sold", item);
                    return false;
                }
            });

            const dataPoints = filteredItems.reduce((dataPoints, item) => {
                const dateSold = standardDate(item.dateSold);
                const price = profitSetToTrue ? +item.profit : +item.priceSold;
                const month = new Date(dateSold).toLocaleString('default', { month: 'long' });

                const itemFoundIndex = dataPoints.findIndex(x => x.label === month);
                if (itemFoundIndex !== -1) {
                    dataPoints[itemFoundIndex] = { label: month, y: dataPoints[itemFoundIndex].y + price };
                    return dataPoints;
                } else {
                    dataPoints.push({ label: month, y: price });
                    return dataPoints;
                }
            }, [])
                .map(j => ({ label: j.label, y: +j.y.toFixed(2) }));

            return dataPoints;
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

function getAverage(dataPoints) {
    let result = "";
    if (dataPoints) {
        const quantity = dataPoints.length;
        const sum = dataPoints.reduce((sum, dp) => sum + +dp.y, 0);
        result = currencyFormatter.format(sum / quantity)
    }

    return result;
}

function daysIntoYear(dateString) {
    const date = new Date(dateString);
    return (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 24 / 60 / 60 / 1000;
}
