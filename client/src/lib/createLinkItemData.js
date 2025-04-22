const createLinkItemData = async (ebayId, getEbayListing) => {
    try {
      // Get the listing data from eBay
      const listingResponse = await getEbayListing(ebayId)
  
      if (!listingResponse.success) {
        throw new Error(listingResponse.message || "Failed to get eBay listing")
      }
  
      // Parse the JSON response if it's still a string
      
  
      const item = listingResponse.listing.GetItemResponse?.Item;
      console.log(item)
      
      if (!item) {
        throw new Error("No item data found in eBay response");
      }
  
      // Build and return the item object
      return {
        title: item.Title || `eBay Item ${ebayId}`,
        brand: item.ProductListingDetails?.BrandMPN?.Brand || "",
        listedPrice: item.SellingStatus?.CurrentPrice?.$t || 
                    item.BuyItNowPrice?.$t || 
                    item.StartPrice?.$t || "",
        dateListed: new Date().toLocaleDateString(),
        conditionId: item.ConditionID || 3000,
        conditionDescription: item.ConditionDescription || "",
        acceptOfferHigh: +item.ListingDetails?.BestOfferAutoAcceptPrice?.$t || "",
        declineOfferLow: +item.ListingDetails?.MinimumBestOfferPrice?.$t || "",
        shippingService: item.ShippingDetails?.ShippingServiceOptions?.ShippingService || "USPSPriority",
        description: item.Description || "",
        SKU: item.SKU || "",
        imageUrls: item.PictureDetails?.PictureURL || [],
        ebayId,
      }
    } catch (error) {
      console.error("Error creating link item data:", error)
      throw error
    }
  }
  
  export default createLinkItemData