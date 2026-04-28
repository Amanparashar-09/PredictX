import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, TrendingUp, Clock, Percent, PlusCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MarketCard } from '@/components/MarketCard';
import { MarketCardSkeleton } from '@/components/SkeletonLoader';
import { CATEGORIES, fetchMarkets, type Market } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';

type SortOption = 'volume' | 'probability' | 'ending';

export default function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('volume');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRefresh, setLastRefresh] = useState<number>(0);

  // Load markets from backend/chain
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // On explicit refresh (lastRefresh changed by button), do a full chain rescan
    const url = lastRefresh > 0
      ? `http://localhost:3001/api/markets/sync`
      : `http://localhost:3001/api/markets`;

    // fetchMarkets from mock-data uses the /api/markets endpoint, 
    // but for refresh we hit /sync directly then fetch the updated list
    const doFetch = async () => {
      if (lastRefresh > 0) {
        // Force backend to rescan all blocks, then get the full list
        await fetch(`http://localhost:3001/api/markets/sync`);
      }
      const data = await fetchMarkets();
      if (!cancelled) { setMarkets(data); setLoading(false); }
    };

    doFetch().catch((err) => {
      if (!cancelled) { setError(err.message); setLoading(false); }
    });

    return () => { cancelled = true; };
  }, [lastRefresh]);

  const filteredMarkets = useMemo(() => {
    let list = [...markets];
    if (selectedCategory !== 'All') {
      list = list.filter((m) => m.category === selectedCategory);
    }
    if (searchQuery) {
      list = list.filter((m) =>
        m.question.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    switch (sortBy) {
      case 'volume':      list.sort((a, b) => b.volume - a.volume); break;
      case 'probability': list.sort((a, b) => b.yesPrice - a.yesPrice); break;
      case 'ending':      list.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()); break;
    }
    return list;
  }, [markets, selectedCategory, sortBy, searchQuery]);

  const sortOptions = [
    { value: 'volume' as SortOption, label: 'Volume',      icon: TrendingUp },
    { value: 'probability' as SortOption, label: 'Probability', icon: Percent },
    { value: 'ending' as SortOption, label: 'Ending Soon', icon: Clock },
  ];

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
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Markets</h1>
            <p className="text-muted-foreground">Live on-chain prediction markets</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLastRefresh(Date.now())}
              disabled={loading}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link to="/create">
              <Button variant="gradient" size="sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-4 mb-8"
        >
          {/* Search Bar */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--secondary) / 0.4), hsl(var(--secondary) / 0.25))',
                backdropFilter: 'blur(12px)',
                border: '1px solid hsl(var(--border) / 0.5)',
                boxShadow: '0 0 0 1px hsl(var(--foreground) / 0.03), 0 4px 16px -4px hsl(var(--background) / 0.5)',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'hsl(var(--primary) / 0.5)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'hsl(var(--border) / 0.5)'; }}
            />
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground mr-2">Sort by:</span>
            <div className="flex gap-2">
              {sortOptions.map((option) => {
                const Icon = option.icon;
                const isActive = sortBy === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 border ${
                      isActive
                        ? 'text-primary border-primary/20'
                        : 'text-muted-foreground hover:text-foreground border-transparent hover:border-primary/10'
                    }`}
                    style={{
                      background: isActive
                        ? 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.08))'
                        : 'linear-gradient(135deg, hsl(var(--secondary) / 0.3), hsl(var(--secondary) / 0.15))',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-3 p-4 mb-6 bg-destructive/10 border border-destructive/20 rounded-xl"
          >
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Could not load markets</p>
              <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Make sure the backend is running on <code className="bg-secondary/50 px-1 rounded">http://localhost:3001</code>
              </p>
            </div>
          </motion.div>
        )}

        {/* Results count */}
        {!loading && !error && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              {filteredMarkets.length} market{filteredMarkets.length !== 1 ? 's' : ''} found
              <span className="ml-2 text-xs text-primary">● Live on-chain</span>
            </p>
          </div>
        )}

        {/* Markets Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <MarketCardSkeleton key={i} />)}
          </div>
        ) : filteredMarkets.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMarkets.map((market, index) => (
              <MarketCard key={market.id} market={market} index={index} />
            ))}
          </div>
        ) : !error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="glass-card inline-block p-10">
              <div className="h-16 w-16 rounded-full bg-primary/10 mx-auto mb-5 flex items-center justify-center">
                <PlusCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No markets yet</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? 'No markets match your search.' : 'Be the first to create a prediction market!'}
              </p>
              {!searchQuery && (
                <Link to="/create">
                  <Button variant="gradient">
                    Create First Market
                    <PlusCircle className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              )}
              {searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              )}
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
