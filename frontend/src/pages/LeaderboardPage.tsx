import { motion } from 'framer-motion';
import { Trophy, Medal, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/mock-data';

// Mock leaderboard data
const leaderboardData = [
  { rank: 1, address: '0x1234...5678', pnl: 125430, winRate: 68, trades: 847 },
  { rank: 2, address: '0xabcd...efgh', pnl: 98200, winRate: 72, trades: 523 },
  { rank: 3, address: '0x9876...4321', pnl: 87650, winRate: 65, trades: 691 },
  { rank: 4, address: '0xfedc...ba98', pnl: 76420, winRate: 61, trades: 445 },
  { rank: 5, address: '0x5555...aaaa', pnl: 65800, winRate: 58, trades: 378 },
  { rank: 6, address: '0x7777...bbbb', pnl: 54230, winRate: 63, trades: 512 },
  { rank: 7, address: '0x8888...cccc', pnl: 48900, winRate: 55, trades: 289 },
  { rank: 8, address: '0x9999...dddd', pnl: 42150, winRate: 59, trades: 334 },
  { rank: 9, address: '0xaaaa...eeee', pnl: 38700, winRate: 52, trades: 267 },
  { rank: 10, address: '0xbbbb...ffff', pnl: 35200, winRate: 56, trades: 198 },
];

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Trophy className="h-5 w-5 text-warning" />;
    case 2:
      return <Medal className="h-5 w-5 text-muted-foreground" />;
    case 3:
      return <Medal className="h-5 w-5 text-warning/80" />;
    default:
      return <span className="text-muted-foreground font-mono">#{rank}</span>;
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
          <p className="text-muted-foreground">Top traders by profit</p>
        </motion.div>

        {/* Top 3 Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid md:grid-cols-3 gap-4 mb-8"
        >
          {leaderboardData.slice(0, 3).map((trader, index) => (
            <div
              key={trader.rank}
              className={`glass-card p-6 relative overflow-hidden ${
                index === 0 ? 'md:order-2 ring-2 ring-warning/30' : ''
              } ${index === 1 ? 'md:order-1' : ''} ${index === 2 ? 'md:order-3' : ''}`}
            >
              {index === 0 && (
                <div className="absolute inset-0 bg-gradient-to-br from-warning/10 to-transparent" />
              )}
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                    {getRankIcon(trader.rank)}
                  </div>
                  <span className="text-sm text-muted-foreground">Rank #{trader.rank}</span>
                </div>
                <p className="font-mono text-foreground mb-2">{trader.address}</p>
                <p className="number-xl text-success">+{formatCurrency(trader.pnl)}</p>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50 text-sm text-muted-foreground">
                  <span>{trader.winRate}% Win Rate</span>
                  <span>{trader.trades} Trades</span>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Full Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-sm font-medium text-muted-foreground p-4">Rank</th>
                  <th className="text-left text-sm font-medium text-muted-foreground p-4">Trader</th>
                  <th className="text-right text-sm font-medium text-muted-foreground p-4">
                    <div className="flex items-center justify-end gap-1">
                      <TrendingUp className="h-4 w-4" />
                      Total P&L
                    </div>
                  </th>
                  <th className="text-right text-sm font-medium text-muted-foreground p-4">Win Rate</th>
                  <th className="text-right text-sm font-medium text-muted-foreground p-4">Trades</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.map((trader, index) => (
                  <motion.tr
                    key={trader.rank}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    className="border-b border-border/30 last:border-0 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center justify-center w-8">
                        {getRankIcon(trader.rank)}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-foreground">{trader.address}</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="number-display text-success font-semibold">
                        +{formatCurrency(trader.pnl)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="number-display">{trader.winRate}%</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="number-display text-muted-foreground">{trader.trades}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
