import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle, Calendar, HelpCircle, Loader2, CheckCircle,
  AlertCircle, ExternalLink, ArrowRight, Wallet, Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { getFactoryContract, isDeployed, ADDRESSES } from '@/lib/contracts';
import { useToast } from '@/hooks/use-toast';

// Suggested question templates
const TEMPLATES = [
  { category: 'Crypto',      text: 'Will Bitcoin exceed $150,000 by end of 2025?' },
  { category: 'Technology',  text: 'Will GPT-5 be publicly released before July 2025?' },
  { category: 'Economics',   text: 'Will the Fed cut rates at least twice in Q3 2025?' },
  { category: 'Sports',      text: 'Will [Team] win the 2025 championship?' },
  { category: 'Politics',    text: 'Will [Candidate] win the 2025 election?' },
];

// Duration presets in seconds
const DURATION_PRESETS = [
  { label: '1 Day',   seconds: 86400 },
  { label: '3 Days',  seconds: 86400 * 3 },
  { label: '1 Week',  seconds: 86400 * 7 },
  { label: '2 Weeks', seconds: 86400 * 14 },
  { label: '1 Month', seconds: 86400 * 30 },
  { label: '3 Months',seconds: 86400 * 90 },
];

const MAX_QUESTION_LENGTH = 200;

type TxState = 'idle' | 'pending' | 'confirmed' | 'error';

