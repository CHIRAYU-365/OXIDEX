import { ethers } from "ethers";

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const CONTRACT_ABI = [
  "event Registration(address indexed user, address indexed referrer, uint256 indexed userId, uint256 referrerId)",
  "event CommissionPaid(address indexed from, address indexed to, uint8 level, uint256 amount)",
  "event TokensPurchased(address indexed buyer, uint256 tokenAmount, uint256 ethSpent)",
  "function users(address) view returns (uint256 id, address referrer, uint256 partnersCount, uint256 totalEarnings)",
  "function levelCommissions(uint8) view returns (uint256)",
  "function isUserExists(address) view returns (bool)",
  "function buyLaunchpadTokens(address referrer) payable",
  "function tokenPrice() view returns (uint256)",
  "function setCommission(uint8 level, uint256 percentageBps)",
  "function setMaxManualLevels(uint8 _max)",
  "function maxManualLevels() view returns (uint8)",
  "event Staked(address indexed user, uint256 amount)",
  "event Unstaked(address indexed user, uint256 amount)",
  "event YieldClaimed(address indexed user, uint256 reward)",
  "function stake(uint256 amount)",
  "function unstake(uint256 amount)",
  "function claimYield()",
  "function getPendingYield(address) view returns (uint256)",
  "function stakers(address) view returns (uint256 amount, uint256 lastClaimTime)",
  "function rewardAPR() view returns (uint256)",
  "function launchpadToken() view returns (address)"
];

export const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];
