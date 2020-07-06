
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
            title: "",
            interval: 5
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

            return filteredItems.reduce((dataPoints, item) => {
                const dateSold = standardDate(item.dateSold);
                const price = profitSetToTrue ? +item.profit : +item.priceSold;
                const itemFoundIndex = dataPoints.findIndex(x => x.x === dateSold);
                if (itemFoundIndex !== -1){
                    dataPoints[itemFoundIndex] = {x: dateSold, y: dataPoints[itemFoundIndex].y + price};
                    return dataPoints;
                } else {
                    dataPoints.push({x: dateSold, y: price});
                    return dataPoints;
                }
            }, []).map(j => ({x: new Date(j.x), y: +j.y}));


        }
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

function daysIntoYear(dateString){
    const date = new Date(dateString);
    return (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 24 / 60 / 60 / 1000;
}