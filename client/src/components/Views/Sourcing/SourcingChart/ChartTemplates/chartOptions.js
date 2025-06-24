const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

const customColors = [
  "blue",
  "red",
  "black",
  // Add more colors as needed
]

class ChartOptions {
  constructor(title) {
    this.animationEnabled = true
    this.exportEnabled = true
    this.theme = "light2" // "light1", "dark1", "dark2";
    this.title = {
      text: title,
    }
  }
}

export class YearSourcingChart extends ChartOptions {
  constructor(year, items) {
    super(`Sourced for year ${year}`)
    this.axisY = {
      title: "Sourcing",
      includeZero: false,
    }
    this.data = [
      {
        type: "column",
        toolTipContent: " {x}: {y}  ~${m} {l}",
        dataPoints: getYearDataPoints(items),
        backgroundColor: customColors,
      },
    ]
    this.axisX = {
      title: `Average Sourcing per day: ${getAverage(
        fillInMissingDays(this.data[0].dataPoints)
      )}`,
      interval: 7,
      xValueType: "date",
      xValueFormatString: "MM/dd",
    }

    function getYearDataPoints(items) {
      const filteredItems = items.filter((item) => {
        try {
          return item.datePurchased.includes(year)
        } catch (e) {
          console.log("Item with no purchase date", item)
          return false
        }
      })

      const dataPoints = filteredItems
        .reduce((dataPoints, item) => {
          const datePurchased = standardDate(item.datePurchased)
          const profit = +item.profit || +item.expectedProfit
          const location = item.purchaseLocation
          const itemFoundIndex = dataPoints.findIndex(
            (x) => x.x === datePurchased
          )
          if (itemFoundIndex !== -1) {
            let foundItem = dataPoints[itemFoundIndex]
            dataPoints[itemFoundIndex] = {
              x: datePurchased,
              y: dataPoints[itemFoundIndex].y + 1,
              m: +(dataPoints[itemFoundIndex].m + profit).toFixed(2),
              locations: foundItem["locations"][location]
                ? {
                    ...foundItem["locations"],
                    [location]: {
                      money: +(
                        foundItem["locations"][location]["money"] + profit
                      ).toFixed(2),
                      count: foundItem["locations"][location]["count"] + 1,
                    },
                  }
                : {
                    ...foundItem["locations"],
                    [location]: { money: profit, count: 1 },
                  },
            }
            return dataPoints
          } else {
            dataPoints.push({
              x: datePurchased,
              y: 1,
              m: +profit,
              locations: { [location]: { money: profit, count: 1 } },
            })
            return dataPoints
          }
        }, []).map((j) => {
            const { locations } = j
            const locationTip = Object.keys(locations).reduce((tip, location) => {
              let data = locations[location]
              let newTip = `${tip} [${location}: ${data.count} - $${data.money}]`.trim()
              return newTip
            }, "")
            return { x: new Date(j.x), y: j.y, m: j.m, l: locationTip }
          })

      return dataPoints
    }
  }
}

