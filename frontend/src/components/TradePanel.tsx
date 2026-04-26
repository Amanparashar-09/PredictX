import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Info, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { Market, formatPercent } from '@/lib/mock-data';

interface TradePanelProps {
  market: Market;
}

export function TradePanel({ market }: TradePanelProps) {
  const { isConnected, connect } = useWallet();
  const [selectedOutcome, setSelectedOutcome] = useState<'yes' | 'no'>('yes');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentPrice = selectedOutcome === 'yes' ? market.yesPrice : market.noPrice;
  const shares = amount ? parseFloat(amount) / currentPrice : 0;
  const potentialReturn = shares * 1 - parseFloat(amount || '0');
  const returnPercent = amount ? (potentialReturn / parseFloat(amount)) * 100 : 0;

  const handleTrade = async () => {
    if (!amount) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsSubmitting(false);
    setAmount('');
  };

  return (
    <div className="glass-card p-5">
      <h3 className="text-lg font-semibold mb-4">Trade</h3>

      {/* Outcome Selection */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          onClick={() => setSelectedOutcome('yes')}
          className={`relative p-4 rounded-xl border-2 transition-all duration-300 overflow-hidden group/yes ${
            selectedOutcome === 'yes'
              ? 'border-success bg-success/10'
              : 'border-border hover:border-success/50 hover:bg-success/5'
          }`}
          style={selectedOutcome === 'yes' ? {
            backdropFilter: 'blur(8px)',
            boxShadow: '0 0 24px -8px hsl(var(--success) / 0.3), inset 0 1px 0 0 hsl(var(--success) / 0.1)',
          } : {
            backdropFilter: 'blur(4px)',
          }}
        >
          {selectedOutcome !== 'yes' && (
            <div className="absolute inset-0 bg-gradient-to-br from-success/10 via-transparent to-success/5 opacity-0 group-hover/yes:opacity-100 transition-opacity duration-300" />
          )}
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className={`h-5 w-5 transition-all ${
                selectedOutcome === 'yes' ? 'text-success scale-110' : 'text-muted-foreground'
              }`} />
              <span className={`font-semibold ${selectedOutcome === 'yes' ? 'text-success' : 'text-foreground'}`}>
                Yes
              </span>
            </div>
            <p className={`number-display text-2xl ${selectedOutcome === 'yes' ? 'text-success' : 'text-foreground'}`}>
              {formatPercent(market.yesPrice)}
            </p>
          </div>
        </button>

        <button
          onClick={() => setSelectedOutcome('no')}
          className={`relative p-4 rounded-xl border-2 transition-all duration-300 overflow-hidden group/no ${
            selectedOutcome === 'no'
              ? 'border-destructive bg-destructive/10'
              : 'border-border hover:border-destructive/50 hover:bg-destructive/5'
          }`}
          style={selectedOutcome === 'no' ? {
            backdropFilter: 'blur(8px)',
            boxShadow: '0 0 24px -8px hsl(var(--destructive) / 0.3), inset 0 1px 0 0 hsl(var(--destructive) / 0.1)',
          } : {
            backdropFilter: 'blur(4px)',
          }}
        >
          {selectedOutcome !== 'no' && (
            <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 via-transparent to-destructive/5 opacity-0 group-hover/no:opacity-100 transition-opacity duration-300" />
          )}
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownRight className={`h-5 w-5 transition-all ${
                selectedOutcome === 'no' ? 'text-destructive scale-110' : 'text-muted-foreground'
              }`} />
              <span className={`font-semibold ${selectedOutcome === 'no' ? 'text-destructive' : 'text-foreground'}`}>
                No
              </span>
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
            disabled={!isConnected}
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
                e.target.style.boxShadow = '0 0 0 1px hsl(var(--primary) / 0.2), 0 4px 16px -4px hsl(var(--primary) / 0.2), 0 0 30px -10px hsl(var(--primary) / 0.15)';
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
                className="px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 relative overflow-hidden group/preset"
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
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="h-5 w-5 border-2 border-current border-t-transparent rounded-full"
            />
          ) : (
            <>Buy {selectedOutcome === 'yes' ? 'Yes' : 'No'}</>
          )}
        </Button>
      ) : (
        <Button variant="gradient" size="lg" className="w-full" onClick={connect}>
          Connect Wallet to Trade
        </Button>
      )}

      {/* Info */}
      <div className="flex items-start gap-2 mt-4 p-3 bg-primary/5 rounded-lg">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          If this market resolves {selectedOutcome === 'yes' ? 'YES' : 'NO'}, you'll receive $1 per share. Max loss is your initial investment.
        </p>
      </div>
    </div>
  );
}
