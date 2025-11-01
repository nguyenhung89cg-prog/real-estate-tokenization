// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RealEstateTokenization
 * @dev Decentralized platform for tokenizing real estate properties as NFTs
 * @notice Allows fractional ownership, rental income distribution, and property trading
 */
contract RealEstateTokenization is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    
    // ============ State Variables ============
    
    uint256 private _propertyIdCounter;
    uint256 private _offerIdCounter;
    uint256 public platformFeePercent = 250; // 2.5% platform fee
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public accumulatedFees;
    
    // ============ Enums ============
    
    enum PropertyType {
        Residential,
        Commercial,
        Industrial,
        Land,
        Mixed
    }
    
    enum PropertyStatus {
        Active,
        Sold,
        UnderOffer,
        Rented,
        Inactive
    }
    
    // ============ Structs ============
    
    struct Property {
        uint256 propertyId;
        address owner;
        string name;
        string location;
        PropertyType propertyType;
        uint256 totalValue; // Total property value in wei
        uint256 totalShares; // Total shares for fractional ownership
        uint256 availableShares; // Shares available for sale
        uint256 pricePerShare; // Price per share in wei
        PropertyStatus status;
        bool isVerified; // Verified by platform
        uint256 monthlyRentalIncome; // Expected monthly rental in wei
        uint256 createdAt;
        string metadataURI; // IPFS link with property details, images, documents
    }
    
    struct ShareHolder {
        address holder;
        uint256 shares;
        uint256 lastDividendClaim;
    }
    
    struct RentalIncome {
        uint256 propertyId;
        uint256 amount;
        uint256 timestamp;
        string period; // e.g., "January 2024"
    }
    
    struct Offer {
        uint256 offerId;
        uint256 propertyId;
        address buyer;
        uint256 sharesOffered;
        uint256 pricePerShare;
        uint256 totalPrice;
        bool isActive;
        uint256 expiresAt;
    }
    
    // ============ Mappings ============
    
    mapping(uint256 => Property) public properties;
    mapping(uint256 => mapping(address => uint256)) public propertyShares; // propertyId => holder => shares
    mapping(uint256 => address[]) public propertyHolders; // propertyId => list of holders
    mapping(address => uint256[]) public userProperties; // user => list of property IDs owned
    mapping(uint256 => RentalIncome[]) public rentalHistory;
    mapping(uint256 => uint256) public totalRentalCollected;
    mapping(uint256 => uint256) public unclaimedDividends; // propertyId => unclaimed amount
    mapping(uint256 => Offer) public offers;
    mapping(address => uint256[]) public userOffers;
    
    // ============ Events ============
    
    event PropertyRegistered(
        uint256 indexed propertyId,
        address indexed owner,
        string name,
        uint256 totalValue,
        uint256 totalShares
    );
    
    event PropertyVerified(
        uint256 indexed propertyId,
        address indexed verifier
    );
    
    event SharesPurchased(
        uint256 indexed propertyId,
        address indexed buyer,
        uint256 shares,
        uint256 totalPrice
    );
    
    event SharesTransferred(
        uint256 indexed propertyId,
        address indexed from,
        address indexed to,
        uint256 shares
    );
    
    event RentalIncomeDeposited(
        uint256 indexed propertyId,
        uint256 amount,
        string period
    );
    
    event DividendsClaimed(
        uint256 indexed propertyId,
        address indexed holder,
        uint256 amount
    );
    
    event OfferCreated(
        uint256 indexed offerId,
        uint256 indexed propertyId,
        address indexed buyer,
        uint256 sharesOffered,
        uint256 pricePerShare
    );
    
    event OfferAccepted(
        uint256 indexed offerId,
        uint256 indexed propertyId,
        address seller,
        address buyer,
        uint256 shares
    );
    
    event PropertyStatusUpdated(
        uint256 indexed propertyId,
        PropertyStatus newStatus
    );
    
    // ============ Constructor ============
    
    constructor() ERC721("RealEstateNFT", "RENFT") Ownable(msg.sender) {}
    
    // ============ Main Functions ============
    
    /**
     * @dev Register a new property and mint NFT
     */
    function registerProperty(
        string memory name,
        string memory location,
        PropertyType propertyType,
        uint256 totalValue,
        uint256 totalShares,
        uint256 pricePerShare,
        uint256 monthlyRentalIncome,
        string memory metadataURI
    ) external returns (uint256) {
        require(totalValue > 0, "Value must be > 0");
        require(totalShares > 0, "Shares must be > 0");
        require(pricePerShare > 0, "Price must be > 0");
        require(bytes(name).length > 0, "Name required");
        require(bytes(location).length > 0, "Location required");
        
        _propertyIdCounter++;
        uint256 propertyId = _propertyIdCounter;
        
        // Mint NFT to property owner
        _safeMint(msg.sender, propertyId);
        _setTokenURI(propertyId, metadataURI);
        
        properties[propertyId] = Property({
            propertyId: propertyId,
            owner: msg.sender,
            name: name,
            location: location,
            propertyType: propertyType,
            totalValue: totalValue,
            totalShares: totalShares,
            availableShares: totalShares,
            pricePerShare: pricePerShare,
            status: PropertyStatus.Active,
            isVerified: false,
            monthlyRentalIncome: monthlyRentalIncome,
            createdAt: block.timestamp,
            metadataURI: metadataURI
        });
        
        // Owner gets all shares initially
        propertyShares[propertyId][msg.sender] = totalShares;
        propertyHolders[propertyId].push(msg.sender);
        userProperties[msg.sender].push(propertyId);
        
        emit PropertyRegistered(propertyId, msg.sender, name, totalValue, totalShares);
        
        return propertyId;
    }
    
    /**
     * @dev Purchase shares of a property
     */
    function purchaseShares(uint256 propertyId, uint256 shares) 
        external 
        payable 
        nonReentrant 
    {
        Property storage property = properties[propertyId];
        require(property.propertyId != 0, "Property not found");
        require(property.status == PropertyStatus.Active, "Property not available");
        require(shares > 0 && shares <= property.availableShares, "Invalid shares");
        
        uint256 totalCost = shares * property.pricePerShare;
        uint256 platformFee = (totalCost * platformFeePercent) / FEE_DENOMINATOR;
        uint256 sellerAmount = totalCost - platformFee;
        
        require(msg.value >= totalCost, "Insufficient payment");
        
        // Transfer shares
        propertyShares[propertyId][property.owner] -= shares;
        
        // Add new shareholder if first time
        if (propertyShares[propertyId][msg.sender] == 0) {
            propertyHolders[propertyId].push(msg.sender);
            userProperties[msg.sender].push(propertyId);
        }
        
        propertyShares[propertyId][msg.sender] += shares;
        property.availableShares -= shares;
        
        // Transfer payments
        accumulatedFees += platformFee;
        payable(property.owner).transfer(sellerAmount);
        
        // Refund excess
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
        
        emit SharesPurchased(propertyId, msg.sender, shares, totalCost);
    }
    
    /**
     * @dev Create an offer to buy shares from existing holders
     */
    function createOffer(
        uint256 propertyId,
        uint256 sharesWanted,
        uint256 pricePerShare
    ) external payable returns (uint256) {
        Property storage property = properties[propertyId];
        require(property.propertyId != 0, "Property not found");
        require(sharesWanted > 0, "Shares must be > 0");
        require(pricePerShare > 0, "Price must be > 0");
        
        uint256 totalPrice = sharesWanted * pricePerShare;
        require(msg.value >= totalPrice, "Insufficient funds");
        
        _offerIdCounter++;
        uint256 offerId = _offerIdCounter;
        
        offers[offerId] = Offer({
            offerId: offerId,
            propertyId: propertyId,
            buyer: msg.sender,
            sharesOffered: sharesWanted,
            pricePerShare: pricePerShare,
            totalPrice: totalPrice,
            isActive: true,
            expiresAt: block.timestamp + 7 days
        });
        
        userOffers[msg.sender].push(offerId);
        
        emit OfferCreated(offerId, propertyId, msg.sender, sharesWanted, pricePerShare);
        
        return offerId;
    }
    
    /**
     * @dev Accept an offer and sell shares
     */
    function acceptOffer(uint256 offerId) external nonReentrant {
        Offer storage offer = offers[offerId];
        require(offer.isActive, "Offer not active");
        require(block.timestamp < offer.expiresAt, "Offer expired");
        require(propertyShares[offer.propertyId][msg.sender] >= offer.sharesOffered, 
                "Insufficient shares");
        
        uint256 platformFee = (offer.totalPrice * platformFeePercent) / FEE_DENOMINATOR;
        uint256 sellerAmount = offer.totalPrice - platformFee;
        
        // Transfer shares
        propertyShares[offer.propertyId][msg.sender] -= offer.sharesOffered;
        
        // Add new shareholder if first time
        if (propertyShares[offer.propertyId][offer.buyer] == 0) {
            propertyHolders[offer.propertyId].push(offer.buyer);
            userProperties[offer.buyer].push(offer.propertyId);
        }
        
        propertyShares[offer.propertyId][offer.buyer] += offer.sharesOffered;
        
        // Mark offer as inactive
        offer.isActive = false;
        
        // Transfer payments
        accumulatedFees += platformFee;
        payable(msg.sender).transfer(sellerAmount);
        
        emit OfferAccepted(offerId, offer.propertyId, msg.sender, offer.buyer, offer.sharesOffered);
        emit SharesTransferred(offer.propertyId, msg.sender, offer.buyer, offer.sharesOffered);
    }
    
    /**
     * @dev Cancel an offer and refund
     */
    function cancelOffer(uint256 offerId) external nonReentrant {
        Offer storage offer = offers[offerId];
        require(offer.buyer == msg.sender, "Not offer creator");
        require(offer.isActive, "Offer not active");
        
        offer.isActive = false;
        payable(msg.sender).transfer(offer.totalPrice);
    }
    
    /**
     * @dev Deposit rental income for a property
     */
    function depositRentalIncome(uint256 propertyId, string memory period) 
        external 
        payable 
    {
        Property storage property = properties[propertyId];
        require(property.propertyId != 0, "Property not found");
        require(msg.value > 0, "Amount must be > 0");
        
        rentalHistory[propertyId].push(RentalIncome({
            propertyId: propertyId,
            amount: msg.value,
            timestamp: block.timestamp,
            period: period
        }));
        
        totalRentalCollected[propertyId] += msg.value;
        unclaimedDividends[propertyId] += msg.value;
        
        emit RentalIncomeDeposited(propertyId, msg.value, period);
    }
    
    /**
     * @dev Claim dividend proportional to shares owned
     */
    function claimDividends(uint256 propertyId) external nonReentrant {
        Property storage property = properties[propertyId];
        require(property.propertyId != 0, "Property not found");
        
        uint256 shares = propertyShares[propertyId][msg.sender];
        require(shares > 0, "No shares owned");
        
        uint256 availableDividends = unclaimedDividends[propertyId];
        require(availableDividends > 0, "No dividends available");
        
        // Calculate proportional share
        uint256 dividend = (availableDividends * shares) / property.totalShares;
        require(dividend > 0, "No dividend to claim");
        
        unclaimedDividends[propertyId] -= dividend;
        
        payable(msg.sender).transfer(dividend);
        
        emit DividendsClaimed(propertyId, msg.sender, dividend);
    }
    
    /**
     * @dev Verify a property (only owner)
     */
    function verifyProperty(uint256 propertyId) external onlyOwner {
        Property storage property = properties[propertyId];
        require(property.propertyId != 0, "Property not found");
        require(!property.isVerified, "Already verified");
        
        property.isVerified = true;
        
        emit PropertyVerified(propertyId, msg.sender);
    }
    
    /**
     * @dev Update property status
     */
    function updatePropertyStatus(uint256 propertyId, PropertyStatus newStatus) 
        external 
    {
        Property storage property = properties[propertyId];
        require(property.propertyId != 0, "Property not found");
        require(property.owner == msg.sender, "Not property owner");
        
        property.status = newStatus;
        
        emit PropertyStatusUpdated(propertyId, newStatus);
    }
    
    /**
     * @dev Update platform fee (only owner)
     */
    function updatePlatformFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= 1000, "Fee too high"); // Max 10%
        platformFeePercent = newFeePercent;
    }
    
    /**
     * @dev Withdraw accumulated fees (only owner)
     */
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 amount = accumulatedFees;
        require(amount > 0, "No fees to withdraw");
        
        accumulatedFees = 0;
        payable(owner()).transfer(amount);
    }
    
    // ============ View Functions ============
    
    function getTotalProperties() external view returns (uint256) {
        return _propertyIdCounter;
    }
    
    function getTotalOffers() external view returns (uint256) {
        return _offerIdCounter;
    }
    
    function getUserProperties(address user) external view returns (uint256[] memory) {
        return userProperties[user];
    }
    
    function getUserOffers(address user) external view returns (uint256[] memory) {
        return userOffers[user];
    }
    
    function getPropertyHolders(uint256 propertyId) external view returns (address[] memory) {
        return propertyHolders[propertyId];
    }
    
    function getUserShares(uint256 propertyId, address user) external view returns (uint256) {
        return propertyShares[propertyId][user];
    }
    
    function getRentalHistory(uint256 propertyId) external view returns (RentalIncome[] memory) {
        return rentalHistory[propertyId];
    }
    
    function getUnclaimedDividends(uint256 propertyId) external view returns (uint256) {
        return unclaimedDividends[propertyId];
    }
    
    function calculateUserDividend(uint256 propertyId, address user) 
        external 
        view 
        returns (uint256) 
    {
        Property storage property = properties[propertyId];
        uint256 shares = propertyShares[propertyId][user];
        
        if (shares == 0) return 0;
        
        uint256 availableDividends = unclaimedDividends[propertyId];
        return (availableDividends * shares) / property.totalShares;
    }
    
    // ============ Required Overrides ============
    
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
