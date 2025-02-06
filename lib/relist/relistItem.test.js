const relistItem = require("./relistItem");
const { getListingImages, endListing } = require("../ebayMethods/ebayApi");
const InventoryItem = require("../../models/inventoryItem");

// Mock dependencies
jest.mock('../ebayApi', () => ({
  getListingImages: jest.fn(),
  endListing: jest.fn()
}));

jest.mock('../../models/inventoryItem', () => ({
  findOne: jest.fn()
}));

describe('relistItem', () => {
  const mockItemId = 'item123';
  const mockUserId = 'user123';
  const mockEbayAuthToken = 'mock-auth-token';
  const mockTemplate = 'mock-template';
  const mockReductionPercentage = 0.1;
  
  const mockInventoryItem = {
    _id: mockItemId,
    userId: mockUserId,
    title: 'Test Item',
    brand: 'Test Brand',
    sku: 'TEST123',
    listedPrice: 100,
    conditionId: '1000',
    conditionDescription: 'New',
    acceptOfferHigh: 90,
    declineOfferLow: 70,
    description: 'Test Description',
    categoryId: '123',
    partNo: 'PART123',
    shippingService: 'USPS'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    InventoryItem.findOne.mockResolvedValue(mockInventoryItem);
  });

  it('should successfully get images and validate them', async () => {
    const mockImages = [
      'https://i.ebayimg.com/image1.jpg',
      'https://i.ebayimg.com/image2.jpg'
    ];
    
    getListingImages.mockResolvedValue({
      success: true,
      images: mockImages
    });

    endListing.mockImplementation(() => {
      throw new Error('endListing should not be called in this test');
    });

    const result = await relistItem(
      mockItemId,
      mockUserId,
      mockEbayAuthToken,
      mockTemplate,
      mockReductionPercentage
    );

    expect(InventoryItem.findOne).toHaveBeenCalledWith({
      _id: mockItemId,
      userId: mockUserId
    });
    expect(getListingImages).toHaveBeenCalledWith(mockEbayAuthToken, mockItemId);
    expect(result.success).toBe(true);
    expect(result.images).toEqual(mockImages);
  });

  it('should fail when no valid eBay images are found', async () => {
    getListingImages.mockResolvedValue({
      success: true,
      images: ['https://invalid-domain.com/image1.jpg']
    });

    const result = await relistItem(
      mockItemId,
      mockUserId,
      mockEbayAuthToken,
      mockTemplate,
      mockReductionPercentage
    );

    expect(result.success).toBe(false);
    expect(result.message).toBe('No valid eBay images found for listing');
    expect(endListing).not.toHaveBeenCalled();
  });

  it('should fail when getListingImages fails', async () => {
    getListingImages.mockResolvedValue({
      success: false,
      message: 'Failed to fetch images'
    });

    const result = await relistItem(
      mockItemId,
      mockUserId,
      mockEbayAuthToken,
      mockTemplate,
      mockReductionPercentage
    );

    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to fetch images');
    expect(endListing).not.toHaveBeenCalled();
  });

  it('should fail when item is not found', async () => {
    InventoryItem.findOne.mockResolvedValue(null);

    const result = await relistItem(
      mockItemId,
      mockUserId,
      mockEbayAuthToken,
      mockTemplate,
      mockReductionPercentage
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain('Did not find id');
    expect(getListingImages).not.toHaveBeenCalled();
    expect(endListing).not.toHaveBeenCalled();
  });
});