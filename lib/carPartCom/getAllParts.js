const { getAllAvailableParts } = require("./carPartApi")

async function getAllParts(payloads) {
  const parts = []
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  try {
    for (const payload of payloads) {
      console.log(
        `Fetching parts for payload ${payloads.indexOf(payload) + 1}/${
          payloads.length
        }`
      )
      const batch = await getAllAvailableParts(payload)
      parts.push(...batch)

      if (payload !== payloads[payloads.length - 1]) {
        await delay(3000)
      }
    }

    // Remove duplicates using stringified comparison
    const uniqueParts = removeDuplicates(parts)
    console.log(`Removed ${parts.length - uniqueParts.length} duplicate parts`)

    return uniqueParts
  } catch (error) {
    console.error("Error fetching all parts:", error)
    throw error
  }
}

// Helper function to remove duplicates from an array of objects
function removeDuplicates(array) {
  const seen = new Set()
  return array.filter((item) => {
    const stringified = JSON.stringify(item)
    if (seen.has(stringified)) {
      return false
    }
    seen.add(stringified)
    return true
  })
}

module.exports = getAllParts
