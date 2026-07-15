// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title OxideX Milestones NFT
 * @dev ERC-1155 Soulbound badges for major user achievements.
 */
contract OxiMilestones is ERC1155, Ownable {
    address public matrixContract;

    // Constants for token types
    uint256 public constant BADGE_LEVEL_12 = 1;
    uint256 public constant BADGE_100_PARTNERS = 2;

    modifier onlyMatrix() {
        require(msg.sender == matrixContract, "OxiMilestones: Caller is not the Matrix contract");
        _;
    }

    // URI example: "https://oxidex.com/api/metadata/{id}.json"
    constructor(string memory uri) ERC1155(uri) {}

    function setMatrixContract(address _matrixContract) external onlyOwner {
        matrixContract = _matrixContract;
    }

    /**
     * @dev Mint a milestone badge. 
     */
    function awardBadge(address to, uint256 badgeId) external onlyMatrix {
        _mint(to, badgeId, 1, "");
    }

    /**
     * @dev Block token transfers to make badges Soulbound (Non-Transferable)
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
        
        // Allow minting (from == 0) and burning (to == 0), but block regular user-to-user transfers
        require(from == address(0) || to == address(0), "OxiMilestones: Badges are soulbound and non-transferable");
    }
}
