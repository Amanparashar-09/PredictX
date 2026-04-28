import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Info, CheckCircle, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { Market, formatPercent } from '@/lib/mock-data';
import { useMarketContract, TxStatus } from '@/hooks/useMarketContract';
import { isEthAddress, formatUSDC } from '@/lib/contracts';
import { useToast } from '@/hooks/use-toast';

interface TradePanelProps {
  market: Market;
}

function StatusBadge({ status, txHash }: { status: TxStatus; txHash: string | null }) {
  if (status === 'idle') return null;

  const config: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    approving: {
      label: 'Approving USDC… (1/2)',
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      color: 'text-amber-400',
    },
    pending: {
      label: 'Confirming transaction… (2/2)',
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      color: 'text-primary',
    },
    confirmed: {
      label: 'Transaction confirmed!',
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'text-success',
    },
    error: {
      label: 'Transaction failed',
      icon: <AlertCircle className="h-4 w-4" />,
      color: 'text-destructive',
    },
  };

  const c = config[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 text-sm font-medium ${c.color} mb-3 p-3 rounded-xl bg-secondary/30`}
    >
      {c.icon}
      <span>{c.label}</span>
      {status === 'confirmed' && txHash && (
        <a
          href={`https://sepolia.etherscan.io/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto hover:opacity-80"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </motion.div>
  );
}

