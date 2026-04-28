import { motion } from 'framer-motion';
import { Trophy, Medal, TrendingUp, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/mock-data';

function getRankIcon(rank: number) {
  switch (rank) {
    case 1: return <Trophy className="h-5 w-5 text-warning" />;
    case 2: return <Medal className="h-5 w-5 text-muted-foreground" />;
    case 3: return <Medal className="h-5 w-5 text-warning/80" />;
    default: return <span className="text-muted-foreground font-mono">#{rank}</span>;
  }
}

export default function LeaderboardPage() {
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
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Leaderboard</h1>
          <p className="text-muted-foreground">Top traders by on-chain performance</p>
        </motion.div>

        {/* Coming Soon state */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-card p-10 text-center"
        >
          <div className="h-20 w-20 rounded-full bg-primary/10 mx-auto mb-6 flex items-center justify-center">
            <Trophy className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-3">Leaderboard Coming Soon</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-4">
            The leaderboard will rank traders by realized P&amp;L from on-chain claimed winnings. 
            Data is indexed from <code className="bg-secondary/50 px-1 rounded">Claimed</code> events emitted by market contracts.
          </p>
          <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl max-w-md mx-auto text-left">
            <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Start trading on real markets and claim winnings — your on-chain activity will appear here once the indexer is live.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
