import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, ExternalLink, Wallet, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { mockPositions, formatCurrency, formatPercent } from '@/lib/mock-data';

export default function PortfolioPage() {
  const { isConnected, connect, balance } = useWallet();

  const totalValue = mockPositions.reduce(
    (acc, pos) => acc + pos.shares * pos.currentPrice,
    0
  );
  const totalPnL = mockPositions.reduce((acc, pos) => acc + pos.pnl, 0);
  const totalPnLPercent = (totalPnL / (totalValue - totalPnL)) * 100;

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
                Connect your wallet to view your positions, track performance, and claim rewards.
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
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Portfolio</h1>
          <p className="text-muted-foreground">Track your positions and performance</p>
        </motion.div>

        {/* Portfolio Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid md:grid-cols-3 gap-4 mb-8"
        >
          <div className="glass-card p-6">
            <p className="text-sm text-muted-foreground mb-2">Portfolio Value</p>
            <p className="number-xl">${totalValue.toFixed(2)}</p>
          </div>
          <div className="glass-card p-6">
            <p className="text-sm text-muted-foreground mb-2">Total P&L</p>
            <div className="flex items-center gap-2">
              <p className={`number-xl ${totalPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
              </p>
              <span className={`text-sm ${totalPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                ({totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(1)}%)
              </span>
            </div>
          </div>
          <div className="glass-card p-6">
            <p className="text-sm text-muted-foreground mb-2">Available Balance</p>
            <p className="number-xl">{balance.toFixed(4)} ETH</p>
          </div>
        </motion.div>

        {/* Positions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold mb-4">Open Positions</h2>
          
          {mockPositions.length > 0 ? (
            <div className="space-y-4">
              {mockPositions.map((position, index) => (
                <motion.div
                  key={position.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Link to={`/market/${position.marketId}`}>
                    <div className="glass-card-hover p-5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Market Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="category-badge">{position.market.category}</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              position.outcome === 'yes'
                                ? 'bg-success/10 text-success border border-success/20'
                                : 'bg-destructive/10 text-destructive border border-destructive/20'
                            }`}>
                              {position.outcome.toUpperCase()}
                            </span>
                          </div>
                          <p className="font-medium text-foreground line-clamp-1">
                            {position.market.question}
                          </p>
                        </div>

                        {/* Position Stats */}
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground mb-1">Shares</p>
                            <p className="number-display">{position.shares}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground mb-1">Avg Price</p>
                            <p className="number-display">{formatPercent(position.avgPrice)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground mb-1">Current</p>
                            <p className="number-display">{formatPercent(position.currentPrice)}</p>
                          </div>
                          <div className="text-right min-w-[80px]">
                            <p className="text-xs text-muted-foreground mb-1">P&L</p>
                            <div className={`flex items-center justify-end gap-1 ${
                              position.pnl >= 0 ? 'text-success' : 'text-destructive'
                            }`}>
                              {position.pnl >= 0 ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : (
                                <TrendingDown className="h-4 w-4" />
                              )}
                              <span className="number-display font-semibold">
                                {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-8 text-center">
              <p className="text-muted-foreground mb-4">You don't have any open positions yet.</p>
              <Link to="/markets">
                <Button variant="gradient">
                  Explore Markets
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </motion.div>

        {/* Claim Rewards CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8"
        >
          <div className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Claimable Rewards</h3>
              <p className="text-muted-foreground text-sm">
                Claim your winnings from resolved markets
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Available</p>
                <p className="number-display text-xl text-success">$0.00</p>
              </div>
              <Button variant="outline" disabled>
                Claim Rewards
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
