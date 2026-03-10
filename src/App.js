import React, { useState, useEffect } from 'react'; 
import { ethers } from 'ethers';
import './App.css';
import SupplyChainABI from './contracts/SupplyChain.json';
import { CONTRACT_ADDRESS } from './contracts/contractAddress';

const SEPOLIA_CHAIN_ID = '0xaa36a7';

function App() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState('');

  // Original form states
  const [productName, setProductName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedStage, setSelectedStage] = useState('1');

  // NEW: Transfer product states
  const [transferProductId, setTransferProductId] = useState('');
  const [transferAddress, setTransferAddress] = useState('');

  // NEW: Update location states
  const [locationProductId, setLocationProductId] = useState('');
  const [newLocation, setNewLocation] = useState('');

  // NEW: History modal state
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyProductId, setHistoryProductId] = useState('');

  const checkNetwork = async () => {
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== SEPOLIA_CHAIN_ID) {
        setNetworkError('Please switch to Sepolia testnet in MetaMask');
        return false;
      }
      setNetworkError('');
      return true;
    } catch (error) {
      console.error('Error checking network:', error);
      return false;
    }
  };

  const switchToSepolia = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
      setNetworkError('');
      connectWallet();
    } catch (error) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: SEPOLIA_CHAIN_ID,
              chainName: 'Sepolia Testnet',
              nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://sepolia.infura.io/v3/'],
              blockExplorerUrls: ['https://sepolia.etherscan.io/'],
            }],
          });
          connectWallet();
        } catch (addError) {
          console.error('Error adding network:', addError);
        }
      }
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;

      }

      const isCorrectNetwork = await checkNetwork();
      if (!isCorrectNetwork) return;

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, SupplyChainABI.abi, signer);

      setContract(contractInstance);
      loadProducts(contractInstance);

      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          loadProducts(contractInstance);
        } else {
          setAccount('');
          setContract(null);
        }
      });

      window.ethereum.on('chainChanged', () => window.location.reload());
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet');
    }
  };

  const loadProducts = async (contractInstance) => {
    try {
      setLoading(true);
      const productIds = await contractInstance.getAllProductIds();
      const productsData = [];

      for (let i = 0; i < productIds.length; i++) {
        const productId = productIds[i];
        const product = await contractInstance.getProduct(productId);
        
        productsData.push({
          id: product[0].toString(),
          name: product[1],
          manufacturer: product[2],
          currentStage: Number(product[3]),
          owner: product[4],
          manufacturingDate: new Date(Number(product[5]) * 1000).toLocaleString(),
          shippingDate: Number(product[6]) > 0 ? new Date(Number(product[6]) * 1000).toLocaleString() : 'N/A',
          deliveryDate: Number(product[7]) > 0 ? new Date(Number(product[7]) * 1000).toLocaleString() : 'N/A',
          currentLocation: product[8] || 'Unknown' // NEW: Get current location
        });
      }

      setProducts(productsData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading products:', error);
      setLoading(false);
    }
  };

  const addProduct = async (e) => {
    e.preventDefault();
    if (!productName || !manufacturer) {
      alert('Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      const tx = await contract.addProduct(productName, manufacturer);
      alert('Transaction submitted! Waiting for confirmation...');
      await tx.wait();
      alert('Product added! View on Etherscan: https://sepolia.etherscan.io/tx/' + tx.hash);
      setProductName('');
      setManufacturer('');
      loadProducts(contract);
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed: ' + (error.reason || error.message));
      setLoading(false);
    }
  };

  const updateStage = async (e) => {
    e.preventDefault();
    if (!selectedProductId || !selectedStage) {
      alert('Please select product and stage');
      return;
    }

    try {
      setLoading(true);
      const tx = await contract.updateStage(selectedProductId, selectedStage);
      alert('Transaction submitted! Waiting for confirmation...');
      await tx.wait();
      alert('Stage updated! View on Etherscan: https://sepolia.etherscan.io/tx/' + tx.hash);
      setSelectedProductId('');
      setSelectedStage('1');
      loadProducts(contract);
    } catch (error) {
      console.error('Error updating stage:', error);
      alert('Failed: ' + (error.reason || error.message));
      setLoading(false);
    }
  };

  // NEW FUNCTION #1: Transfer Product
  const transferProduct = async (e) => {
    e.preventDefault();
    if (!transferProductId || !transferAddress) {
      alert('Please fill all fields');
      return;
    }

    // Validate Ethereum address
    if (!ethers.isAddress(transferAddress)) {
      alert('Invalid Ethereum address!');
      return;
    }

    try {
      setLoading(true);
      const tx = await contract.transferProduct(transferProductId, transferAddress);
      alert('Transfer submitted! Waiting for confirmation...');
      await tx.wait();
      alert('Product transferred successfully!\nView on Etherscan: https://sepolia.etherscan.io/tx/' + tx.hash);
      setTransferProductId('');
      setTransferAddress('');
      loadProducts(contract);
    } catch (error) {
      console.error('Error transferring product:', error);
      alert('❌ Transfer failed: ' + (error.reason || error.message));
      setLoading(false);
    }
  };

  // NEW FUNCTION #2: Update Location
  const updateLocation = async (e) => {
    e.preventDefault();
    if (!locationProductId || !newLocation) {
      alert('Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      const tx = await contract.updateLocation(locationProductId, newLocation);
      alert('📍 Location update submitted! Waiting for confirmation...');
      await tx.wait();
      alert('✅ Location updated successfully!\nView on Etherscan: https://sepolia.etherscan.io/tx/' + tx.hash);
      setLocationProductId('');
      setNewLocation('');
      loadProducts(contract);
    } catch (error) {
      console.error('Error updating location:', error);
      alert('❌ Location update failed: ' + (error.reason || error.message));
      setLoading(false);
    }
  };

  // ✨ NEW FUNCTION #3: View Product History
  const viewHistory = async (productId) => {
    try {
      setLoading(true);
      const history = await contract.getProductHistory(productId);
      
      const formattedHistory = history.map((entry, index) => ({
        index: index + 1,
        stage: ['Manufacturing', 'Shipping', 'Delivery'][Number(entry.stage)],
        location: entry.location,
        timestamp: new Date(Number(entry.timestamp) * 1000).toLocaleString(),
        updatedBy: entry.updatedBy
      }));

      setHistoryData(formattedHistory);
      setHistoryProductId(productId);
      setShowHistory(true);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching history:', error);
      alert('Failed to fetch history: ' + (error.reason || error.message));
      setLoading(false);
    }
  };

  const closeHistory = () => {
    setShowHistory(false);
    setHistoryData([]);
    setHistoryProductId('');
  };

  const getStageText = (stage) => ['Manufacturing', 'Shipping', 'Delivery'][stage];
  const getStageColor = (stage) => ['#ff9800', '#2196f3', '#4caf50'][stage];

  return (
    <div className="App">
      <header className="header">
        <h1>🔗 Blockchain Supply Chain Tracker</h1>
        <div className="header-right">
          {networkError && (
            <button onClick={switchToSepolia} className="network-error-btn">
              ⚠️ Switch to Sepolia
            </button>
          )}
          {!account ? (
            <button onClick={connectWallet} className="connect-btn">Connect MetaMask</button>
          ) : (
            <div className="account-info">
              <span className="network-badge">Sepolia</span>
              Connected: {account.substring(0, 6)}...{account.substring(38)}
            </div>
          )}
        </div>
      </header>

      {networkError && (
        <div className="network-warning">
          <p>⚠️ {networkError}</p>
          <p>Click the button above to switch networks</p>
        </div>
      )}

      {account && !networkError && (
        <div className="container">
          <div className="info-banner">
            <p>Contract: <a href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer">{CONTRACT_ADDRESS}</a></p>
            {/* <p> New Features: Transfer ownership, Update location, View complete history!</p> */}
          </div>

          {/* Original Forms Row */}
          <div className="forms-grid">
            <div className="card">
              <h2>Add New Product</h2>
              <form onSubmit={addProduct}>
                <input type="text" placeholder="Product Name" value={productName} onChange={(e) => setProductName(e.target.value)} className="input" />
                <input type="text" placeholder="Manufacturer" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} className="input" />
                <button type="submit" className="btn" disabled={loading}>{loading ? 'Processing...' : 'Add Product'}</button>
              </form>
            </div>

            <div className="card">
              <h2>Update Product Stage</h2>
              <form onSubmit={updateStage}>
                <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className="input">
                  <option value="">Select Product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>#{product.id} - {product.name}</option>
                  ))}
                </select>
                <select value={selectedStage} onChange={(e) => setSelectedStage(e.target.value)} className="input">
                  <option value="1">Shipping</option>
                  <option value="2">Delivery</option>
                </select>
                <button type="submit" className="btn" disabled={loading}>{loading ? 'Processing...' : 'Update Stage'}</button>
              </form>
            </div>
          </div>

          {/* NEW: Additional Features Row */}
          <div className="forms-grid">
            {/* NEW: Transfer Product Form */}
            <div className="card transfer-card">
              <h2>Transfer Product Ownership</h2>
              <form onSubmit={transferProduct}>
                <select value={transferProductId} onChange={(e) => setTransferProductId(e.target.value)} className="input">
                  <option value="">Select Product to Transfer</option>
                  {products.filter(p => p.owner.toLowerCase() === account.toLowerCase()).map((product) => (
                    <option key={product.id} value={product.id}>#{product.id} - {product.name}</option>
                  ))}
                </select>
                <input 
                  type="text" 
                  placeholder="New Owner Address (0x...)" 
                  value={transferAddress} 
                  onChange={(e) => setTransferAddress(e.target.value)} 
                  className="input" 
                />
                <button type="submit" className="btn btn-transfer" disabled={loading}>
                  {loading ? 'Processing...' : 'Transfer Product'}
                </button>
              </form>
              <p className="hint">⚠️ You can only transfer products you own</p>
            </div>

            {/* NEW: Update Location Form */}
            <div className="card location-card">
              <h2>Update Product Location</h2>
              <form onSubmit={updateLocation}>
                <select value={locationProductId} onChange={(e) => setLocationProductId(e.target.value)} className="input">
                  <option value="">Select Product</option>
                  {products.filter(p => p.owner.toLowerCase() === account.toLowerCase()).map((product) => (
                    <option key={product.id} value={product.id}>#{product.id} - {product.name}</option>
                  ))}
                </select>
                <input 
                  type="text" 
                  placeholder="New Location (e.g., Hong Kong Port)" 
                  value={newLocation} 
                  onChange={(e) => setNewLocation(e.target.value)} 
                  className="input" 
                />
                <button type="submit" className="btn btn-location" disabled={loading}>
                  {loading ? 'Processing...' : 'Update Location'}
                </button>
              </form>
              <p className="hint">💡 Track product at each checkpoint</p>
            </div>
          </div>

          {/* Products Section */}
          <div className="products-section">
            <h2>All Products ({products.length})</h2>
            {loading && <p className="loading-text">⏳ Loading from blockchain...</p>}
            <div className="products-grid">
              {products.map((product) => (
                <div key={product.id} className="product-card">
                  <div className="product-header">
                    <h3>{product.name}</h3>
                    <span className="stage-badge" style={{ backgroundColor: getStageColor(product.currentStage) }}>
                      {getStageText(product.currentStage)}
                    </span>
                  </div>
                  
                  {/* NEW: Show current location */}
                  <div className="location-badge">
                      {product.currentLocation}
                  </div>

                  <div className="product-details">
                    <p><strong>ID:</strong> #{product.id}</p>
                    <p><strong>Manufacturer:</strong> {product.manufacturer}</p>
                    <p><strong>Owner:</strong> 
                      {product.owner.toLowerCase() === account.toLowerCase() ? (
                        <span className="you-badge"> You ✓</span>
                      ) : (
                        ` ${product.owner.substring(0, 10)}...`
                      )}
                    </p>
                    <p><strong>Manufacturing:</strong> {product.manufacturingDate}</p>
                    <p><strong>Shipping:</strong> {product.shippingDate}</p>
                    <p><strong>Delivery:</strong> {product.deliveryDate}</p>
                  </div>

                  {/* NEW: View History Button */}
                  <button 
                    className="btn-history" 
                    onClick={() => viewHistory(product.id)}
                    disabled={loading}
                  >
                      View Complete History
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!account && !networkError && (
        <div className="welcome">
          <h2>Welcome to Supply Chain Tracker</h2>
          <p>Connect your MetaMask wallet to get started</p>
          <ul>
            <li> -Track products through lifecycle</li>
            <li> -Immutable blockchain records</li>
            <li> -Complete transparency</li>
            <li> -Transfer ownership</li>
            <li> -Real-time location tracking</li>
            <li> -Complete audit trail</li>
          </ul>
        </div>
      )}

      {/* NEW: History Modal */}
      {showHistory && (
        <div className="modal-overlay" onClick={closeHistory}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Product History - ID #{historyProductId}</h2>
              <button className="modal-close" onClick={closeHistory}>✕</button>
            </div>
            <div className="modal-body">
              {historyData.length === 0 ? (
                <p>No history available</p>
              ) : (
                <div className="history-timeline">
                  {historyData.map((entry) => (
                    <div key={entry.index} className="history-entry">
                      <div className="history-number">{entry.index}</div>
                      <div className="history-details">
                        <h4>{entry.stage}</h4>
                        <p><strong>📍 Location:</strong> {entry.location}</p>
                        <p><strong>🕐 Time:</strong> {entry.timestamp}</p>
                        <p><strong>👤 Updated by:</strong> {entry.updatedBy.substring(0, 10)}...</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;