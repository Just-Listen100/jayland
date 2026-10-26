import React, { useState } from 'react';
import { BlackjackGame } from './BlackjackGame';
import { RouletteGame } from './RouletteGame';
import { SlotMachineGame } from './SlotMachineGame';
import { CrashGame } from './CrashGame';
import { BaccaratGame } from './BaccaratGame';
import { VideoPokerGame } from './VideoPokerGame';
import { 
  Trophy, 
  Flame, 
  Disc, 
  Rocket, 
  Sparkles, 
  ShieldCheck, 
  Coins, 
  Layers,
  ArrowRight,
  Crown,
  Play
} from 'lucide-react';

export const CasinoLobby: React.FC = () => {
  const [activeCasinoGame, setActiveCasinoGame] = useState<'lobby' | 'roulette' | 'slots' | 'blackjack' | 'baccarat' | 'videopoker' | 'crash'>('roulette');

  const gamesList = [
    {
      id: 'roulette' as const,
      title: 'Live European Roulette',
      tagline: 'Single Zero 2.7% Edge · 35:1 Payouts',
      icon: <Disc className="w-6 h-6 text-rose-400" />,
      badge: 'LIVE WHEEL',
      color: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
    },
    {
      id: 'slots' as const,
      title: 'Mega 777 Apex Video Slots',
      tagline: '$2.48M Progressive Jackpot · 5 Reels',
      icon: <Flame className="w-6 h-6 text-amber-400" />,
      badge: 'JACKPOT 50X',
      color: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    },
    {
      id: 'blackjack' as const,
      title: 'Vegas VIP Blackjack 21',
      tagline: 'Classic Table · Pays 3:2 · Double Down',
      icon: <Trophy className="w-6 h-6 text-emerald-400" />,
      badge: 'VIP TABLE',
      color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    },
    {
      id: 'baccarat' as const,
      title: 'Macau Live Baccarat',
      tagline: 'Punto Banco · Natural 8/9 · 8:1 Tie',
      icon: <Crown className="w-6 h-6 text-purple-400" />,
      badge: 'HIGH ROLLER',
      color: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
    },
    {
      id: 'videopoker' as const,
      title: 'Jacks or Better Video Poker',
      tagline: '9/6 Full Pay · 800x Royal Flush',
      icon: <Coins className="w-6 h-6 text-blue-400" />,
      badge: '800X PAY',
      color: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    },
    {
      id: 'crash' as const,
      title: 'High-Roller Rocket Crash',
      tagline: '100x Multiplier Curve · Instant Cashout',
      icon: <Rocket className="w-6 h-6 text-amber-400" />,
      badge: 'MULTIPLAYER',
      color: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Bovada 10x VIP Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400">
                <Sparkles className="w-5 h-5" />
              </span>
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                10X BOVADA CASINO &amp; LIVE TABLES
              </span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1">
              Institutional Gaming &amp; High-Roller Casino
            </h2>
            <p className="text-xs text-zinc-400 font-mono mt-1 max-w-2xl">
              Zero-latency provably fair table games, real-time physics roulette, progressive 777 jackpots, and exponential rocket multipliers.
            </p>
          </div>

          {/* Hot Drop Jackpots countdown banner */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-center font-mono">
              <span className="text-[10px] text-zinc-500 block uppercase">HOURLY DROP</span>
              <span className="text-sm font-black text-amber-400">$1,420.50</span>
              <span className="text-[9px] text-emerald-400 block">Must drop in 14m</span>
            </div>

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-center font-mono">
              <span className="text-[10px] text-zinc-500 block uppercase">DAILY DROP</span>
              <span className="text-sm font-black text-amber-400">$28,950.00</span>
              <span className="text-[9px] text-emerald-400 block">Must drop in 2h 45m</span>
            </div>
          </div>
        </div>

        {/* Casino Game Switcher Tabs */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pt-2 border-t border-zinc-800/80">
          {gamesList.map((g) => (
            <button
              key={g.id}
              onClick={() => setActiveCasinoGame(g.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeCasinoGame === g.id
                  ? 'bg-amber-400 text-zinc-950 shadow-md'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <span>{g.title}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                  activeCasinoGame === g.id
                    ? 'bg-zinc-950 text-amber-400'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {g.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Render Active Game */}
      <div className="animate-fade-in">
        {activeCasinoGame === 'roulette' && <RouletteGame />}
        {activeCasinoGame === 'slots' && <SlotMachineGame />}
        {activeCasinoGame === 'blackjack' && <BlackjackGame />}
        {activeCasinoGame === 'baccarat' && <BaccaratGame />}
        {activeCasinoGame === 'videopoker' && <VideoPokerGame />}
        {activeCasinoGame === 'crash' && <CrashGame />}
      </div>
    </div>
  );
};
