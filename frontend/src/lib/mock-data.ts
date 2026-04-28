// Shared types and pure utility functions — no mock data

export interface Market {
  id: string;          // on-chain: 0x… contract address
  question: string;
  category: string;
  yesPrice: number;    // 0–1, derived from pool sizes
  noPrice: number;
  volume: number;      // total pool in USDC
  liquidity: number;
  endDate: string;     // ISO date string
  resolution: string;
  status: 'active' | 'resolved' | 'pending';
}

export interface Position {
  marketAddress: string;
  yesStake: string;    // human-readable USDC
  noStake: string;
  claimed: boolean;
  potentialPayout: string;
}

export const CATEGORIES = [
  'All', 'Crypto', 'Economics', 'Politics', 'Technology', 'Sports', 'Entertainment',
] as const;

export type Category = typeof CATEGORIES[number];

// ─── Pure formatters ─────────────────────────────────────────────────────────

export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)     return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(2)}`;
}

export function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)     return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

export function getDaysRemaining(endDate: string): number {
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── Backend API helpers ──────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface ChainMarket {
  address: string;
  question: string;
  expiry: number;
  resolved: boolean;
  outcomeYes: boolean;
  totalYes: string;
  totalNo: string;
  pool: string;
}

/** Fetch all markets from the backend (which reads from chain) */
export async function fetchMarkets(): Promise<Market[]> {
  const res = await fetch(`${API_BASE}/api/markets`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data: ChainMarket[] = await res.json();
  return data.map(chainMarketToMarket);
}

/** Convert raw chain market to frontend Market shape */
export function chainMarketToMarket(cm: ChainMarket): Market {
  const totalYes = parseFloat(cm.totalYes);
  const totalNo  = parseFloat(cm.totalNo);
  const pool     = totalYes + totalNo;
  const yesPrice = pool > 0 ? totalYes / pool : 0.5;
  const noPrice  = pool > 0 ? totalNo  / pool : 0.5;
  const expDate  = new Date(cm.expiry * 1000);
  const now      = Date.now() / 1000;

  return {
    id:         cm.address,
    question:   cm.question,
    category:   'On-Chain',
    yesPrice,
    noPrice,
    volume:     pool,
    liquidity:  pool,
    endDate:    expDate.toISOString().split('T')[0],
    resolution: `Market resolves via oracle after ${expDate.toLocaleString()}.`,
    status:     cm.resolved ? 'resolved' : cm.expiry < now ? 'pending' : 'active',
  };
}
