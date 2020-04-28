const getDaysSince = (date) => {
    if (date) {
        let newDate = new Date(date)
        return Math.trunc(Math.abs((new Date()) - newDate) / 8.64e7)
    }
}

export default getDaysSince;