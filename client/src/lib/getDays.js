const getDays = (date) => {
    if (date) {
        let yardDate = new Date(date)
        return Math.trunc(Math.abs((new Date()) - yardDate) / 8.64e7)
    }
}

export default getDays;