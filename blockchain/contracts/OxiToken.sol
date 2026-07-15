// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title OxideX Token (OXI)
 * @dev The native utility and reward token for the OXIDEX ecosystem.
 * Users earn OXI tokens by actively participating in the matrix (registering, upgrading).
 */
contract OxiToken is ERC20, Ownable {
    address public matrixContract;

    modifier onlyMatrix() {
        require(msg.sender == matrixContract, "OxiToken: Caller is not the Matrix contract");
        _;
    }

    constructor() ERC20("OxideX Token", "OXI") {
        // Mint an initial supply of 10,000,000 OXI to the creator for liquidity/marketing
        _mint(msg.sender, 10_000_000 * 10 ** decimals());
    }

    /**
     * @dev Sets the official OXIDEX Matrix contract address.
     * Only this contract can mint new reward tokens.
     */
    function setMatrixContract(address _matrixContract) external onlyOwner {
        matrixContract = _matrixContract;
    }

    /**
     * @dev Called by the Matrix contract to mint OXI rewards to users.
     */
    function rewardUser(address to, uint256 amount) external onlyMatrix {
        _mint(to, amount);
    }
}
