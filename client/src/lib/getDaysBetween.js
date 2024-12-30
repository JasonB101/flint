const getDaysBetween = (date1, date2) => {
    if (date1 && date2) {
        let newDate1 = new Date(date1)
        let newDate2 = new Date(date2)
        return Math.trunc(Math.abs(newDate2 - newDate1) / 8.64e7)
    }
}

export default getDaysBetween;