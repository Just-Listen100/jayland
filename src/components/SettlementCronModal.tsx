import React, { useState } from 'react';
import { useLiveFeed } from '../context/LiveFeedContext';
import { useWallet } from '../context/WalletContext';
import { 
  Cpu, 
  Play, 
  CheckCircle, 
  RotateCcw, 
  ShieldCheck, 
  Clock, 
  AlertCircle,
  Terminal,
  Zap,
  Check
} from 'lucide-react';

interface SettlementCronModalProps {
  selectedGameId?: string | null;
  onClose?: () => void;
  isStandaloneTab?: boolean;
}

export const SettlementCronModal: React.FC<SettlementCronModalProps> = ({
  selectedGameId,
  onClose,
  isStandaloneTab = false,
}) => {
  const { games, settleGameMatch, resetAllGames, triggerGameEvent } = useLiveFeed();
  const { pendingBets } = useWallet();

  const [activeGameId, setActiveGameId] = useState<string>(
    selectedGameId || (games.length > 0 ? games[0].id : '')
  );
  const [selectedWinner, setSelectedWinner] = useState<'home' | 'away' | 'draw'>('home');
  const [apiLog, setApiLog] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  const currentGame = games.find((g) => g.id === activeGameId) || games[0];

  const handleExecuteSettlement = () => {
    if (!currentGame) return;
    setIsExecuting(true);

    const payload = {
      gameId: currentGame.id,
      winningOutcome: selectedWinner,
      timestamp: new Date().toISOString(),
      cronSecret: 'Bearer CRON_SECRET_PRODUCTION_2026',
    };

    setTimeout(() => {
      settleGameMatch(currentGame.id, selectedWinner);
      setIsExecuting(false);

      const responseLog = {
        status: 200,
        message: 'Settlement pipeline executed successfully',
        gameSettled: currentGame.id,
        officialWinner:
          selectedWinner === 'home'
            ? currentGame.homeTeam.name
            : selectedWinner === 'away'
            ? currentGame.awayTeam.name
            : 'DRAW',
        timestamp: new Date().toLocaleTimeString(),
        affectedPendingTickets: pendingBets.filter((b) =>
          b.legs.some((l) => l.gameId === currentGame.id)
        ).length,
      };

      setApiLog(JSON.stringify(responseLog, null, 2));
    }, 350);
  };

  return (
    <div className={`space-y-6 ${!isStandaloneTab ? 'p-1' : ''}`}>
      {/* Header Info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-400/10 text-amber-400">
              <Cpu className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Match Settlement &amp; Cron Payout Simulator</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ENDPOINT: POST /api/bets/settle
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                Simulate official league feed ingest, winner resolution, and row-level locked payout distribution.
              </p>
            </div>
          </div>

          <button
            onClick={resetAllGames}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono border border-zinc-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Matches</span>
          </button>
        </div>

        {/* Game Selector & Winner Picker */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
          {/* Left: Select Game (5 cols) */}
          <div className="lg:col-span-5 space-y-2">
            <label className="text-xs font-mono text-zinc-400 block font-semibold">
              SELECT MATCH TO SETTLE:
            </label>
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {games.map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    setActiveGameId(g.id);
                    setApiLog(null);
                  }}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                    activeGameId === g.id
                      ? 'bg-amber-400 text-zinc-950 font-bold border-amber-300 shadow-md'
                      : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                  }`}
                >
                  <div>
                    <span className="text-[10px] uppercase font-mono block opacity-80">
                      {g.sport} · {g.league}
                    </span>
                    <span className="font-bold text-sm">
                      {g.homeTeam.code} vs {g.awayTeam.code}
                    </span>
                    <span className="text-[11px] block mt-0.5 opacity-90">
                      Score: {g.homeTeam.score} - {g.awayTeam.score} ({g.clock})
                    </span>
                  </div>
                  {g.status === 'FINAL' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
                      FINAL
                    </span>
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Trigger Outcome & View Cron JSON (7 cols) */}
          {currentGame && (
            <div className="lg:col-span-7 space-y-4">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400 font-mono">TARGET EVENT:</span>
                  <span className="font-bold text-white font-mono">{currentGame.id}</span>
                </div>

                <div className="text-xs font-mono text-zinc-400">
                  CHOOSE OFFICIAL FINAL WINNER:
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelectedWinner('home')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedWinner === 'home'
                        ? 'bg-amber-400 text-zinc-950 font-bold border-amber-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-850'
                    }`}
                  >
                    <span className="text-[10px] uppercase block opacity-80">Home Team Win</span>
                    <span className="text-sm font-bold truncate block">{currentGame.homeTeam.name}</span>
                  </button>

                  {currentGame.markets.drawOdds && (
                    <button
                      onClick={() => setSelectedWinner('draw')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedWinner === 'draw'
                          ? 'bg-amber-400 text-zinc-950 font-bold border-amber-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-850'
                      }`}
                    >
                      <span className="text-[10px] uppercase block opacity-80">Full-Time Tie</span>
                      <span className="text-sm font-bold block">Draw Outcome</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedWinner('away')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedWinner === 'away'
                        ? 'bg-amber-400 text-zinc-950 font-bold border-amber-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-850'
                    }`}
                  >
                    <span className="text-[10px] uppercase block opacity-80">Away Team Win</span>
                    <span className="text-sm font-bold truncate block">{currentGame.awayTeam.name}</span>
                  </button>
                </div>

                {/* Settle Action Button */}
                <button
                  onClick={handleExecuteSettlement}
                  disabled={isExecuting || currentGame.status === 'FINAL'}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-black text-xs font-mono transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-500/10"
                >
                  {isExecuting ? (
                    <span>DISPATCHING SETTLEMENT RPC...</span>
                  ) : currentGame.status === 'FINAL' ? (
                    <span>MATCH ALREADY SETTLED (FINAL)</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>DISPATCH /api/bets/settle PIPELINE</span>
                    </>
                  )}
                </button>
              </div>

              {/* JSON Logs Window */}
              <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-3 font-mono text-[11px] space-y-1">
                <div className="flex items-center justify-between text-zinc-400 pb-1 border-b border-zinc-900">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-amber-400" />
                    <span>CRON AUDIT OUTPUT STREAM</span>
                  </div>
                  <span className="text-zinc-600">JSON response</span>
                </div>

                <pre className="text-emerald-400 max-h-48 overflow-y-auto pt-1 whitespace-pre-wrap">
                  {apiLog ||
                    `// Ready to execute settlement for ${currentGame.id}\n// Select winner above and click Dispatch to settle bets and disburse ledger payouts.`}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
