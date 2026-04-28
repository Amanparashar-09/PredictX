import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Users, BarChart3, Zap, Shield, Globe, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/StatsCard';
import { useEffect, useState } from 'react';

interface ChainStats {
  trackedMarkets: number;
  contractsDeployed: boolean;
  blockNumber: number | null;
}

export default function LandingPage() {
  const [stats, setStats] = useState<ChainStats | null>(null);

  // Fetch live stats from backend health endpoint
  useEffect(() => {
    fetch('http://localhost:3001/health')
      .then((r) => r.json())
      .then((data) => setStats({
        trackedMarkets: data.trackedMarkets ?? 0,
        contractsDeployed: data.contractsDeployed ?? false,
        blockNumber: data.blockNumber ?? null,
      }))
      .catch(() => {}); // silently fail if backend not running
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"
               style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl animate-pulse"
               style={{ animationDuration: '5s', animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
               style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)' }} />
          <div className="absolute inset-0 opacity-[0.03]"
               style={{
                 backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
                 backgroundSize: '50px 50px',
               }} />
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
              }}
            >
              <Zap className="h-4 w-4" />
              <span>Fully On-Chain · MetaMask Native</span>
              {stats?.contractsDeployed && (
                <span className="ml-1 h-1.5 w-1.5 rounded-full bg-success animate-pulse inline-block" />
              )}
            </motion.div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="text-foreground">Trade on </span>
              <span className="gradient-primary-text">Real-World</span>
              <br />
              <span className="text-foreground">Outcomes</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-balance">
              Create and trade binary prediction markets on-chain. Every trade is a real MetaMask transaction — fully transparent, fully on-chain.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/markets">
                <Button variant="gradient" size="xl" className="group">
                  Explore Markets
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/create">
                <Button variant="glass" size="xl">
                  <PlusCircle className="h-5 w-5 mr-2" />
                  Create Market
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Stats */}
      <section className="section-spacing border-y border-border/50 bg-secondary/20">
        <div className="container-main">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatsCard
              label="Active Markets"
              value={stats ? stats.trackedMarkets.toString() : '—'}
              icon={Globe}
              delay={0}
            />
            <StatsCard
              label="Chain"
              value={stats?.contractsDeployed ? 'Deployed' : 'Not deployed'}
              icon={Shield}
              delay={0.1}
            />
            <StatsCard
              label="Block"
              value={stats?.blockNumber ? `#${stats.blockNumber.toLocaleString()}` : '—'}
              icon={BarChart3}
              delay={0.2}
            />
            <StatsCard
              label="Settlement"
              value="On-chain"
              icon={TrendingUp}
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* Features */}
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
              Built for traders who demand transparency, real settlements, and no custodians.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: 'Fully On-Chain',
                description: 'Every trade and settlement happens on-chain. No custody, no counterparty risk. Your funds, your keys.',
              },
              {
                icon: Zap,
                title: 'Oracle Resolution',
                description: 'Markets resolve via the SimpleOracle contract. Winnings are distributed proportionally to winning stakes.',
              },
              {
                icon: TrendingUp,
                title: 'Parimutuel Pools',
                description: 'Winning side splits the full pool. The more you stake, the larger your share of the payout.',
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
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-all duration-700" />
                <div className="relative">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-500">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-spacing">
        <div className="container-main">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4">How It Works</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Connect MetaMask', desc: 'Link your wallet. Import a Hardhat account or use any web3 wallet on the configured network.' },
              { step: '02', title: 'Trade YES or NO', desc: 'Stake USDC on your predicted outcome. Two MetaMask pops: approve USDC, then place bet.' },
              { step: '03', title: 'Claim Winnings', desc: 'After oracle resolution, winners claim their proportional share of the full pool directly on-chain.' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6"
              >
                <p className="text-4xl font-bold gradient-primary-text mb-4">{item.step}</p>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-spacing">
        <div className="container-main">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8 md:p-12 text-center relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/10 to-primary/20 opacity-60" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
            <div className="relative">
              <h2 className="text-2xl md:text-4xl font-bold mb-4">Ready to Trade?</h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                Connect your wallet and trade on fully on-chain prediction markets with real MetaMask transactions.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/markets">
                  <Button variant="gradient" size="xl" className="group/btn">
                    Explore Markets
                    <ArrowRight className="h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/create">
                  <Button variant="glass" size="xl">
                    Create Market
                  </Button>
                </Link>
              </div>
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
              © 2025 PredictX · Fully on-chain · No custody
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
