const cheerio = require("cheerio")

function findResultsPaginationLinks(html, partOption) {
  const $ = cheerio.load(html)
  const queryStrings = []

  // Parse the original partOption into URLSearchParams object
  const params = new URLSearchParams(partOption)

  // Look for the div containing "Additional Result Pages" text
  const paginationDiv = $("div:contains('Additional Result Pages')")

  if (paginationDiv.length > 0) {
    // Find all links within this div
    paginationDiv.find("a").each((i, link) => {
      const href = $(link).attr("href")

      // Check if this is a valid page link and extract page number
      if (href && href.includes("userPage=")) {
        // Extract page number from the href
        const pageMatch = href.match(/userPage=(\d+)/)
        if (pageMatch && pageMatch[1]) {
          const pageNumber = pageMatch[1]

          // Create a copy of the original params
          const newParams = new URLSearchParams(params.toString())

          // Update the userPage parameter
          newParams.set("userPage", pageNumber)

          // Add the modified query string to our results
          queryStrings.push(newParams.toString())
        }
      }
    })
  }

  return queryStrings
}

module.exports = findResultsPaginationLinks
