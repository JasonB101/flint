function createEbayDescriptionTemplate(
  title,
  partNo,
  description,
  shippingService,
  userDescriptionTemplate
) {
  //description is a javascript string with \n
  //That is then converted into html with multiple p tags, one for each line.
  const itemSpecsArray = description.split("\n")
  itemSpecsArray.forEach(
    (x) => (x = `<p style="text-align: center; width: 100%;">${x}</p>`)
  )
  const itemSpecs = itemSpecsArray.join("<br>")
  const returnPolicyDays = 30
  const shippingDays = shippingService === "USPSPriority" ? "1 - 3" : "2 - 5"
  const returnMessage =
    shippingService === "USPSPriority"
      ? "Using the Post Office Priority Mail Return Service, shipping will be free."
      : "Contact us for instructions on returning this item."
  const descriptionVariables = {
    title,
    partNo,
    itemSpecs,
    shippingService,
    returnPolicyDays,
    shippingDays,
    returnMessage,
  }

  // Replace placeholders in the template with actual values
  return userDescriptionTemplate.replace(/\${(.*?)}/g, (_, key) => {
    return descriptionVariables[key.trim()] || ""
  })
}

module.exports = createEbayDescriptionTemplate