export class YearSourcingChartByWeek extends YearSourcingChart {
  constructor(year, items) {
    super(year, items)

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

    this.data = [
      {
        type: "column",
        toolTipContent: " {label}: {y} ~${m} {l}",
        dataPoints: fillInMissingWeeks(getYearDataPointsByWeek(items)),
        // .sort((a, b) => +a.label.split(" ")[1] - +b.label.split(" ")[1])
      },
    ]

    this.axisX = {
      title: `Average Sourcing per week: ${getAverage(
        this.data[0].dataPoints
      )}`,
      interval: 1,
    }

    function getYearDataPointsByWeek(items) {
      const filteredItems = items.filter((item) => {
        try {
          return item.datePurchased.includes(year)
        } catch (e) {
          console.log("Item with no purchase date", item)
          return false
        }
      })
      filteredItems.sort((a, b) => {
        let valA = a.datePurchased
        let valB = b.datePurchased
        function dateToTime(value) {
          return Number(new Date(String(value)).getTime())
        }
        return dateToTime(valA) - dateToTime(valB)
      })

      const dataPoints = filteredItems
        .reduce((dataPoints, item) => {
          const datePurchased = standardDate(item.datePurchased)
          const profit = +item.profit || +item.expectedProfit
          const location = item.purchaseLocation
          const week = new Date(datePurchased).getWeek()
          const month = new Date(datePurchased).toLocaleString("default", {
            month: "short",
          })

          const itemFoundIndex = dataPoints.findIndex(
            (x) => x.label.split(" ")[0] === String(week)
          )
          if (itemFoundIndex !== -1) {
            let foundItem = dataPoints[itemFoundIndex]
            const dP = dataPoints[itemFoundIndex]
            dataPoints[itemFoundIndex] = {
              label: `${week} ${checkAndMergeMonths(
                dP.label.split(" ")[1],
                month
              )}`,
              y: dataPoints[itemFoundIndex].y + 1,
              m: +(dataPoints[itemFoundIndex].m + profit).toFixed(2),
              locations: foundItem["locations"][location]
                ? {
                    ...foundItem["locations"],
                    [location]: {
                      money: +(
                        foundItem["locations"][location]["money"] + profit
                      ).toFixed(2),
                      count: foundItem["locations"][location]["count"] + 1,
                    },
                  }
                : {
                    ...foundItem["locations"],
                    [location]: { money: profit, count: 1 },
                  },
            }
            return dataPoints
          } else {
            dataPoints.push({
              label: `${week} ${month}`,
              y: 1,
              m: +profit,
              locations: { [location]: { money: profit, count: 1 } },
            })
            return dataPoints
          }
        }, [])
        .map((j) => {
          const { locations } = j
          const locationTip = Object.keys(locations).reduce((tip, location) => {
            let data = locations[location]
            let newTip =
              `${tip} [${location}: ${data.count} - $${data.money}]`.trim()
            return newTip
          }, "")
          return { label: `W${j.label}`, y: j.y, m: j.m, l: locationTip }
        })

      return dataPoints
    }
  }
}
export class YearSourcingChartByMonth extends YearSourcingChart {
  constructor(year, items) {
    super(year, items)

    this.data = [
      {
        type: "column",
        toolTipContent: " {label}: {y} ~${m} {l}",
        dataPoints: fillInMissingMonths(getYearDataPointsByMonth(items)).sort(
          (a, b) => +a.label.split(" ")[1] - +b.label.split(" ")[1]
        ),
        // color: customColors[ Math.floor(Math.random() * customColors.length)]
      },
    ]

    this.axisX = {
      title: `Average Sourcing per month: ${getAverage(
        this.data[0].dataPoints
      )}`,
      interval: 1,
    }
    this.axisY = {
      includeZero: true,
    }
    function fillInMissingMonths(dataPoints) {
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ]
      const newDataPoints = []
      const maxMonth = dataPoints.reduce((highestMonth, dp) => {
        if (highestMonth < months.indexOf(dp.label))
          return months.indexOf(dp.label)
        return highestMonth
      }, 0)

      for (let i = 0; i <= maxMonth; i++) {
        const foundIndex = dataPoints.findIndex((x) => x.label === months[i])
        if (foundIndex !== -1) {
          newDataPoints.push(dataPoints[foundIndex])
        } else {
          newDataPoints.push({
            label: months[i],
            y: 0,
            color:
              customColors[Math.floor(Math.random() * customColors.length)],
          })
        }
      }

      return newDataPoints
    }

