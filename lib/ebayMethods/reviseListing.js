async function reviseListing(listingUpdates) {
//I want this function to handle updates to anything I would like to change. The listing updates will be an object with keys 
// That will looked at and dependent on what is found will be updated.
}

//Example for title change
let example = `
<?xml version="1.0" encoding="utf-8"?>
<ReviseItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <RequesterCredentials>
    <eBayAuthToken>A*******3</eBayAuthToken>
  </RequesterCredentials>
  <ErrorLanguage>en_US</ErrorLanguage>
  <WarningLevel>High</WarningLevel>
  <Item>
    <ItemID>1**********0</ItemID>
    <Title>Harry Potter and the Goblet of Fire - First Edition</Title>
  </Item>
</ReviseItemRequest>
`
//Template 

let string = `
<?xml version="1.0" encoding="utf-8"?>
<ReviseItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <!-- Call-specific Input Fields -->
  <DeletedField> string </DeletedField>
  <!-- ... more DeletedField values allowed here ... -->
  <Item> ItemType
    <ApplicationData> string </ApplicationData>
    <AutoPay> boolean </AutoPay>
    <BestOfferDetails> BestOfferDetailsType
      <BestOfferEnabled> boolean </BestOfferEnabled>
    </BestOfferDetails>
    <BuyerResponsibleForShipping> boolean </BuyerResponsibleForShipping>
    <BuyItNowPrice currencyID="CurrencyCodeType"> AmountType (double) </BuyItNowPrice>
    <CategoryMappingAllowed> boolean </CategoryMappingAllowed>
    <CeilingPrice currencyID="CurrencyCodeType"> AmountType (double) </CeilingPrice>
    <Charity> CharityType
      <CharityID> string </CharityID>
      <DonationPercent> float </DonationPercent>
    </Charity>
    <ConditionDescription> string </ConditionDescription>
    <ConditionID> int </ConditionID>
    <Country> CountryCodeType </Country>
    <CrossBorderTrade> string </CrossBorderTrade>
    <!-- ... more CrossBorderTrade values allowed here ... -->
    <CustomPolicies> CustomPoliciesType
      <ProductCompliancePolicyID> long </ProductCompliancePolicyID>
      <!-- ... more ProductCompliancePolicyID values allowed here ... -->
      <TakeBackPolicyID> long </TakeBackPolicyID>
    </CustomPolicies>
    <Description> string </Description>
    <DescriptionReviseMode> DescriptionReviseModeCodeType </DescriptionReviseMode>
    <DigitalGoodInfo> DigitalGoodInfoType
      <DigitalDelivery> boolean </DigitalDelivery>
    </DigitalGoodInfo>
    <DisableBuyerRequirements> boolean </DisableBuyerRequirements>
    <DiscountPriceInfo> DiscountPriceInfoType
      <MadeForOutletComparisonPrice currencyID="CurrencyCodeType"> AmountType (double) </MadeForOutletComparisonPrice>
      <MinimumAdvertisedPrice currencyID="CurrencyCodeType"> AmountType (double) </MinimumAdvertisedPrice>
      <MinimumAdvertisedPriceExposure> MinimumAdvertisedPriceExposureCodeType </MinimumAdvertisedPriceExposure>
      <OriginalRetailPrice currencyID="CurrencyCodeType"> AmountType (double) </OriginalRetailPrice>
      <SoldOffeBay> boolean </SoldOffeBay>
      <SoldOneBay> boolean </SoldOneBay>
    </DiscountPriceInfo>
    <DispatchTimeMax> int </DispatchTimeMax>
    <eBayPlus> boolean </eBayPlus>
    <ExtendedProducerResponsibility> ExtendedProducerResponsibilityType
      <EcoParticipationFee currencyID="CurrencyCodeType"> AmountType (double) </EcoParticipationFee>
      <ProducerProductID> string </ProducerProductID>
      <ProductDocumentationID> string </ProductDocumentationID>
      <ProductPackageID> string </ProductPackageID>
      <ShipmentPackageID> string </ShipmentPackageID>
    </ExtendedProducerResponsibility>
    <ExtendedSellerContactDetails> ExtendedContactDetailsType
      <ClassifiedAdContactByEmailEnabled> boolean </ClassifiedAdContactByEmailEnabled>
      <ContactHoursDetails> ContactHoursDetailsType
        <Hours1AnyTime> boolean </Hours1AnyTime>
        <Hours1Days> DaysCodeType </Hours1Days>
        <Hours1From> time </Hours1From>
        <Hours1To> time </Hours1To>
        <Hours2AnyTime> boolean </Hours2AnyTime>
        <Hours2Days> DaysCodeType </Hours2Days>
        <Hours2From> time </Hours2From>
        <Hours2To> time </Hours2To>
        <TimeZoneID> string </TimeZoneID>
      </ContactHoursDetails>
    </ExtendedSellerContactDetails>
    <FloorPrice currencyID="CurrencyCodeType"> AmountType (double) </FloorPrice>
    <ItemCompatibilityList> ItemCompatibilityListType
      <Compatibility> ItemCompatibilityType
        <CompatibilityNotes> string </CompatibilityNotes>
        <Delete> boolean </Delete>
        <NameValueList> NameValueListType
          <Name> string </Name>
          <Value> string </Value>
          <!-- ... more Value values allowed here ... -->
        </NameValueList>
        <!-- ... more NameValueList nodes allowed here ... -->
      </Compatibility>
      <!-- ... more Compatibility nodes allowed here ... -->
      <ReplaceAll> boolean </ReplaceAll>
    </ItemCompatibilityList>
    <ItemID> ItemIDType (string) </ItemID>
    <ItemSpecifics> NameValueListArrayType
      <NameValueList> NameValueListType
        <Name> string </Name>
        <Value> string </Value>
        <!-- ... more Value values allowed here ... -->
      </NameValueList>
      <!-- ... more NameValueList nodes allowed here ... -->
    </ItemSpecifics>
    <ListingDetails> ListingDetailsType
      <BestOfferAutoAcceptPrice currencyID="CurrencyCodeType"> AmountType (double) </BestOfferAutoAcceptPrice>
      <MinimumBestOfferPrice currencyID="CurrencyCodeType"> AmountType (double) </MinimumBestOfferPrice>
    </ListingDetails>
    <ListingDuration> token </ListingDuration>
    <ListingEnhancement> ListingEnhancementsCodeType </ListingEnhancement>
    <!-- ... more ListingEnhancement values allowed here ... -->
    <ListingSubtype2> ListingSubtypeCodeType </ListingSubtype2>
    <Location> string </Location>
    <LotSize> int </LotSize>
    <PaymentDetails> PaymentDetailsType
      <DaysToFullPayment> int </DaysToFullPayment>
      <DepositAmount currencyID="CurrencyCodeType"> AmountType (double) </DepositAmount>
      <DepositType> DepositTypeCodeType </DepositType>
      <HoursToDeposit> int </HoursToDeposit>
    </PaymentDetails>
    <PaymentMethods> BuyerPaymentMethodCodeType </PaymentMethods>
    <!-- ... more PaymentMethods values allowed here ... -->
    <PayPalEmailAddress> string </PayPalEmailAddress>
    <PickupInStoreDetails> PickupInStoreDetailsType
      <EligibleForPickupInStore> boolean </EligibleForPickupInStore>
    </PickupInStoreDetails>
    <PictureDetails> PictureDetailsType
      <GalleryType> GalleryTypeCodeType </GalleryType>
      <PhotoDisplay> PhotoDisplayCodeType </PhotoDisplay>
      <PictureURL> anyURI </PictureURL>
      <!-- ... more PictureURL values allowed here ... -->
    </PictureDetails>
    <PostalCode> string </PostalCode>
    <PrimaryCategory> CategoryType
      <CategoryID> string </CategoryID>
    </PrimaryCategory>
    <PrivateListing> boolean </PrivateListing>
    <ProductListingDetails> ProductListingDetailsType
      <BrandMPN> BrandMPNType
        <Brand> string </Brand>
        <MPN> string </MPN>
      </BrandMPN>
      <EAN> string </EAN>
      <IncludeeBayProductDetails> boolean </IncludeeBayProductDetails>
      <IncludeStockPhotoURL> boolean </IncludeStockPhotoURL>
      <ISBN> string </ISBN>
      <ProductReferenceID> string </ProductReferenceID>
      <ReturnSearchResultOnDuplicates> boolean </ReturnSearchResultOnDuplicates>
      <TicketListingDetails> TicketListingDetailsType
        <EventTitle> string </EventTitle>
        <PrintedDate> string </PrintedDate>
        <PrintedTime> string </PrintedTime>
        <Venue> string </Venue>
      </TicketListingDetails>
      <UPC> string </UPC>
      <UseFirstProduct> boolean </UseFirstProduct>
      <UseStockPhotoURLAsGallery> boolean </UseStockPhotoURLAsGallery>
    </ProductListingDetails>
    <Quantity> int </Quantity>
    <QuantityInfo> QuantityInfoType
      <MinimumRemnantSet> int </MinimumRemnantSet>
    </QuantityInfo>
    <QuantityRestrictionPerBuyer> QuantityRestrictionPerBuyerInfoType
      <MaximumQuantity> int </MaximumQuantity>
    </QuantityRestrictionPerBuyer>
    <Regulatory> RegulatoryType
      <Hazmat> HazmatType
        <Component> string </Component>
        <Pictograms> PictogramsType
          <Pictogram> string </Pictogram>
          <!-- ... more Pictogram values allowed here ... -->
        </Pictograms>
        <SignalWord> string </SignalWord>
        <Statements> StatementsType
          <Statement> string </Statement>
          <!-- ... more Statement values allowed here ... -->
        </Statements>
      </Hazmat>
      <RepairScore> double </RepairScore>
    </Regulatory>
    <ReservePrice currencyID="CurrencyCodeType"> AmountType (double) </ReservePrice>
    <ReturnPolicy> ReturnPolicyType
      <Description> string </Description>
      <InternationalRefundOption> token </InternationalRefundOption>
      <InternationalReturnsAcceptedOption> token </InternationalReturnsAcceptedOption>
      <InternationalReturnsWithinOption> token </InternationalReturnsWithinOption>
      <InternationalShippingCostPaidByOption> token </InternationalShippingCostPaidByOption>
      <RefundOption> token </RefundOption>
      <ReturnsAcceptedOption> token </ReturnsAcceptedOption>
      <ReturnsWithinOption> token </ReturnsWithinOption>
      <ShippingCostPaidByOption> token </ShippingCostPaidByOption>
    </ReturnPolicy>
    <ScheduleTime> dateTime </ScheduleTime>
    <SecondaryCategory> CategoryType
      <CategoryID> string </CategoryID>
    </SecondaryCategory>
    <Seller> UserType </Seller>
    <SellerContactDetails> AddressType
      <CompanyName> string </CompanyName>
      <County> string </County>
      <PhoneAreaOrCityCode> string </PhoneAreaOrCityCode>
      <PhoneCountryCode> CountryCodeType </PhoneCountryCode>
      <PhoneLocalNumber> string </PhoneLocalNumber>
      <Street> string </Street>
      <Street2> string </Street2>
    </SellerContactDetails>
    <SellerProfiles> SellerProfilesType
      <SellerPaymentProfile> SellerPaymentProfileType
        <PaymentProfileID> long </PaymentProfileID>
        <PaymentProfileName> string </PaymentProfileName>
      </SellerPaymentProfile>
      <SellerReturnProfile> SellerReturnProfileType
        <ReturnProfileID> long </ReturnProfileID>
        <ReturnProfileName> string </ReturnProfileName>
      </SellerReturnProfile>
      <SellerShippingProfile> SellerShippingProfileType
        <ShippingProfileID> long </ShippingProfileID>
        <ShippingProfileName> string </ShippingProfileName>
      </SellerShippingProfile>
    </SellerProfiles>
    <SellerProvidedTitle> string </SellerProvidedTitle>
    <ShippingDetails> ShippingDetailsType
      <CalculatedShippingRate> CalculatedShippingRateType
        <InternationalPackagingHandlingCosts currencyID="CurrencyCodeType"> AmountType (double) </InternationalPackagingHandlingCosts>
        <OriginatingPostalCode> string </OriginatingPostalCode>
        <PackagingHandlingCosts currencyID="CurrencyCodeType"> AmountType (double) </PackagingHandlingCosts>
      </CalculatedShippingRate>
      <CODCost currencyID="CurrencyCodeType"> AmountType (double) </CODCost>
      <ExcludeShipToLocation> string </ExcludeShipToLocation>
      <!-- ... more ExcludeShipToLocation values allowed here ... -->
      <GlobalShipping> boolean </GlobalShipping>
      <InternationalPromotionalShippingDiscount> boolean </InternationalPromotionalShippingDiscount>
      <InternationalShippingDiscountProfileID> string </InternationalShippingDiscountProfileID>
      <InternationalShippingServiceOption> InternationalShippingServiceOptionsType
        <ShippingService> token </ShippingService>
        <ShippingServiceAdditionalCost currencyID="CurrencyCodeType"> AmountType (double) </ShippingServiceAdditionalCost>
        <ShippingServiceCost currencyID="CurrencyCodeType"> AmountType (double) </ShippingServiceCost>
        <ShippingServicePriority> int </ShippingServicePriority>
        <ShipToLocation> string </ShipToLocation>
        <!-- ... more ShipToLocation values allowed here ... -->
      </InternationalShippingServiceOption>
      <!-- ... more InternationalShippingServiceOption nodes allowed here ... -->
      <PromotionalShippingDiscount> boolean </PromotionalShippingDiscount>
      <RateTableDetails> RateTableDetailsType
        <DomesticRateTable> string </DomesticRateTable>
        <DomesticRateTableId> string </DomesticRateTableId>
        <InternationalRateTable> string </InternationalRateTable>
        <InternationalRateTableId> string </InternationalRateTableId>
      </RateTableDetails>
      <SalesTax> SalesTaxType
        <SalesTaxPercent> float </SalesTaxPercent>
        <SalesTaxState> string </SalesTaxState>
        <ShippingIncludedInTax> boolean </ShippingIncludedInTax>
      </SalesTax>
      <ShippingDiscountProfileID> string </ShippingDiscountProfileID>
      <ShippingServiceOptions> ShippingServiceOptionsType
        <FreeShipping> boolean </FreeShipping>
        <ShippingService> token </ShippingService>
        <ShippingServiceAdditionalCost currencyID="CurrencyCodeType"> AmountType (double) </ShippingServiceAdditionalCost>
        <ShippingServiceCost currencyID="CurrencyCodeType"> AmountType (double) </ShippingServiceCost>
        <ShippingServicePriority> int </ShippingServicePriority>
      </ShippingServiceOptions>
      <!-- ... more ShippingServiceOptions nodes allowed here ... -->
      <ShippingType> ShippingTypeCodeType </ShippingType>
    </ShippingDetails>
    <ShippingPackageDetails> ShipPackageDetailsType
      <MeasurementUnit> MeasurementSystemCodeType </MeasurementUnit>
      <PackageDepth> MeasureType (decimal) </PackageDepth>
      <PackageLength> MeasureType (decimal) </PackageLength>
      <PackageWidth> MeasureType (decimal) </PackageWidth>
      <ShippingIrregular> boolean </ShippingIrregular>
      <ShippingPackage> ShippingPackageCodeType </ShippingPackage>
      <WeightMajor> MeasureType (decimal) </WeightMajor>
      <WeightMinor> MeasureType (decimal) </WeightMinor>
    </ShippingPackageDetails>
    <ShippingServiceCostOverrideList> ShippingServiceCostOverrideListType
      <ShippingServiceCostOverride> ShippingServiceCostOverrideType
        <ShippingServiceAdditionalCost currencyID="CurrencyCodeType"> AmountType (double) </ShippingServiceAdditionalCost>
        <ShippingServiceCost currencyID="CurrencyCodeType"> AmountType (double) </ShippingServiceCost>
        <ShippingServicePriority> int </ShippingServicePriority>
        <ShippingServiceType> ShippingServiceType </ShippingServiceType>
      </ShippingServiceCostOverride>
      <!-- ... more ShippingServiceCostOverride nodes allowed here ... -->
    </ShippingServiceCostOverrideList>
    <ShipToLocations> string </ShipToLocations>
    <!-- ... more ShipToLocations values allowed here ... -->
    <SKU> SKUType (string) </SKU>
    <StartPrice currencyID="CurrencyCodeType"> AmountType (double) </StartPrice>
    <Storefront> StorefrontType
      <StoreCategory2ID> long </StoreCategory2ID>
      <StoreCategory2Name> string </StoreCategory2Name>
      <StoreCategoryID> long </StoreCategoryID>
      <StoreCategoryName> string </StoreCategoryName>
    </Storefront>
    <SubTitle> string </SubTitle>
    <TaxCategory> string </TaxCategory>
    <Title> string </Title>
    <UpdateReturnPolicy> boolean </UpdateReturnPolicy>
    <UpdateSellerInfo> boolean </UpdateSellerInfo>
    <UseTaxTable> boolean </UseTaxTable>
    <VATDetails> VATDetailsType
      <BusinessSeller> boolean </BusinessSeller>
      <RestrictedToBusiness> boolean </RestrictedToBusiness>
      <VATPercent> float </VATPercent>
    </VATDetails>
    <VideoDetails> VideoDetailsType
      <VideoID> string </VideoID>
      <!-- ... more VideoID values allowed here ... -->
    </VideoDetails>
    <VIN> string </VIN>
    <VRM> string </VRM>
  </Item>
  <VerifyOnly> boolean </VerifyOnly>
  <!-- Standard Input Fields -->
  <ErrorHandling> ErrorHandlingCodeType </ErrorHandling>
  <ErrorLanguage> string </ErrorLanguage>
  <InvocationID> UUIDType (string) </InvocationID>
  <MessageID> string </MessageID>
  <Version> string </Version>
  <WarningLevel> WarningLevelCodeType </WarningLevel>
</ReviseItemRequest>
`