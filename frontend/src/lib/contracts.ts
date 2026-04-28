import { ethers } from 'ethers';
import deployedAddresses from './deployed-addresses.json';

// ─── Contract ABIs (human-readable) ──────────────────────────────────────────

export const MARKET_ABI = [
  'function collateral() view returns (address)',
  'function oracle() view returns (address)',
  'function expiry() view returns (uint256)',
  'function question() view returns (string)',
  'function resolved() view returns (bool)',
  'function outcomeYes() view returns (bool)',
  'function totalYes() view returns (uint256)',
  'function totalNo() view returns (uint256)',
  'function yesStake(address) view returns (uint256)',
  'function noStake(address) view returns (uint256)',
  'function claimed(address) view returns (bool)',
  'function buyYes(uint256 amount) external',
  'function buyNo(uint256 amount) external',
  'function claim() external',
  'function getUserStake(address user) view returns (uint256 yes, uint256 no)',
  'function getPoolSizes() view returns (uint256 yesPool, uint256 noPool)',
  'function getPotentialPayout(address user) view returns (uint256)',
  'event Bought(address indexed user, bool indexed sideYes, uint256 amount)',
  'event Resolved(bool outcomeYes)',
  'event Claimed(address indexed user, uint256 payout)',
] as const;

export const FACTORY_ABI = [
  'function createMarket(uint256 expiry, string calldata question) returns (address market)',
  'function getOracle() view returns (address)',
  'function getCollateral() view returns (address)',
  'event MarketCreated(address indexed market, uint256 expiry, string question)',
] as const;

export const USDC_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
] as const;

// ─── Deployed addresses ───────────────────────────────────────────────────────

export const ADDRESSES = {
  usdc: deployedAddresses.usdc as string,
  oracle: deployedAddresses.oracle as string,
  factory: deployedAddresses.factory as string,
  markets: deployedAddresses.markets as string[],
};

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export function isDeployed(): boolean {
  return ADDRESSES.factory !== ZERO_ADDRESS && ADDRESSES.factory !== '';
}

export function isEthAddress(s: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(s);
}

// ─── Contract instances ───────────────────────────────────────────────────────

export function getMarketContract(
  address: string,
  signerOrProvider: ethers.Signer | ethers.Provider
) {
  return new ethers.Contract(address, MARKET_ABI, signerOrProvider);
}

export function getFactoryContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  if (!isDeployed()) throw new Error('Contracts not deployed — run deploy script first');
  return new ethers.Contract(ADDRESSES.factory, FACTORY_ABI, signerOrProvider);
}

export function getUSDCContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  if (!isDeployed()) throw new Error('Contracts not deployed — run deploy script first');
  return new ethers.Contract(ADDRESSES.usdc, USDC_ABI, signerOrProvider);
}

// USDC has 6 decimals
export const USDC_DECIMALS = 6;

export function parseUSDC(amount: string): bigint {
  return ethers.parseUnits(amount, USDC_DECIMALS);
}

export function formatUSDC(amount: bigint): string {
  return ethers.formatUnits(amount, USDC_DECIMALS);
}
