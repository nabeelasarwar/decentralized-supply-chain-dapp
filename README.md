# Decentralized Supply Chain DApp
This project implements a blockchain-based supply chain solution to solve the problem of 
transparency and accountability in the movement of goods. By using a decentralized ledger, 
every stakeholder can verify the origin, current location, and ownership history of a product 
without relying on a central authority.
## Smart Contract Architecture
The contract, titled SupplyChain, is built on the Ethereum Virtual Machine (EVM). It uses a 
combination of State Machines (via Enums) and Append-only Logs (via Mappings and 
Structs). Contract address is available in contracts folder under src.
I used **ethers.js** as the primary library to interact with the Ethereum Blockchain. It serves as the middleware between the User Interface and the Smart Contracts. 
## Detailed Functionality Overview 
### 1. Administrative & Creation Functions 
* addProduct(string _name, string _manufacturer): Registers a new physical item on the blockchain. Increments the productCount (which acts as the unique ID), initializes a Product struct, and sets the initial state to Manufacturing. It also creates the first entry in the productHistory array to establish the "Birth" of the product.
### 2 Transactional & State Functions 
* updateStage(uint256 _productId, Stage _newStage): Moves the product through its lifecycle. It validates that the caller is the current owner and ensures that the stage only moves forward (e.g., you cannot move a "Delivered" item back to 
"Manufacturing").
* transferProduct(uint256 _productId, address _newOwner): Handover of responsibility. Updates the owner field in the mapping.

* updateLocation(uint256 _productId, string _newLocation): Real-time tracking. Allows the owner to update the text-based location (e.g., "Suez Canal" or "Warehouse 4"). It adds this specific location update to the permanent history.
### 3 Data Retrieval (Read-Only) Functions 
* getProduct(uint256 _productId): Returns a snapshot of the current status of a product. 

* getProductHistory(uint256 _productId): Returns an array of all updates, showing who changed what and when. 

* getAllProductIds(): Returns a list of all product IDs registered in the system.
##  Frontend Development & UI Technologies 
### 1 Framework: React.js 
React.js was chosen as the primary frontend library for building a dynamic and responsive User 
Interface (UI). 
* Component-Based Architecture: The app is divided into reusable components (e.g., 
"Add Product Form," "Product History List"), making the code organized and easy to 
maintain.

* State Management: React handles real-time updates—for example, as soon as a 
product’s stage is updated on the blockchain, the UI reflects that change without needing 
a full page refresh. 
### 2 Blockchain Interaction: Ethers.js 
Ethers.js is the most critical library in this project. It serves as the "translator" between 
JavaScript and the Smart Contract. 
* Provider & Signer: It connects to the MetaMask provider to read data from the 
blockchain and uses the "Signer" to authorize transactions (like adding a product).

* Contract Abstraction: By combining the Contract Address and the ABI, Ethers.js 
creates a JavaScript object that allows us to call Solidity functions like 
contract.addProduct() directly from our frontend code. 
### 3 Styling & UX: CSS3 
Custom CSS was used to ensure the supply chain data is presented in a clean, readable format. 
 
* Responsive Design: Ensures the dashboard is accessible on both desktop and mobile 
devices. 
* Visual Cues: Used CSS to distinguish between different stages (e.g., different colors for 
"Manufacturing," "Shipping," and "Delivered") to enhance the user experience. 
##  How to Test the DApp (Setup Instructions)

To interact with this Decentralized Supply Chain, follow these steps:

### 1. MetaMask Setup
* Install the **MetaMask Extension** in your browser.
* Create a new wallet (and securely save your seed phrase!).

### 2. Connect to Sepolia Testnet
* In MetaMask, go to **Settings > Advanced** and turn on **"Show test networks"**.
* Select **Sepolia Test Network** from the network dropdown.
* You will need some **Sepolia ETH** (Test tokens) to pay for "Gas Fees." You can get these for free from a [Sepolia Faucet](https://sepoliafaucet.com/).

### 3. Monitoring Transactions
* Every action in this DApp (like adding a product or changing ownership) is a real blockchain transaction.
* You can copy your **Transaction Hash** or **Contract Address** and paste it into [Etherscan (Sepolia)](https://sepolia.etherscan.io/) to see the live status, gas used, and block confirmation.
# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.





