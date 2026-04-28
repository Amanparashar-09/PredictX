import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import { FACTORY_ABI, ORACLE_ABI, MARKET_ABI, USDC_ABI } from './contracts';
import { OracleService } from './oracle-service';

dotenv.config();

// ─── App setup ────────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─── Deployed addresses ───────────────────────────────────────────────────────
interface DeployedAddresses {
  usdc: string;
  oracle: string;
  factory: string;
  markets: string[];
}

let deployed: DeployedAddresses = { usdc: '', oracle: '', factory: '', markets: [] };

const addressesPath = path.join(__dirname, '..', 'deployed-addresses.json');
if (fs.existsSync(addressesPath)) {
  deployed = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
  console.log('[Backend] Loaded deployed addresses:', deployed);
} else {
  console.warn('[Backend] deployed-addresses.json not found — run the deploy script first');
}

// ─── Blockchain provider ──────────────────────────────────────────────────────
const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';
const ORACLE_PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY || '';
const API_KEY = process.env.API_KEY || 'dev-api-key-change-me-in-production';

const provider = new ethers.JsonRpcProvider(RPC_URL);

// ─── Oracle service ───────────────────────────────────────────────────────────
let oracleService: OracleService | null = null;

if (ORACLE_PRIVATE_KEY && deployed.oracle) {
  oracleService = new OracleService(provider, deployed.oracle, ORACLE_PRIVATE_KEY);
  for (const addr of deployed.markets) {
    oracleService.addMarket(addr, 0, 'unknown');
  }
  console.log(`[Oracle] Service ready. Signer: ${oracleService.getSignerAddress()}`);
} else {
  console.warn('[Backend] Oracle service disabled — set ORACLE_PRIVATE_KEY in .env');
}

// ─── Contract helpers ─────────────────────────────────────────────────────────
function getFactory() {
  if (!deployed.factory) throw new Error('Factory not deployed');
  return new ethers.Contract(deployed.factory, FACTORY_ABI, provider);
}

function getMarket(address: string) {
  return new ethers.Contract(address, MARKET_ABI, provider);
}

function getUSDC() {
  if (!deployed.usdc) throw new Error('USDC not deployed');
  return new ethers.Contract(deployed.usdc, USDC_ABI, provider);
}

// ─── In-memory market address cache (seeded from deployed-addresses.json) ────
const marketAddresses: Set<string> = new Set(
  (deployed.markets || []).map((a: string) => a.toLowerCase())
);

// ─── Track which block we last scanned for events ────────────────────────────
let lastScannedBlock = 0;

/**
 * Register a market address into the in-memory set.
 * Called on startup (backfill) and whenever a new market event is found.
 */
function registerMarket(address: string, expiry: number, question: string) {
  const addr = address.toLowerCase();
  if (!marketAddresses.has(addr)) {
    marketAddresses.add(addr);
    if (oracleService) oracleService.addMarket(address, expiry, question);
    console.log(`[Market] Registered: ${address} — "${question}"`);
  }
}

/**
 * Backfill: query all MarketCreated events from block 0 → latest.
 * HTTP JSON-RPC providers don't support factory.on() websocket listeners,
 * so we poll with queryFilter instead.
 */
async function syncMarkets() {
  if (!deployed.factory) return;
  try {
    const factory = getFactory();
    const latest = await provider.getBlockNumber();
    const from = lastScannedBlock;

    // Guard: skip if no new blocks since last scan
    if (from > latest) {
      return;
    }

    console.log(`[Sync] Scanning blocks ${from} → ${latest}…`);
    const events = await factory.queryFilter(
      factory.filters.MarketCreated(),
      from,
      latest
    );
    for (const ev of events) {
      const [market, expiry, question] = (ev as any).args;
      registerMarket(market, Number(expiry), question as string);
    }
    lastScannedBlock = latest + 1;
    if (events.length > 0) {
      console.log(`[Sync] Found ${events.length} new market(s) up to block ${latest}`);
    }
  } catch (err) {
    // Log the actual error so we can diagnose it
    console.error('[Sync] queryFilter error:', (err as any)?.message || err);
  }
}

