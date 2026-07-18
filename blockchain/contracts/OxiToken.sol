// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title OxideX Token (OXI)
 * @dev The native utility token for the OXIDEX ecosystem Launchpad.
 */
contract OxiToken is ERC20, Ownable {
    address public launchpadContract;

    modifier onlyLaunchpad() {
        require(msg.sender == launchpadContract, "OxiToken: Caller is not the Launchpad contract");
        _;
    }

    constructor() ERC20("OxideX Token", "OXI") Ownable() {
        _mint(msg.sender, 10_000_000 * 10 ** decimals());
    }

    function setLaunchpadContract(address _launchpadContract) external onlyOwner {
        launchpadContract = _launchpadContract;
    }

    /**
     * @dev Called by the Launchpad contract to mint OXI tokens to users upon purchase.
     */
    function rewardUser(address to, uint256 amount) external onlyLaunchpad {
        _mint(to, amount);
    }
}