export default function CreatePredictionPage() {
  const navigate = useNavigate();
  const { isConnected, connect, signer } = useWallet();
  const { toast } = useToast();

  const [question, setQuestion] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [customDate, setCustomDate] = useState('');
  const [useCustomDate, setUseCustomDate] = useState(false);

  const [txState, setTxState] = useState<TxState>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [createdMarketAddress, setCreatedMarketAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const contractsDeployed = isDeployed();
  const charsLeft = MAX_QUESTION_LENGTH - question.length;
  const isOverLimit = charsLeft < 0;

  // Compute expiry timestamp
  function getExpiryTimestamp(): number | null {
    if (useCustomDate && customDate) {
      const ts = Math.floor(new Date(customDate).getTime() / 1000);
      return ts > Math.floor(Date.now() / 1000) ? ts : null;
    }
    if (selectedDuration) {
      return Math.floor(Date.now() / 1000) + selectedDuration;
    }
    return null;
  }

  const expiry = getExpiryTimestamp();
  const isFormValid = question.trim().length >= 10 && !isOverLimit && !!expiry;

  const handleCreate = useCallback(async () => {
    if (!signer || !expiry || !isFormValid) return;
    setError(null);
    setTxState('pending');

    try {
      const factory = getFactoryContract(signer);
      const tx = await factory.createMarket(expiry, question.trim());
      setTxHash(tx.hash);

      const receipt = await tx.wait();

      // Extract market address from event
      const event = receipt?.logs?.find((log: any) => {
        try { return log.fragment?.name === 'MarketCreated'; } catch { return false; }
      }) as any;

      const marketAddr: string | undefined = event?.args?.market;
      setCreatedMarketAddress(marketAddr || null);

      // Immediately register with the backend so it shows in /markets without waiting for poll
      if (marketAddr) {
        try {
          await fetch('http://localhost:3001/api/markets/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: marketAddr }),
          });
        } catch {
          // non-critical — backend will pick it up on next 30s poll anyway
        }
      }

      setTxState('confirmed');

      toast({
        title: 'Market created!',
        description: `"${question.trim().slice(0, 60)}…"`,
      });
    } catch (err: any) {
      setTxState('error');
      const msg = err?.reason || err?.shortMessage || err?.message || 'Transaction failed';
      setError(msg);
      toast({ title: 'Failed to create market', description: msg, variant: 'destructive' });
    }
  }, [signer, expiry, question, isFormValid, toast]);

  // ─── Confirmed state ─────────────────────────────────────────────────────────
  if (txState === 'confirmed' && createdMarketAddress) {
    // Redirect directly to markets page
    navigate('/markets');
    return null;
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container-main max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <PlusCircle className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Create Prediction</h1>
          </div>
          <p className="text-muted-foreground">
            Deploy a new prediction market on-chain. Anyone can trade YES or NO until the expiry.
          </p>
        </motion.div>

        {/* Not connected */}
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 text-center mb-6"
          >
            <Wallet className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connect Wallet First</h2>
            <p className="text-muted-foreground mb-4">
              You need MetaMask connected to create an on-chain market.
            </p>
            <Button variant="gradient" onClick={connect}>
              Connect Wallet
            </Button>
          </motion.div>
        )}

        {/* Contracts not deployed warning */}
        {isConnected && !contractsDeployed && (
          <div className="flex items-start gap-3 p-4 mb-6 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-400">Contracts not deployed</p>
              <p className="text-xs text-muted-foreground mt-1">
                Run <code className="bg-secondary/50 px-1 rounded">npx hardhat run scripts/deploy.ts --network localhost</code> first.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Question */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Market Question</h2>
            </div>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Will Bitcoin exceed $150,000 by end of 2025?"
              rows={3}
              disabled={!isConnected || txState === 'pending'}
              className="w-full p-4 rounded-xl resize-none text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--secondary) / 0.4), hsl(var(--secondary) / 0.25))',
                backdropFilter: 'blur(8px)',
                border: `1px solid ${isOverLimit ? 'hsl(var(--destructive) / 0.5)' : 'hsl(var(--border) / 0.5)'}`,
              }}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                Min 10 characters · Must be a YES/NO question
              </p>
              <p className={`text-xs font-mono ${isOverLimit ? 'text-destructive' : charsLeft < 30 ? 'text-amber-400' : 'text-muted-foreground'}`}>
                {charsLeft} left
              </p>
            </div>

            {/* Templates */}
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                <p className="text-xs text-muted-foreground">Suggestions</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.text}
                    onClick={() => setQuestion(t.text)}
                    disabled={!isConnected}
                    className="text-xs px-3 py-1.5 rounded-lg border border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all duration-200 disabled:opacity-50"
                    style={{ background: 'hsl(var(--secondary) / 0.3)' }}
                  >
                    {t.category}: {t.text.slice(0, 35)}…
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Expiry */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Market Expiry</h2>
            </div>

            {/* Toggle between preset and custom */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setUseCustomDate(false)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${!useCustomDate ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground border border-border/40'}`}
                style={{ background: !useCustomDate ? undefined : 'hsl(var(--secondary) / 0.3)' }}
              >
                Quick Select
              </button>
              <button
                onClick={() => setUseCustomDate(true)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${useCustomDate ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground border border-border/40'}`}
                style={{ background: useCustomDate ? undefined : 'hsl(var(--secondary) / 0.3)' }}
              >
                Custom Date
              </button>
            </div>

            <AnimatePresence mode="wait">
              {!useCustomDate ? (
                <motion.div
                  key="presets"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="grid grid-cols-3 gap-2"
                >
                  {DURATION_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setSelectedDuration(p.seconds)}
                      disabled={!isConnected}
                      className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 border ${
                        selectedDuration === p.seconds
                          ? 'border-primary bg-primary/15 text-primary'
                          : 'border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/30'
                      } disabled:opacity-50`}
                      style={{ background: selectedDuration === p.seconds ? undefined : 'hsl(var(--secondary) / 0.3)' }}
                    >
                      {p.label}
                    </button>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="custom"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <input
                    type="datetime-local"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                    disabled={!isConnected}
                    className="w-full h-11 px-4 rounded-xl text-foreground focus:outline-none disabled:opacity-50 transition-all"
                    style={{
                      background: 'hsl(var(--secondary) / 0.4)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid hsl(var(--border) / 0.5)',
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Expiry preview */}
            {expiry && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 text-xs text-muted-foreground"
              >
                Expires:{' '}
                <span className="text-foreground font-medium">
                  {new Date(expiry * 1000).toLocaleString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric',
                    year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </motion.p>
            )}
          </div>

          {/* Summary */}
          <AnimatePresence>
            {isFormValid && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="glass-card p-5 border border-primary/20">
                  <p className="text-sm font-medium mb-3 text-primary">Preview</p>
                  <p className="text-sm text-foreground mb-2 leading-relaxed">"{question}"</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Oracle: <span className="font-mono">{ADDRESSES.oracle.slice(0, 10)}…</span></span>
                    <span>Factory: <span className="font-mono">{ADDRESSES.factory.slice(0, 10)}…</span></span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {txState === 'error' && error && (
            <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Transaction failed</p>
                <p className="text-xs text-muted-foreground mt-1 break-all">{error}</p>
              </div>
            </div>
          )}

          {/* Submit */}
          <Button
            variant="gradient"
            size="lg"
            className="w-full"
            disabled={!isConnected || !isFormValid || !contractsDeployed || txState === 'pending'}
            onClick={handleCreate}
          >
            {txState === 'pending' ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Deploying Market…
              </>
            ) : (
              <>
                <PlusCircle className="h-5 w-5 mr-2" />
                Create Market
              </>
            )}
          </Button>

          {txState === 'pending' && (
            <p className="text-center text-xs text-muted-foreground animate-pulse">
              Confirm the transaction in MetaMask…
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
