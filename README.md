# 🏠 Real Estate Tokenization Platform

A decentralized platform for tokenizing real estate properties as NFTs with fractional ownership, built on Celo blockchain.

## 🌟 Overview

This DApp enables property owners to tokenize their real estate into tradeable NFTs with fractional shares, allowing multiple investors to own portions of properties and earn proportional rental income.

## ✨ Key Features

### 🏘️ Property Tokenization
- Tokenize properties as ERC-721 NFTs
- Divide ownership into fractional shares
- Support for multiple property types (Residential, Commercial, Industrial, Land, Mixed)
- IPFS metadata storage for property details

### 💼 Fractional Ownership
- Purchase shares of properties
- Trade shares on secondary market via offers
- Track individual shareholdings per property
- Proportional voting rights (future implementation)

### 💰 Rental Income Distribution
- Property owners deposit monthly rental income
- Automatic proportional distribution to all shareholders
- Claim dividends at any time
- Transparent rental history tracking

### 🤝 Marketplace
- Create offers to buy shares from existing holders
- Accept offers to sell your shares
- Cancel offers and receive refund
- Time-limited offers with expiration

### 🛡️ Security Features
- Property verification by platform admin
- ReentrancyGuard on all payment functions
- 2.5% platform fee on transactions
- Ownable access control

## 🏗️ Smart Contract Architecture

### Core Components

**Property NFT (ERC-721)**
- Each property is a unique NFT
- Owner holds the NFT, representing primary ownership
- Metadata stored on IPFS

**Fractional Shares System**
- Properties divided into configurable number of shares
- Shareholders tracked per property
- Shares can be transferred via marketplace offers

**Rental Income Pool**
- Rental deposits accumulate per property
- Dividends calculated proportionally based on share ownership
- Claimable by any shareholder

### Property Types
```solidity
enum PropertyType {
    Residential,  // Houses, apartments
    Commercial,   // Offices, retail spaces
    Industrial,   // Warehouses, factories
    Land,         // Undeveloped land
    Mixed         // Mixed-use properties
}
```

### Property Status
```solidity
enum PropertyStatus {
    Active,       // Available for investment
    Sold,         // Fully sold out
    UnderOffer,   // Has pending offers
    Rented,       // Currently rented
    Inactive      // Not active
}
```

## 📊 Contract Functions

### Property Management
- `registerProperty()` - Tokenize a new property
- `updatePropertyStatus()` - Change property status
- `verifyProperty()` - Admin verification

### Share Trading
- `purchaseShares()` - Buy shares from property owner
- `createOffer()` - Create bid to buy shares
- `acceptOffer()` - Sell shares to offer creator
- `cancelOffer()` - Cancel offer and get refund

### Rental Income
- `depositRentalIncome()` - Deposit monthly rental
- `claimDividends()` - Claim your share of rental income
- `calculateUserDividend()` - View claimable amount

### View Functions
- `getUserShares()` - Check shares owned
- `getUserProperties()` - List your properties
- `getPropertyOffers()` - View offers for property
- `getUnclaimedDividends()` - Check unclaimed rental income

## 🧪 Testing

Comprehensive test suite with 24 tests covering:

```bash
npm test
```

**Test Coverage:**
- ✅ Property registration
- ✅ Share purchasing
- ✅ Offer creation and acceptance
- ✅ Rental income distribution
- ✅ Dividend claiming
- ✅ Property verification
- ✅ Admin functions
- ✅ Access control
- ✅ Edge cases and error handling

**All 24 tests passing!**

## 🚀 Deployment

### Prerequisites
- Node.js v18+
- 12-word mnemonic with testnet CELO

### Setup
```bash
npm install
npx hardhat compile
```

### Deploy to Celo Sepolia
```bash
npm run deploy:testnet
```

### Verify on Celoscan (optional)
```bash
# Add CELOSCAN_API_KEY to .env first
npm run verify
```

### Test Interactions
```bash
npm run interact
```

## 📖 Usage Examples

