import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { useLiveFeed } from '../context/LiveFeedContext';
import { Bet } from '../types/betting';
import { calculateLiveCashoutValue, calculateHedge, formatOdds } from '../utils/oddsEngine';
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  Scale, 
  ArrowRight, 
  Clock, 
  Layers,
  ChevronDown,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

interface ActiveBetsHedgingProps {
  onGoToMarkets: () => void;
}

export const ActiveBetsHedging: React.FC<ActiveBetsHedgingProps> = ({ onGoToMarkets }) => {
  const { pendingBets, cashoutBet, oddsFormat, balance } = useWallet();
  const { games } = useLiveFeed();

  const [filterType, setFilterType] = useState<'ALL' | 'PARLAY' | 'SINGLE'>('ALL');
  const [cashingOutId, setCashingOutId] = useState<string | null>(null);
  const [hedgeModalBet, setHedgeModalBet] = useState<Bet | null>(null);

  const filteredBets = pendingBets.filter((b) => {
    if (filterType === 'ALL') return true;
    return b.type === filterType;
  });

  /**
   * Helper to compute real-time live odds for an active bet or parlay
   */
  const computeCurrentLiveOdds = (bet: Bet): number => {
    // For single bet, lookup the live odds of that selection in the active games
    if (bet.legs.length === 1) {
      const leg = bet.legs[0];
      const match = games.find((g) => g.id === leg.gameId);
      if (!match) return leg.odds;

      if (leg.selectionKey === 'home') return match.markets.homeOdds;
      if (leg.selectionKey === 'away') return match.markets.awayOdds;
      if (leg.selectionKey === 'draw' && match.markets.drawOdds) return match.markets.drawOdds;
      if (leg.selectionKey === 'total_over' && match.markets.totalOverOdds) return match.markets.totalOverOdds;
      if (leg.selectionKey === 'total_under' && match.markets.totalUnderOdds) return match.markets.totalUnderOdds;
      return leg.odds;
    }

    // For multi-leg parlay, product of live odds across legs
    const currentLegOdds = bet.legs.map((leg) => {
      const match = games.find((g) => g.id === leg.gameId);
      if (!match) return leg.odds;
      if (leg.selectionKey === 'home') return match.markets.homeOdds;
      if (leg.selectionKey === 'away') return match.markets.awayOdds;
      if (leg.selectionKey === 'draw' && match.markets.drawOdds) return match.markets.drawOdds;
      return leg.odds;
    });

    const product = currentLegOdds.reduce((acc, o) => acc * Math.max(1.01, o), 1.0);
    return Number(product.toFixed(4));
  };

  const handleCashout = (bet: Bet) => {
    const liveOdds = computeCurrentLiveOdds(bet);
    setCashingOutId(bet.id);
    setTimeout(() => {
      cashoutBet(bet.id, liveOdds);
      setCashingOutId(null);
    }, 200);
  };

  return (
    <div className="space-y-5">
      {/* Overview & Hedging Philosophy Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400">
              <Zap className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-white">Dynamic Auto-Cashout &amp; Hedge Desk</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl font-mono">
            Real-time Net Present Value (NPV) calculation based on live match drift. Settle early to
            lock guaranteed profits before the final buzzer or hedge opposite outcomes.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 p-1 bg-zinc-950 rounded-xl border border-zinc-800 text-xs font-semibold">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterType === 'ALL'
                ? 'bg-amber-400 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            All Open ({pendingBets.length})
          </button>
          <button
            onClick={() => setFilterType('PARLAY')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterType === 'PARLAY'
                ? 'bg-amber-400 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Parlays ({pendingBets.filter((b) => b.type === 'PARLAY').length})
          </button>
          <button
            onClick={() => setFilterType('SINGLE')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterType === 'SINGLE'
                ? 'bg-amber-400 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Singles ({pendingBets.filter((b) => b.type === 'SINGLE').length})
          </button>
        </div>
      </div>

      {/* Active Position Tickets Grid */}
      {filteredBets.length === 0 ? (
        <div className="text-center py-16 px-4 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30">
          <Layers className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-300">No active positions open</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
            You do not have any pending wagers in play. Browse live events and lock in a slip to test
            real-time dynamic cashouts.
          </p>
          <button
            onClick={onGoToMarkets}
            className="mt-4 px-4 py-2 rounded-xl bg-amber-400 text-zinc-950 font-bold text-xs hover:bg-amber-300 transition-colors cursor-pointer"
          >
            Explore Live Markets
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBets.map((bet) => {
            const currentLiveOdds = computeCurrentLiveOdds(bet);
            const cashoutValue = calculateLiveCashoutValue(bet.payout, currentLiveOdds, 0.05);
            const pnlDollar = Number((cashoutValue - bet.amount).toFixed(2));
            const pnlPercent = Number(((pnlDollar / bet.amount) * 100).toFixed(1));
            const isProfitable = pnlDollar >= 0;

            return (
              <div
                key={bet.id}
                className="bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm"
              >
                {/* Header: Bet Type, ID, and Live P&L badge */}
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/30">
                        {bet.type === 'PARLAY' ? `${bet.legs.length}-LEG PARLAY` : 'STRAIGHT WAGER'}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-500">{bet.id}</span>
                    </div>

                    <div
                      className={`flex items-center gap-1 font-mono text-xs font-black px-2.5 py-1 rounded-lg ${
                        isProfitable
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {isProfitable ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      <span>{isProfitable ? `+$${pnlDollar}` : `-$${Math.abs(pnlDollar)}`}</span>
                      <span>({isProfitable ? `+${pnlPercent}%` : `${pnlPercent}%`})</span>
                    </div>
                  </div>

                  {/* Legs Details */}
                  <div className="py-3 space-y-2">
                    {bet.legs.map((leg, idx) => {
                      const match = games.find((g) => g.id === leg.gameId);
                      return (
                        <div
                          key={idx}
                          className="bg-zinc-950/70 border border-zinc-800/80 p-2.5 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-zinc-400 font-bold">
                                {leg.sport}
                              </span>
                              <span className="text-zinc-500">·</span>
                              <span className="text-zinc-300 font-medium">{leg.matchup}</span>
                              {match && (
                                <span className="font-mono text-[10px] text-amber-400 bg-zinc-900 px-1.5 py-0.2 rounded">
                                  {match.homeTeam.score}-{match.awayTeam.score} ({match.clock})
                                </span>
                              )}
                            </div>
                            <p className="font-bold text-white text-sm mt-0.5">{leg.selectionName}</p>
                          </div>

                          <div className="text-right font-mono">
                            <span className="text-zinc-500 text-[10px] block">Locked Odds</span>
                            <span className="font-black text-amber-400 text-xs">
                              {formatOdds(leg.odds, oddsFormat)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Valuation & Odds Comparison */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono">
                    <div>
                      <span className="text-zinc-500 text-[10px] block">Stake Locked</span>
                      <span className="font-bold text-white">${bet.amount.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] block">Locked Odds</span>
                      <span className="font-bold text-amber-400">
                        {formatOdds(bet.totalOdds, oddsFormat)}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] block">Potential Payout</span>
                      <span className="font-bold text-emerald-400">${bet.payout.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Cashout Action Bar */}
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400 flex items-center gap-1">
                      <span>Live NPV Valuation:</span>
                      <span className="text-zinc-500">(5% fee)</span>
                    </span>
                    <span className="text-white font-bold">${cashoutValue.toFixed(2)}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Primary Dynamic Cashout Button */}
                    <button
                      onClick={() => handleCashout(bet)}
                      disabled={cashingOutId === bet.id}
                      className={`sm:col-span-2 py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                        isProfitable
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 shadow-emerald-500/10'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-400/30'
                      }`}
                    >
                      {cashingOutId === bet.id ? (
                        <span>PROCESSING LIQUIDITY...</span>
                      ) : (
                        <>
                          <DollarSign className="w-4 h-4" />
                          <span>CASH OUT NOW FOR ${cashoutValue.toFixed(2)}</span>
                        </>
                      )}
                    </button>

                    {/* Hedge Calculator Button */}
                    <button
                      onClick={() => setHedgeModalBet(bet)}
                      className="py-3 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Analyze Arbitrage Hedge"
                    >
                      <Scale className="w-3.5 h-3.5 text-amber-400" />
                      <span>Hedge Calc</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hedge Calculator Modal */}
      {hedgeModalBet && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Institutional Hedge Calculator</h3>
              </div>
              <button
                onClick={() => setHedgeModalBet(null)}
                className="text-zinc-500 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400 font-mono">
              Lock in risk-free profit regardless of match outcome by taking the opposing side at
              current live market odds.
            </p>

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-400">Current Position:</span>
                <span className="font-bold text-white">
                  {hedgeModalBet.legs.map((l) => l.selectionName).join(', ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Original Stake:</span>
                <span className="text-white">${hedgeModalBet.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Locked Potential Payout:</span>
                <span className="text-emerald-400 font-bold">${hedgeModalBet.payout.toFixed(2)}</span>
              </div>
            </div>

            {/* Calculations assuming opposing odds */}
            {(() => {
              const liveOdds = computeCurrentLiveOdds(hedgeModalBet);
              // Opposing line estimate
              const opposingOdds = Number(Math.max(1.15, (liveOdds / (liveOdds - 1))).toFixed(2));
              const hedgeInfo = calculateHedge(hedgeModalBet.amount, hedgeModalBet.payout, opposingOdds);

              return (
                <div className="space-y-3 pt-2">
                  <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-xs space-y-2">
                    <div className="flex justify-between font-mono">
                      <span className="text-amber-300 font-semibold">Recommended Opposite Stake:</span>
                      <span className="font-black text-amber-400 text-sm">
                        ${hedgeInfo.recommendedHedgeStake.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-zinc-300">Estimated Opposite Odds:</span>
                      <span className="text-white font-bold">{opposingOdds}x</span>
                    </div>
                    <div className="flex justify-between font-mono pt-1 border-t border-amber-400/20">
                      <span className="text-zinc-300 font-bold">Guaranteed Arbitrage Profit:</span>
                      <span className="font-black text-emerald-400 text-sm">
                        +${hedgeInfo.guaranteedProfit.toFixed(2)} ({hedgeInfo.roiPercent}%)
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-500 font-mono text-center">
                    By staking ${hedgeInfo.recommendedHedgeStake.toFixed(2)} on the opposing line,
                    both possible game finishes yield an identical net positive return.
                  </p>
                </div>
              );
            })()}

            <div className="pt-2">
              <button
                onClick={() => setHedgeModalBet(null)}
                className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs font-mono transition-colors"
              >
                Close Calculator
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
