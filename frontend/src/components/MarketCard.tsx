import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, TrendingUp } from 'lucide-react';
import { Market, formatCurrency, getDaysRemaining, formatPercent } from '@/lib/mock-data';
import { ProbabilityBar } from './ProbabilityBar';

interface MarketCardProps {
  market: Market;
  index?: number;
}

export function MarketCard({ market, index = 0 }: MarketCardProps) {
  const daysRemaining = getDaysRemaining(market.endDate);
  const yesPercent = Math.round(market.yesPrice * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link to={`/market/${market.id}`} className="block group">
        <div className="glass-card-hover p-5 h-full relative overflow-hidden">
          {/* Enhanced background glow layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-all duration-700" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-60 transition-all duration-700 transform group-hover:scale-150" />
          
          {/* Shimmer effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] bg-gradient-to-r from-transparent via-white/3 to-transparent transition-transform duration-1000" />
          </div>
          
          <div className="relative">
            {/* Category & Status */}
            <div className="flex items-center justify-between mb-3">
              <span className="category-badge group-hover:border-primary/40 group-hover:bg-primary/15 transition-all duration-300">{market.category}</span>
              <span className="status-live">Live</span>
            </div>

            {/* Question */}
            <h3 className="text-base font-semibold text-foreground mb-4 line-clamp-2 leading-snug group-hover:text-primary/90 transition-colors duration-300">
              {market.question}
            </h3>

            {/* Probability Bar */}
            <div className="mb-4">
              <ProbabilityBar yesPrice={market.yesPrice} showLabels />
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-success/5 border border-success/10 rounded-lg p-3 text-center group-hover:bg-success/10 group-hover:border-success/20 group-hover:shadow-lg group-hover:shadow-success/10 transition-all duration-300">
                <p className="text-xs text-muted-foreground mb-1">Yes</p>
                <p className="number-display text-success text-lg">
                  {formatPercent(market.yesPrice)}
                </p>
              </div>
              <div className="bg-destructive/5 border border-destructive/10 rounded-lg p-3 text-center group-hover:bg-destructive/10 group-hover:border-destructive/20 group-hover:shadow-lg group-hover:shadow-destructive/10 transition-all duration-300">
                <p className="text-xs text-muted-foreground mb-1">No</p>
                <p className="number-display text-destructive text-lg">
                  {formatPercent(market.noPrice)}
                </p>
              </div>
            </div>

            {/* Footer Stats */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50 group-hover:border-border/80 transition-colors duration-300">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 group-hover:text-primary transition-colors duration-300" />
                <span className="font-medium">{formatCurrency(market.volume)}</span>
                <span>Vol</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{daysRemaining}d left</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
