// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SupplyChain {
    //Three stages defined: Manufacturing, shipping, and delivery 
    enum Stage {  
        Manufacturing, 
        Shipping, //Shipping is index 1 in our enum
        Delivery 
    }
    
    //Define the ID Card for each product, to track them 
    struct Product {
        uint256 id;
        string name;
        string manufacturer;
        Stage currentStage;
        address owner;
        uint256 manufacturingDate;
        uint256 shippingDate;
        uint256 deliveryDate;
        string currentLocation; // NEW: Track product location
        bool exists;
    }
    
    // NEW: Track stage history for audit trail
    struct StageUpdate {
        Stage stage;
        uint256 timestamp;
        address updatedBy;
        string location;
    }
    
    //A kinda storage where I will be seeing the details of the product using only unique ID
    mapping(uint256 => Product) public products;
    mapping(uint256 => StageUpdate[]) public productHistory; // NEW: Store complete history
    uint256[] public productIds;
    uint256 public productCount = 0;
    
    event ProductAdded(uint256 indexed productId, string name, string manufacturer);
    event StageUpdated(uint256 indexed productId, Stage newStage, uint256 timestamp);
    event ProductTransferred(uint256 indexed productId, address indexed from, address indexed to); // NEW
    event LocationUpdated(uint256 indexed productId, string location); // NEW
    
    //a func to create new item, stage changes from currentstage to manufacturing, logs the current time  
    function addProduct(string memory _name, string memory _manufacturer) public {
        productCount++;
        
        products[productCount] = Product({
            id: productCount,
            name: _name,
            manufacturer: _manufacturer,
            currentStage: Stage.Manufacturing,
            owner: msg.sender,
            manufacturingDate: block.timestamp,
            shippingDate: 0,
            deliveryDate: 0,
            currentLocation: "Factory", // NEW: Initial location
            exists: true
        });
        
        productIds.push(productCount);
        
        // NEW: Add to history
        productHistory[productCount].push(StageUpdate({
            stage: Stage.Manufacturing,
            timestamp: block.timestamp,
            updatedBy: msg.sender,
            location: "Factory"
        }));
        
        emit ProductAdded(productCount, _name, _manufacturer);
    }
    
    //this has two security guards, 1. only user who registered can update it
    //2. product cannot go backward   
    function updateStage(uint256 _productId, Stage _newStage) public {
        require(products[_productId].exists, "Product does not exist");
        require(msg.sender == products[_productId].owner, "Only owner can update");
        
        Product storage product = products[_productId];
        require(uint(_newStage) > uint(product.currentStage), "Cannot go back to previous stage");
        
        product.currentStage = _newStage;
        
        // Update location based on stage
        string memory newLocation;
        if (_newStage == Stage.Shipping) {
            product.shippingDate = block.timestamp;
            newLocation = "In Transit";
        } else if (_newStage == Stage.Delivery) {
            product.deliveryDate = block.timestamp;
            newLocation = "Delivered";
        }
        
        product.currentLocation = newLocation;
        
        // NEW: Add to history
        productHistory[_productId].push(StageUpdate({
            stage: _newStage,
            timestamp: block.timestamp,
            updatedBy: msg.sender,
            location: newLocation
        }));
        
        emit StageUpdated(_productId, _newStage, block.timestamp);
    }
    
    // ✨ NEW WRITE FUNCTION #1: Transfer Product Ownership
    // Allows current owner to transfer product to someone else
    // Useful for: Selling product, transferring between warehouses, changing responsibility
    function transferProduct(uint256 _productId, address _newOwner) public {
        require(products[_productId].exists, "Product does not exist");
        require(msg.sender == products[_productId].owner, "Only owner can transfer");
        require(_newOwner != address(0), "Invalid new owner address");
        require(_newOwner != msg.sender, "Cannot transfer to yourself");
        
        address previousOwner = products[_productId].owner;
        products[_productId].owner = _newOwner;
        
        emit ProductTransferred(_productId, previousOwner, _newOwner);
    }
    
    // ✨ NEW WRITE FUNCTION #2: Update Product Location
    // Allows owner to update current location with custom text
    // Useful for: Real-time tracking, GPS updates, warehouse changes
    function updateLocation(uint256 _productId, string memory _newLocation) public {
        require(products[_productId].exists, "Product does not exist");
        require(msg.sender == products[_productId].owner, "Only owner can update location");
        require(bytes(_newLocation).length > 0, "Location cannot be empty");
        
        products[_productId].currentLocation = _newLocation;
        
        // Add location update to history
        productHistory[_productId].push(StageUpdate({
            stage: products[_productId].currentStage,
            timestamp: block.timestamp,
            updatedBy: msg.sender,
            location: _newLocation
        }));
        
        emit LocationUpdated(_productId, _newLocation);
    }
    
    //function that lets anyone see the history and current status of a specific item(read only hota hai)  
    function getProduct(uint256 _productId) public view returns (
        uint256 id,
        string memory name,
        string memory manufacturer,
        Stage currentStage,
        address owner,
        uint256 manufacturingDate,
        uint256 shippingDate,
        uint256 deliveryDate,
        string memory currentLocation // NEW: Return location
    ) {
        require(products[_productId].exists, "Product does not exist");
        Product memory product = products[_productId];
        return (
            product.id,
            product.name,
            product.manufacturer,
            product.currentStage,
            product.owner,
            product.manufacturingDate,
            product.shippingDate,
            product.deliveryDate,
            product.currentLocation
        );
    }
    
    // NEW READ FUNCTION: Get complete history of a product
    function getProductHistory(uint256 _productId) public view returns (StageUpdate[] memory) {
        require(products[_productId].exists, "Product does not exist");
        return productHistory[_productId];
    }
    
    function getAllProductIds() public view returns (uint256[] memory) {
        return productIds;
    }
    
    function getProductCount() public view returns (uint256) {
        return productCount;
    }
}
