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