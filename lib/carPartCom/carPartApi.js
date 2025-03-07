const cheerio = require("cheerio")
const findResultsPaginationLinks = require("./findResultsPagnationLinks")
const parsePartResults = require("./parsePartResults")
const extractRadioOptions = require("./extractRadioOptions")

async function yearModelPartQuery({ year, model, part, zipCode }) {
  const results = await fetch("https://www.car-part.com/cgi-bin/search.cgi", {
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "max-age=0",
      "content-type": "application/x-www-form-urlencoded",
      "sec-ch-ua":
        '"Not A(Brand";v="8", "Chromium";v="132", "Microsoft Edge";v="132"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      cookie: `vinLookup=no; year=31; userZip=${zipCode}; userSort=price; Loc=1; _ga=GA1.2.846635699.1741040829; _gid=GA1.2.114881341.1741040829; model=686; _gat=1; _ga_XNRXYYP90R=GS1.2.1741064767.5.1.1741065565.0.0.0`,
      Referer: "https://www.car-part.com/index.htm",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    body: `userDate=${year}&userVIN=&userModel=${encodeURIComponent(
      model
    )}&userPart=${encodeURIComponent(
      part
    )}&userLocation=USA&userPreference=price&userZip=${zipCode}&svZip=y&userPage=1&userInterchange=None&userDate2=Ending+Year&userSearch=int&Search+Car+Part+Inventory.x=25&Search+Car+Part+Inventory.y=20`,
    method: "POST",
  })

  // Get the HTML text from the response
  const htmlText = await results.text()
  const $ = cheerio.load(htmlText)

  // Extract radio options
  const radioOptions = extractRadioOptions($)
  console.log("Radio options:", radioOptions)

  // Build query from hidden inputs

  return radioOptions
}

async function getAllAvailableParts(partOption) {
  // Start with the first page
  const firstPageHtml = await getAvailableParts(partOption)

  // Parse first page results
  const firstPageResults = parsePartResults(firstPageHtml)

  // Find pagination links
  const paginationLinks = findResultsPaginationLinks(firstPageHtml, partOption)

  // If there are additional pages, fetch them
  let allResults = [...firstPageResults]

  if (paginationLinks.length > 0) {
    console.log(`Found ${paginationLinks.length} additional pages to fetch`)

    for (let i = 0; i < paginationLinks.length; i++) {
      // Wait 1 second between requests to avoid overwhelming the server
      await delay(1000)

      // Make full URL if it's a relative path
      const nextPageQuery = paginationLinks[i]

      console.log(`Fetching page ${i + 2}...`)

      // Fetch and parse the next page
      const nextPageHtml = await getAvailableParts(nextPageQuery) //RIGHT HERE
      const nextPageResults = parsePartResults(nextPageHtml)

      // Add results to our collection
      allResults = [...allResults, ...nextPageResults]
    }
  }

  return allResults
}

async function getAvailableParts(
  body = "ref=&sessionID=14000000317605048&iKey=&userModel=Jeep+Grand+Cherokee&userPart=Computer+Box+Engine&uID=&uPass=&dbPart=590.1&dbSubPart=&userLocation=USA&userPreference=price&userPage=1&confirm_yes=&confirm_no=&iCN=&userClaim=&userClaimer=&userLang=&userZip=84067&userLat=41.1733000&userLong=-112.0490000&userCSA=&userMCO=&userAdjuster=&userItem=&limitYears=&userVIN=&userVINModelID=&userIMS=&imsFullSpecification=&userInterchange=A%3E%3EA%7DA%7D%7D590%7D1357789%7DHO&userSearch=int&dbModel=37.7.1.1&vinSearch=&dummyVar=A%3E%3EA%7DA%7D%7D590%7D1357789%7DHO&userDate=1995&userDate2=1995&Search+Car+Part+Inventory.x=20&Search+Car+Part+Inventory.y=8",
  cookie = "vinLookup=no; year=31; userZip=84067; userSort=price; Loc=1; _ga=GA1.2.846635699.1741040829; _gid=GA1.2.114881341.1741040829; model=832; _ga_XNRXYYP90R=GS1.2.1741056743.3.1.1741059651.0.0.0",
  url = "https://www.car-part.com/cgi-bin/search.cgi"
) {
  const response = await fetch(url, {
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "max-age=0",
      "content-type": "application/x-www-form-urlencoded",
      "sec-ch-ua":
        '"Not A(Brand";v="8", "Chromium";v="132", "Microsoft Edge";v="132"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      cookie: cookie,
      Referer: "https://www.car-part.com/cgi-bin/search.cgi",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    // For GET requests, don't include a body
    method: url.includes("?") ? "GET" : "POST",
    // Only add body for POST requests
    ...(url.includes("?")
      ? {}
      : {
          body: body,
        }),
  })

  return await response.text()
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}


