
const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

class ChartOptions {
    constructor(title) {
        this.animationEnabled = true;
        this.exportEnabled = true;
        this.theme = "light1" // "light1", "dark1", "dark2";
        this.title = {
            text: title
        };

    }
}


export class YearSalesChart extends ChartOptions {
    constructor(year, soldItems, profitSetToTrue) {
        super(`${profitSetToTrue ? "Profits" : "Sales"} for year ${year}`);
        this.axisY = {
            title: "Sales",
            includeZero: false,
            prefix: "$"
        }
        this.axisX = {
            title: `Average ${profitSetToTrue ? "profit" : "sales"} per Day: ${false}`,
            interval: 7
        }
        this.data = [{
            type: "column",
            toolTipContent: " {x}: ${y}",
            dataPoints: getYearDataPoints(soldItems)
        }]


        function getYearDataPoints(soldItems) {
            const filteredItems = soldItems.filter(item => {
                try {
                    return item.dateSold.includes(year);
                } catch (e) {
                    console.log("Item with no Date Sold", item);
                    return false;
                }
            });

            const dataPoints = filteredItems.reduce((dataPoints, item) => {
                const dateSold = standardDate(item.dateSold);
                const price = profitSetToTrue ? +item.profit : +item.priceSold;
                const itemFoundIndex = dataPoints.findIndex(x => x.x === dateSold);
                if (itemFoundIndex !== -1) {
                    dataPoints[itemFoundIndex] = { x: dateSold, y: dataPoints[itemFoundIndex].y + price };
                    return dataPoints;
                } else {
                    dataPoints.push({ x: dateSold, y: price });
                    return dataPoints;
                }
            }, []).map(j => ({ x: new Date(j.x), y: +j.y.toFixed(2) }));

            return dataPoints;


        }
    }

}

export class YearSalesChartByWeek extends YearSalesChart {
    constructor(year, soldItems, profitSetToTrue) {
        super(year, soldItems, true);

        Date.prototype.getWeek = function () {
            var onejan = new Date(this.getFullYear(), 0, 1);
            return Math.ceil((((this - onejan) / 86400000) + onejan.getDay()) / 7);
        }

        this.data = [{
            type: "column",
            toolTipContent: " {label}: ${y}",
            dataPoints: fillInMissingWeeks(getYearDataPointsByWeek(soldItems))
                .sort((a, b) => +a.label.split(" ")[1] - +b.label.split(" ")[1])
        }]

        this.axisX = {
            title: `Average ${profitSetToTrue ? "profit" : "sales"} per week: ${getAverage(this.data[0].dataPoints)}`,
            interval: 1
        }

        function getYearDataPointsByWeek(soldItems) {
            const filteredItems = soldItems.filter(item => {
                try {
                    return item.dateSold.includes(year);
                } catch (e) {
                    console.log("Item with no Date Sold", item);
                    return false;
                }
            });

            const dataPoints = filteredItems.reduce((dataPoints, item) => {
                const dateSold = standardDate(item.dateSold);
                const price = profitSetToTrue ? +item.profit : +item.priceSold;
                const week = new Date(dateSold).getWeek()
                const month = new Date(dateSold).toLocaleString('default', { month: 'long' });

                const itemFoundIndex = dataPoints.findIndex(x => x.label.split(" ")[0] === String(week));
                if (itemFoundIndex !== -1) {
                    const dP = dataPoints[itemFoundIndex];
                    dataPoints[itemFoundIndex] = { label: `${week} ${checkAndMergeMonths(dP.label.split(" ")[1], month)}`, y: dataPoints[itemFoundIndex].y + price };
                    return dataPoints;
                } else {
                    dataPoints.push({ label: `${week} ${month}`, y: price });
                    return dataPoints;
                }
            }, [])
                .map(j => ({ label: `Week ${j.label}`, y: +j.y.toFixed(2) }));


            return dataPoints;

        }
    }
}

function checkAndMergeMonths(originalMonth, newMonth) {
    if (originalMonth === newMonth || originalMonth.includes("/")) return originalMonth;
    return `${originalMonth}/${newMonth}`
}

function fillInMissingWeeks(dataArray) {
    const allWeeks = [];
    const sorted = dataArray.sort((a, b) => +a.label.split(" ")[1] - +b.label.split(" ")[1]);
    if (sorted.length > 1 && sorted[0].label.split(" ")[1] !== 1) {
        sorted.unshift({ label: "Week 1 ", y: 0 });
    }
    sorted.forEach((dataPoint, index) => {
        const firstPoint = sorted[index - 1] ? +sorted[index - 1].label.split(" ")[1] : 1;
        const secondPoint = +dataPoint.label.split(" ")[1];

        if (secondPoint - firstPoint !== 1) {
            insertWeeks(firstPoint, secondPoint);
        }

        allWeeks.push(dataPoint);
    })

    function insertWeeks(low, high) {
        for (let i = low + 1; i < high; i++) {
            allWeeks.push({ label: `Week ${i} `, y: 0 });
        }
    }

    return allWeeks;

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
        const quantity = dataPoints.length - 7;
        const sum = dataPoints.reduce((sum, dp) => sum + +dp.y, 0);
        result = currencyFormatter.format(sum / quantity)
    }

    return result;

}
function daysIntoYear(dateString) {
    const date = new Date(dateString);
    return (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 24 / 60 / 60 / 1000;
}