import React, { useState } from 'react';
import { useLiveFeed } from '../context/LiveFeedContext';
import { useWallet } from '../context/WalletContext';
import { BetLeg, SportCategory, MarketType } from '../types/betting';
import { formatOdds } from '../utils/oddsEngine';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  ChevronRight, 
  ChevronDown, 
  Flame, 
  ShieldAlert, 
  Zap, 
  Check, 
  Radio
} from 'lucide-react';

interface LiveOddsTerminalProps {
  parlaySlip: BetLeg[];
  onToggleLeg: (leg: BetLeg) => void;
  onOpenCronModal: (gameId?: string) => void;
}

export const LiveOddsTerminal: React.FC<LiveOddsTerminalProps> = ({
  parlaySlip,
  onToggleLeg,
  onOpenCronModal,
}) => {
  const { games, activeSport, setActiveSport, triggerGameEvent } = useLiveFeed();
  const { oddsFormat } = useWallet();
  const [activeMarketTab, setActiveMarketTab] = useState<'ALL' | 'MONEYLINE' | 'SPREAD' | 'TOTAL' | 'PROPS'>('ALL');
  const [expandedGameId, setExpandedGameId] = useState<string | null>('game_nba_celtics_warriors');

  // Filter games by sport
  const filteredGames = games.filter((g) => {
    if (activeSport === 'ALL') return true;
    return g.sport === activeSport;
  });

  const isLegSelected = (gameId: string, selectionKey: string, marketType: MarketType) => {
    return parlaySlip.some(
      (l) => l.gameId === gameId && l.selectionKey === selectionKey && l.marketType === marketType
    );
  };

  const sportsList: { id: SportCategory; label: string }[] = [
    { id: 'ALL', label: 'All Live Feeds' },
    { id: 'NBA', label: 'NBA Basketball' },
    { id: 'EPL', label: 'Premier League' },
    { id: 'NFL', label: 'NFL Football' },
    { id: 'TENNIS', label: 'Tennis Slams' },
    { id: 'ESPORTS', label: 'CS2 Esports' },
  ];

  return (
    <div className="space-y-4">
      {/* Sports Filter Bar & Market Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/80">
        {/* Sport Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {sportsList.map((sport) => {
            const count = sport.id === 'ALL' ? games.length : games.filter((g) => g.sport === sport.id).length;
            const active = activeSport === sport.id;
            return (
              <button
                key={sport.id}
                onClick={() => setActiveSport(sport.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-amber-400 text-zinc-950 font-bold shadow-sm'
                    : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <span>{sport.label}</span>
                <span
                  className={`text-[10px] font-mono px-1 rounded ${
                    active ? 'bg-zinc-950 text-amber-400' : 'bg-zinc-700 text-zinc-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Market Filter Chips */}
        <div className="flex items-center gap-1 self-end md:self-auto text-xs font-mono">
          <span className="text-[11px] text-zinc-500 mr-1 hidden sm:inline">VIEW:</span>
          {(['ALL', 'MONEYLINE', 'SPREAD', 'TOTAL', 'PROPS'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveMarketTab(tab)}
              className={`px-2.5 py-1 rounded-md text-[11px] transition-colors ${
                activeMarketTab === tab
                  ? 'bg-zinc-800 text-amber-400 font-bold border border-amber-400/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Live Match Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredGames.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30 text-zinc-500">
            No live events currently active in this category.
          </div>
        ) : (
          filteredGames.map((game) => {
            const isHomeMlSelected = isLegSelected(game.id, 'home', 'MONEYLINE');
            const isAwayMlSelected = isLegSelected(game.id, 'away', 'MONEYLINE');
            const isDrawSelected = isLegSelected(game.id, 'draw', 'MONEYLINE');
            const isExpanded = expandedGameId === game.id;

            return (
              <div
                key={game.id}
                className="bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-4 transition-all shadow-sm"
              >
                {/* Header: League, Clock, Live Beacon, and Quick Simulation Trigger */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-zinc-400 font-bold">{game.league}</span>
                    <span className="text-zinc-600">·</span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono text-[11px] font-bold">
                      <Radio className="w-3 h-3 animate-pulse" />
                      <span>{game.clock}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Live score trigger for testing */}
                    <button
                      onClick={() => triggerGameEvent(game.id, 'score_home')}
                      className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono border border-zinc-700 transition-colors"
                      title="Simulate Home Team Scoring Point/Goal"
                    >
                      + {game.homeTeam.code} Pt
                    </button>
                    <button
                      onClick={() => triggerGameEvent(game.id, 'score_away')}
                      className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono border border-zinc-700 transition-colors"
                      title="Simulate Away Team Scoring Point/Goal"
                    >
                      + {game.awayTeam.code} Pt
                    </button>
                    <button
                      onClick={() => onOpenCronModal(game.id)}
                      className="px-2 py-1 rounded bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 text-[10px] font-mono border border-amber-400/30 transition-colors"
                      title="Open Instant Settlement Engine for this Match"
                    >
                      Settle Match
                    </button>
                  </div>
                </div>

                {/* Scoreboard & Odds Row */}
                <div className="py-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  {/* Teams & Current Score (5 cols) */}
                  <div className="lg:col-span-5 space-y-2.5">
                    {/* Home Team */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/50">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: game.homeTeam.color }}
                        />
                        <span className="font-bold text-sm text-white tracking-wide">
                          {game.homeTeam.name}
                        </span>
                        {game.possession === 'home' && (
                          <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded font-bold">
                            POSS
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-xl font-black text-amber-400 px-2">
                        {game.homeTeam.score}
                      </span>
                    </div>

                    {/* Away Team */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/50">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: game.awayTeam.color }}
                        />
                        <span className="font-bold text-sm text-white tracking-wide">
                          {game.awayTeam.name}
                        </span>
                        {game.possession === 'away' && (
                          <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded font-bold">
                            POSS
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-xl font-black text-amber-400 px-2">
                        {game.awayTeam.score}
                      </span>
                    </div>
                  </div>

                  {/* Primary Moneyline / Match Winner Odds (7 cols) */}
                  <div className="lg:col-span-7">
                    <div className="text-[11px] font-mono text-zinc-400 mb-1.5 flex justify-between items-center">
                      <span>MONEYLINE // FULL MATCH OUTCOME</span>
                      <span className="text-zinc-500">Click to lock into slip</span>
                    </div>

                    <div className={`grid gap-2 ${game.markets.drawOdds ? 'grid-cols-3' : 'grid-cols-2'}`}>
                      {/* Home Odds Button */}
                      <button
                        onClick={() =>
                          onToggleLeg({
                            id: `${game.id}_ml_home`,
                            gameId: game.id,
                            matchup: `${game.homeTeam.code} vs ${game.awayTeam.code}`,
                            sport: game.sport,
                            selectionName: `${game.homeTeam.name} Win`,
                            selectionKey: 'home',
                            marketType: 'MONEYLINE',
                            marketLabel: 'Match Winner',
                            odds: game.markets.homeOdds,
                            status: 'PENDING',
                          })
                        }
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all duration-300 relative cursor-pointer ${
                          isHomeMlSelected
                            ? 'bg-amber-400 text-zinc-950 font-bold border-amber-300 shadow-md shadow-amber-400/10'
                            : game.markets.homeShift === 'up'
                            ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200'
                            : game.markets.homeShift === 'down'
                            ? 'bg-rose-950/50 border-rose-500 text-rose-200'
                            : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 text-white'
                        }`}
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className={`font-semibold ${isHomeMlSelected ? 'text-zinc-950' : 'text-zinc-300'}`}>
                            {game.homeTeam.code}
                          </span>
                          {isHomeMlSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex items-baseline justify-between mt-1">
                          <span className={`text-[10px] uppercase font-mono ${isHomeMlSelected ? 'text-zinc-800' : 'text-zinc-500'}`}>
                            Home
                          </span>
                          <span
                            className={`font-mono text-base font-black flex items-center gap-0.5 ${
                              isHomeMlSelected
                                ? 'text-zinc-950'
                                : game.markets.homeShift === 'up'
                                ? 'text-emerald-400'
                                : game.markets.homeShift === 'down'
                                ? 'text-rose-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {game.markets.homeShift === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />}
                            {game.markets.homeShift === 'down' && <TrendingDown className="w-3.5 h-3.5 text-rose-400 animate-bounce" />}
                            {formatOdds(game.markets.homeOdds, oddsFormat)}
                          </span>
                        </div>
                      </button>

                      {/* Draw Odds Button (if applicable, e.g. soccer) */}
                      {game.markets.drawOdds && (
                        <button
                          onClick={() =>
                            onToggleLeg({
                              id: `${game.id}_ml_draw`,
                              gameId: game.id,
                              matchup: `${game.homeTeam.code} vs ${game.awayTeam.code}`,
                              sport: game.sport,
                              selectionName: 'Draw / Tie',
                              selectionKey: 'draw',
                              marketType: 'MONEYLINE',
                              marketLabel: 'Match Winner',
                              odds: game.markets.drawOdds!,
                              status: 'PENDING',
                            })
                          }
                          className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all duration-300 relative cursor-pointer ${
                            isDrawSelected
                              ? 'bg-amber-400 text-zinc-950 font-bold border-amber-300 shadow-md shadow-amber-400/10'
                              : game.markets.drawShift === 'up'
                              ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200'
                              : game.markets.drawShift === 'down'
                              ? 'bg-rose-950/50 border-rose-500 text-rose-200'
                              : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 text-white'
                          }`}
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span className={`font-semibold ${isDrawSelected ? 'text-zinc-950' : 'text-zinc-300'}`}>
                              DRAW
                            </span>
                            {isDrawSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <div className="flex items-baseline justify-between mt-1">
                            <span className={`text-[10px] uppercase font-mono ${isDrawSelected ? 'text-zinc-800' : 'text-zinc-500'}`}>
                              Tie
                            </span>
                            <span
                              className={`font-mono text-base font-black flex items-center gap-0.5 ${
                                isDrawSelected
                                  ? 'text-zinc-950'
                                  : game.markets.drawShift === 'up'
                                  ? 'text-emerald-400'
                                  : game.markets.drawShift === 'down'
                                  ? 'text-rose-400'
                                  : 'text-amber-400'
                              }`}
                            >
                              {game.markets.drawShift === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
                              {game.markets.drawShift === 'down' && <TrendingDown className="w-3.5 h-3.5 text-rose-400" />}
                              {formatOdds(game.markets.drawOdds, oddsFormat)}
                            </span>
                          </div>
                        </button>
                      )}

                      {/* Away Odds Button */}
                      <button
                        onClick={() =>
                          onToggleLeg({
                            id: `${game.id}_ml_away`,
                            gameId: game.id,
                            matchup: `${game.homeTeam.code} vs ${game.awayTeam.code}`,
                            sport: game.sport,
                            selectionName: `${game.awayTeam.name} Win`,
                            selectionKey: 'away',
                            marketType: 'MONEYLINE',
                            marketLabel: 'Match Winner',
                            odds: game.markets.awayOdds,
                            status: 'PENDING',
                          })
                        }
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all duration-300 relative cursor-pointer ${
                          isAwayMlSelected
                            ? 'bg-amber-400 text-zinc-950 font-bold border-amber-300 shadow-md shadow-amber-400/10'
                            : game.markets.awayShift === 'up'
                            ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200'
                            : game.markets.awayShift === 'down'
                            ? 'bg-rose-950/50 border-rose-500 text-rose-200'
                            : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 text-white'
                        }`}
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className={`font-semibold ${isAwayMlSelected ? 'text-zinc-950' : 'text-zinc-300'}`}>
                            {game.awayTeam.code}
                          </span>
                          {isAwayMlSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex items-baseline justify-between mt-1">
                          <span className={`text-[10px] uppercase font-mono ${isAwayMlSelected ? 'text-zinc-800' : 'text-zinc-500'}`}>
                            Away
                          </span>
                          <span
                            className={`font-mono text-base font-black flex items-center gap-0.5 ${
                              isAwayMlSelected
                                ? 'text-zinc-950'
                                : game.markets.awayShift === 'up'
                                ? 'text-emerald-400'
                                : game.markets.awayShift === 'down'
                                ? 'text-rose-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {game.markets.awayShift === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />}
                            {game.markets.awayShift === 'down' && <TrendingDown className="w-3.5 h-3.5 text-rose-400 animate-bounce" />}
                            {formatOdds(game.markets.awayOdds, oddsFormat)}
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Win Probability Bar & Key In-Game Metric */}
                <div className="pt-2 pb-3 border-t border-zinc-800/60">
                  <div className="flex justify-between items-center text-[11px] font-mono mb-1 text-zinc-400">
                    <span className="flex items-center gap-1">
                      <span className="font-bold text-white">{game.homeTeam.code} {game.stats.homeWinProb}%</span>
                      <span>Win Prob</span>
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {game.stats.keyMetricLabel}: <span className="text-zinc-300">{game.stats.homeMetric} vs {game.stats.awayMetric}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span>Win Prob</span>
                      <span className="font-bold text-white">{game.awayTeam.code} {game.stats.awayWinProb}%</span>
                    </span>
                  </div>
                  {/* Probability Bar */}
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-500"
                      style={{ width: `${game.stats.homeWinProb}%` }}
                    />
                    <div
                      className="h-full bg-zinc-700 transition-all duration-500"
                      style={{ width: `${game.stats.awayWinProb}%` }}
                    />
                  </div>
                </div>

                {/* Secondary Markets (Spread, Total, Props) - Expandable */}
                <div className="pt-2">
                  <button
                    onClick={() => setExpandedGameId(isExpanded ? null : game.id)}
                    className="flex items-center justify-between w-full py-1 text-xs text-zinc-400 hover:text-amber-400 font-mono transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>More Markets: Spreads, Over/Under Totals &amp; Props</span>
                    </span>
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-zinc-800/80 space-y-3">
                      {/* Spreads & Totals */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {/* Spread / Handicap */}
                        {game.markets.spreadLine !== undefined && (
                          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                            <div className="text-[11px] font-mono text-zinc-400 mb-2">
                              POINT SPREAD (Line: {game.markets.spreadLine > 0 ? `+${game.markets.spreadLine}` : game.markets.spreadLine})
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() =>
                                  onToggleLeg({
                                    id: `${game.id}_spread_home`,
                                    gameId: game.id,
                                    matchup: `${game.homeTeam.code} vs ${game.awayTeam.code}`,
                                    sport: game.sport,
                                    selectionName: `${game.homeTeam.code} (${game.markets.spreadLine! > 0 ? `+${game.markets.spreadLine}` : game.markets.spreadLine})`,
                                    selectionKey: 'spread_home',
                                    marketType: 'SPREAD',
                                    marketLabel: 'Point Spread',
                                    odds: game.markets.spreadHomeOdds || 1.91,
                                    status: 'PENDING',
                                  })
                                }
                                className={`p-2 rounded-lg border text-left flex justify-between items-center transition-colors ${
                                  isLegSelected(game.id, 'spread_home', 'SPREAD')
                                    ? 'bg-amber-400 text-zinc-950 font-bold border-amber-300'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                                }`}
                              >
                                <span>{game.homeTeam.code} Spread</span>
                                <span className="font-mono font-bold text-amber-400">
                                  {formatOdds(game.markets.spreadHomeOdds || 1.91, oddsFormat)}
                                </span>
                              </button>

                              <button
                                onClick={() =>
                                  onToggleLeg({
                                    id: `${game.id}_spread_away`,
                                    gameId: game.id,
                                    matchup: `${game.homeTeam.code} vs ${game.awayTeam.code}`,
                                    sport: game.sport,
                                    selectionName: `${game.awayTeam.code} (${-game.markets.spreadLine! > 0 ? `+${-game.markets.spreadLine!}` : -game.markets.spreadLine!})`,
                                    selectionKey: 'spread_away',
                                    marketType: 'SPREAD',
                                    marketLabel: 'Point Spread',
                                    odds: game.markets.spreadAwayOdds || 1.91,
                                    status: 'PENDING',
                                  })
                                }
                                className={`p-2 rounded-lg border text-left flex justify-between items-center transition-colors ${
                                  isLegSelected(game.id, 'spread_away', 'SPREAD')
                                    ? 'bg-amber-400 text-zinc-950 font-bold border-amber-300'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                                }`}
                              >
                                <span>{game.awayTeam.code} Spread</span>
                                <span className="font-mono font-bold text-amber-400">
                                  {formatOdds(game.markets.spreadAwayOdds || 1.91, oddsFormat)}
                                </span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Over / Under Totals */}
                        {game.markets.totalLine !== undefined && (
                          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                            <div className="text-[11px] font-mono text-zinc-400 mb-2">
                              TOTAL SCORE OVER/UNDER (Line: {game.markets.totalLine})
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() =>
                                  onToggleLeg({
                                    id: `${game.id}_total_over`,
                                    gameId: game.id,
                                    matchup: `${game.homeTeam.code} vs ${game.awayTeam.code}`,
                                    sport: game.sport,
                                    selectionName: `Over ${game.markets.totalLine} Total Points`,
                                    selectionKey: 'total_over',
                                    marketType: 'TOTAL',
                                    marketLabel: 'Total Over/Under',
                                    odds: game.markets.totalOverOdds || 1.90,
                                    status: 'PENDING',
                                  })
                                }
                                className={`p-2 rounded-lg border text-left flex justify-between items-center transition-colors ${
                                  isLegSelected(game.id, 'total_over', 'TOTAL')
                                    ? 'bg-amber-400 text-zinc-950 font-bold border-amber-300'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                                }`}
                              >
                                <span>Over {game.markets.totalLine}</span>
                                <span className="font-mono font-bold text-amber-400">
                                  {formatOdds(game.markets.totalOverOdds || 1.90, oddsFormat)}
                                </span>
                              </button>

                              <button
                                onClick={() =>
                                  onToggleLeg({
                                    id: `${game.id}_total_under`,
                                    gameId: game.id,
                                    matchup: `${game.homeTeam.code} vs ${game.awayTeam.code}`,
                                    sport: game.sport,
                                    selectionName: `Under ${game.markets.totalLine} Total Points`,
                                    selectionKey: 'total_under',
                                    marketType: 'TOTAL',
                                    marketLabel: 'Total Over/Under',
                                    odds: game.markets.totalUnderOdds || 1.90,
                                    status: 'PENDING',
                                  })
                                }
                                className={`p-2 rounded-lg border text-left flex justify-between items-center transition-colors ${
                                  isLegSelected(game.id, 'total_under', 'TOTAL')
                                    ? 'bg-amber-400 text-zinc-950 font-bold border-amber-300'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                                }`}
                              >
                                <span>Under {game.markets.totalLine}</span>
                                <span className="font-mono font-bold text-amber-400">
                                  {formatOdds(game.markets.totalUnderOdds || 1.90, oddsFormat)}
                                </span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Player Props (if present) */}
                      {game.markets.playerProps && game.markets.playerProps.length > 0 && (
                        <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                          <div className="text-[11px] font-mono text-zinc-400 mb-2">
                            PLAYER PERFORMANCE PROPS
                          </div>
                          <div className="space-y-2">
                            {game.markets.playerProps.map((prop) => (
                              <div
                                key={prop.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-lg bg-zinc-900/70 border border-zinc-800 gap-2 text-xs"
                              >
                                <div>
                                  <span className="font-bold text-white">{prop.playerName}</span>
                                  <span className="text-zinc-500 ml-2 font-mono">
                                    {prop.statType}: {prop.line}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() =>
                                      onToggleLeg({
                                        id: `${game.id}_prop_${prop.id}_over`,
                                        gameId: game.id,
                                        matchup: `${game.homeTeam.code} vs ${game.awayTeam.code}`,
                                        sport: game.sport,
                                        selectionName: `${prop.playerName} Over ${prop.line} ${prop.statType}`,
                                        selectionKey: `prop_${prop.id}_over`,
                                        marketType: 'PLAYER_PROP',
                                        marketLabel: prop.statType,
                                        odds: prop.overOdds,
                                        status: 'PENDING',
                                      })
                                    }
                                    className={`px-3 py-1.5 rounded border flex items-center gap-2 font-mono transition-colors ${
                                      isLegSelected(game.id, `prop_${prop.id}_over`, 'PLAYER_PROP')
                                        ? 'bg-amber-400 text-zinc-950 font-bold border-amber-300'
                                        : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                                    }`}
                                  >
                                    <span>Over</span>
                                    <span className="text-amber-400 font-bold">
                                      {formatOdds(prop.overOdds, oddsFormat)}
                                    </span>
                                  </button>

                                  <button
                                    onClick={() =>
                                      onToggleLeg({
                                        id: `${game.id}_prop_${prop.id}_under`,
                                        gameId: game.id,
                                        matchup: `${game.homeTeam.code} vs ${game.awayTeam.code}`,
                                        sport: game.sport,
                                        selectionName: `${prop.playerName} Under ${prop.line} ${prop.statType}`,
                                        selectionKey: `prop_${prop.id}_under`,
                                        marketType: 'PLAYER_PROP',
                                        marketLabel: prop.statType,
                                        odds: prop.underOdds,
                                        status: 'PENDING',
                                      })
                                    }
                                    className={`px-3 py-1.5 rounded border flex items-center gap-2 font-mono transition-colors ${
                                      isLegSelected(game.id, `prop_${prop.id}_under`, 'PLAYER_PROP')
                                        ? 'bg-amber-400 text-zinc-950 font-bold border-amber-300'
                                        : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                                    }`}
                                  >
                                    <span>Under</span>
                                    <span className="text-amber-400 font-bold">
                                      {formatOdds(prop.underOdds, oddsFormat)}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom ticker item: Last live action event */}
                {game.lastEvent && (
                  <div className="mt-3 pt-2 border-t border-zinc-800/40 flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span className="text-zinc-500">FEED:</span>
                    <span className="text-zinc-300 truncate">{game.lastEvent}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
