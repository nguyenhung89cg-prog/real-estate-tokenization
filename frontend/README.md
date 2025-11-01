# 🏠 Real Estate Tokenization - Frontend

A modern React frontend for interacting with the Real Estate Tokenization smart contract on Celo blockchain.

## 🚀 Live Demo

**Frontend URL:** http://localhost:3002

**Smart Contract:** `0x16889c1918af6Ad8Ac06bf49435930Ed2574C00E` (Celo Sepolia)

## ✨ Features

### 🏘️ Marketplace
- Browse all available properties
- View property details (type, location, value, shares)
- See verification status and monthly rental income
- Purchase shares directly from property owners
- Create offers to buy shares from existing shareholders
- Real-time availability updates

### 🏠 My Properties
- View all properties you own shares in
- See your ownership percentage
- Track your share value
- View proportional monthly rental income
- Claim accumulated dividends
- Deposit rental income (for property owners)

### 🤝 Offers
- View all active offers on the marketplace
- Accept offers for properties you hold shares in
- See offer details (buyer, shares, price, expiration)
- Track your own offers

### ➕ Register Property
- Tokenize new real estate as NFT
- Set fractional shares parameters
- Define pricing and rental income
- Add IPFS metadata
- Support for 5 property types

## 🛠️ Technology Stack

- **React 18** - Modern UI framework
- **Vite** - Fast build tool
- **Ethers.js v6** - Ethereum/Celo blockchain interaction
- **MetaMask** - Web3 wallet integration
- **CSS3** - Responsive styling with animations

## 📋 Prerequisites

- Node.js v18 or higher
- MetaMask browser extension
- Testnet CELO (from https://faucet.celo.org/sepolia)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

Frontend will be available at **http://localhost:3002**

### 3. Connect MetaMask

1. Click "Connect MetaMask" button
2. Approve connection request
3. Switch to Celo Sepolia network (automatic prompt)
4. Start interacting with the DApp!

## 📱 Features Guide

### Connecting Your Wallet

1. Install MetaMask extension
2. Import account with testnet CELO
3. Click "Connect MetaMask" in header
4. Approve network switch to Celo Sepolia
5. Your address and balance will appear

### Browsing Properties

Navigate to **Marketplace** tab:
- View all registered properties
- See property details and availability
- Check verification status (✓ verified badge)
- Filter by property status (Active, Sold, etc.)

### Purchasing Shares

1. Find property in marketplace
2. Click "Buy Shares" button
3. Enter number of shares to purchase
4. Review total cost
5. Confirm transaction in MetaMask
6. Wait for confirmation ✅

### Creating Offers

Want to buy from existing shareholders?

1. Navigate to desired property
2. Click "Make Offer" button
3. Enter shares wanted and price per share
4. Funds are locked in contract
5. Wait for shareholder to accept

### Accepting Offers

Own shares? Sell them via offers:

1. Go to **Offers** tab
2. Find offers for your properties
3. Click "Accept Offer" if you have enough shares
4. Shares transfer, you receive payment

### Claiming Dividends

Earn passive income from rental payments:

1. Go to **My Properties** tab
2. Click "Claim Dividends" on any property
3. See claimable amount
4. Confirm to receive your share
5. Proportional to your ownership percentage

### Depositing Rental Income

Property owners can distribute rental income:

1. Go to **My Properties** tab
2. Click "Deposit Rental" (only for properties you own NFT)
3. Enter amount and period (e.g., "January 2024")
4. Funds distributed proportionally to all shareholders

### Registering Properties

Tokenize your real estate:

1. Navigate to **Register Property** tab
2. Fill in property details:
   - Name and location
   - Property type (Residential, Commercial, etc.)
   - Total value in CELO
   - Number of shares
   - Price per share
   - Monthly rental income
   - IPFS metadata URI (optional)
3. Submit transaction
4. You receive ERC-721 NFT + all shares initially

## 🎨 User Interface

### Dashboard Stats
- Total properties on platform
- Active offers count
- Platform fee percentage
- Your property count

### Property Cards
Each property displays:
- Name and location
- Property type badge
- Verification status
- Total value and shares
- Available shares
- Price per share
- Monthly rental income
- Registration date

### Modal Dialogs
Interactive modals for:
- Share purchasing
- Offer creation
- Dividend claiming
- Rental deposits

### Notifications
- Success messages (green)
- Error messages (red)
- Auto-dismiss after 5 seconds
- Manual close button

## 🌐 Network Configuration

**Celo Sepolia Testnet:**
- Chain ID: `11142220` (0xAA044C hex)
- RPC: https://forno.celo-sepolia.celo-testnet.org
- Explorer: https://sepolia.celoscan.io
- Symbol: CELO

Network is added automatically when you connect!

## 🔧 Configuration

Edit `src/config.js` to customize:

```javascript
// Contract address
export const CONTRACT_ADDRESS = "0x16889c1918af6Ad8Ac06bf49435930Ed2574C00E";

// Network settings
export const CELO_SEPOLIA_CONFIG = {
  chainId: "0xAA044C",
  chainName: "Celo Sepolia Testnet",
  // ... other settings
};
```

## 📊 Property Types

- **Residential** - Houses, apartments, condos
- **Commercial** - Offices, retail spaces, malls
- **Industrial** - Warehouses, factories, storage
- **Land** - Undeveloped plots
- **Mixed** - Mixed-use properties

## 💡 Use Cases

### For Investors
- Low barrier to entry (buy fractional shares)
- Diversify across multiple properties
- Earn passive rental income
- Trade shares on secondary market
- Transparent ownership on blockchain

### For Property Owners
- Unlock liquidity from real estate
- Raise capital by selling shares
- Maintain control with NFT ownership
- Automate rental distribution
- Reach global investor base

### For Traders
- Speculate on property values
- Create offers above/below market
- Flip shares for profit
- Build real estate portfolio
- 24/7 trading availability

## 🐛 Troubleshooting

### MetaMask Not Detected
- Install MetaMask extension
- Refresh page
- Check browser compatibility

### Wrong Network
- Click "Connect" again
- Approve network switch
- Or manually add Celo Sepolia in MetaMask

### Transaction Failed
- Check CELO balance for gas
- Ensure you have enough funds
- Verify share availability
- Try increasing gas limit

### Data Not Loading
- Check internet connection
- Verify contract address in config.js
- Refresh page
- Clear browser cache

## 🔒 Security Best Practices

- Never share your private keys
- Always verify contract address
- Review transactions before signing
- Use testnet for learning
- Keep MetaMask locked when not in use
- Backup your recovery phrase

## 📱 Responsive Design

Fully responsive for:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)

