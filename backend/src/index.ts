import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for demo (replace with database in production)
interface Market {
  id: string;
  question: string;
  expiry: number;
  totalYes: string;
  totalNo: string;
  resolved: boolean;
  outcomeYes: boolean | null;
  createdAt: number;
}

interface UserPosition {
  address: string;
  marketId: string;
  yesStake: string;
  noStake: string;
  claimed: boolean;
}

const markets: Map<string, Market> = new Map();
const userPositions: Map<string, UserPosition[]> = new Map();

// Demo data
const DEMO_MARKET_ID = 'demo-market-1';
markets.set(DEMO_MARKET_ID, {
  id: DEMO_MARKET_ID,
  question: 'Will Bitcoin exceed $100,000 by end of 2025?',
  expiry: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
  totalYes: '50000',
  totalNo: '30000',
  resolved: false,
  outcomeYes: null,
  createdAt: Date.now(),
});

// Routes

// Get all markets
app.get('/api/markets', (req: Request, res: Response) => {
  const allMarkets = Array.from(markets.values());
  res.json(allMarkets);
});

// Get single market
app.get('/api/markets/:id', (req: Request, res: Response) => {
  const market = markets.get(req.params.id);
  if (!market) {
    return res.status(404).json({ error: 'Market not found' });
  }
  res.json(market);
});

// Create new market
app.post('/api/markets', (req: Request, res: Response) => {
  const { question, expiry } = req.body;
  
  if (!question || !expiry) {
    return res.status(400).json({ error: 'Question and expiry are required' });
  }

  const id = `market-${Date.now()}`;
  const market: Market = {
    id,
    question,
    expiry,
    totalYes: '0',
    totalNo: '0',
    resolved: false,
    outcomeYes: null,
    createdAt: Date.now(),
  };

  markets.set(id, market);
  res.status(201).json(market);
});

// Get user positions for a market
app.get('/api/markets/:id/positions/:address', (req: Request, res: Response) => {
  const { id, address } = req.params;
  const positions = userPositions.get(address.toLowerCase()) || [];
  const marketPositions = positions.filter(p => p.marketId === id);
  res.json(marketPositions);
});

// Place a bet (buy YES or NO)
app.post('/api/markets/:id/bet', (req: Request, res: Response) => {
  const { id } = req.params;
  const { address, side, amount } = req.body;

  if (!address || !side || !amount) {
    return res.status(400).json({ error: 'Address, side, and amount are required' });
  }

  const market = markets.get(id);
  if (!market) {
    return res.status(404).json({ error: 'Market not found' });
  }

  if (Date.now() > market.expiry) {
    return res.status(400).json({ error: 'Market has expired' });
  }

  if (market.resolved) {
    return res.status(400).json({ error: 'Market is already resolved' });
  }

  // Update market totals
  if (side === 'yes') {
    market.totalYes = (BigInt(market.totalYes) + BigInt(amount)).toString();
  } else {
    market.totalNo = (BigInt(market.totalNo) + BigInt(amount)).toString();
  }
  markets.set(id, market);

  // Update user position
  const userKey = address.toLowerCase();
  let positions = userPositions.get(userKey) || [];
  const existingPosition = positions.find(p => p.marketId === id);

  if (existingPosition) {
    if (side === 'yes') {
      existingPosition.yesStake = (BigInt(existingPosition.yesStake) + BigInt(amount)).toString();
    } else {
      existingPosition.noStake = (BigInt(existingPosition.noStake) + BigInt(amount)).toString();
    }
  } else {
    const newPosition: UserPosition = {
      address: userKey,
      marketId: id,
      yesStake: side === 'yes' ? amount : '0',
      noStake: side === 'no' ? amount : '0',
      claimed: false,
    };
    positions.push(newPosition);
  }

  userPositions.set(userKey, positions);

  res.json({ success: true, market });
});

// Resolve market (oracle function)
app.post('/api/markets/:id/resolve', (req: Request, res: Response) => {
  const { id } = req.params;
  const { outcomeYes } = req.body;

  const market = markets.get(id);
  if (!market) {
    return res.status(404).json({ error: 'Market not found' });
  }

  if (market.resolved) {
    return res.status(400).json({ error: 'Market already resolved' });
  }

  market.resolved = true;
  market.outcomeYes = outcomeYes;
  markets.set(id, market);

  res.json({ success: true, market });
});

// Claim winnings
app.post('/api/markets/:id/claim', (req: Request, res: Response) => {
  const { id } = req.params;
  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }

  const market = markets.get(id);
  if (!market) {
    return res.status(404).json({ error: 'Market not found' });
  }

  if (!market.resolved) {
    return res.status(400).json({ error: 'Market not resolved' });
  }

  const userKey = address.toLowerCase();
  const positions = userPositions.get(userKey) || [];
  const position = positions.find(p => p.marketId === id);

  if (!position) {
    return res.status(400).json({ error: 'No position found' });
  }

  if (position.claimed) {
    return res.status(400).json({ error: 'Already claimed' });
  }

  // Calculate payout
  const totalPool = BigInt(market.totalYes) + BigInt(market.totalNo);
  let payout = '0';

  if (market.outcomeYes && position.yesStake !== '0') {
    payout = (BigInt(position.yesStake) * totalPool / BigInt(market.totalYes)).toString();
  } else if (!market.outcomeYes && position.noStake !== '0') {
    payout = (BigInt(position.noStake) * totalPool / BigInt(market.totalNo)).toString();
  }

  position.claimed = true;
  userPositions.set(userKey, positions);

  res.json({ success: true, payout });
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Prediction Market Backend running on port ${PORT}`);
  console.log(`Demo market available at: http://localhost:${PORT}/api/markets/${DEMO_MARKET_ID}`);
});

export default app;