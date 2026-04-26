import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, TrendingUp, Clock, Percent } from 'lucide-react';
import { MarketCard, } from '@/components/MarketCard';
import { MarketCardSkeleton } from '@/components/SkeletonLoader';
import { mockMarkets, categories, type Market } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';

type SortOption = 'volume' | 'probability' | 'ending';

export default function MarketsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('volume');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const filteredMarkets = useMemo(() => {
    let markets = [...mockMarkets];

    // Filter by category
    if (selectedCategory !== 'All') {
      markets = markets.filter((m) => m.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery) {
      markets = markets.filter((m) =>
        m.question.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    switch (sortBy) {
      case 'volume':
        markets.sort((a, b) => b.volume - a.volume);
        break;
      case 'probability':
        markets.sort((a, b) => b.yesPrice - a.yesPrice);
        break;
      case 'ending':
        markets.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
        break;
    }

    return markets;
  }, [selectedCategory, sortBy, searchQuery]);

  const sortOptions = [
    { value: 'volume' as SortOption, label: 'Volume', icon: TrendingUp },
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
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Markets</h1>
          <p className="text-muted-foreground">Browse and trade on prediction markets</p>
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
                boxShadow: '0 0 0 1px hsl(var(--foreground) / 0.03), 0 4px 16px -4px hsl(var(--background) / 0.5), inset 0 1px 0 0 hsl(var(--foreground) / 0.05)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'hsl(var(--primary) / 0.5)';
                e.target.style.boxShadow = '0 0 0 1px hsl(var(--primary) / 0.2), 0 4px 20px -4px hsl(var(--primary) / 0.2), 0 0 40px -10px hsl(var(--primary) / 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'hsl(var(--border) / 0.5)';
                e.target.style.boxShadow = '0 0 0 1px hsl(var(--foreground) / 0.03), 0 4px 16px -4px hsl(var(--background) / 0.5), inset 0 1px 0 0 hsl(var(--foreground) / 0.05)';
              }}
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const isActive = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative overflow-hidden group/cat ${
                    isActive
                      ? 'text-primary-foreground shadow-lg shadow-primary/25 border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground border border-transparent hover:border-primary/20'
                  }`}
                  style={isActive ? {
                    background: 'linear-gradient(135deg, hsl(var(--primary) / 0.9), hsl(var(--primary) / 0.7))',
                  } : {
                    background: 'linear-gradient(135deg, hsl(var(--secondary) / 0.4), hsl(var(--secondary) / 0.25))',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  {!isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 opacity-0 group-hover/cat:opacity-100 transition-opacity duration-300" />
                  )}
                  <span className="relative z-10">{category}</span>
                </button>
              );
            })}
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 relative overflow-hidden group/sort ${
                      isActive
                        ? 'text-primary border border-primary/20'
                        : 'text-muted-foreground hover:text-foreground border border-transparent hover:border-primary/10'
                    }`}
                    style={{
                      background: isActive 
                        ? 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.08))'
                        : 'linear-gradient(135deg, hsl(var(--secondary) / 0.3), hsl(var(--secondary) / 0.15))',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    {!isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover/sort:opacity-100 transition-opacity duration-300" />
                    )}
                    <Icon className="h-3.5 w-3.5 relative z-10" />
                    <span className="relative z-10">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {filteredMarkets.length} market{filteredMarkets.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Markets Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <MarketCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredMarkets.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMarkets.map((market, index) => (
              <MarketCard key={market.id} market={market} index={index} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="glass-card inline-block p-8">
              <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No markets found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filters
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
