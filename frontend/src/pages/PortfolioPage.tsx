import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, ExternalLink, Wallet,
  ArrowRight, Loader2, RefreshCw, BarChart3, PlusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { useMarketContract } from '@/hooks/useMarketContract';
import { formatCurrency } from '@/lib/mock-data';
import { ADDRESSES, isDeployed, formatUSDC } from '@/lib/contracts';

interface OnChainPosition {
  marketAddress: string;
  question: string;
  yesStake: string;
  noStake: string;
  claimed: boolean;
  potentialPayout: string;
  resolved: boolean;
  outcomeYes: boolean;
  pool: string;
}

export default function PortfolioPage() {
  const { isConnected, connect, balance, usdcBalance } = useWallet();
  const { getMarketState, getUserPosition } = useMarketContract();

  const ethDisplay  = parseFloat(balance || '0').toFixed(4);
  const usdcDisplay = parseFloat(usdcBalance || '0').toFixed(2);

  const [positions, setPositions] = useState<OnChainPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Load positions from all deployed markets
  useEffect(() => {
    if (!isConnected || !isDeployed()) return;
    let cancelled = false;
    setLoading(true);

    async function load() {
      const marketAddrs: string[] = ADDRESSES.markets;
      if (!marketAddrs.length) { setLoading(false); return; }

      const results: OnChainPosition[] = [];
      for (const addr of marketAddrs) {
        try {
          const [state, pos] = await Promise.all([
            getMarketState(addr),
            getUserPosition(addr),
          ]);
          // Only include if user has any stake
          if (parseFloat(pos.yesStake) > 0 || parseFloat(pos.noStake) > 0 || pos.claimed) {
            results.push({
              marketAddress: addr,
              question: state.question,
              yesStake: pos.yesStake,
              noStake: pos.noStake,
              claimed: pos.claimed,
              potentialPayout: pos.potentialPayout,
              resolved: state.resolved,
              outcomeYes: state.outcomeYes,
              pool: state.pool,
            });
          }
        } catch {
          // skip markets that fail
        }
      }
      if (!cancelled) { setPositions(results); setLoading(false); }
    }

    load();
    return () => { cancelled = true; };
  }, [isConnected, lastRefresh, getMarketState, getUserPosition]);

  // Compute aggregate stats
  const totalInvested = positions.reduce(
    (acc, p) => acc + parseFloat(p.yesStake) + parseFloat(p.noStake), 0
  );
  const totalClaimable = positions.reduce(
    (acc, p) => !p.claimed ? acc + parseFloat(p.potentialPayout) : acc, 0
  );

  // ─── Not connected ───────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="container-main">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg mx-auto text-center py-16"
          >
            <div className="glass-card p-8">
              <div className="h-20 w-20 rounded-full bg-primary/10 mx-auto mb-6 flex items-center justify-center">
                <Wallet className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-3">Connect Your Wallet</h1>
              <p className="text-muted-foreground mb-6">
                Connect MetaMask to see your on-chain positions, stakes, and claimable winnings.
              </p>
              <Button variant="gradient" size="lg" onClick={connect}>
                Connect Wallet
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container-main">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-start justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Portfolio</h1>
            <p className="text-muted-foreground">Your on-chain positions</p>
          </div>
          <button
            onClick={() => setLastRefresh(Date.now())}
            disabled={loading}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid md:grid-cols-3 gap-4 mb-8"
        >
          <div className="glass-card p-6">
            <p className="text-sm text-muted-foreground mb-2">ETH Balance</p>
            <p className="number-xl">{ethDisplay} ETH</p>
            {parseFloat(usdcDisplay) > 0 && (
              <p className="text-sm text-success mt-1">${usdcDisplay} USDC</p>
            )}
          </div>
          <div className="glass-card p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Invested</p>
            <p className="number-xl">${totalInvested.toFixed(2)} USDC</p>
            <p className="text-xs text-muted-foreground mt-1">{positions.length} market{positions.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="glass-card p-6">
            <p className="text-sm text-muted-foreground mb-2">Claimable Winnings</p>
            <p className={`number-xl ${totalClaimable > 0 ? 'text-success' : ''}`}>
              ${totalClaimable.toFixed(2)} USDC
            </p>
            {totalClaimable > 0 && (
              <p className="text-xs text-success mt-1">Visit market to claim</p>
            )}
          </div>
        </motion.div>

        {/* Positions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold mb-4">Positions</h2>

          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading positions from chain…</p>
            </div>
          ) : positions.length > 0 ? (
            <div className="space-y-4">
              {positions.map((pos, index) => (
                <motion.div
                  key={pos.marketAddress}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Link to={`/market/${pos.marketAddress}`}>
                    <div className="glass-card-hover p-5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Market Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {parseFloat(pos.yesStake) > 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                                YES: ${pos.yesStake}
                              </span>
                            )}
                            {parseFloat(pos.noStake) > 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                                NO: ${pos.noStake}
                              </span>
                            )}
                            {pos.resolved && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                Resolved: {pos.outcomeYes ? 'YES' : 'NO'}
                              </span>
                            )}
                            {pos.claimed && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                Claimed
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-foreground line-clamp-2">{pos.question}</p>
                          <p className="text-xs text-muted-foreground mt-1 font-mono">{pos.marketAddress.slice(0, 10)}…</p>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground mb-1">Pool Size</p>
                            <p className="number-display">${parseFloat(pos.pool).toFixed(2)}</p>
                          </div>
                          {!pos.claimed && parseFloat(pos.potentialPayout) > 0 && (
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground mb-1">Payout</p>
                              <div className="flex items-center justify-end gap-1 text-success">
                                <TrendingUp className="h-4 w-4" />
                                <span className="number-display font-semibold">
                                  ${parseFloat(pos.potentialPayout).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          )}
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            // Empty state
            <div className="glass-card p-10 text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 mx-auto mb-5 flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No positions yet</h3>
              <p className="text-muted-foreground mb-6">
                {isDeployed()
                  ? 'Browse markets and place your first trade to see positions here.'
                  : 'Deploy contracts and create markets first.'}
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link to="/markets">
                  <Button variant="gradient">
                    Explore Markets
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/create">
                  <Button variant="outline">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Market
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
