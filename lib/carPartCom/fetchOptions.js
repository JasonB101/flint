const cheerio = require("cheerio")

async function fetchOptions() {
  const url = "https://www.car-part.com/"

  try {
    // Fetch the main search page
    const response = await fetch(url, {
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "max-age=0",
        "sec-ch-ua":
          '"Not A(Brand";v="8", "Chromium";v="132", "Microsoft Edge";v="132"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "upgrade-insecure-requests": "1",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
      },
      method: "GET",
    })

    if (!response.ok) {
      throw new Error(
        `Failed to fetch options: ${response.status} ${response.statusText}`
      )
    }

    // Parse the HTML with cheerio
    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract models
    const models = []
    $('select[name="userModel"] option, select#model option').each(
      (index, element) => {
        const option = $(element)
        const value = option.attr("value") || option.text().trim()
        const text = option.text().trim()

        // Skip the placeholder option "Select Make/Model"
        if (text !== "Select Make/Model") {
          models.push(value)
        }
      }
    )

    // Extract years
    const years = []
    $('select[name="userDate"] option, select#year option').each(
      (index, element) => {
        const option = $(element)
        const value = option.attr("value") || option.text().trim()
        const text = option.text().trim()

        // Skip the placeholder option "Select Year"
        if (text !== "Select Year" && !isNaN(parseInt(text))) {
          years.push(value)
        }
      }
    )

    // Extract parts
    const parts = []
    $('select[name="userPart"] option').each(
      (index, element) => {
        const option = $(element)
        const value = option.attr("value") || option.text().trim()
        const text = option.text().trim()

        // Skip the placeholder option "Select Part"
        if (text !== "Select Part" && value) {
          parts.push(value)
        }
      }
    )

    console.log(`Found ${models.length} car models, ${years.length} years, and ${parts.length} parts`)

    // Return all three datasets
    return {
      models,
      years,
      parts
    }
  } catch (error) {
    console.error("Error fetching options:", error)
    throw error
  }
}

module.exports = fetchOptions