import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Users, BarChart3, Zap, Shield, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/StatsCard';
import { MarketCard } from '@/components/MarketCard';
import { mockMarkets, mockStats, formatCurrency, formatNumber } from '@/lib/mock-data';

const featuredMarkets = mockMarkets.slice(0, 3);

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Enhanced Background Effects with Glass Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Animated glass orbs with blur */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" 
               style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl animate-pulse" 
               style={{ animationDuration: '5s', animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full" 
               style={{
                 background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)',
               }} />
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]" 
               style={{
                 backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
                 backgroundSize: '50px 50px',
               }} />
          
          {/* Radial gradient overlay */}
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-background/50 to-background" />
        </div>

        <div className="container-main relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-primary text-sm font-medium mb-6 relative group/badge overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.08))',
                border: '1px solid hsl(var(--primary) / 0.3)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 0 0 1px hsl(var(--primary) / 0.1), 0 4px 16px -4px hsl(var(--primary) / 0.2), inset 0 1px 0 0 hsl(var(--foreground) / 0.1)',
              }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 opacity-0 group-hover/badge:opacity-100 transition-opacity duration-700">
                <div className="absolute inset-0 translate-x-[-100%] group-hover/badge:translate-x-[100%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000" />
              </div>
              <Zap className="h-4 w-4 relative z-10" />
              <span className="relative z-10">Decentralized Prediction Markets</span>
            </motion.div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="text-foreground">Trade on </span>
              <span className="gradient-primary-text">Real-World</span>
              <br />
              <span className="text-foreground">Outcomes</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-balance">
              The most liquid prediction market protocol. Trade on politics, crypto, sports, and more with transparent, on-chain settlement.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/markets">
                <Button variant="gradient" size="xl" className="group">
                  Explore Markets
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/portfolio">
                <Button variant="glass" size="xl">
                  View Portfolio
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-spacing border-y border-border/50 bg-secondary/20">
        <div className="container-main">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatsCard
              label="Total Volume"
              value={formatCurrency(mockStats.totalVolume)}
              icon={TrendingUp}
              delay={0}
            />
            <StatsCard
              label="Active Traders"
              value={formatNumber(mockStats.activeTraders)}
              icon={Users}
              delay={0.1}
            />
            <StatsCard
              label="Weekly Volume"
              value={formatCurrency(mockStats.weeklyVolume)}
              icon={BarChart3}
              delay={0.2}
            />
            <StatsCard
              label="Active Markets"
              value={mockStats.activeMarkets.toString()}
              icon={Globe}
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* Featured Markets */}
      <section className="section-spacing">
        <div className="container-main">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Trending Markets</h2>
              <p className="text-muted-foreground">Most active markets by volume</p>
            </div>
            <Link to="/markets">
              <Button variant="outline" className="hidden sm:flex">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredMarkets.map((market, index) => (
              <MarketCard key={market.id} market={market} index={index} />
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link to="/markets">
              <Button variant="outline" className="w-full">
                View All Markets
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-spacing border-t border-border/50 bg-secondary/10">
        <div className="container-main">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Why PredictX?</h2>
            <p className="text-muted-foreground">
              Built for traders who demand transparency, liquidity, and security.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: 'Fully On-Chain',
                description: 'All trades and settlements happen on-chain with complete transparency. No custody, no counterparty risk.',
              },
              {
                icon: Zap,
                title: 'Instant Settlement',
                description: 'Markets resolve automatically based on oracle data. Winnings are distributed immediately.',
              },
              {
                icon: TrendingUp,
                title: 'Deep Liquidity',
                description: 'Automated market makers ensure tight spreads and minimal slippage even for large trades.',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-card p-6 text-center group cursor-pointer relative overflow-hidden"
              >
                {/* Enhanced background effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-all duration-700" />
                <div className="absolute -inset-[2px] bg-gradient-to-r from-primary/20 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 rounded-xl blur-md transition-all duration-700" />
                
                <div className="relative">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/20 group-hover:shadow-xl group-hover:shadow-primary/20 group-hover:scale-110 transition-all duration-500">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary/90 transition-colors duration-300">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-spacing">
        <div className="container-main">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="glass-card p-8 md:p-12 text-center relative overflow-hidden group"
          >
            {/* Enhanced background gradients and glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/10 to-primary/20 opacity-60" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
            <div className="absolute -inset-[3px] bg-gradient-to-r from-primary/30 via-purple-500/20 to-primary/30 rounded-xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="relative">
              <h2 className="text-2xl md:text-4xl font-bold mb-4">Ready to Start Trading?</h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                Connect your wallet and start trading on the world's most liquid prediction markets.
              </p>
              <Link to="/markets">
                <Button variant="gradient" size="xl" className="group/btn">
                  Get Started
                  <ArrowRight className="h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container-main">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold">
                <span className="gradient-primary-text">Predict</span>
                <span className="text-foreground">X</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 PredictX. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