export function TradePanel({ market }: TradePanelProps) {
  const { isConnected, connect, usdcBalance, refreshUsdcBalance } = useWallet();
  const { buyYes, buyNo, claimWinnings, getMarketState, getUserPosition, txStatus, txHash, txError, resetTx } =
    useMarketContract();
  const { toast } = useToast();

  const [selectedOutcome, setSelectedOutcome] = useState<'yes' | 'no'>('yes');
  const [amount, setAmount] = useState('');

  // On-chain state (only populated when market.id is an eth address)
  const isOnChain = isEthAddress(market.id);
  const [onChainYes, setOnChainYes] = useState<string | null>(null);
  const [onChainNo, setOnChainNo] = useState<string | null>(null);
  const [userYesStake, setUserYesStake] = useState<string>('0');
  const [userNoStake, setUserNoStake] = useState<string>('0');
  const [marketResolved, setMarketResolved] = useState(false);
  const [marketOutcomeYes, setMarketOutcomeYes] = useState(false);
  const [userClaimed, setUserClaimed] = useState(false);
  const [potentialPayout, setPotentialPayout] = useState<string>('0');

  // Load on-chain data when market address is available
  useEffect(() => {
    if (!isOnChain) return;
    let cancelled = false;

    async function load() {
      try {
        const state = await getMarketState(market.id);
        if (cancelled) return;
        setOnChainYes(state.totalYes);
        setOnChainNo(state.totalNo);
        setMarketResolved(state.resolved);
        setMarketOutcomeYes(state.outcomeYes);
      } catch {
        // Contract not deployed or wrong network
      }
    }

    load();
    return () => { cancelled = true; };
  }, [market.id, isOnChain, getMarketState]);

  // Load user position when connected
  useEffect(() => {
    if (!isOnChain || !isConnected) return;
    let cancelled = false;

    async function loadPosition() {
      try {
        const pos = await getUserPosition(market.id);
        if (cancelled) return;
        setUserYesStake(pos.yesStake);
        setUserNoStake(pos.noStake);
        setUserClaimed(pos.claimed);
        setPotentialPayout(pos.potentialPayout);
      } catch {
        // ignore
      }
    }

    loadPosition();
    return () => { cancelled = true; };
  }, [market.id, isOnChain, isConnected, getUserPosition, txStatus]);

  // Reset tx status after 6 seconds of confirmation
  useEffect(() => {
    if (txStatus === 'confirmed') {
      const t = setTimeout(resetTx, 6000);
      return () => clearTimeout(t);
    }
  }, [txStatus, resetTx]);

  // Show error toast
  useEffect(() => {
    if (txStatus === 'error' && txError) {
      toast({ title: 'Transaction failed', description: txError, variant: 'destructive' });
    }
  }, [txStatus, txError, toast]);

  const currentPrice = selectedOutcome === 'yes' ? market.yesPrice : market.noPrice;
  const shares = amount ? parseFloat(amount) / currentPrice : 0;
  const potentialReturn = shares * 1 - parseFloat(amount || '0');
  const returnPercent = amount ? (potentialReturn / parseFloat(amount)) * 100 : 0;
  const isSubmitting = txStatus === 'approving' || txStatus === 'pending';

  const handleTrade = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    if (!isOnChain) return; // safety guard — UI already hides button for non-on-chain

    try {
      if (selectedOutcome === 'yes') {
        await buyYes(market.id, amount);
      } else {
        await buyNo(market.id, amount);
      }
      await refreshUsdcBalance();
      setAmount('');
      toast({ title: 'Trade confirmed!', description: `Bought ${selectedOutcome.toUpperCase()} for $${amount} USDC` });
    } catch {
      // error handled by hook
    }
  };

  const handleClaim = async () => {
    if (!isOnChain) return;
    try {
      await claimWinnings(market.id);
      await refreshUsdcBalance();
      toast({ title: 'Winnings claimed!', description: `Received $${potentialPayout} USDC` });
    } catch {
      // error handled by hook
    }
  };

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Trade</h3>
        {isOnChain ? (
          <span className="text-xs text-success bg-success/10 px-2 py-1 rounded-full font-medium">
            ● On-chain · Authenticated
          </span>
        ) : (
          <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full font-medium">
            ⚠ Demo Mode
          </span>
        )}
      </div>

      {/* Demo mode notice */}
      {!isOnChain && (
        <div className="mb-4 p-3 bg-amber-400/5 border border-amber-400/20 rounded-xl">
          <p className="text-xs text-amber-400 font-medium mb-0.5">Demo Market — No real transactions</p>
          <p className="text-xs text-muted-foreground">
            Browse on-chain markets or <span className="text-primary">create one</span> to trade with MetaMask.
          </p>
        </div>
      )}

      {/* On-chain pool sizes */}
      {isOnChain && (onChainYes !== null) && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="p-3 bg-success/10 rounded-xl text-center">
            <p className="text-xs text-muted-foreground mb-1">YES Pool</p>
            <p className="text-success font-semibold number-display">${onChainYes}</p>
          </div>
          <div className="p-3 bg-destructive/10 rounded-xl text-center">
            <p className="text-xs text-muted-foreground mb-1">NO Pool</p>
            <p className="text-destructive font-semibold number-display">${onChainNo}</p>
          </div>
        </div>
      )}

      {/* Claim panel for resolved markets */}
      {isOnChain && marketResolved && isConnected && !userClaimed && parseFloat(potentialPayout) > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-success/10 rounded-xl border border-success/30"
        >
          <p className="text-sm font-medium text-success mb-2">🎉 You won!</p>
          <p className="text-xs text-muted-foreground mb-3">
            Claimable: <span className="font-semibold text-success">${potentialPayout} USDC</span>
          </p>
          <Button
            variant="yes"
            size="sm"
            className="w-full"
            onClick={handleClaim}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Claim Winnings
          </Button>
        </motion.div>
      )}

      {isOnChain && marketResolved && (
        <div className="mb-4 p-3 bg-primary/5 rounded-xl text-center">
          <p className="text-sm font-medium">
            Market resolved:{' '}
            <span className={marketOutcomeYes ? 'text-success' : 'text-destructive'}>
              {marketOutcomeYes ? 'YES' : 'NO'}
            </span>
          </p>
        </div>
      )}

      {/* Trading UI — shown even for resolved markets (grayed out) */}
      {(!isOnChain || !marketResolved) && (
        <>
          {/* Tx status */}
          <StatusBadge status={txStatus} txHash={txHash} />

          {/* USDC balance */}
          {isConnected && isOnChain && (
            <p className="text-xs text-muted-foreground mb-3">
              Balance: <span className="font-semibold text-foreground">${parseFloat(usdcBalance).toFixed(2)} USDC</span>
            </p>
          )}

          {/* Outcome Selection */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              type="button"
              onClick={() => setSelectedOutcome('yes')}
              className={`relative p-4 rounded-xl border-2 transition-all duration-300 overflow-hidden group/yes ${
                selectedOutcome === 'yes'
                  ? 'border-success bg-success/10'
                  : 'border-border hover:border-success/50 hover:bg-success/5'
              }`}
              style={selectedOutcome === 'yes' ? {
                backdropFilter: 'blur(8px)',
                boxShadow: '0 0 24px -8px hsl(var(--success) / 0.3), inset 0 1px 0 0 hsl(var(--success) / 0.1)',
              } : { backdropFilter: 'blur(4px)' }}
            >
              {selectedOutcome !== 'yes' && (
                <div className="absolute inset-0 bg-gradient-to-br from-success/10 via-transparent to-success/5 opacity-0 group-hover/yes:opacity-100 transition-opacity duration-300" />
              )}
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUpRight className={`h-5 w-5 transition-all ${selectedOutcome === 'yes' ? 'text-success scale-110' : 'text-muted-foreground'}`} />
                  <span className={`font-semibold ${selectedOutcome === 'yes' ? 'text-success' : 'text-foreground'}`}>Yes</span>
                </div>
                <p className={`number-display text-2xl ${selectedOutcome === 'yes' ? 'text-success' : 'text-foreground'}`}>
                  {formatPercent(market.yesPrice)}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedOutcome('no')}
              className={`relative p-4 rounded-xl border-2 transition-all duration-300 overflow-hidden group/no ${
                selectedOutcome === 'no'
                  ? 'border-destructive bg-destructive/10'
                  : 'border-border hover:border-destructive/50 hover:bg-destructive/5'
              }`}
              style={selectedOutcome === 'no' ? {
                backdropFilter: 'blur(8px)',
                boxShadow: '0 0 24px -8px hsl(var(--destructive) / 0.3), inset 0 1px 0 0 hsl(var(--destructive) / 0.1)',
              } : { backdropFilter: 'blur(4px)' }}
            >
              {selectedOutcome !== 'no' && (
                <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 via-transparent to-destructive/5 opacity-0 group-hover/no:opacity-100 transition-opacity duration-300" />
              )}
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowDownRight className={`h-5 w-5 transition-all ${selectedOutcome === 'no' ? 'text-destructive scale-110' : 'text-muted-foreground'}`} />
                  <span className={`font-semibold ${selectedOutcome === 'no' ? 'text-destructive' : 'text-foreground'}`}>No</span>
                </div>
                <p className={`number-display text-2xl ${selectedOutcome === 'no' ? 'text-destructive' : 'text-foreground'}`}>
                  {formatPercent(market.noPrice)}
                </p>
              </div>
            </button>
          </div>

          {/* Amount Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Amount (USDC)
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                disabled={!isConnected || isSubmitting}
                min="0"
                step="0.01"
                className="w-full h-12 pl-8 pr-4 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed number-display text-lg transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--secondary) / 0.4), hsl(var(--secondary) / 0.25))',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid hsl(var(--border) / 0.5)',
                  boxShadow: '0 0 0 1px hsl(var(--foreground) / 0.03), 0 2px 8px -2px hsl(var(--background) / 0.5), inset 0 1px 0 0 hsl(var(--foreground) / 0.05)',
                }}
                onFocus={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.borderColor = 'hsl(var(--primary) / 0.5)';
                    e.target.style.boxShadow = '0 0 0 1px hsl(var(--primary) / 0.2), 0 4px 16px -4px hsl(var(--primary) / 0.2)';
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'hsl(var(--border) / 0.5)';
                  e.target.style.boxShadow = '0 0 0 1px hsl(var(--foreground) / 0.03), 0 2px 8px -2px hsl(var(--background) / 0.5), inset 0 1px 0 0 hsl(var(--foreground) / 0.05)';
                }}
              />
            </div>
            {isConnected && (
              <div className="flex gap-2 mt-2">
                {[10, 25, 50, 100].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(preset.toString())}
                    disabled={isSubmitting}
                    className="px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 relative overflow-hidden group/preset disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, hsl(var(--secondary) / 0.3), hsl(var(--secondary) / 0.15))',
                      backdropFilter: 'blur(4px)',
                      border: '1px solid hsl(var(--border) / 0.3)',
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 opacity-0 group-hover/preset:opacity-100 transition-opacity duration-200" />
                    <span className="relative z-10">${preset}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Trade Summary */}
          <AnimatePresence>
            {amount && parseFloat(amount) > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className="p-4 bg-secondary/30 rounded-xl space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Est. Shares</span>
                    <span className="number-display">{shares.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg. Price</span>
                    <span className="number-display">${currentPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-border/50">
                    <span className="text-muted-foreground">Potential Return</span>
                    <span className={`number-display font-semibold ${returnPercent > 0 ? 'text-success' : 'text-destructive'}`}>
                      +${potentialReturn.toFixed(2)} ({returnPercent.toFixed(0)}%)
                    </span>
                  </div>
                  {isOnChain && (
                    <p className="text-xs text-muted-foreground pt-1">
                      ⚡ Step 1: Approve USDC · Step 2: Confirm trade
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Button */}
          {isConnected ? (
            <Button
              variant={selectedOutcome === 'yes' ? 'yes' : 'no'}
              size="lg"
              className="w-full"
              onClick={handleTrade}
              disabled={!amount || parseFloat(amount) <= 0 || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {txStatus === 'approving' ? 'Approving…' : 'Confirming…'}
                </>
              ) : (
                <>Buy {selectedOutcome === 'yes' ? 'Yes' : 'No'}</>
              )}
            </Button>
          ) : (
            <Button variant="gradient" size="lg" className="w-full" onClick={connect}>
              Connect Wallet to Trade
            </Button>
          )}

          {/* User's existing position */}
          {isOnChain && isConnected && (parseFloat(userYesStake) > 0 || parseFloat(userNoStake) > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-secondary/20 rounded-xl"
            >
              <p className="text-xs text-muted-foreground mb-2 font-medium">Your Position</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {parseFloat(userYesStake) > 0 && (
                  <div>
                    <span className="text-muted-foreground text-xs">YES</span>
                    <p className="text-success font-semibold">${userYesStake}</p>
                  </div>
                )}
                {parseFloat(userNoStake) > 0 && (
                  <div>
                    <span className="text-muted-foreground text-xs">NO</span>
                    <p className="text-destructive font-semibold">${userNoStake}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Info */}
          <div className="flex items-start gap-2 mt-4 p-3 bg-primary/5 rounded-lg">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              {isOnChain
                ? 'Trades require 2 MetaMask confirmations: USDC approval, then the bet.'
                : `If this market resolves ${selectedOutcome === 'yes' ? 'YES' : 'NO'}, you'll receive $1 per share.`}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
