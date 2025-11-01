import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, CELO_SEPOLIA_CONFIG, PROPERTY_TYPES, PROPERTY_STATUS } from './config';
import './App.css';

function App() {
  // State management
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('marketplace');
  
  // Data states
  const [properties, setProperties] = useState([]);
  const [myProperties, setMyProperties] = useState([]);
  const [offers, setOffers] = useState([]);
  const [contractStats, setContractStats] = useState({
    totalProperties: 0,
    totalOffers: 0,
    platformFee: 0
  });
  
  // Form states
  const [newProperty, setNewProperty] = useState({
    name: '',
    location: '',
    propertyType: 'Residential',
    totalValue: '',
    totalShares: '',
    pricePerShare: '',
    monthlyRentalIncome: '',
    metadataURI: ''
  });
  
  const [purchaseModal, setPurchaseModal] = useState({
    show: false,
    propertyId: null,
    shares: '',
    pricePerShare: '0',
    totalCost: '0',
    propertyName: ''
  });
  
  const [offerModal, setOfferModal] = useState({
    show: false,
    propertyId: null,
    shares: '',
    pricePerShare: '',
    propertyName: ''
  });
  
  const [dividendModal, setDividendModal] = useState({
    show: false,
    propertyId: null,
    propertyName: '',
    claimableAmount: '0',
    userShares: 0
  });

  const [rentalModal, setRentalModal] = useState({
    show: false,
    propertyId: null,
    amount: '',
    period: '',
    propertyName: ''
  });

  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      setLoading(true);
      setError('');

      if (!window.ethereum) {
        throw new Error('Please install MetaMask to use this DApp');
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const network = await web3Provider.getNetwork();

      if (network.chainId !== 11142220n) {
        await switchToCeloSepolia();
      }

      const signer = await web3Provider.getSigner();
      const address = await signer.getAddress();
      const bal = await web3Provider.getBalance(address);

      const realEstateContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      setProvider(web3Provider);
      setContract(realEstateContract);
      setAccount(address);
      setBalance(ethers.formatEther(bal));
      setSuccess('Wallet connected successfully!');
      
      await loadAllData(realEstateContract, address);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Connection error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Switch to Celo Sepolia network
  const switchToCeloSepolia = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CELO_SEPOLIA_CONFIG.chainId }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [CELO_SEPOLIA_CONFIG],
        });
      } else {
        throw switchError;
      }
    }
  };

  // Load all data
  const loadAllData = async (contractInstance, userAddress) => {
    try {
      await Promise.all([
        loadProperties(contractInstance),
        loadMyProperties(contractInstance, userAddress),
        loadOffers(contractInstance),
        loadContractStats(contractInstance)
      ]);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data from contract');
    }
  };

  // Load all properties
  const loadProperties = async (contractInstance) => {
    try {
      const total = await contractInstance.getTotalProperties();
      const loadedProperties = [];

      for (let i = 1; i <= Number(total); i++) {
        const property = await contractInstance.properties(i);
        loadedProperties.push({
          propertyId: Number(property[0]),
          owner: property[1],
          name: property[2],
          location: property[3],
          propertyType: PROPERTY_TYPES[Number(property[4])],
          totalValue: ethers.formatEther(property[5]),
          totalShares: Number(property[6]),
          availableShares: Number(property[7]),
          pricePerShare: ethers.formatEther(property[8]),
          status: PROPERTY_STATUS[Number(property[9])],
          isVerified: property[10],
          monthlyRentalIncome: ethers.formatEther(property[11]),
          createdAt: new Date(Number(property[12]) * 1000).toLocaleDateString(),
          metadataURI: property[13]
        });
      }

      setProperties(loadedProperties);
    } catch (err) {
      console.error('Error loading properties:', err);
    }
  };

  // Load my properties
  const loadMyProperties = async (contractInstance, userAddress) => {
    try {
      const propertyIds = await contractInstance.getUserProperties(userAddress);
      const myProps = [];

      for (let id of propertyIds) {
        const property = await contractInstance.properties(id);
        const userShares = await contractInstance.getUserShares(id, userAddress);
        
        myProps.push({
          propertyId: Number(property[0]),
          owner: property[1],
          name: property[2],
          location: property[3],
          propertyType: PROPERTY_TYPES[Number(property[4])],
          totalValue: ethers.formatEther(property[5]),
          totalShares: Number(property[6]),
          availableShares: Number(property[7]),
          pricePerShare: ethers.formatEther(property[8]),
          status: PROPERTY_STATUS[Number(property[9])],
          isVerified: property[10],
          monthlyRentalIncome: ethers.formatEther(property[11]),
          createdAt: new Date(Number(property[12]) * 1000).toLocaleDateString(),
          metadataURI: property[13],
          userShares: Number(userShares)
        });
      }

      setMyProperties(myProps);
    } catch (err) {
      console.error('Error loading my properties:', err);
    }
  };

  // Load offers
  const loadOffers = async (contractInstance) => {
    try {
      const totalOffers = await contractInstance.getTotalOffers();
      const loadedOffers = [];

      for (let i = 1; i <= Number(totalOffers); i++) {
        const offer = await contractInstance.offers(i);
        if (offer[6]) { // isActive
          const property = await contractInstance.properties(offer[1]);
          loadedOffers.push({
            offerId: Number(offer[0]),
            propertyId: Number(offer[1]),
            buyer: offer[2],
            sharesOffered: Number(offer[3]),
            pricePerShare: ethers.formatEther(offer[4]),
            totalPrice: ethers.formatEther(offer[5]),
            isActive: offer[6],
            expiresAt: new Date(Number(offer[7]) * 1000).toLocaleDateString(),
            propertyName: property[2]
          });
        }
      }

      setOffers(loadedOffers);
    } catch (err) {
      console.error('Error loading offers:', err);
    }
  };

  // Load contract stats
  const loadContractStats = async (contractInstance) => {
    try {
      const totalProps = await contractInstance.getTotalProperties();
      const totalOffs = await contractInstance.getTotalOffers();
      const fee = await contractInstance.platformFeePercent();

      setContractStats({
        totalProperties: Number(totalProps),
        totalOffers: Number(totalOffs),
        platformFee: Number(fee) / 100
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  // Register new property
  const registerProperty = async (e) => {
    e.preventDefault();
    if (!contract) return;

    try {
      setLoading(true);
      setError('');

      const propertyTypeIndex = PROPERTY_TYPES.indexOf(newProperty.propertyType);
      
      const tx = await contract.registerProperty(
        newProperty.name,
        newProperty.location,
        propertyTypeIndex,
        ethers.parseEther(newProperty.totalValue),
        newProperty.totalShares,
        ethers.parseEther(newProperty.pricePerShare),
        ethers.parseEther(newProperty.monthlyRentalIncome),
        newProperty.metadataURI
      );

      setSuccess('Registering property... Please wait for confirmation.');
      await tx.wait();
      
      setSuccess('Property registered successfully!');
      setNewProperty({
        name: '',
        location: '',
        propertyType: 'Residential',
        totalValue: '',
        totalShares: '',
        pricePerShare: '',
        monthlyRentalIncome: '',
        metadataURI: ''
      });

      await loadAllData(contract, account);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Error registering property:', err);
      setError(err.message || 'Failed to register property');
    } finally {
      setLoading(false);
    }
  };

  // Purchase shares
  const handlePurchaseShares = async () => {
    if (!contract || !purchaseModal.shares) return;

    try {
      setLoading(true);
      setError('');

      const totalCost = ethers.parseEther(purchaseModal.totalCost);
      
      const tx = await contract.purchaseShares(
        purchaseModal.propertyId,
        purchaseModal.shares,
        { value: totalCost }
      );

      setSuccess('Purchasing shares... Please wait for confirmation.');
      await tx.wait();
      
      setSuccess('Shares purchased successfully!');
      setPurchaseModal({ show: false, propertyId: null, shares: '', pricePerShare: '0', totalCost: '0', propertyName: '' });

      await loadAllData(contract, account);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Error purchasing shares:', err);
      setError(err.message || 'Failed to purchase shares');
    } finally {
      setLoading(false);
    }
  };

  // Create offer
  const handleCreateOffer = async () => {
    if (!contract || !offerModal.shares || !offerModal.pricePerShare) return;

    try {
      setLoading(true);
      setError('');

      const totalPrice = parseFloat(offerModal.shares) * parseFloat(offerModal.pricePerShare);
      
      const tx = await contract.createOffer(
        offerModal.propertyId,
        offerModal.shares,
        ethers.parseEther(offerModal.pricePerShare),
        { value: ethers.parseEther(totalPrice.toString()) }
      );

      setSuccess('Creating offer... Please wait for confirmation.');
      await tx.wait();
      
      setSuccess('Offer created successfully!');
      setOfferModal({ show: false, propertyId: null, shares: '', pricePerShare: '', propertyName: '' });

      await loadAllData(contract, account);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Error creating offer:', err);
      setError(err.message || 'Failed to create offer');
    } finally {
      setLoading(false);
    }
  };

  // Accept offer
  const acceptOffer = async (offerId) => {
    if (!contract) return;

    try {
      setLoading(true);
      setError('');

      const tx = await contract.acceptOffer(offerId);
      setSuccess('Accepting offer... Please wait for confirmation.');
      await tx.wait();
      
      setSuccess('Offer accepted successfully!');
      await loadAllData(contract, account);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Error accepting offer:', err);
      setError(err.message || 'Failed to accept offer');
    } finally {
      setLoading(false);
    }
  };

  // Deposit rental income
  const handleDepositRentalIncome = async () => {
    if (!contract || !rentalModal.amount || !rentalModal.period) return;

    try {
      setLoading(true);
      setError('');

      const tx = await contract.depositRentalIncome(
        rentalModal.propertyId,
        rentalModal.period,
        { value: ethers.parseEther(rentalModal.amount) }
      );

      setSuccess('Depositing rental income... Please wait for confirmation.');
      await tx.wait();
      
      setSuccess('Rental income deposited successfully!');
      setRentalModal({ show: false, propertyId: null, amount: '', period: '', propertyName: '' });

      await loadAllData(contract, account);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Error depositing rental income:', err);
      setError(err.message || 'Failed to deposit rental income');
    } finally {
      setLoading(false);
    }
  };

  // Claim dividends
  const handleClaimDividends = async () => {
    if (!contract || !dividendModal.propertyId) return;

    try {
      setLoading(true);
      setError('');

      const tx = await contract.claimDividends(dividendModal.propertyId);
      setSuccess('Claiming dividends... Please wait for confirmation.');
      await tx.wait();
      
      setSuccess('Dividends claimed successfully!');
      setDividendModal({ show: false, propertyId: null, propertyName: '', claimableAmount: '0', userShares: 0 });

      await loadAllData(contract, account);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Error claiming dividends:', err);
      setError(err.message || 'Failed to claim dividends');
    } finally {
      setLoading(false);
    }
  };

  // Open purchase modal
  const openPurchaseModal = (property) => {
    setPurchaseModal({
      show: true,
      propertyId: property.propertyId,
      shares: '',
      pricePerShare: property.pricePerShare,
      totalCost: '0',
      propertyName: property.name
    });
  };

  // Open offer modal
  const openOfferModal = (property) => {
    setOfferModal({
      show: true,
      propertyId: property.propertyId,
      shares: '',
      pricePerShare: '',
      propertyName: property.name
    });
  };

  // Open dividend modal
  const openDividendModal = async (property) => {
    if (!contract) return;
    
    try {
      const claimable = await contract.calculateUserDividend(property.propertyId, account);
      setDividendModal({
        show: true,
        propertyId: property.propertyId,
        propertyName: property.name,
        claimableAmount: ethers.formatEther(claimable),
        userShares: property.userShares
      });
    } catch (err) {
      console.error('Error getting dividend:', err);
      setError('Failed to calculate dividends');
    }
  };

  // Open rental modal
  const openRentalModal = (property) => {
    setRentalModal({
      show: true,
      propertyId: property.propertyId,
      amount: '',
      period: '',
      propertyName: property.name
    });
  };

  // Update purchase total
  useEffect(() => {
    if (purchaseModal.shares && purchaseModal.pricePerShare) {
      const total = parseFloat(purchaseModal.shares) * parseFloat(purchaseModal.pricePerShare);
      setPurchaseModal(prev => ({ ...prev, totalCost: total.toFixed(4) }));
    }
  }, [purchaseModal.shares, purchaseModal.pricePerShare]);

  // Listen to account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          connectWallet();
        } else {
          setAccount('');
          setContract(null);
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
  }, []);

  return (
    <div className="App">
      {/* Header */}
      <header className="header">
        <div className="container">
          <h1>🏠 Real Estate Tokenization</h1>
          <p className="subtitle">Fractional Property Ownership on Celo</p>
          
          {!account ? (
            <button onClick={connectWallet} className="btn btn-primary" disabled={loading}>
              {loading ? 'Connecting...' : '🦊 Connect MetaMask'}
            </button>
          ) : (
            <div className="wallet-info">
              <div className="wallet-address">
                <span>📍 {account.slice(0, 6)}...{account.slice(-4)}</span>
                <span className="balance">💰 {parseFloat(balance).toFixed(4)} CELO</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Notifications */}
      {error && (
        <div className="notification error">
          ❌ {error}
          <button onClick={() => setError('')} className="close-btn">×</button>
        </div>
      )}
      {success && (
        <div className="notification success">
          ✅ {success}
          <button onClick={() => setSuccess('')} className="close-btn">×</button>
        </div>
      )}

      {/* Main Content */}
      <main className="container">
        {!account ? (
          <div className="welcome-section">
            <h2>Welcome to Real Estate Tokenization Platform</h2>
            <div className="features">
              <div className="feature-card">
                <h3>🏘️ Tokenize Properties</h3>
                <p>Convert real estate into NFTs with fractional shares</p>
              </div>
              <div className="feature-card">
                <h3>💼 Fractional Ownership</h3>
                <p>Buy and trade property shares with low barriers</p>
              </div>
              <div className="feature-card">
                <h3>💰 Rental Income</h3>
                <p>Earn proportional dividends from property rentals</p>
              </div>
              <div className="feature-card">
                <h3>🤝 Marketplace</h3>
                <p>Create and accept offers for share trading</p>
              </div>
            </div>
            <p className="connect-prompt">Connect your wallet to get started</p>
          </div>
        ) : (
          <>
            {/* Stats Section */}
            <div className="stats-section">
              <div className="stat-card">
                <h3>{contractStats.totalProperties}</h3>
                <p>Total Properties</p>
              </div>
              <div className="stat-card">
                <h3>{contractStats.totalOffers}</h3>
                <p>Active Offers</p>
              </div>
              <div className="stat-card">
                <h3>{contractStats.platformFee}%</h3>
                <p>Platform Fee</p>
              </div>
              <div className="stat-card">
                <h3>{myProperties.length}</h3>
                <p>My Properties</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="tabs">
              <button
                className={activeTab === 'marketplace' ? 'tab active' : 'tab'}
                onClick={() => setActiveTab('marketplace')}
              >
                🏪 Marketplace
              </button>
              <button
                className={activeTab === 'myProperties' ? 'tab active' : 'tab'}
                onClick={() => setActiveTab('myProperties')}
              >
                🏠 My Properties
              </button>
              <button
                className={activeTab === 'offers' ? 'tab active' : 'tab'}
                onClick={() => setActiveTab('offers')}
              >
                🤝 Offers ({offers.length})
              </button>
              <button
                className={activeTab === 'register' ? 'tab active' : 'tab'}
                onClick={() => setActiveTab('register')}
              >
                ➕ Register Property
              </button>
            </div>

            {/* Marketplace Tab */}
            {activeTab === 'marketplace' && (
              <div className="tab-content">
                <h2>Available Properties</h2>
                {properties.length === 0 ? (
                  <p className="empty-state">No properties available yet. Be the first to register one!</p>
                ) : (
                  <div className="properties-grid">
                    {properties.map(property => (
                      <div key={property.propertyId} className="property-card">
                        <div className="property-header">
                          <h3>{property.name}</h3>
                          {property.isVerified && <span className="badge verified">✓ Verified</span>}
                          <span className={`badge ${property.status.toLowerCase().replace(' ', '-')}`}>
                            {property.status}
                          </span>
                        </div>
                        <div className="property-details">
                          <p><strong>📍 Location:</strong> {property.location}</p>
                          <p><strong>🏢 Type:</strong> {property.propertyType}</p>
                          <p><strong>💵 Total Value:</strong> {property.totalValue} CELO</p>
                          <p><strong>📊 Shares:</strong> {property.availableShares}/{property.totalShares} available</p>
                          <p><strong>💰 Price per Share:</strong> {property.pricePerShare} CELO</p>
                          <p><strong>🏦 Monthly Rental:</strong> {property.monthlyRentalIncome} CELO</p>
                          <p><strong>📅 Listed:</strong> {property.createdAt}</p>
                        </div>
                        <div className="property-actions">
                          {property.availableShares > 0 && (
                            <>
                              <button
                                onClick={() => openPurchaseModal(property)}
                                className="btn btn-primary"
                                disabled={loading}
                              >
                                🛒 Buy Shares
                              </button>
                              <button
                                onClick={() => openOfferModal(property)}
                                className="btn btn-secondary"
                                disabled={loading}
                              >
                                💼 Make Offer
                              </button>
                            </>
                          )}
                          {property.availableShares === 0 && (
                            <button className="btn btn-disabled" disabled>
                              Sold Out
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* My Properties Tab */}
            {activeTab === 'myProperties' && (
              <div className="tab-content">
                <h2>My Properties & Holdings</h2>
                {myProperties.length === 0 ? (
                  <p className="empty-state">You don't own any properties yet. Visit the marketplace to purchase shares!</p>
                ) : (
                  <div className="properties-grid">
                    {myProperties.map(property => (
                      <div key={property.propertyId} className="property-card my-property">
                        <div className="property-header">
                          <h3>{property.name}</h3>
                          {property.isVerified && <span className="badge verified">✓ Verified</span>}
                        </div>
                        <div className="property-details">
                          <p><strong>📍 Location:</strong> {property.location}</p>
                          <p><strong>🏢 Type:</strong> {property.propertyType}</p>
                          <p><strong>💵 Total Value:</strong> {property.totalValue} CELO</p>
                          <p><strong>📊 Your Shares:</strong> {property.userShares}/{property.totalShares} ({((property.userShares / property.totalShares) * 100).toFixed(2)}%)</p>
                          <p><strong>💰 Share Value:</strong> {(property.userShares * parseFloat(property.pricePerShare)).toFixed(4)} CELO</p>
                          <p><strong>🏦 Monthly Rental:</strong> {property.monthlyRentalIncome} CELO</p>
                          <p><strong>💵 Your Monthly Share:</strong> {((property.userShares / property.totalShares) * parseFloat(property.monthlyRentalIncome)).toFixed(4)} CELO</p>
                        </div>
                        <div className="property-actions">
                          <button
                            onClick={() => openDividendModal(property)}
                            className="btn btn-primary"
                            disabled={loading}
                          >
                            💵 Claim Dividends
                          </button>
                          {property.owner.toLowerCase() === account.toLowerCase() && (
                            <button
                              onClick={() => openRentalModal(property)}
                              className="btn btn-secondary"
                              disabled={loading}
                            >
                              💰 Deposit Rental
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Offers Tab */}
            {activeTab === 'offers' && (
              <div className="tab-content">
                <h2>Active Offers</h2>
                {offers.length === 0 ? (
                  <p className="empty-state">No active offers at the moment.</p>
                ) : (
                  <div className="offers-grid">
                    {offers.map(offer => (
                      <div key={offer.offerId} className="offer-card">
                        <h3>Offer #{offer.offerId}</h3>
                        <div className="offer-details">
                          <p><strong>🏠 Property:</strong> {offer.propertyName}</p>
                          <p><strong>👤 Buyer:</strong> {offer.buyer.slice(0, 6)}...{offer.buyer.slice(-4)}</p>
                          <p><strong>📊 Shares:</strong> {offer.sharesOffered}</p>
                          <p><strong>💰 Price per Share:</strong> {offer.pricePerShare} CELO</p>
                          <p><strong>💵 Total Price:</strong> {offer.totalPrice} CELO</p>
                          <p><strong>⏰ Expires:</strong> {offer.expiresAt}</p>
                        </div>
                        <div className="offer-actions">
                          {myProperties.find(p => p.propertyId === offer.propertyId && p.userShares >= offer.sharesOffered) && (
                            <button
                              onClick={() => acceptOffer(offer.offerId)}
                              className="btn btn-primary"
                              disabled={loading}
                            >
                              ✅ Accept Offer
                            </button>
                          )}
                          {offer.buyer.toLowerCase() === account.toLowerCase() && (
                            <span className="badge">Your Offer</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Register Property Tab */}
            {activeTab === 'register' && (
              <div className="tab-content">
                <h2>Register New Property</h2>
                <form onSubmit={registerProperty} className="register-form">
                  <div className="form-group">
                    <label>Property Name *</label>
                    <input
                      type="text"
                      placeholder="e.g., Luxury Villa Miami"
                      value={newProperty.name}
                      onChange={(e) => setNewProperty({...newProperty, name: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Location *</label>
                    <input
                      type="text"
                      placeholder="e.g., Miami Beach, FL"
                      value={newProperty.location}
                      onChange={(e) => setNewProperty({...newProperty, location: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Property Type *</label>
                    <select
                      value={newProperty.propertyType}
                      onChange={(e) => setNewProperty({...newProperty, propertyType: e.target.value})}
                      required
                    >
                      {PROPERTY_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Total Value (CELO) *</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="1000"
                        value={newProperty.totalValue}
                        onChange={(e) => setNewProperty({...newProperty, totalValue: e.target.value})}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Total Shares *</label>
                      <input
                        type="number"
                        placeholder="1000"
                        value={newProperty.totalShares}
                        onChange={(e) => setNewProperty({...newProperty, totalShares: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Price per Share (CELO) *</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="1"
                        value={newProperty.pricePerShare}
                        onChange={(e) => setNewProperty({...newProperty, pricePerShare: e.target.value})}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Monthly Rental Income (CELO) *</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="5"
                        value={newProperty.monthlyRentalIncome}
                        onChange={(e) => setNewProperty({...newProperty, monthlyRentalIncome: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Metadata URI (IPFS)</label>
                    <input
                      type="text"
                      placeholder="ipfs://QmExample..."
                      value={newProperty.metadataURI}
                      onChange={(e) => setNewProperty({...newProperty, metadataURI: e.target.value})}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-large" disabled={loading}>
                    {loading ? '⏳ Registering...' : '🏠 Register Property'}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </main>

      {/* Purchase Modal */}
      {purchaseModal.show && (
        <div className="modal-overlay" onClick={() => setPurchaseModal({...purchaseModal, show: false})}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Purchase Shares</h3>
              <button onClick={() => setPurchaseModal({...purchaseModal, show: false})} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <p><strong>Property:</strong> {purchaseModal.propertyName}</p>
              <p><strong>Price per Share:</strong> {purchaseModal.pricePerShare} CELO</p>
              
              <div className="form-group">
                <label>Number of Shares</label>
                <input
                  type="number"
                  min="1"
                  placeholder="10"
                  value={purchaseModal.shares}
                  onChange={(e) => setPurchaseModal({...purchaseModal, shares: e.target.value})}
                />
              </div>
              
              <div className="total-cost">
                <strong>Total Cost:</strong> {purchaseModal.totalCost} CELO
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setPurchaseModal({...purchaseModal, show: false})} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handlePurchaseShares} className="btn btn-primary" disabled={loading || !purchaseModal.shares}>
                {loading ? 'Processing...' : 'Confirm Purchase'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offer Modal */}
      {offerModal.show && (
        <div className="modal-overlay" onClick={() => setOfferModal({...offerModal, show: false})}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Offer</h3>
              <button onClick={() => setOfferModal({...offerModal, show: false})} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <p><strong>Property:</strong> {offerModal.propertyName}</p>
              
              <div className="form-group">
                <label>Number of Shares</label>
                <input
                  type="number"
                  min="1"
                  placeholder="50"
                  value={offerModal.shares}
                  onChange={(e) => setOfferModal({...offerModal, shares: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Price per Share (CELO)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="1.2"
                  value={offerModal.pricePerShare}
                  onChange={(e) => setOfferModal({...offerModal, pricePerShare: e.target.value})}
                />
              </div>
              
              {offerModal.shares && offerModal.pricePerShare && (
                <div className="total-cost">
                  <strong>Total:</strong> {(parseFloat(offerModal.shares) * parseFloat(offerModal.pricePerShare)).toFixed(4)} CELO
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setOfferModal({...offerModal, show: false})} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleCreateOffer} className="btn btn-primary" disabled={loading || !offerModal.shares || !offerModal.pricePerShare}>
                {loading ? 'Processing...' : 'Create Offer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dividend Modal */}
      {dividendModal.show && (
        <div className="modal-overlay" onClick={() => setDividendModal({...dividendModal, show: false})}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Claim Dividends</h3>
              <button onClick={() => setDividendModal({...dividendModal, show: false})} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <p><strong>Property:</strong> {dividendModal.propertyName}</p>
              <p><strong>Your Shares:</strong> {dividendModal.userShares}</p>
              
              <div className="dividend-amount">
                <h2>{dividendModal.claimableAmount} CELO</h2>
                <p>Available to claim</p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setDividendModal({...dividendModal, show: false})} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleClaimDividends} className="btn btn-primary" disabled={loading || dividendModal.claimableAmount === '0'}>
                {loading ? 'Processing...' : 'Claim Dividends'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rental Modal */}
      {rentalModal.show && (
        <div className="modal-overlay" onClick={() => setRentalModal({...rentalModal, show: false})}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Deposit Rental Income</h3>
              <button onClick={() => setRentalModal({...rentalModal, show: false})} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <p><strong>Property:</strong> {rentalModal.propertyName}</p>
              
              <div className="form-group">
                <label>Amount (CELO)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="5"
                  value={rentalModal.amount}
                  onChange={(e) => setRentalModal({...rentalModal, amount: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Period</label>
                <input
                  type="text"
                  placeholder="January 2024"
                  value={rentalModal.period}
                  onChange={(e) => setRentalModal({...rentalModal, period: e.target.value})}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setRentalModal({...rentalModal, show: false})} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleDepositRentalIncome} className="btn btn-primary" disabled={loading || !rentalModal.amount || !rentalModal.period}>
                {loading ? 'Processing...' : 'Deposit Rental'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>🏠 Real Estate Tokenization Platform | Built on Celo Sepolia</p>
          <p>Contract: <a href={`https://sepolia.celoscan.io/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer">{CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}</a></p>
        </div>
      </footer>
    </div>
  );
}

export default App;
