// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IOxiToken {
    function rewardUser(address to, uint256 amount) external;
}

contract OxideXBase {
    address public owner;
    IOxiToken public launchpadToken;
    uint256 public tokenPrice = 0.0001 ether; // 1 token = 0.0001 ETH
    
    struct User {
        uint256 id;
        address referrer;
        uint256 partnersCount;
        uint256 totalEarnings;
    }
    
    mapping(address => User) public users;
    mapping(uint256 => address) public idToAddress;
    uint256 public lastUserId;
    
    // Fully automated dynamic commission parameters
    uint8 public constant GAS_LIMIT_MAX_LEVELS = 50; // Hard EVM cap
    
    // Hybrid Commission State
    mapping(uint8 => uint256) public levelCommissions;
    uint8 public maxManualLevels;
    
    event Registration(address indexed user, address indexed referrer, uint256 indexed userId, uint256 referrerId);
    event CommissionPaid(address indexed from, address indexed to, uint8 level, uint256 amount);
    event TokensPurchased(address indexed buyer, uint256 tokenAmount, uint256 ethSpent);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(address _owner) {
        owner = _owner;
        lastUserId = 1;
        
        users[_owner] = User({
            id: 1,
            referrer: address(0),
            partnersCount: 0,
            totalEarnings: 0
        });
        idToAddress[1] = _owner;
        
        // Dynamic halving curve takes over automatically, no manual admin setup needed!
    }
    
    function setToken(address _token) external onlyOwner {
        launchpadToken = IOxiToken(_token);
    }
    
    function setTokenPrice(uint256 _price) external onlyOwner {
        tokenPrice = _price;
    }
    
    // Admin configuration for Manual Overrides
    function setCommission(uint8 level, uint256 percentageBps) external onlyOwner {
        require(level > 0 && level <= 50, "Invalid level");
        levelCommissions[level] = percentageBps;
    }
    
    function setMaxManualLevels(uint8 _max) external onlyOwner {
        maxManualLevels = _max;
    }
    
    function isUserExists(address user) public view returns (bool) {
        return (users[user].id != 0);
    }
    
    function registerUser(address user, address referrer) internal {
        require(!isUserExists(user), "User already exists");
        if (!isUserExists(referrer)) {
            referrer = owner; // Fallback to owner if referrer is invalid
        }
        
        lastUserId++;
        users[user] = User({
            id: lastUserId,
            referrer: referrer,
            partnersCount: 0,
            totalEarnings: 0
        });
        idToAddress[lastUserId] = user;
        
        users[referrer].partnersCount++;
        
        emit Registration(user, referrer, lastUserId, users[referrer].id);
    }
    
    function distributeCommission(address user, uint256 amount) internal {
        address currentReferrer = users[user].referrer;
        uint256 currentBps;
        uint256 autoBpsTracker = 1000; // Default 10% fallback
        uint8 level = 1;
        
        // Loop dynamically climbs the tree until it hits the root, hits precision 0, or hits the 50-level gas cap.
        while (currentReferrer != address(0) && level <= GAS_LIMIT_MAX_LEVELS) {
            
            // Check if level has a manual override
            if (level <= maxManualLevels && levelCommissions[level] > 0) {
                currentBps = levelCommissions[level];
                autoBpsTracker = currentBps; // Sync auto tracker to the last manual level
            } else {
                // Auto generate
                if (level > 1) {
                    autoBpsTracker = autoBpsTracker / 2; // Halving curve
                }
                currentBps = autoBpsTracker;
            }
            
            // If the dynamic curve hits 0, stop to save gas
            if (currentBps == 0) break;
            
            uint256 commissionAmount = (amount * currentBps) / 10000;
            
            if (commissionAmount > 0) {
                users[currentReferrer].totalEarnings += commissionAmount;
                (bool success, ) = payable(currentReferrer).call{value: commissionAmount}("");
                if (success) {
                    emit CommissionPaid(user, currentReferrer, level, commissionAmount);
                }
            }
            
            currentReferrer = users[currentReferrer].referrer;
            level++;
        }
    }
    
    function buyLaunchpadTokens(address referrer) external payable {
        require(msg.value > 0, "Must send ETH");
        require(address(launchpadToken) != address(0), "Token not set");
        
        if (!isUserExists(msg.sender)) {
            registerUser(msg.sender, referrer);
        }
        
        uint256 tokensToTransfer = (msg.value * 1e18) / tokenPrice;
        
        // Distribute ETH commissions up the unilevel tree
        distributeCommission(msg.sender, msg.value);
        
        // Mint tokens to buyer
        launchpadToken.rewardUser(msg.sender, tokensToTransfer);
        
        emit TokensPurchased(msg.sender, tokensToTransfer, msg.value);
    }
    
    function withdrawEth(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = payable(owner).call{value: amount}("");
        require(success, "Transfer failed");
    }
}