Optimized touch interactions for mobile users.

## 🎯 Performance

- Fast loading with Vite
- Code splitting for optimal bundle size
- Lazy loading of property data
- Efficient re-renders with React hooks
- Minimal API calls with caching

## 🔄 State Management

Uses React hooks for state:
- `useState` - Component state
- `useEffect` - Side effects and data loading
- No external state library needed

## 📦 Build for Production

```bash
npm run build
```

Outputs to `dist/` folder. Deploy to:
- Vercel
- Netlify
- GitHub Pages
- IPFS
- Any static hosting

## 🌟 Future Enhancements

- [ ] IPFS integration for property images
- [ ] Advanced filtering and search
- [ ] Property analytics dashboard
- [ ] Chart.js for price history
- [ ] Notification system for offers
- [ ] Multi-language support
- [ ] Dark mode toggle
- [ ] Mobile app version

## 🤝 Integration with Smart Contract

Frontend reads from contract:
- `getTotalProperties()` - Property count
- `properties(id)` - Property details
- `getUserShares()` - User ownership
- `calculateUserDividend()` - Claimable amount
- `offers(id)` - Offer details

Frontend writes to contract:
- `registerProperty()` - Create new property
- `purchaseShares()` - Buy shares
- `createOffer()` - Make buy offer
- `acceptOffer()` - Sell shares
- `depositRentalIncome()` - Add rental
- `claimDividends()` - Withdraw earnings

All transactions show loading states and confirmations!

## 📞 Support

- Contract: `0x16889c1918af6Ad8Ac06bf49435930Ed2574C00E`
- Explorer: https://sepolia.celoscan.io/address/0x16889c1918af6Ad8Ac06bf49435930Ed2574C00E
- Network: Celo Sepolia Testnet
- Port: 3002

## 📄 License

MIT License

---

Built with ❤️ using React + Vite + Ethers.js on Celo
