
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract OxideXNFT is ERC721Enumerable, Ownable {
    uint256 public nextTokenId = 1;
    IERC20 public oxiToken;
    uint256 public constant MINT_PRICE = 1000 * 10**18; 
    
    
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
    string private _baseTokenURI;

    event VIPPassMinted(address indexed user, uint256 indexed tokenId);

    constructor(address _oxiTokenAddress) ERC721("OxideX VIP Pass", "OXIVIP") Ownable() {
        oxiToken = IERC20(_oxiTokenAddress);
    }

    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function setOxiToken(address _oxiTokenAddress) external onlyOwner {
        oxiToken = IERC20(_oxiTokenAddress);
    }

    function mint() external {
        require(oxiToken.balanceOf(msg.sender) >= MINT_PRICE, "Insufficient OXI tokens");
        require(oxiToken.allowance(msg.sender, address(this)) >= MINT_PRICE, "Must approve OXI first");
        
        
        bool success = oxiToken.transferFrom(msg.sender, BURN_ADDRESS, MINT_PRICE);
        require(success, "OXI transfer failed");

        uint256 tokenId = nextTokenId;
        nextTokenId++;

        _safeMint(msg.sender, tokenId);

        emit VIPPassMinted(msg.sender, tokenId);
    }
}
