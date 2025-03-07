function extractRadioOptions($) {
  const radioOptions = []

  // First get the base query parameters from hidden inputs
  const baseParams = new URLSearchParams()

  // Find all hidden inputs
  $('input[type="hidden"]').each((index, element) => {
    const name = $(element).attr("NAME") || $(element).attr("name")
    const value = $(element).attr("VALUE") || $(element).attr("value") || ""

    if (name) {
      baseParams.append(name, value)
    }
  })

  // Add standard form submission parameters
  baseParams.append("Search+Car+Part+Inventory.x", "20")
  baseParams.append("Search+Car+Part+Inventory.y", "8")

  // Find all radio inputs
  $('input[type="radio"]').each((index, element) => {
    const value = $(element).attr("VALUE") || $(element).attr("value")
    const name = $(element).attr("NAME") || $(element).attr("name")

    // Only process radio buttons with values that aren't "None"
    if (value && value !== "None") {
      const id = $(element).attr("ID") || $(element).attr("id")
      let labelText = ""

      // Find the associated label
      if (id) {
        const label = $(`label[for="${id}"]`)
        if (label.length) {
          labelText = label.text().trim()
        }
      }

      // Create a copy of the base params for this specific radio option
      const optionParams = new URLSearchParams(baseParams.toString())

      // Replace the parameter value with this radio button's value
      if (name) {
        // Remove existing value if it exists
        optionParams.delete(name)
        // Add the radio option's value
        optionParams.append(name, value)
        // Important: When setting dummyVar, also set userInterchange to the same value
        if (name === "dummyVar") {
          optionParams.delete("userInterchange")
          optionParams.append("userInterchange", value)
        }
      }

      // Create object with value, label and payload
      const disqualifiers = ["Search using", "Non-Interchange"]
      if (!disqualifiers.some((disqualifier) => labelText.includes(disqualifier))) {
        radioOptions.push({
          label: labelText,
          payload: optionParams.toString(),
        })
      }
    }
  })

  return radioOptions
}

module.exports = extractRadioOptions
