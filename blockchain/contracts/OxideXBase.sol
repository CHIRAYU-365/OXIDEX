// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IOxiToken {
    function rewardUser(address to, uint256 amount) external;
}

interface IOxiMilestones {
    function awardBadge(address to, uint256 badgeId) external;
}

contract OxideXBase {
    struct User {
        uint256 id;
        address referrer;
        uint256 partnersCount;
    }

    struct X3 {
        address currentReferrer;
        address[] referrals;
        bool blocked;
        uint256 reinvestCount;
    }

    struct X4 {
        address currentReferrer;
        address[] firstLevel;
        address[] secondLevel;
        bool blocked;
        uint256 reinvestCount;
        address closedPart;
    }

    struct X2 {
        address currentReferrer;
        address[] referrals;
        bool blocked;
        uint256 reinvestCount;
    }

    uint8 public constant LAST_LEVEL = 12;
    uint256 public constant REGISTRATION_COST = 0.075 ether;

    address public owner;
    uint256 public lastUserId;

    mapping(address => User) public users;
    mapping(uint256 => address) public idToAddress;
    mapping(uint8 => uint256) public levelPrice;

    mapping(address => mapping(uint8 => bool)) public activeLevels_x3;
    mapping(address => mapping(uint8 => bool)) public activeLevels_x4;
    mapping(address => mapping(uint8 => bool)) public activeLevels_x2;

    mapping(address => mapping(uint8 => X3)) public x3Matrix;
    mapping(address => mapping(uint8 => X4)) public x4Matrix;
    mapping(address => mapping(uint8 => X2)) public x2Matrix;

    IOxiToken public oxiToken;
    IOxiMilestones public oxiMilestones;
    
    mapping(address => bool) public autoUpgradeEnabled;
    mapping(address => uint256) public autoUpgradeEscrow;

    event EscrowedForUpgrade(address indexed user, uint256 amount);
    event AutoUpgradeToggled(address indexed user, bool enabled);

    event Registration(address indexed user, address indexed referrer, uint256 indexed userId, uint256 referrerId);
    event Upgrade(address indexed user, address indexed referrer, uint8 matrix, uint8 level);
    event Reinvest(address indexed user, address indexed currentReferrer, address indexed caller, uint8 matrix, uint8 level);
    event NewUserPlace(address indexed user, address indexed referrer, uint8 matrix, uint8 level, uint8 place);
    event MissedEthReceive(address indexed receiver, address indexed from, uint8 matrix, uint8 level);
    event SentExtraEthDividends(address indexed from, address indexed receiver, uint8 matrix, uint8 level);

    function setContracts(address _token, address _milestones) external {
        require(msg.sender == owner, "Only owner");
        oxiToken = IOxiToken(_token);
        oxiMilestones = IOxiMilestones(_milestones);
    }

    function toggleAutoUpgrade() external {
        require(isUserExists(msg.sender), "User not registered");
        autoUpgradeEnabled[msg.sender] = !autoUpgradeEnabled[msg.sender];
        emit AutoUpgradeToggled(msg.sender, autoUpgradeEnabled[msg.sender]);
    }
    
    function withdrawEscrow() external {
        uint256 amount = autoUpgradeEscrow[msg.sender];
        require(amount > 0, "No escrowed funds");
        autoUpgradeEscrow[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
    }

    constructor(address _owner) {
        owner = _owner;
        lastUserId = 1;

        levelPrice[1] = 0.025 ether;
        for (uint8 i = 2; i <= LAST_LEVEL; i++) {
            levelPrice[i] = levelPrice[i - 1] * 2;
        }

        users[_owner] = User({
            id: 1,
            referrer: address(0),
            partnersCount: 0
        });
        idToAddress[1] = _owner;

        for (uint8 i = 1; i <= LAST_LEVEL; i++) {
            activeLevels_x3[_owner][i] = true;
            activeLevels_x4[_owner][i] = true;
            activeLevels_x2[_owner][i] = true;
        }
    }

    fallback() external payable {
        if (msg.data.length == 0) {
            registration(msg.sender, owner);
        } else {
            registration(msg.sender, bytesToAddress(msg.data));
        }
    }

    receive() external payable {
        registration(msg.sender, owner);
    }

    function registrationExt(address referrerAddress) external payable {
        registration(msg.sender, referrerAddress);
    }

    function buyNewLevel(uint8 matrix, uint8 level) external payable {
        require(isUserExists(msg.sender), "user does not exist. Register first.");
        require(matrix == 1 || matrix == 2 || matrix == 3, "invalid matrix");
        if (msg.value == 0) {
            require(autoUpgradeEscrow[msg.sender] >= levelPrice[level], "insufficient escrow");
            autoUpgradeEscrow[msg.sender] -= levelPrice[level];
        } else {
            require(msg.value == levelPrice[level], "invalid price");
        }
        require(level > 1 && level <= LAST_LEVEL, "invalid level");

        if (matrix == 1) {
            require(activeLevels_x3[msg.sender][level - 1], "buy previous level first");
            require(!activeLevels_x3[msg.sender][level], "level already active");

            if (x3Matrix[msg.sender][level - 1].blocked) {
                x3Matrix[msg.sender][level - 1].blocked = false;
            }

            address freeReferrer = findFreeReferrer(msg.sender, level);
            x3Matrix[msg.sender][level].currentReferrer = freeReferrer;
            activeLevels_x3[msg.sender][level] = true;
            updateX3Referrer(msg.sender, freeReferrer, level);

            emit Upgrade(msg.sender, freeReferrer, 1, level);
        } else if (matrix == 2) {
            require(activeLevels_x4[msg.sender][level - 1], "buy previous level first");
            require(!activeLevels_x4[msg.sender][level], "level already active");

            if (x4Matrix[msg.sender][level - 1].blocked) {
                x4Matrix[msg.sender][level - 1].blocked = false;
            }

            address freeReferrer = findFreeReferrerX4(msg.sender, level);
            x4Matrix[msg.sender][level].currentReferrer = freeReferrer;
            activeLevels_x4[msg.sender][level] = true;
            updateX4Referrer(msg.sender, freeReferrer, level);

            emit Upgrade(msg.sender, freeReferrer, 2, level);
        } else {
            require(activeLevels_x2[msg.sender][level - 1], "buy previous level first");
            require(!activeLevels_x2[msg.sender][level], "level already active");

            if (x2Matrix[msg.sender][level - 1].blocked) {
                x2Matrix[msg.sender][level - 1].blocked = false;
            }

            address freeReferrer = findFreeReferrerX2(msg.sender, level);
            x2Matrix[msg.sender][level].currentReferrer = freeReferrer;
            activeLevels_x2[msg.sender][level] = true;
            updateX2Referrer(msg.sender, freeReferrer, level);

            emit Upgrade(msg.sender, freeReferrer, 3, level);
        }

        if (address(oxiToken) != address(0)) {
            oxiToken.rewardUser(msg.sender, 50 * 10**18);
        }
        if (address(oxiMilestones) != address(0) && level == LAST_LEVEL) {
            oxiMilestones.awardBadge(msg.sender, 1);
        }
    }

    function registration(address userAddress, address referrerAddress) private {
        require(msg.value == REGISTRATION_COST, "registration cost is 0.075 ETH");
        require(!isUserExists(userAddress), "user already exists");
        require(isUserExists(referrerAddress), "referrer does not exist");
        require(msg.sender == tx.origin, "cannot be a contract");

        lastUserId++;
        users[userAddress] = User({
            id: lastUserId,
            referrer: referrerAddress,
            partnersCount: 0
        });
        idToAddress[lastUserId] = userAddress;

        activeLevels_x3[userAddress][1] = true;
        activeLevels_x4[userAddress][1] = true;
        activeLevels_x2[userAddress][1] = true;

        users[referrerAddress].partnersCount++;

        address freeX3Referrer = findFreeReferrer(userAddress, 1);
        x3Matrix[userAddress][1].currentReferrer = freeX3Referrer;
        updateX3Referrer(userAddress, freeX3Referrer, 1);

        address freeX4Referrer = findFreeReferrerX4(userAddress, 1);
        x4Matrix[userAddress][1].currentReferrer = freeX4Referrer;
        updateX4Referrer(userAddress, freeX4Referrer, 1);

        address freeX2Referrer = findFreeReferrerX2(userAddress, 1);
        x2Matrix[userAddress][1].currentReferrer = freeX2Referrer;
        updateX2Referrer(userAddress, freeX2Referrer, 1);

        emit Registration(userAddress, referrerAddress, lastUserId, users[referrerAddress].id);

        if (address(oxiToken) != address(0)) {
            oxiToken.rewardUser(userAddress, 100 * 10**18);
        }
        if (address(oxiMilestones) != address(0) && users[referrerAddress].partnersCount == 100) {
            oxiMilestones.awardBadge(referrerAddress, 2);
        }
    }

    function updateX3Referrer(address userAddress, address referrerAddress, uint8 level) private {
        x3Matrix[referrerAddress][level].referrals.push(userAddress);

        if (x3Matrix[referrerAddress][level].referrals.length < 3) {
            emit NewUserPlace(userAddress, referrerAddress, 1, level, uint8(x3Matrix[referrerAddress][level].referrals.length));
            return sendETHDividends(referrerAddress, userAddress, 1, level);
        }

        emit NewUserPlace(userAddress, referrerAddress, 1, level, 3);

        x3Matrix[referrerAddress][level].referrals = new address[](0);

        if (referrerAddress != owner) {
            address freeReferrer = findFreeReferrer(referrerAddress, level);
            if (x3Matrix[referrerAddress][level].currentReferrer != freeReferrer) {
                x3Matrix[referrerAddress][level].currentReferrer = freeReferrer;
            }

            x3Matrix[referrerAddress][level].reinvestCount++;
            emit Reinvest(referrerAddress, freeReferrer, userAddress, 1, level);
            updateX3Referrer(referrerAddress, freeReferrer, level);
        } else {
            sendETHDividends(owner, userAddress, 1, level);
            x3Matrix[owner][level].reinvestCount++;
            emit Reinvest(owner, address(0), userAddress, 1, level);
        }
    }

    function updateX2Referrer(address userAddress, address referrerAddress, uint8 level) private {
        x2Matrix[referrerAddress][level].referrals.push(userAddress);

        if (x2Matrix[referrerAddress][level].referrals.length < 2) {
            emit NewUserPlace(userAddress, referrerAddress, 3, level, uint8(x2Matrix[referrerAddress][level].referrals.length));
            return sendETHDividends(referrerAddress, userAddress, 3, level);
        }

        emit NewUserPlace(userAddress, referrerAddress, 3, level, 2);

        x2Matrix[referrerAddress][level].referrals = new address[](0);

        if (referrerAddress != owner) {
            address freeReferrer = findFreeReferrerX2(referrerAddress, level);
            if (x2Matrix[referrerAddress][level].currentReferrer != freeReferrer) {
                x2Matrix[referrerAddress][level].currentReferrer = freeReferrer;
            }

            x2Matrix[referrerAddress][level].reinvestCount++;
            emit Reinvest(referrerAddress, freeReferrer, userAddress, 3, level);
            updateX2Referrer(referrerAddress, freeReferrer, level);
        } else {
            sendETHDividends(owner, userAddress, 3, level);
            x2Matrix[owner][level].reinvestCount++;
            emit Reinvest(owner, address(0), userAddress, 3, level);
        }
    }

    function updateX4Referrer(address userAddress, address referrerAddress, uint8 level) private {
        require(activeLevels_x4[referrerAddress][level], "referrer level is not active");

        if (x4Matrix[referrerAddress][level].firstLevel.length < 2) {
            x4Matrix[referrerAddress][level].firstLevel.push(userAddress);
            emit NewUserPlace(userAddress, referrerAddress, 2, level, uint8(x4Matrix[referrerAddress][level].firstLevel.length));

            x4Matrix[userAddress][level].currentReferrer = referrerAddress;

            if (referrerAddress == owner) {
                return sendETHDividends(owner, userAddress, 2, level);
            }

            address ref = x4Matrix[referrerAddress][level].currentReferrer;
            x4Matrix[ref][level].secondLevel.push(userAddress);

            uint8 place = uint8(x4Matrix[ref][level].secondLevel.length);
            emit NewUserPlace(userAddress, ref, 2, level, place + 2);

            if (x4Matrix[ref][level].secondLevel.length < 4) {
                return sendETHDividends(ref, userAddress, 2, level);
            }

            x4Matrix[ref][level].secondLevel = new address[](0);
            x4Matrix[ref][level].firstLevel = new address[](0);

            if (ref != owner) {
                address freeReferrer = findFreeReferrerX4(ref, level);
                x4Matrix[ref][level].reinvestCount++;
                emit Reinvest(ref, freeReferrer, userAddress, 2, level);
                updateX4Referrer(ref, freeReferrer, level);
            } else {
                sendETHDividends(owner, userAddress, 2, level);
                x4Matrix[owner][level].reinvestCount++;
                emit Reinvest(owner, address(0), userAddress, 2, level);
            }
            return;
        }

        x4Matrix[referrerAddress][level].secondLevel.push(userAddress);
        x4Matrix[userAddress][level].currentReferrer = referrerAddress;

        if (x4Matrix[referrerAddress][level].firstLevel[0] != address(0) &&
            x4Matrix[x4Matrix[referrerAddress][level].firstLevel[0]][level].firstLevel.length < 2) {

            x4Matrix[x4Matrix[referrerAddress][level].firstLevel[0]][level].firstLevel.push(userAddress);
            emit NewUserPlace(userAddress, x4Matrix[referrerAddress][level].firstLevel[0], 2, level, uint8(x4Matrix[x4Matrix[referrerAddress][level].firstLevel[0]][level].firstLevel.length));
        } else {
            x4Matrix[x4Matrix[referrerAddress][level].firstLevel[1]][level].firstLevel.push(userAddress);
            emit NewUserPlace(userAddress, x4Matrix[referrerAddress][level].firstLevel[1], 2, level, uint8(x4Matrix[x4Matrix[referrerAddress][level].firstLevel[1]][level].firstLevel.length));
        }

        if (x4Matrix[referrerAddress][level].secondLevel.length < 4) {
            return sendETHDividends(referrerAddress, userAddress, 2, level);
        }

        x4Matrix[referrerAddress][level].secondLevel = new address[](0);
        x4Matrix[referrerAddress][level].firstLevel = new address[](0);

        if (referrerAddress != owner) {
            address freeReferrer = findFreeReferrerX4(referrerAddress, level);
            x4Matrix[referrerAddress][level].reinvestCount++;
            emit Reinvest(referrerAddress, freeReferrer, userAddress, 2, level);
            updateX4Referrer(referrerAddress, freeReferrer, level);
        } else {
            sendETHDividends(owner, userAddress, 2, level);
            x4Matrix[owner][level].reinvestCount++;
            emit Reinvest(owner, address(0), userAddress, 2, level);
        }
    }

    function findFreeReferrer(address userAddress, uint8 level) public view returns(address) {
        uint256 depth = 0;
        while (depth < 30) {
            address referrer = users[userAddress].referrer;
            if (activeLevels_x3[referrer][level]) {
                return referrer;
            }
            userAddress = referrer;
            depth++;
        }
        return owner;
    }

    function findFreeReferrerX4(address userAddress, uint8 level) public view returns(address) {
        uint256 depth = 0;
        while (depth < 30) {
            address referrer = users[userAddress].referrer;
            if (activeLevels_x4[referrer][level]) {
                return referrer;
            }
            userAddress = referrer;
            depth++;
        }
        return owner;
    }

    function findFreeReferrerX2(address userAddress, uint8 level) public view returns(address) {
        uint256 depth = 0;
        while (depth < 30) {
            address referrer = users[userAddress].referrer;
            if (activeLevels_x2[referrer][level]) {
                return referrer;
            }
            userAddress = referrer;
            depth++;
        }
        return owner;
    }

    function isUserExists(address user) public view returns (bool) {
        return (users[user].id != 0);
    }

    function sendETHDividends(address receiver, address from, uint8 matrix, uint8 level) private {
        if (autoUpgradeEnabled[receiver]) {
            autoUpgradeEscrow[receiver] += levelPrice[level];
            emit EscrowedForUpgrade(receiver, levelPrice[level]);
        } else {
            (bool success, ) = payable(receiver).call{value: levelPrice[level]}("");
            if (success) {
                emit SentExtraEthDividends(from, receiver, matrix, level);
            } else {
                (bool successOwner, ) = payable(owner).call{value: levelPrice[level]}("");
                require(successOwner, "Owner transfer failed");
                emit SentExtraEthDividends(from, owner, matrix, level);
            }
        }
    }

    function usersX3Matrix(address userAddress, uint8 level) public view returns(address, address[] memory, bool, uint256) {
        X3 memory matrix = x3Matrix[userAddress][level];
        return (matrix.currentReferrer, matrix.referrals, matrix.blocked, matrix.reinvestCount);
    }

    function usersX2Matrix(address userAddress, uint8 level) public view returns(address, address[] memory, bool, uint256) {
        X2 memory matrix = x2Matrix[userAddress][level];
        return (matrix.currentReferrer, matrix.referrals, matrix.blocked, matrix.reinvestCount);
    }

    function usersX4Matrix(address userAddress, uint8 level) public view returns(address, address[] memory, address[] memory, bool, uint256, address) {
        X4 memory matrix = x4Matrix[userAddress][level];
        return (
            matrix.currentReferrer,
            matrix.firstLevel,
            matrix.secondLevel,
            matrix.blocked,
            matrix.reinvestCount,
            matrix.closedPart
        );
    }

    function bytesToAddress(bytes memory bys) private pure returns (address addr) {
        assembly {
            addr := mload(add(bys, 20))
        }
    }
}
