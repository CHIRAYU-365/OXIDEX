const OXIDEX_ABI = [
  "event Registration(address indexed user, address indexed referrer, uint256 indexed userId, uint256 referrerId)",
  "event CommissionPaid(address indexed from, address indexed to, uint8 level, uint256 amount)",
  "event TokensPurchased(address indexed buyer, uint256 tokenAmount, uint256 ethSpent)",
  "function users(address) view returns (uint256 id, address referrer, uint256 partnersCount, uint256 totalEarnings)",
  "function levelCommissions(uint8) view returns (uint256)",
  "function isUserExists(address) view returns (bool)"
];

module.exports = {
  OXIDEX_ABI,
};
