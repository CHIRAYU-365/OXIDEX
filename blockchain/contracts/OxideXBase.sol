
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IOxiToken {
    function rewardUser(address to, uint256 amount) external;
}

interface IOxideXNFT {
    function balanceOf(address owner) external view returns (uint256);
}

contract OxideXBase is ReentrancyGuard {
    address public owner;
    IOxiToken public launchpadToken;
    IOxideXNFT public nftContract;
    uint256 public tokenPrice = 0.0001 ether; 
    
    struct User {
        uint256 id;
        address referrer;
        uint256 partnersCount;
        uint256 totalEarnings;
    }
    
    mapping(address => User) public users;
    mapping(uint256 => address) public idToAddress;
    uint256 public lastUserId;
    uint256 public registrationBonus = 50 * 1e18; 
    
    uint8 public constant GAS_LIMIT_MAX_LEVELS = 50; 
    
    
    mapping(uint8 => uint256) public levelCommissions;
    uint8 public maxManualLevels;
    
    
    struct Stake {
        uint256 amount;
        uint256 lastClaimTime;
    }
    mapping(address => Stake) public stakers;
    uint256 public constant SECONDS_IN_YEAR = 31536000;
    uint256 public rewardAPR = 50; 
    
    event Registration(address indexed user, address indexed referrer, uint256 indexed userId, uint256 referrerId);
    event RegistrationBonusPaid(address indexed user, address indexed referrer, uint256 amount);
    event CommissionPaid(address indexed from, address indexed to, uint8 level, uint256 amount);
    event TokensPurchased(address indexed buyer, uint256 tokenAmount, uint256 ethSpent);
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event YieldClaimed(address indexed user, uint256 reward);
    
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
        
        
    }
    
    function setToken(address _token) external onlyOwner {
        launchpadToken = IOxiToken(_token);
    }
    
    function setNFTContract(address _nft) external onlyOwner {
        nftContract = IOxideXNFT(_nft);
    }
    
    function setTokenPrice(uint256 _price) external onlyOwner {
        tokenPrice = _price;
    }
    
    function setRegistrationBonus(uint256 _amount) external onlyOwner {
        registrationBonus = _amount;
    }
    
    
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
            referrer = owner; 
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
        
        if (registrationBonus > 0 && address(launchpadToken) != address(0)) {
            launchpadToken.rewardUser(user, registrationBonus);
            launchpadToken.rewardUser(referrer, registrationBonus);
            emit RegistrationBonusPaid(user, referrer, registrationBonus);
        }
    }
    
    function distributeCommission(address user, uint256 amount) internal {
        address currentReferrer = users[user].referrer;
        uint256 currentBps;
        uint256 autoBpsTracker = 1000; 
        uint8 level = 1;
        
        
        while (currentReferrer != address(0) && level <= GAS_LIMIT_MAX_LEVELS) {
            
            
            if (level <= maxManualLevels && levelCommissions[level] > 0) {
                currentBps = levelCommissions[level];
                autoBpsTracker = currentBps; 
            } else {
                
                if (level > 1) {
                    autoBpsTracker = autoBpsTracker / 2; 
                }
                currentBps = autoBpsTracker;
            }
            
            
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
    
    function buyLaunchpadTokens(address referrer) external payable nonReentrant {
        require(msg.value > 0, "Must send ETH");
        require(address(launchpadToken) != address(0), "Token not set");
        
        if (!isUserExists(msg.sender)) {
            registerUser(msg.sender, referrer);
        }
        
        uint256 tokensToTransfer = (msg.value * 1e18) / tokenPrice;
        
        
        distributeCommission(msg.sender, msg.value);
        
        
        launchpadToken.rewardUser(msg.sender, tokensToTransfer);
        
        emit TokensPurchased(msg.sender, tokensToTransfer, msg.value);
    }
    
    function withdrawEth(uint256 amount) external onlyOwner nonReentrant {
        require(amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = payable(owner).call{value: amount}("");
        require(success, "Transfer failed");
    }

    
    
    function setRewardAPR(uint256 _apr) external onlyOwner {
        rewardAPR = _apr;
    }

    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot stake 0");
        require(address(launchpadToken) != address(0), "Token not set");
        
        _claimYield(msg.sender);
        
        bool success = IERC20(address(launchpadToken)).transferFrom(msg.sender, address(this), amount);
        require(success, "Token transfer failed");
        
        stakers[msg.sender].amount += amount;
        stakers[msg.sender].lastClaimTime = block.timestamp;
        
        emit Staked(msg.sender, amount);
    }
    
    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot unstake 0");
        require(stakers[msg.sender].amount >= amount, "Insufficient staked amount");
        
        _claimYield(msg.sender);
        
        stakers[msg.sender].amount -= amount;
        
        bool success = IERC20(address(launchpadToken)).transfer(msg.sender, amount);
        require(success, "Token transfer failed");
        
        emit Unstaked(msg.sender, amount);
    }
    
    function claimYield() external nonReentrant {
        _claimYield(msg.sender);
    }
    
    function _claimYield(address _user) internal {
        Stake storage userStake = stakers[_user];
        if (userStake.amount > 0) {
            uint256 timeElapsed = block.timestamp - userStake.lastClaimTime;
            if (timeElapsed > 0) {
                uint256 effectiveAPR = rewardAPR;
                if (address(nftContract) != address(0) && nftContract.balanceOf(_user) > 0) {
                    effectiveAPR = rewardAPR * 2; 
                }
                
                uint256 reward = (userStake.amount * effectiveAPR * timeElapsed) / (100 * SECONDS_IN_YEAR);
                userStake.lastClaimTime = block.timestamp;
                if (reward > 0) {
                    launchpadToken.rewardUser(_user, reward);
                    emit YieldClaimed(_user, reward);
                }
            }
        } else {
            userStake.lastClaimTime = block.timestamp; 
        }
    }
    
    function getPendingYield(address _user) public view returns (uint256) {
        Stake memory userStake = stakers[_user];
        if (userStake.amount == 0) return 0;
        
        uint256 timeElapsed = block.timestamp - userStake.lastClaimTime;
        
        uint256 effectiveAPR = rewardAPR;
        if (address(nftContract) != address(0) && nftContract.balanceOf(_user) > 0) {
            effectiveAPR = rewardAPR * 2; 
        }
        
        return (userStake.amount * effectiveAPR * timeElapsed) / (100 * SECONDS_IN_YEAR);
    }
}
