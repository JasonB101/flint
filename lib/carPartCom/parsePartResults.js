const cheerio = require("cheerio")
const extractPhoneNumber = require("./extractPhoneNumber")


function parsePartResults(html) {
    const $ = cheerio.load(html)
    const results = []
  
    // Find all table rows
    $("table tr").each((index, element) => {
      const tds = $(element).find("td")
  
      // Make sure this row has the expected number of columns
      if (tds.length >= 7) {
        // Enhanced checks to filter out non-part rows
        const firstColumnText = $(tds[0]).text().trim()
        const firstColumnHTML = $(tds[0]).html()
  
        // Skip header rows and info rows (existing checks)
        if (
          firstColumnText === "Year" ||
          firstColumnText.includes("Year") ||
          firstColumnHTML.includes("<table") ||
          firstColumnHTML.includes("Results sorted") ||
          firstColumnHTML.includes("Distances are") ||
          firstColumnText.length > 50
        ) {
          return
        }
  
        // Check that the price column looks valid
        const priceText = $(tds[4]).text().trim()
        if (!priceText.includes("$")) {
          return // Skip rows without a price
        }
  
        // Parse the first TD which contains Year, Part, Model
        const firstTdParts = firstColumnHTML.split("<br>")
        const price = parseFloat(priceText.replace("$", ""))
  
        // Extract dealer name, website and location
        const dealerCell = $(tds[5])
        const dealerLink = dealerCell.find("a").first()
        const dealerName = dealerLink.text().trim()
        const dealerWebsite = dealerLink.attr("href") || ""
  
        // Get location from text
        const dealerCellText = dealerCell.text()
        const locationMatch = dealerCellText.match(/USA-([A-Z]{2})\(([^)]+)\)/)
        const location = locationMatch
          ? `${locationMatch[1]}, ${locationMatch[2]}`
          : ""
          
        // Check for image in description column and extract URL
        const descriptionCell = $(tds[1])
        let imageUrl = ""
        
        // Look for image with onclick attribute
        const imageElement = descriptionCell.find('img[onclick]')
        if (imageElement.length > 0) {
          const onclickAttr = imageElement.attr('onclick') || ""
          // Extract the parameter string from inside popupImg('...')
          const paramMatch = onclickAttr.match(/popupImg\('([^']+)'\)/)
          if (paramMatch && paramMatch[1]) {
            imageUrl = "https://imageappky.car-part.com/image?" + paramMatch[1]
          }
        }
  
        // Create the part object
        const part = {
          year: firstTdParts[0].trim(),
          part: firstTdParts[1] ? firstTdParts[1].trim() : "",
          model: firstTdParts[2] ? firstTdParts[2].trim() : "",
          description: $(tds[1]).text().trim(),
          imageUrl: imageUrl, // Always include this property
          partGrade: $(tds[2]).text().trim(),
          stockNumber: $(tds[3]).text().trim(),
          price: isNaN(price) ? priceText : price,
          dealerInfo: {
            name: dealerName,
            website: dealerWebsite,
            location: location,
            phone: extractPhoneNumber(dealerCellText),
          },
          distance: parseInt($(tds[6]).text().trim()) || 0,
        }
  
        // Final validation - skip if year doesn't look like a number
        if (isNaN(parseInt(part.year))) {
          return
        }
  
        results.push(part)
      }
    })
  
    return results
  }

  module.exports = parsePartResults