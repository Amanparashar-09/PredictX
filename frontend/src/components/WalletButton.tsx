import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';

export function WalletButton() {
  const { isConnected, address, balance, usdcBalance, chainId, connect, disconnect, isConnecting } = useWallet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : '';

  // balance is a string from formatEther — parse before calling toFixed
  const ethBalance = parseFloat(balance || '0').toFixed(4);
  const usdcDisplay = parseFloat(usdcBalance || '0').toFixed(2);

  const isLocalnet = chainId === 31337;

  async function copyAddress() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function openExplorer() {
    if (!address) return;
    const base = isLocalnet
      ? `http://localhost:8080` // no real explorer for local
      : `https://sepolia.etherscan.io/address/${address}`;
    if (!isLocalnet) window.open(base, '_blank');
  }

  if (!isConnected) {
    return (
      <Button
        variant="wallet"
        onClick={connect}
        disabled={isConnecting}
        className="min-w-[160px]"
      >
        {isConnecting ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Wallet className="h-4 w-4" />
          </motion.div>
        ) : (
          <Wallet className="h-4 w-4" />
        )}
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="glass"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="min-w-[180px] justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="font-mono text-sm">{shortAddress}</span>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </Button>

      <AnimatePresence>
        {isDropdownOpen && (
          <>
            {/* Click-away backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsDropdownOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 w-64 glass-card p-2"
            >
              {/* Balances */}
              <div className="p-3 border-b border-border/50 space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">ETH Balance</p>
                  <p className="number-display text-base font-semibold">{ethBalance} ETH</p>
                </div>
                {parseFloat(usdcDisplay) > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">USDC Balance</p>
                    <p className="number-display text-base font-semibold text-success">${usdcDisplay} USDC</p>
                  </div>
                )}
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-success" />
                  <p className="text-xs text-muted-foreground font-mono truncate">{address}</p>
                </div>
                {isLocalnet && (
                  <p className="text-xs text-amber-400">⚠ Local network (Chain {chainId})</p>
                )}
              </div>

              {/* Actions */}
              <div className="p-1 space-y-1 mt-1">
                <button
                  onClick={copyAddress}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? 'Copied!' : 'Copy Address'}
                </button>

                {!isLocalnet && (
                  <button
                    onClick={openExplorer}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on Etherscan
                  </button>
                )}

                <button
                  onClick={() => {
                    disconnect();
                    setIsDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Disconnect
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
