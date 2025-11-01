// Real Estate Tokenization Contract Configuration
export const CONTRACT_ADDRESS = "0x16889c1918af6Ad8Ac06bf49435930Ed2574C00E";

// Celo Sepolia Testnet configuration
export const CELO_SEPOLIA_CONFIG = {
  chainId: "0xAA044C", // 11142220 in hex
  chainName: "Celo Sepolia Testnet",
  nativeCurrency: {
    name: "CELO",
    symbol: "CELO",
    decimals: 18
  },
  rpcUrls: ["https://forno.celo-sepolia.celo-testnet.org"],
  blockExplorerUrls: ["https://sepolia.celoscan.io"]
};

// Contract ABI - All essential functions
export const CONTRACT_ABI = [
  // Write functions
  "function registerProperty(string name, string location, uint8 propertyType, uint256 totalValue, uint256 totalShares, uint256 pricePerShare, uint256 monthlyRentalIncome, string metadataURI) external returns (uint256)",
  "function purchaseShares(uint256 propertyId, uint256 shares) external payable",
  "function createOffer(uint256 propertyId, uint256 shares, uint256 pricePerShare) external payable returns (uint256)",
  "function acceptOffer(uint256 offerId) external",
  "function cancelOffer(uint256 offerId) external",
  "function depositRentalIncome(uint256 propertyId, string period) external payable",
  "function claimDividends(uint256 propertyId) external",
  "function verifyProperty(uint256 propertyId) external",
  "function updatePropertyStatus(uint256 propertyId, uint8 status) external",
  "function updatePlatformFee(uint256 newFeePercent) external",
  "function withdrawFees() external",
  
  // Read functions
  "function properties(uint256) external view returns (uint256 propertyId, address owner, string name, string location, uint8 propertyType, uint256 totalValue, uint256 totalShares, uint256 availableShares, uint256 pricePerShare, uint8 status, bool isVerified, uint256 monthlyRentalIncome, uint256 createdAt, string metadataURI)",
  "function offers(uint256) external view returns (uint256 offerId, uint256 propertyId, address buyer, uint256 sharesOffered, uint256 pricePerShare, uint256 totalPrice, bool isActive, uint256 expiresAt)",
  "function getTotalProperties() external view returns (uint256)",
  "function getTotalOffers() external view returns (uint256)",
  "function getUserProperties(address user) external view returns (uint256[] memory)",
  "function getUserShares(uint256 propertyId, address user) external view returns (uint256)",
  "function getPropertyOffers(uint256 propertyId) external view returns (uint256[] memory)",
  "function calculateUserDividend(uint256 propertyId, address user) external view returns (uint256)",
  "function getUnclaimedDividends(uint256 propertyId) external view returns (uint256)",
  "function platformFeePercent() external view returns (uint256)",
  "function accumulatedFees() external view returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function balanceOf(address owner) external view returns (uint256)",
  
  // Events
  "event PropertyRegistered(uint256 indexed propertyId, address indexed owner, string name, uint256 totalValue, uint256 totalShares)",
  "event PropertyVerified(uint256 indexed propertyId)",
  "event SharesPurchased(uint256 indexed propertyId, address indexed buyer, uint256 shares, uint256 totalPrice)",
  "event SharesTransferred(uint256 indexed propertyId, address indexed from, address indexed to, uint256 shares)",
  "event RentalIncomeDeposited(uint256 indexed propertyId, uint256 amount, string period)",
  "event DividendsClaimed(uint256 indexed propertyId, address indexed shareholder, uint256 amount)",
  "event OfferCreated(uint256 indexed offerId, uint256 indexed propertyId, address indexed buyer, uint256 shares, uint256 pricePerShare)",
  "event OfferAccepted(uint256 indexed offerId, uint256 indexed propertyId, address indexed seller, address buyer, uint256 shares)"
];

// Property types
export const PROPERTY_TYPES = [
  "Residential",
  "Commercial",
  "Industrial",
  "Land",
  "Mixed"
];

// Property status
export const PROPERTY_STATUS = [
  "Active",
  "Sold",
  "Under Offer",
  "Rented",
  "Inactive"
];
