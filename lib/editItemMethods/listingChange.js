const createEbayDescriptionTemplate = require("../createEbayDescriptionTemplate")
const inventoryItemChange = require("./inventoryItemChange")
const { ebayXMLRequest } = require("../../lib/ebayCallAndParse")

const listingChange = async (item, changes, user) => {
  const { ebayToken: ebayAuthToken, userDescriptionTemplate } = user
  console.log(item)
  const template = `<?xml version="1.0" encoding="utf-8"?>
    <ReviseItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
      <RequesterCredentials>
        <eBayAuthToken>${ebayAuthToken}</eBayAuthToken>
      </RequesterCredentials>
      <Item>
        <ItemID>${item.ebayId}</ItemID>
        <Title>${item.title}</Title>
        <ProductListingDetails>
          <BrandMPN>
            <Brand>${item.brand}</Brand>
            <MPN>${item.partNo}</MPN>
          </BrandMPN>
        </ProductListingDetails>
        <SKU>${item.sku}</SKU>
        <PrimaryCategory>
          <CategoryID>${item.categoryId}</CategoryID>
        </PrimaryCategory>
        <StartPrice currencyID="USD">${item.listedPrice}</StartPrice>
        <ShippingDetails>
          <ShippingServiceOptions>
            <ShippingServicePriority>1</ShippingServicePriority>
            <ShippingService>${item.shippingService}</ShippingService>
            <FreeShipping>true</FreeShipping>
            <ShippingServiceCost currencyID="USD">0.00</ShippingServiceCost>
            <ShippingServiceAdditionalCost currencyID="USD">0.00</ShippingServiceAdditionalCost>
          </ShippingServiceOptions>
        </ShippingDetails>
        <Description><![CDATA[${createEbayDescriptionTemplate(
          item.title,
          item.partNo,
          item.description,
          item.shippingService,
          userDescriptionTemplate
        )}]]></Description>
        <ConditionID>${item.conditionId}</ConditionID>
        <ConditionDescription>${
          item.conditionDescription
        }</ConditionDescription>
        <BestOfferDetails>
          <BestOfferEnabled>true</BestOfferEnabled>
        </BestOfferDetails>
        <ListingDetails>
          <BestOfferAutoAcceptPrice currencyID="USD">${
            item.acceptOfferHigh
          }</BestOfferAutoAcceptPrice>
          <MinimumBestOfferPrice currencyID="USD">${
            item.declineOfferLow
          }</MinimumBestOfferPrice>
        </ListingDetails>
      </Item>
    </ReviseItemRequest>`

  const url = process.env.EBAY_API_URL // Ensure this is set correctly in your environment
  const config = {
    headers: {
      "Content-Type": "text/xml",
      "X-EBAY-API-COMPATIBILITY-LEVEL": 967, // Set appropriate compatibility level
      "X-EBAY-API-DEV-NAME": process.env.EBAY_API_DEV_NAME,
      "X-EBAY-API-APP-NAME": process.env.EBAY_API_APP_NAME,
      "X-EBAY-API-CALL-NAME": "ReviseItem",
      "X-EBAY-API-SITEID": 100, // Site ID for eBay US
    },
  }

  try {
    const result = await ebayXMLRequest(url, template, config)
    if (result) {
      console.log(result)
      if (result.ReviseItemResponse.Errors) {
        console.log(result.ReviseItemResponse.Errors)
      }
    }
  } catch (e) {
    console.log(e)
    return { success: false, message: e.message }
  }

  const updatedSuccessfully = await inventoryItemChange(item, changes, user)

  return updatedSuccessfully
}

module.exports = listingChange
