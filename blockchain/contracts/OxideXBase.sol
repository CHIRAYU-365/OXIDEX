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
    
    // Admin config for commission levels
    mapping(uint8 => uint256) public levelCommissions;
    uint8 public maxLevels = 6;
    
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
        
        // Default commissions: 10%, 5%, 3%, 2%, 1% (in basis points: 10000 = 100%)
        levelCommissions[1] = 1000;
        levelCommissions[2] = 500;
        levelCommissions[3] = 300;
        levelCommissions[4] = 200;
        levelCommissions[5] = 100;
    }
    
    function setToken(address _token) external onlyOwner {
        launchpadToken = IOxiToken(_token);
    }
    
    function setTokenPrice(uint256 _price) external onlyOwner {
        tokenPrice = _price;
    }
    
    function getTotalCommissionBps() public view returns (uint256) {
        uint256 total = 0;
        for (uint8 i = 1; i <= maxLevels; i++) {
            total += levelCommissions[i];
        }
        return total;
    }

    function setCommission(uint8 level, uint256 percentageBps) external onlyOwner {
        require(level > 0 && level <= maxLevels, "Invalid level");
        
        uint256 currentTotal = getTotalCommissionBps();
        uint256 newTotal = currentTotal - levelCommissions[level] + percentageBps;
        require(newTotal <= 10000, "Total commission cannot exceed 100%");
        
        levelCommissions[level] = percentageBps;
    }
    
    function setMaxLevels(uint8 _maxLevels) external onlyOwner {
        maxLevels = _maxLevels;
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
        
        for (uint8 i = 1; i <= maxLevels; i++) {
            if (currentReferrer == address(0)) {
                break;
            }
            
            uint256 commissionPercentage = levelCommissions[i];
            if (commissionPercentage > 0) {
                uint256 commissionAmount = (amount * commissionPercentage) / 10000;
                
                if (commissionAmount > 0) {
                    users[currentReferrer].totalEarnings += commissionAmount;
                    (bool success, ) = payable(currentReferrer).call{value: commissionAmount}("");
                    if (success) {
                        emit CommissionPaid(user, currentReferrer, i, commissionAmount);
                    }
                }
            }
            
            currentReferrer = users[currentReferrer].referrer;
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
