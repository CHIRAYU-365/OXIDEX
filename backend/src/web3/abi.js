const OXIDEX_ABI = [
  "event Registration(address indexed user, address indexed referrer, uint256 indexed userId, uint256 referrerId)",
  "event Upgrade(address indexed user, address indexed referrer, uint8 matrix, uint8 level)",
  "event Reinvest(address indexed user, address indexed currentReferrer, address indexed caller, uint8 matrix, uint8 level)",
  "event NewUserPlace(address indexed user, address indexed referrer, uint8 matrix, uint8 level, uint8 place)",
  "event MissedEthReceive(address indexed receiver, address indexed from, uint8 matrix, uint8 level)",
  "event SentExtraEthDividends(address indexed from, address indexed receiver, uint8 matrix, uint8 level)",
  "event EscrowedForUpgrade(address indexed user, uint256 amount)",
  "function users(address) view returns (uint256 id, address referrer, uint256 partnersCount)",
  "function usersX3Matrix(address, uint8) view returns (address currentReferrer, address[] referrals, bool blocked, uint256 reinvestCount)",
  "function usersX4Matrix(address, uint8) view returns (address currentReferrer, address[] firstLevel, address[] secondLevel, bool blocked, uint256 reinvestCount, address closedPart)",
  "function levelPrice(uint8) view returns (uint256)",
  "function isUserExists(address) view returns (bool)"
];

module.exports = {
  OXIDEX_ABI,
};