module.exports = {
  yearModelPartQuery,
  getAllAvailableParts,
}

async function runTestYearModelPartQuery() {
  const partInfo = {
    year: 2009,
    model: "Dodge Avenger",
    part: "Computer Box Engine",
    zipCode: 84010,
  }
  const html = await yearModelPartQuery(partInfo)

  // Load HTML into cheerio
}

async function runTestGetAllParts() {
  try {
    console.log("Starting parts search across all pages...")
    const body =
      "ref=&sessionID=13000000844463577&iKey=&userModel=Dodge+Avenger&userPart=Glove+Box&uID=&uPass=&dbPart=260.1&dbSubPart=&userLocation=USA&userPreference=price&userPage=1&confirm_yes=&confirm_no=&iCN=&userClaim=&userClaimer=&userLang=&userZip=84067&userLat=41.1733000&userLong=-112.0490000&userCSA=&userMCO=&userAdjuster=&userItem=&limitYears=&userVIN=&userVINModelID=&userIMS=&imsFullSpecification=&userSearch=int&dbModel=22.6.1.1&vinSearch=&Search%2BCar%2BPart%2BInventory.x=20&Search%2BCar%2BPart%2BInventory.y=8&dummyVar=FFFD%3E%3F%7D%7D%7D260%7D235265%7DMO&userInterchange=FFFD%3E%3F%7D%7D%7D260%7D235265%7DMO"
    const allParts = await getAllAvailableParts(body)
    console.log(allParts)
    console.log(`Total parts found across all pages: ${allParts.length}`)
    return allParts
  } catch (error) {
    console.error("Error fetching parts:", error)
  }
}

async function runTestGetAvailableParts() {
  const body =
    "ref=&sessionID=14000000317908857&iKey=&userModel=Dodge+Avenger&userPart=Computer+Box+Engine&uID=&uPass=&dbPart=590.1&dbSubPart=&userLocation=USA&userPreference=price&userPage=1&confirm_yes=&confirm_no=&iCN=&userClaim=&userClaimer=&userLang=&userZip=84010&userLat=40.8715000&userLong=-111.8314000&userCSA=&userMCO=&userAdjuster=&userItem=&limitYears=&userVIN=&userVINModelID=&userIMS=&imsFullSpecification=&userSearch=int&dbModel=22.6.1.1&vinSearch=&userDate=2009&userDate2=2009&Search%2BCar%2BPart%2BInventory.x=20&Search%2BCar%2BPart%2BInventory.y=8&dummyVar=%3EB%40%3E%7D%7D%7D590%7D236613%7DHO&userInterchange=%3EB%40%3E%7D%7D%7D590%7D236613%7DHO"
  const firstPageHtml = await getAvailableParts(body)

  // Parse first page results
  const firstPageResults = parsePartResults(firstPageHtml)
  console.log(firstPageResults)
  console.log(`Found ${firstPageResults.length} parts on first page`)
}

// runTestGetAllParts()
