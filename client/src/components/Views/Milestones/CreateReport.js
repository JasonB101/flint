import React from 'react'

const CreateReport = (items, isProfit, yearToView) => {
    const reports = {
        day: {},
        week: {},
        month: {}
    }

    const formatDate = (date) => {
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const year = date.getFullYear()
        return `${month}/${day}/${year}`
    }

    const formatDateRange = (startDate, endDate) => {
        const formattedStartDate = formatDate(startDate)
        const formattedEndDate = formatDate(endDate)
        return `${formattedStartDate} - ${formattedEndDate}`
    }

    const formatMonth = (date) => {
        return date.toLocaleString('en-US', {
            month: 'long'
        })
    }

    const initializeReportEntry = (item, report, date, operation) => {
        const formattedDate = formatDate(date)
        const startDate = new Date(date)
        startDate.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1))
        const weekKey = formatDateRange(startDate, new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000))
        const monthKey = formatMonth(date)

        if (!report.day[formattedDate]) {
            report.day[formattedDate] = {
                listed: 0,
                sold: 0,
                sales: 0,
                pulled: 0,
                spent: 0
            }
        }
        if (!report.week[weekKey]) {
            report.week[weekKey] = {
                listed: 0,
                sold: 0,
                sales: 0,
                pulled: 0,
                spent: 0
            }
        }
        if (!report.month[monthKey]) {
            report.month[monthKey] = {
                listed: 0,
                sold: 0,
                sales: 0,
                pulled: 0,
                spent: 0
            }
        }

        if (operation === 'purchase') {
            const purchasePrice = item.purchasePrice
            report.day[formattedDate].pulled++
            report.day[formattedDate].spent = +(report.day[formattedDate].spent + purchasePrice).toFixed(2)
            report.week[weekKey].pulled++
            report.week[weekKey].spent = +(report.week[weekKey].spent + purchasePrice).toFixed(2)
            report.month[monthKey].pulled++
            report.month[monthKey].spent = +(report.month[monthKey].spent + purchasePrice).toFixed(2)

        } else if (operation === 'listed') {
            report.day[formattedDate].listed++
            report.week[weekKey].listed++
            report.month[monthKey].listed++
        } else if (operation === 'sold') {
            if (item.profit && item.priceSold) {
                report.day[formattedDate].sold++
                const soldPrice = isProfit ? item.profit : item.priceSold
                report.day[formattedDate].sales = +(report.day[formattedDate].sales + soldPrice).toFixed(2)
                report.week[weekKey].sold++
                report.week[weekKey].sales = +(report.week[weekKey].sales+ soldPrice).toFixed(2)
                report.month[monthKey].sold++
                report.month[monthKey].sales = +(report.month[monthKey].sales + soldPrice).toFixed(2)
            }
        }
    }

    items.forEach((item) => {
        const purchaseDate = new Date(item.datePurchased)
        const saleDate = new Date(item.dateSold)
        const listedDate = new Date(item.dateListed)

        if (item.datePurchased && purchaseDate.getFullYear() === yearToView) initializeReportEntry(item, reports, purchaseDate, 'purchase')
        if (item.dateSold && saleDate.getFullYear() === yearToView) initializeReportEntry(item, reports, saleDate, 'sold')
        if (item.dateListed && listedDate.getFullYear() === yearToView) initializeReportEntry(item, reports, listedDate, 'listed')
    })

    return filterReport(reports)
}

//REPORT FILTER

const filterReport = (report) => {
    const filteredReport = {
        day: {},
        week: {},
        month: {}
    }

    for (const category in report) {
        if (report.hasOwnProperty(category)) {
            const entries = Object.entries(report[category])

            // Create a dictionary to store the winning entries for each property
            const winningEntries = {
                listed: [],
                sold: [],
                sales: [],
                pulled: [],
                spent: [],
            }

            for (const [key, entry] of entries) {
                for (const property in entry) {
                    if (entry.hasOwnProperty(property) && property !== 'competition') {
                        const value = entry[property]
                        if (
                            !winningEntries[property].length ||
                            value > report[category][winningEntries[property][0]][property]
                        ) {
                            winningEntries[property] = [key]
                        } else if (value === report[category][winningEntries[property][0]][property]) {
                            winningEntries[property].push(key)
                        }
                    }
                }
            }

            // Add the winning entries to the filtered report with an array for competition
            for (const property in winningEntries) {
                if (winningEntries.hasOwnProperty(property)) {
                    const winnerKeys = winningEntries[property]
                    for (const winnerKey of winnerKeys) {
                        const winnerEntry = report[category][winnerKey]
                        if (!Array.isArray(winnerEntry.competition)) {
                            winnerEntry.competition = []
                        }
                        winnerEntry.competition.push(property)
                        filteredReport[category][winnerKey] = winnerEntry
                    }
                }
            }
        }
    }

    return filteredReport
}


export default CreateReport