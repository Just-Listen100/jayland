import React from 'react';
import { 
  Zap, 
  Layers, 
  ShieldCheck, 
  Scale, 
  Lock, 
  TrendingUp, 
  Code2, 
  Terminal, 
  CheckCircle2,
  DollarSign
} from 'lucide-react';

export const StrategyGuide: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Institutional Sportsbook Strategy Architecture</h2>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              Quantitative risk management, mathematical leverage, dynamic NPV hedging, and row-level atomic ledger guarantees.
            </p>
          </div>
        </div>
      </div>

      {/* The 4 Core Strategies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strategy 1: Straight Bets */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-zinc-800 text-amber-400 font-black font-mono flex items-center justify-center text-xs">
              01
            </span>
            <h3 className="font-bold text-white text-base">Straight Bets (Single Wagers)</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            The foundation of sports betting. A single wager placed on an individual game market (moneyline, spread, or over/under). Lowest variance, clean exposure.
          </p>
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 font-mono text-[11px] text-zinc-300 space-y-1">
            <span className="text-amber-400 block font-bold">Execution:</span>
            <span>Payout = Stake × MarketOdds</span>
            <span className="text-zinc-500 block">Example: $100 on Celtics @ 1.62x = $162.00 Return</span>
          </div>
        </div>

        {/* Strategy 2: Multi-Leg Parlays */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-zinc-800 text-amber-400 font-black font-mono flex items-center justify-center text-xs">
              02
            </span>
            <h3 className="font-bold text-white text-base">Multi-Leg Parlays (Accumulators)</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Combine multiple independent selections into a single high-leverage slip. Odds multiply exponentially. All legs must hit for a victory payout.
          </p>
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 font-mono text-[11px] text-zinc-300 space-y-1">
            <span className="text-amber-400 block font-bold">Compounding Formula:</span>
            <span>TotalOdds = Odds₁ × Odds₂ × ... × Oddsₙ</span>
            <span className="text-zinc-500 block">Example: $50 × (1.62 × 2.45 × 1.48) = $293.71 Payout (5.87x multiplier)</span>
          </div>
        </div>

        {/* Strategy 3: Dynamic Auto-Cashout */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-zinc-800 text-amber-400 font-black font-mono flex items-center justify-center text-xs">
              03
            </span>
            <h3 className="font-bold text-white text-base">Dynamic Auto-Cashout (NPV Hedging)</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Settle active positions early before match conclusion. The engine continuously calculates the Net Present Value of the ticket relative to real-time live odds.
          </p>
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 font-mono text-[11px] text-zinc-300 space-y-1">
            <span className="text-emerald-400 block font-bold">Dynamic NPV Formula:</span>
            <span>Cashout = (PotentialPayout / LiveOdds) × (1 - 0.05 Margin)</span>
            <span className="text-zinc-500 block">Lock in positive returns when your team takes a commanding lead!</span>
          </div>
        </div>

        {/* Strategy 4: Kelly Criterion Staking */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-zinc-800 text-amber-400 font-black font-mono flex items-center justify-center text-xs">
              04
            </span>
            <h3 className="font-bold text-white text-base">Kelly Criterion Bankroll Management</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            A Nobel-grade formula designed to calculate the mathematically optimal percentage of bankroll to wager based on perceived edge while eliminating the risk of ruin.
          </p>
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 font-mono text-[11px] text-zinc-300 space-y-1">
            <span className="text-amber-400 block font-bold">Quarter-Kelly Equation:</span>
            <span>f* = [(b · p - q) / b] × 0.25</span>
            <span className="text-zinc-500 block">b = net odds, p = win probability, q = loss probability</span>
          </div>
        </div>
      </div>

      {/* 10x Architectural Superiority Matrix */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-white text-base">How PROP-X Eliminates Common Sportsbook Vulnerabilities</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
            <div className="flex items-center gap-1.5 text-rose-400 font-bold">
              <span>✕ Standard Vulnerability:</span>
            </div>
            <p className="text-zinc-400">
              Double-spending when two wagers arrive simultaneously over laggy mobile networks, allowing users to spend balance twice.
            </p>
            <div className="text-emerald-400 font-bold pt-1 border-t border-zinc-800/80">
              ✓ PROP-X Solution: Raw SQL SELECT FOR UPDATE locks the wallet row atomically before updating balance.
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
            <div className="flex items-center gap-1.5 text-rose-400 font-bold">
              <span>✕ Standard Vulnerability:</span>
            </div>
            <p className="text-zinc-400">
              Stale odds exploit where bettors execute orders on outdated cached lines before server adjusts.
            </p>
            <div className="text-emerald-400 font-bold pt-1 border-t border-zinc-800/80">
              ✓ PROP-X Solution: High-frequency WebSocket push ticks front-end state instantly with color flash indicators.
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
            <div className="flex items-center gap-1.5 text-rose-400 font-bold">
              <span>✕ Standard Vulnerability:</span>
            </div>
            <p className="text-zinc-400">
              API server crashes under heavy load during major events (Super Bowl, World Cup, NBA Finals).
            </p>
            <div className="text-emerald-400 font-bold pt-1 border-t border-zinc-800/80">
              ✓ PROP-X Solution: Decoupled Edge WebSocket cluster offloads connection pooling away from transaction routes.
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
            <div className="flex items-center gap-1.5 text-rose-400 font-bold">
              <span>✕ Standard Vulnerability:</span>
            </div>
            <p className="text-zinc-400">
              User hesitation, decision fatigue, and rapid bankroll depletion from emotional stakes.
            </p>
            <div className="text-emerald-400 font-bold pt-1 border-t border-zinc-800/80">
              ✓ PROP-X Solution: Integrated Quarter-Kelly staking calculator provides scientific staking suggestions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
