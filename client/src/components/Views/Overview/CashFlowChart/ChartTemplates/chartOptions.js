function standardDate(date) {
  return new Date(date).toLocaleDateString()
}

function getAverage(dataPoints) {
  const sum = dataPoints.reduce((sum, dp) => sum + dp.y, 0)
  const count = dataPoints.length
  return count > 0 ? `$${Math.round(sum / count)}` : "$0"
}

class ChartOptions {
  constructor(title) {
    this.title = { text: title }
    this.axisX = {}
    this.axisY = {}
    this.data = []
  }
}

function fillInMissingDays(dataPoints, year) {
  const filledDataPoints = []
  const startDate = new Date(year, 0, 1)
  const endDate = new Date()
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toLocaleDateString()
    const existingPoint = dataPoints.find(point => 
      point.x instanceof Date ? point.x.toLocaleDateString() === dateStr : false
    )
    
    if (existingPoint) {
      filledDataPoints.push(existingPoint)
    } else {
      filledDataPoints.push({
        x: new Date(d),
        y: 0,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
    }
  }
  
  return filledDataPoints
}

function fillInMissingWeeks(dataPoints, year) {
  const filledDataPoints = []
  
  // Get all weeks that should exist for the year
  const startDate = new Date(year, 0, 1)
  const endDate = new Date()
  
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
  
  const startWeek = startDate.getWeek()
  const endWeek = endDate.getWeek()
  
  let lastMonth = null;
  
  for (let week = startWeek; week <= endWeek; week++) {
    // Get the month for this week
    const weekMonth = getMonthForWeek(week, year);
    
    // Determine label format
    let label;
    if (lastMonth === null || weekMonth !== lastMonth) {
      // First week or month changed - include month abbreviation
      label = week === 1 ? `Week ${week}` : `${weekMonth} Week ${week}`;
      lastMonth = weekMonth;
    } else {
      // Same month as previous week
      label = `Week ${week}`;
    }
    
    const existingPoint = dataPoints.find(point => 
      point.label === `Week ${week}`
    )
    
    if (existingPoint) {
      // Update the label to include month if needed
      filledDataPoints.push({
        ...existingPoint,
        label: label
      })
    } else {
      filledDataPoints.push({
        label: label,
        y: 0
      })
    }
  }
  
  return filledDataPoints
}

function fillInMissingMonths(dataPoints, year) {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  
  const currentMonth = new Date().getMonth()
  const filledDataPoints = []
  
  for (let i = 0; i <= currentMonth; i++) {
    const existingPoint = dataPoints.find(point => point.label === months[i])
    
    if (existingPoint) {
      filledDataPoints.push(existingPoint)
    } else {
      filledDataPoints.push({
        label: months[i],
        y: 0
      })
    }
  }
  
  return filledDataPoints
}

export class YearCashFlowChart extends ChartOptions {
  constructor(year, items, expenses) {
    super(`Cash Flow for ${year}`)
    this.axisY = {
      title: "Cash Flow",
      includeZero: true,
      prefix: "$"
    }
    
    const dataPoints = fillInMissingDays(getYearDataPoints(items, expenses, year), year)
    
    this.data = [{
      type: "column",
      toolTipContent: " {x}: ${y}",
      dataPoints: dataPoints
    }]
    
    this.axisX = {
      title: `Average cash flow per day: ${getAverage(dataPoints)}`,
      interval: 7,
      xValueType: "date",
      xValueFormatString: "MM/dd"
    }

    function getYearDataPoints(items, expenses, year) {
      const cashFlowByDate = {}

      // Add revenue from sold items
      const soldItems = items.filter(item => {
        try {
          return item.sold && new Date(item.dateSold).getFullYear() === year
        } catch (e) {
          return false
        }
      })

      soldItems.forEach(item => {
        const date = standardDate(item.dateSold)
        const revenue = parseFloat(item.priceSold) || 0
        cashFlowByDate[date] = (cashFlowByDate[date] || 0) + revenue
      })

      // Subtract expenses
      const yearExpenses = expenses.filter(expense => {
        try {
          return new Date(expense.date).getFullYear() === year
        } catch (e) {
          return false
        }
      })

      yearExpenses.forEach(expense => {
        const date = standardDate(expense.date)
        const amount = parseFloat(expense.amount) || 0
        cashFlowByDate[date] = (cashFlowByDate[date] || 0) - amount
      })

      // Subtract inventory purchases
      const purchasedItems = items.filter(item => {
        try {
          return new Date(item.datePurchased).getFullYear() === year
        } catch (e) {
          return false
        }
      })

      purchasedItems.forEach(item => {
        const date = standardDate(item.datePurchased)
        const cost = parseFloat(item.purchasePrice) || 0
        const additionalCosts = (item.additionalCosts || []).reduce((sum, cost) => sum + (parseFloat(cost.amount) || 0), 0)
        const totalCost = cost + additionalCosts
        cashFlowByDate[date] = (cashFlowByDate[date] || 0) - totalCost
      })

      // Convert to array format
      return Object.entries(cashFlowByDate).map(([date, amount]) => ({
        x: new Date(date),
        y: Math.round(amount),
        label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }))
    }
  }
}

export class YearCashFlowChartByWeek extends ChartOptions {
  constructor(year, items, expenses) {
    super(`Weekly Cash Flow for ${year}`)

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

    const dataPoints = fillInMissingWeeks(getYearDataPointsByWeek(items, expenses, year), year)

    this.data = [{
      type: "column",
      toolTipContent: " {label}: ${y}",
      dataPoints: dataPoints
    }]

    this.axisX = {
      title: `Average cash flow per week: ${getAverage(dataPoints)}`,
      interval: 1
    }

    this.axisY = {
      includeZero: true,
      prefix: "$"
    }

    function getYearDataPointsByWeek(items, expenses, year) {
      const cashFlowByWeek = {}

      // Add revenue from sold items
      const soldItems = items.filter(item => {
        try {
          return item.sold && new Date(item.dateSold).getFullYear() === year
        } catch (e) {
          return false
        }
      })

      soldItems.forEach(item => {
        const week = new Date(item.dateSold).getWeek()
        const weekLabel = `Week ${week}`
        const revenue = parseFloat(item.priceSold) || 0
        cashFlowByWeek[weekLabel] = (cashFlowByWeek[weekLabel] || 0) + revenue
      })

      // Subtract expenses
      const yearExpenses = expenses.filter(expense => {
        try {
          return new Date(expense.date).getFullYear() === year
        } catch (e) {
          return false
        }
      })

      yearExpenses.forEach(expense => {
        const week = new Date(expense.date).getWeek()
        const weekLabel = `Week ${week}`
        const amount = parseFloat(expense.amount) || 0
        cashFlowByWeek[weekLabel] = (cashFlowByWeek[weekLabel] || 0) - amount
      })

      // Subtract inventory purchases
      const purchasedItems = items.filter(item => {
        try {
          return new Date(item.datePurchased).getFullYear() === year
        } catch (e) {
          return false
        }
      })

      purchasedItems.forEach(item => {
        const week = new Date(item.datePurchased).getWeek()
        const weekLabel = `Week ${week}`
        const cost = parseFloat(item.purchasePrice) || 0
        const additionalCosts = (item.additionalCosts || []).reduce((sum, cost) => sum + (parseFloat(cost.amount) || 0), 0)
        const totalCost = cost + additionalCosts
        cashFlowByWeek[weekLabel] = (cashFlowByWeek[weekLabel] || 0) - totalCost
      })

      // Convert to array format
      return Object.entries(cashFlowByWeek).map(([week, amount]) => ({
        label: week,
        y: Math.round(amount)
      }))
    }
  }
}

export class YearCashFlowChartByMonth extends ChartOptions {
  constructor(year, items, expenses) {
    super(`Monthly Cash Flow for ${year}`)

    const dataPoints = fillInMissingMonths(getYearDataPointsByMonth(items, expenses, year), year)

    this.data = [{
      type: "column",
      toolTipContent: " {label}: ${y}",
      dataPoints: dataPoints.sort((a, b) => {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
        return months.indexOf(a.label) - months.indexOf(b.label)
      })
    }]

    this.axisX = {
      title: `Average cash flow per month: ${getAverage(dataPoints)}`,
      interval: 1
    }

    this.axisY = {
      includeZero: true,
      prefix: "$"
    }

    function getYearDataPointsByMonth(items, expenses, year) {
      const cashFlowByMonth = {}

      // Add revenue from sold items
      const soldItems = items.filter(item => {
        try {
          return item.sold && new Date(item.dateSold).getFullYear() === year
        } catch (e) {
          return false
        }
      })

      soldItems.forEach(item => {
        const month = new Date(item.dateSold).toLocaleString("default", { month: "long" })
        const revenue = parseFloat(item.priceSold) || 0
        cashFlowByMonth[month] = (cashFlowByMonth[month] || 0) + revenue
      })

      // Subtract expenses
      const yearExpenses = expenses.filter(expense => {
        try {
          return new Date(expense.date).getFullYear() === year
        } catch (e) {
          return false
        }
      })

      yearExpenses.forEach(expense => {
        const month = new Date(expense.date).toLocaleString("default", { month: "long" })
        const amount = parseFloat(expense.amount) || 0
        cashFlowByMonth[month] = (cashFlowByMonth[month] || 0) - amount
      })

      // Subtract inventory purchases
      const purchasedItems = items.filter(item => {
        try {
          return new Date(item.datePurchased).getFullYear() === year
        } catch (e) {
          return false
        }
      })

      purchasedItems.forEach(item => {
        const month = new Date(item.datePurchased).toLocaleString("default", { month: "long" })
        const cost = parseFloat(item.purchasePrice) || 0
        const additionalCosts = (item.additionalCosts || []).reduce((sum, cost) => sum + (parseFloat(cost.amount) || 0), 0)
        const totalCost = cost + additionalCosts
        cashFlowByMonth[month] = (cashFlowByMonth[month] || 0) - totalCost
      })

      // Convert to array format
      return Object.entries(cashFlowByMonth).map(([month, amount]) => ({
        label: month,
        y: Math.round(amount)
      }))
    }
  }
}

// Helper functions for week-month labeling
function getMonthForWeek(weekNumber, year) {
  // Calculate approximate date for middle of the week (Wednesday)
  const firstSunday = getFirstSundayOfYear(year);
  const weekStart = new Date(firstSunday.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000);
  const midWeek = new Date(weekStart.getTime() + 3 * 24 * 60 * 60 * 1000); // Wednesday
  
  return midWeek.toLocaleString('default', { month: 'short' });
}

function getFirstSundayOfYear(year) {
  const jan1 = new Date(year, 0, 1);
  const daysToFirstSunday = (7 - jan1.getDay()) % 7;
  return new Date(year, 0, 1 + daysToFirstSunday);
}