    function getYearDataPointsByMonth(items) {
      const filteredItems = items.filter((item) => {
        try {
          return item.datePurchased.includes(year)
        } catch (e) {
          console.log("Item with no purchase date", item)
          return false
        }
      })

      const dataPoints = filteredItems
        .reduce((dataPoints, item) => {
          const datePurchased = standardDate(item.datePurchased)
          const profit = +item.profit || +item.expectedProfit
          const location = item.purchaseLocation
          const month = new Date(datePurchased).toLocaleString("default", {
            month: "long",
          })

          const itemFoundIndex = dataPoints.findIndex((x) => x.label === month)
          if (itemFoundIndex !== -1) {
            let foundItem = dataPoints[itemFoundIndex]
            dataPoints[itemFoundIndex] = {
              label: month,
              y: dataPoints[itemFoundIndex].y + 1,
              m: +(dataPoints[itemFoundIndex].m + profit).toFixed(2),
              locations: foundItem["locations"][location]
                ? {
                    ...foundItem["locations"],
                    [location]: {
                      money: +(
                        foundItem["locations"][location]["money"] + profit
                      ).toFixed(2),
                      count: foundItem["locations"][location]["count"] + 1,
                    },
                  }
                : {
                    ...foundItem["locations"],
                    [location]: { money: profit, count: 1 },
                  },
            }
            return dataPoints
          } else {
            dataPoints.push({
              label: month,
              y: 1,
              m: +profit,
              locations: { [location]: { money: profit, count: 1 } },
            })
            return dataPoints
          }
        }, [])
        .map((j) => {
          const { locations } = j
          const locationTip = Object.keys(locations).reduce((tip, location) => {
            let data = locations[location]
            let newTip =
              `${tip} [${location}: ${data.count} - $${data.money}]`.trim()
            return newTip
          }, "")
          return { label: j.label, y: j.y, m: j.m, l: locationTip }
        })

      return dataPoints
    }
  }
}

///Methods//////////////////////////

function checkAndMergeMonths(originalMonth, newMonth) {
  if (originalMonth === newMonth || originalMonth.includes("/"))
    return originalMonth
  return `${originalMonth}/${newMonth}`
}
function fillInMissingDays(dataArray) {
  //get day  for i < length - day
  const newArray = [...dataArray]
  const maxDay = newArray.reduce((highestDay, dp) => {
    if (highestDay < getDay(dp.x)) return getDay(dp.x)
    return highestDay
  }, 1)
  // console.log(maxDay)
  const difference = maxDay - newArray.length
  const difference2 = new Date().getDay() - newArray.length

  // console.log(difference, difference2)

  for (let i = 0; i < difference; i++) {
    newArray.push({ y: 0 })
  }

  return newArray
}

function getDay(date) {
  // console.log(typeof(date))
  if (typeof date === "string") date = new Date(date)
  // console.log(date)
  const start = new Date(date.getFullYear(), 0, 0)
  const diff =
    date -
    start +
    (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000
  const oneDay = 1000 * 60 * 60 * 24
  const day = Math.floor(diff / oneDay)
  return day
}
function fillInMissingWeeks(dataArray) {
  const allWeeks = []
  const sorted = dataArray.sort(
    (a, b) => +a.label.split(" ")[1] - +b.label.split(" ")[1]
  )
  if (sorted.length > 1 && sorted[0].label.split(" ")[0] !== "W1") {
    sorted.unshift({ label: "Week 1 ", y: 0 })
  }
  sorted.forEach((dataPoint, index) => {
    const firstPoint = sorted[index - 1]
      ? +sorted[index - 1].label.split(" ")[1]
      : 1
    const secondPoint = +dataPoint.label.split(" ")[1]

    if (secondPoint - firstPoint !== 1) {
      insertWeeks(firstPoint, secondPoint)
    }

    allWeeks.push(dataPoint)
  })

  function insertWeeks(low, high) {
    for (let i = low + 1; i < high; i++) {
      allWeeks.push({ label: `Week {i} `, y: 0 })
    }
  }

  return allWeeks
}

function standardDate(value) {
  const dateArray = value.split("/")
  if (dateArray.length === 3) {
    dateArray[0] = dateArray[0].length === 1 ? `0${dateArray[0]}` : dateArray[0]
    dateArray[1] = dateArray[1].length === 1 ? `0${dateArray[1]}` : dateArray[1]
    const newValue = dateArray.join("/")
    return newValue
  }

  return value
}

function getAverage(dataPoints) {
  let result = ""
  if (dataPoints) {
    const quantity = dataPoints.length
    const sum = dataPoints.reduce((sum, dp) => sum + +dp.y, 0)
    result = Math.floor(sum / quantity)
  }

  return result
}