### 1. Register Property
```javascript
const tx = await realEstate.registerProperty(
  "Luxury Villa Miami",
  "Miami Beach, FL",
  0, // Residential
  ethers.parseEther("1000"), // Total value
  1000, // Total shares
  ethers.parseEther("1"), // Price per share
  ethers.parseEther("5"), // Monthly rental
  "ipfs://QmPropertyMetadata..."
);
```

### 2. Purchase Shares
```javascript
const tx = await realEstate.purchaseShares(
  1, // Property ID
  50, // Number of shares
  { value: ethers.parseEther("50") } // Payment
);
```

### 3. Create Offer
```javascript
const tx = await realEstate.createOffer(
  1, // Property ID
  100, // Shares wanted
  ethers.parseEther("1.2"), // Price per share
  { value: ethers.parseEther("120") } // Total payment
);
```

### 4. Deposit Rental Income
```javascript
const tx = await realEstate.depositRentalIncome(
  1, // Property ID
  "January 2024",
  { value: ethers.parseEther("5") }
);
```

### 5. Claim Dividends
```javascript
const dividend = await realEstate.calculateUserDividend(1, userAddress);
const tx = await realEstate.claimDividends(1);
```

## 🎯 Use Cases

### For Property Owners
- **Liquidity**: Convert illiquid real estate into tradeable tokens
- **Fractional Sales**: Sell portions while retaining ownership
- **Rental Management**: Automate rental income distribution
- **Global Access**: Reach international investors

### For Investors
- **Low Barrier**: Invest with small amounts
- **Diversification**: Own shares of multiple properties
- **Passive Income**: Earn rental dividends
- **Liquidity**: Trade shares on secondary market

### For Developers
- **Crowdfunding**: Raise capital for property development
- **Tokenized REITs**: Create decentralized real estate funds
- **Property Management**: Track ownership transparently
- **DeFi Integration**: Use property tokens as collateral

## 🔒 Security Considerations

- All payment functions use `nonReentrant` modifier
- Owner-only functions for verification and admin tasks
- Platform fee capped at 10%
- Offer expiration to prevent stale orders
- Share balance validation on all transfers

## 📝 Contract Events

```solidity
event PropertyRegistered(uint256 propertyId, address owner, string name, uint256 value, uint256 shares);
event PropertyVerified(uint256 propertyId);
event SharesPurchased(uint256 propertyId, address buyer, uint256 shares, uint256 totalPrice);
event SharesTransferred(uint256 propertyId, address from, address to, uint256 shares);
event RentalIncomeDeposited(uint256 propertyId, uint256 amount, string period);
event DividendsClaimed(uint256 propertyId, address shareholder, uint256 amount);
event OfferCreated(uint256 offerId, uint256 propertyId, address buyer, uint256 shares);
event OfferAccepted(uint256 offerId, uint256 propertyId, address seller, address buyer);
```

## 🌐 Network Configuration

**Celo Sepolia Testnet:**
- Chain ID: 11142220
- RPC: https://forno.celo-sepolia.celo-testnet.org
- Explorer: https://sepolia.celoscan.io
- Faucet: https://faucet.celo.org/sepolia

## 🛠️ Technology Stack

- **Smart Contracts**: Solidity 0.8.20
- **Framework**: Hardhat
- **Standards**: OpenZeppelin ERC-721, Ownable, ReentrancyGuard
- **Network**: Celo blockchain
- **Testing**: Chai, Hardhat Network
- **Metadata**: IPFS

## 📂 Project Structure

```
real-estate-tokenization/
├── contracts/
│   └── RealEstateTokenization.sol   # Main contract
├── scripts/
│   ├── deploy.js                    # Deployment script
│   ├── verify.js                    # Celoscan verification
│   └── interact.js                  # Interaction examples
├── test/
│   └── RealEstateTokenization.test.js # 24 comprehensive tests
├── hardhat.config.js                # Celo network config
├── package.json                     # Dependencies
└── .env                             # Environment variables
```

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- Frontend React application
- Advanced marketplace features
- Property management dashboard
- Integration with property registries
- Cross-chain bridging

## 📄 License

MIT License
