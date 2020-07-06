
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
    constructor(year, soldItems) {
        super(`Sales for year ${year}`);
        this.axisY = {
            title: "Sales",
            includeZero: false,
            prefix: "$"
        }
        this.axisX = {
            title: "Day of the Year",
            interval: 5
        }
        this.data = [{
            type: "column",
            toolTipContent: " {x}: ${y}",
            dataPoints: getYearDataPoints(soldItems)
        }]

        function getYearDataPoints(soldItems) {
            const dataPoints = [];
            const filteredItems = soldItems.filter(item => {
                try {
                    return item.dateSold.includes(year);
                } catch (e) {
                    console.log("Item with no Date Sold", item);
                    return false;
                }
            });
            const sortedItems = filteredItems.sort((a, b) => standardDateToNumber(a.dateSold) - standardDateToNumber(b.dateSold));
            sortedItems.forEach(item => dataPoints.push(
                { x: new Date(item.dateSold), y: +item.priceSold }
            ));
            console.log(dataPoints)
            return dataPoints;

        }
    }

}

function standardDateToNumber(value) {
    const dateArray = value.split("/");
    if (dateArray.length === 3) {
        dateArray[0] = dateArray[0].length === 1 ? `0${dateArray[0]}` : dateArray[0];
        dateArray[1] = dateArray[1].length === 1 ? `0${dateArray[1]}` : dateArray[1];
        const newValue = dateArray.join("");
        return newValue;
    }

    return value;

}

function daysIntoYear(dateString){
    const date = new Date(dateString);
    return (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 24 / 60 / 60 / 1000;
}