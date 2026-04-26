// Mock data for prediction markets

export interface Market {
  id: string;
  question: string;
  category: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  liquidity: number;
  endDate: string;
  resolution: string;
  status: 'active' | 'resolved' | 'pending';
  imageUrl?: string;
}

export interface Position {
  id: string;
  marketId: string;
  market: Market;
  outcome: 'yes' | 'no';
  shares: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

export const categories = [
  'All',
  'Politics',
  'Crypto',
  'Sports',
  'Technology',
  'Entertainment',
  'Economics',
] as const;

export const mockMarkets: Market[] = [
  {
    id: '1',
    question: 'Will Bitcoin exceed $150,000 by end of 2025?',
    category: 'Crypto',
    yesPrice: 0.42,
    noPrice: 0.58,
    volume: 2847500,
    liquidity: 458000,
    endDate: '2025-12-31',
    resolution: 'Resolves YES if BTC/USD spot price exceeds $150,000 on any major exchange before Dec 31, 2025 11:59 PM UTC.',
    status: 'active',
  },
  {
    id: '2',
    question: 'Will the Fed cut rates in Q1 2025?',
    category: 'Economics',
    yesPrice: 0.67,
    noPrice: 0.33,
    volume: 1523000,
    liquidity: 312000,
    endDate: '2025-03-31',
    resolution: 'Resolves YES if the Federal Reserve announces a rate cut between Jan 1 and Mar 31, 2025.',
    status: 'active',
  },
  {
    id: '3',
    question: 'Will Ethereum ETF see $10B inflows in 2025?',
    category: 'Crypto',
    yesPrice: 0.31,
    noPrice: 0.69,
    volume: 892000,
    liquidity: 178000,
    endDate: '2025-12-31',
    resolution: 'Resolves YES if cumulative Ethereum ETF inflows exceed $10 billion USD by end of 2025.',
    status: 'active',
  },
  {
    id: '4',
    question: 'Will Apple release AR glasses in 2025?',
    category: 'Technology',
    yesPrice: 0.24,
    noPrice: 0.76,
    volume: 567000,
    liquidity: 134000,
    endDate: '2025-12-31',
    resolution: 'Resolves YES if Apple announces and begins selling AR glasses (not Vision Pro) in 2025.',
    status: 'active',
  },
  {
    id: '5',
    question: 'Will Tesla stock hit $500 in 2025?',
    category: 'Economics',
    yesPrice: 0.55,
    noPrice: 0.45,
    volume: 3124000,
    liquidity: 523000,
    endDate: '2025-12-31',
    resolution: 'Resolves YES if TSLA stock price reaches $500 or higher on NASDAQ at any point in 2025.',
    status: 'active',
  },
  {
    id: '6',
    question: 'Will SpaceX Starship reach orbit in Q1 2025?',
    category: 'Technology',
    yesPrice: 0.78,
    noPrice: 0.22,
    volume: 445000,
    liquidity: 89000,
    endDate: '2025-03-31',
    resolution: 'Resolves YES if SpaceX Starship successfully reaches stable orbit before March 31, 2025.',
    status: 'active',
  },
  {
    id: '7',
    question: 'Will ChatGPT-5 be released before July 2025?',
    category: 'Technology',
    yesPrice: 0.61,
    noPrice: 0.39,
    volume: 1876000,
    liquidity: 267000,
    endDate: '2025-06-30',
    resolution: 'Resolves YES if OpenAI publicly releases GPT-5 or ChatGPT-5 before June 30, 2025.',
    status: 'active',
  },
  {
    id: '8',
    question: 'Will Solana flip Ethereum in daily transactions?',
    category: 'Crypto',
    yesPrice: 0.48,
    noPrice: 0.52,
    volume: 723000,
    liquidity: 156000,
    endDate: '2025-12-31',
    resolution: 'Resolves YES if Solana has more daily transactions than Ethereum for 30 consecutive days in 2025.',
    status: 'active',
  },
];

export const mockPositions: Position[] = [
  {
    id: 'p1',
    marketId: '1',
    market: mockMarkets[0],
    outcome: 'yes',
    shares: 250,
    avgPrice: 0.35,
    currentPrice: 0.42,
    pnl: 17.5,
    pnlPercent: 20,
  },
  {
    id: 'p2',
    marketId: '2',
    market: mockMarkets[1],
    outcome: 'yes',
    shares: 500,
    avgPrice: 0.58,
    currentPrice: 0.67,
    pnl: 45,
    pnlPercent: 15.52,
  },
  {
    id: 'p3',
    marketId: '5',
    market: mockMarkets[4],
    outcome: 'no',
    shares: 150,
    avgPrice: 0.52,
    currentPrice: 0.45,
    pnl: -10.5,
    pnlPercent: -13.46,
  },
];

export const mockStats = {
  totalVolume: 12458000,
  activeTraders: 24567,
  weeklyVolume: 3245000,
  activeMarkets: 847,
};

export function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(2)}`;
}

export function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

export function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
