// Minimal ABIs for blockchain interaction (human-readable format for ethers.js)

export const MARKET_ABI = [
  "function collateral() view returns (address)",
  "function oracle() view returns (address)",
  "function expiry() view returns (uint256)",
  "function question() view returns (string)",
  "function resolved() view returns (bool)",
  "function outcomeYes() view returns (bool)",
  "function totalYes() view returns (uint256)",
  "function totalNo() view returns (uint256)",
  "function yesStake(address) view returns (uint256)",
  "function noStake(address) view returns (uint256)",
  "function claimed(address) view returns (bool)",
  "function buyYes(uint256 amount) external",
  "function buyNo(uint256 amount) external",
  "function resolve(bool outcomeYes) external",
  "function claim() external",
  "function getUserStake(address user) view returns (uint256 yes, uint256 no)",
  "function getPoolSizes() view returns (uint256 yesPool, uint256 noPool)",
  "function getPotentialPayout(address user) view returns (uint256)",
  "event Bought(address indexed user, bool indexed sideYes, uint256 amount)",
  "event Resolved(bool outcomeYes)",
  "event Claimed(address indexed user, uint256 payout)"
];

export const FACTORY_ABI = [
  "function oracle() view returns (address)",
  "function collateral() view returns (address)",
  "function createMarket(uint256 expiry, string calldata question) returns (address market)",
  "function getOracle() view returns (address)",
  "function getCollateral() view returns (address)",
  "event MarketCreated(address indexed market, uint256 expiry, string question)"
];

export const ORACLE_ABI = [
  "function owner() view returns (address)",
  "function resolveMarket(address market, bool outcomeYes) external",
  "function resolveYes(address market) external",
  "function resolveNo(address market) external",
  "function isResolved(address market) view returns (bool)",
  "function getOutcome(address market) view returns (bool)",
  "event MarketResolved(address indexed market, bool outcomeYes, uint256 timestamp)"
];

export const USDC_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount) external",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];