// Backfill all historical events on startup, then poll every 30s
syncMarkets()
  .then(() => console.log(`[Sync] Initial sync done. Tracking ${marketAddresses.size} market(s).`))
  .catch(console.error);

setInterval(() => syncMarkets().catch(console.error), 30_000);

// Oracle check every 60 seconds
setInterval(async () => {
  if (oracleService) {
    await oracleService.checkExpiredMarkets().catch(console.error);
  }
}, 60_000);

// ─── Auth middleware ──────────────────────────────────────────────────────────
function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['x-api-key'] || req.body?.apiKey;
  if (key !== API_KEY) {
    res.status(401).json({ error: 'Unauthorized: invalid API key' });
    return;
  }
  next();
}

// ─── Utility ──────────────────────────────────────────────────────────────────
function isAddress(s: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(s);
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/** GET /api/config — return deployed contract addresses for frontend */
app.get('/api/config', (_req, res) => {
  res.json({
    usdc: deployed.usdc || null,
    oracle: deployed.oracle || null,
    factory: deployed.factory || null,
    chainId: 31337,
    rpcUrl: RPC_URL,
  });
});

/**
 * POST /api/markets/register — immediately register a market address.
 * Called by the frontend right after factory.createMarket() succeeds,
 * so users don't have to wait for the 30s poll cycle.
 */
app.post('/api/markets/register', async (req, res) => {
  const { address } = req.body;
  if (!address || !isAddress(address)) {
    res.status(400).json({ error: 'Invalid or missing market address' });
    return;
  }
  try {
    // Verify the contract exists and is a valid market
    const market = getMarket(address);
    const [question, expiry] = await Promise.all([
      market.question(),
      market.expiry(),
    ]);
    registerMarket(address, Number(expiry), question);
    res.json({ success: true, address, question, trackedMarkets: marketAddresses.size });
  } catch (err: any) {
    res.status(500).json({ error: `Could not verify market: ${err.message}` });
  }
});

/** GET /api/markets/sync — force a full rescan from block 0 and return all markets */
app.get('/api/markets/sync', async (_req, res) => {
  try {
    // Reset and do a full rescan from genesis
    lastScannedBlock = 0;
    await syncMarkets();
    res.json({ success: true, trackedMarkets: marketAddresses.size, markets: Array.from(marketAddresses) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/markets — list all known markets with on-chain state */
app.get('/api/markets', async (_req, res) => {
  try {
    // Always do a fresh scan so newly created markets aren't missed
    await syncMarkets();

    const markets = await Promise.all(
      Array.from(marketAddresses).map(async (addr) => {
        try {
          const market = getMarket(addr);
          const [
            question,
            expiry,
            resolved,
            outcomeYes,
            totalYes,
            totalNo,
          ] = await Promise.all([
            market.question(),
            market.expiry(),
            market.resolved(),
            market.outcomeYes(),
            market.totalYes(),
            market.totalNo(),
          ]);
          return {
            address: addr,
            question,
            expiry: Number(expiry),
            resolved,
            outcomeYes,
            totalYes: totalYes.toString(),
            totalNo: totalNo.toString(),
            pool: (BigInt(totalYes) + BigInt(totalNo)).toString(),
          };
        } catch (err) {
          console.error(`[Market] Failed to read ${addr}:`, (err as any)?.message);
          return null;
        }
      })
    );
    res.json(markets.filter(Boolean));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/markets/:address — get single market on-chain state */
app.get('/api/markets/:address', async (req, res) => {
  const { address } = req.params;
  if (!isAddress(address)) {
    res.status(400).json({ error: 'Invalid market address' });
    return;
  }
  try {
    const market = getMarket(address);
    const [
      question,
      expiry,
      resolved,
      outcomeYes,
      totalYes,
      totalNo,
      collateral,
      oracleAddr,
    ] = await Promise.all([
      market.question(),
      market.expiry(),
      market.resolved(),
      market.outcomeYes(),
      market.totalYes(),
      market.totalNo(),
      market.collateral(),
      market.oracle(),
    ]);

    res.json({
      address,
      question,
      expiry: Number(expiry),
      resolved,
      outcomeYes,
      totalYes: totalYes.toString(),
      totalNo: totalNo.toString(),
      pool: (BigInt(totalYes) + BigInt(totalNo)).toString(),
      collateral,
      oracle: oracleAddr,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/markets/:address/position/:userAddress — user stake info */
app.get('/api/markets/:address/position/:userAddress', async (req, res) => {
  const { address, userAddress } = req.params;
  if (!isAddress(address) || !isAddress(userAddress)) {
    res.status(400).json({ error: 'Invalid address' });
    return;
  }
  try {
    const market = getMarket(address);
    const [[yesStake, noStake], claimed, potentialPayout] = await Promise.all([
      market.getUserStake(userAddress),
      market.claimed(userAddress),
      market.getPotentialPayout(userAddress),
    ]);
    res.json({
      marketAddress: address,
      userAddress,
      yesStake: yesStake.toString(),
      noStake: noStake.toString(),
      claimed,
      potentialPayout: potentialPayout.toString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/usdc/balance/:userAddress — USDC balance for a user */
app.get('/api/usdc/balance/:userAddress', async (req, res) => {
  const { userAddress } = req.params;
  if (!isAddress(userAddress)) {
    res.status(400).json({ error: 'Invalid address' });
    return;
  }
  try {
    const usdc = getUSDC();
    const balance = await usdc.balanceOf(userAddress);
    res.json({ address: userAddress, balance: balance.toString(), decimals: 6 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/markets/:address/resolve — resolve a market via oracle
 * Secured with X-Api-Key header or body.apiKey
 * Body: { outcomeYes: boolean }
 */
app.post('/api/markets/:address/resolve', requireApiKey, async (req, res) => {
  const { address } = req.params;
  const { outcomeYes } = req.body;

  if (!isAddress(address)) {
    res.status(400).json({ error: 'Invalid market address' });
    return;
  }
  if (typeof outcomeYes !== 'boolean') {
    res.status(400).json({ error: 'outcomeYes must be a boolean' });
    return;
  }
  if (!oracleService) {
    res.status(503).json({ error: 'Oracle service not configured — set ORACLE_PRIVATE_KEY' });
    return;
  }

  try {
    const receipt = await oracleService.resolveMarket(address, outcomeYes);
    res.json({
      success: true,
      marketAddress: address,
      outcomeYes,
      txHash: receipt?.hash,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/oracle/expired — list expired unresolved markets
 */
app.get('/api/oracle/expired', requireApiKey, async (_req, res) => {
  if (!oracleService) {
    res.status(503).json({ error: 'Oracle service not configured' });
    return;
  }
  try {
    const expired = await oracleService.checkExpiredMarkets();
    res.json({ expiredMarkets: expired });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /health */
app.get('/health', async (_req, res) => {
  let blockNumber: number | null = null;
  try {
    blockNumber = await provider.getBlockNumber();
  } catch {
    // provider may not be available
  }
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    blockNumber,
    oracleReady: !!oracleService,
    contractsDeployed: !!deployed.factory,
    trackedMarkets: marketAddresses.size,
  });
});

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Prediction Market Backend running on port ${PORT}`);
  console.log(`   Health:  http://localhost:${PORT}/health`);
  console.log(`   Config:  http://localhost:${PORT}/api/config`);
  console.log(`   Markets: http://localhost:${PORT}/api/markets\n`);
});

export default app;