import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, TrendingUp, Users, Info, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProbabilityBar } from '@/components/ProbabilityBar';
import { TradePanel } from '@/components/TradePanel';
import { mockMarkets, formatCurrency, getDaysRemaining, formatPercent } from '@/lib/mock-data';

export default function MarketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const market = mockMarkets.find((m) => m.id === id);

  if (!market) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="container-main text-center py-16">
          <h1 className="text-2xl font-bold mb-4">Market Not Found</h1>
          <p className="text-muted-foreground mb-6">The market you're looking for doesn't exist.</p>
          <Link to="/markets">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Markets
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining(market.endDate);

  // Mock chart data points
  const chartPoints = Array.from({ length: 30 }, (_, i) => ({
    x: i,
    y: 0.3 + Math.random() * 0.4 + (i / 30) * 0.1,
  }));

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container-main">
        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link
            to="/markets"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Markets
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="category-badge">{market.category}</span>
                <span className="status-live">Live</span>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold mb-6">{market.question}</h1>

              {/* Large Probability Display */}
              <div className="mb-6">
                <ProbabilityBar yesPrice={market.yesPrice} size="lg" showLabels />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-secondary/30 rounded-xl">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <TrendingUp className="h-4 w-4" />
                    Volume
                  </div>
                  <p className="number-display text-lg">{formatCurrency(market.volume)}</p>
                </div>
                <div className="p-4 bg-secondary/30 rounded-xl">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Users className="h-4 w-4" />
                    Liquidity
                  </div>
                  <p className="number-display text-lg">{formatCurrency(market.liquidity)}</p>
                </div>
                <div className="p-4 bg-secondary/30 rounded-xl">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Clock className="h-4 w-4" />
                    Ends In
                  </div>
                  <p className="number-display text-lg">{daysRemaining} days</p>
                </div>
                <div className="p-4 bg-secondary/30 rounded-xl">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    End Date
                  </div>
                  <p className="number-display text-lg">
                    {new Date(market.endDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Price Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="glass-card p-6"
            >
              <h3 className="text-lg font-semibold mb-4">Price History</h3>
              <div className="h-48 relative">
                {/* Simple SVG Chart */}
                <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Area fill */}
                  <path
                    d={`M 0 100 ${chartPoints.map((p) => `L ${p.x * 10} ${100 - p.y * 100}`).join(' ')} L 290 100 Z`}
                    fill="url(#chartGradient)"
                  />
                  {/* Line */}
                  <path
                    d={`M ${chartPoints.map((p) => `${p.x * 10} ${100 - p.y * 100}`).join(' L ')}`}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                  />
                </svg>
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground">
                  <span>100%</span>
                  <span>50%</span>
                  <span>0%</span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>30 days ago</span>
                <span>Today</span>
              </div>
            </motion.div>

            {/* Resolution Rules */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Info className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Resolution Rules</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">{market.resolution}</p>
              <div className="mt-4 pt-4 border-t border-border/50">
                <button className="flex items-center gap-2 text-sm text-primary hover:underline">
                  View on-chain details
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </div>

          {/* Trade Panel Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:sticky lg:top-24 self-start"
          >
            <TradePanel market={market} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
