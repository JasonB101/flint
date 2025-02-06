// Assuming the ebayXMLRequest and parseXMLResponse are in the same file or imported.

const { ebayXMLRequest } = require("./ebayCallAndParse") // Adjust the path accordingly

async function findCompatibilityList(itemIds, authToken) {
  const url = "https://api.ebay.com/ws/api.dll"

  // Function to fetch compatibility list for a single item
  const fetchItemCompatibility = async (itemId) => {
    const xmlData = `<?xml version="1.0" encoding="utf-8"?>
        <GetItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
          <RequesterCredentials>
            <eBayAuthToken>${authToken}</eBayAuthToken>
          </RequesterCredentials>
          <ErrorLanguage>en_US</ErrorLanguage>
          <WarningLevel>High</WarningLevel>
          <Version>663</Version>
          <ItemID>${itemId}</ItemID>
          <IncludeItemCompatibilityList>true</IncludeItemCompatibilityList>
          <DetailLevel>ItemReturnAttributes</DetailLevel>
        </GetItemRequest>`

    const headers = {
      "Content-Type": "text/xml",
      "X-EBAY-API-CALL-NAME": "GetItem",
      "X-EBAY-API-SITEID": "0", // USA site ID
      "X-EBAY-API-COMPATIBILITY-LEVEL": "663",
    }

    const response = await ebayXMLRequest(url, xmlData, { headers })

    // Extract compatibility info
    // console.log(response.GetItemResponse.Item.ItemCompatibilityList)
    if (response && response.GetItemResponse.Item.ItemCompatibilityList) {
      let compatibilityList =
        response.GetItemResponse.Item.ItemCompatibilityList.Compatibility
        if (compatibilityList.NameValueList) {
            compatibilityList = [compatibilityList]
        }

      // Map through Compatibility array and extract NameValueList for each Compatibility item
      const compatibilityData = compatibilityList.map((item) => {
        // Consolidate all NameValue pairs into a single object
        const compatibilityEntry = {}

        item.NameValueList.forEach((nameValue) => {
          if (nameValue.Name && nameValue.Value) {
            compatibilityEntry[nameValue.Name] = nameValue.Value // Add key-value pair to the object
          }
        })

        return compatibilityEntry // Return a single object for each compatibility item
      })

      return compatibilityData
    } else {
      return [] // Return an empty array if no compatibility found
    }
  }

  // Use Promise.all to fetch compatibility data for all items concurrently
  const compatibilityResults = await Promise.all(
    itemIds.map((itemId) => fetchItemCompatibility(itemId))
  )
  const validEntries = compatibilityResults.filter((entry) => entry.length > 0)
  const minMatches = Math.ceil(validEntries.length * 0.5)

  const allCompatibilities = validEntries.flat()

  // Create a map to count occurrences of each unique combination
  const compatibilityCountMap = new Map()
  allCompatibilities.forEach((entry) => {
    // Create a unique key for Year, Make, Model, and Engine
    const key = `${entry.Year}-${entry.Make}-${entry.Model}-${entry.Trim}-${entry.Engine}`
    compatibilityCountMap.set(key, (compatibilityCountMap.get(key) || 0) + 1)
  })

  // Filter entries based on minimum match count
  const filteredCompatibilities = allCompatibilities.filter((entry) => {
    const key = `${entry.Year}-${entry.Make}-${entry.Model}-${entry.Trim}-${entry.Engine}`
    return compatibilityCountMap.get(key) >= minMatches
  })
  const uniqueCompatibilities = []
  const seenKeys = new Set()

  filteredCompatibilities.forEach((entry) => {
    const key = `${entry.Year}-${entry.Make}-${entry.Model}-${entry.Trim}-${entry.Engine}`
    if (!seenKeys.has(key)) {
      seenKeys.add(key)
      uniqueCompatibilities.push(entry)
    }
  })

  return uniqueCompatibilities
}

module.exports = findCompatibilityList

async function test() {
  const itemIds = [
    // "226547209117",
    // "395433666248",
    // "267089211954",
    // "155352331937",
    // "126153942995",
    // "363569707497",
    // "375364916880",
    // "354669352037",
    // "155282683231",
    // "363569707795"
  ] // Example item IDs
  const authToken =
    "v^1.1#i^1#I^3#r^1#f^0#p^3#t^Ul4xMF81OkZGQUU1RkY2MTg1ODJGODBGODREOUVENERCNDhCQzAzXzBfMSNFXjI2MA=="
  const compatibility = await findCompatibilityList(itemIds, authToken)
  console.log(compatibility)
  return
}

// test()
