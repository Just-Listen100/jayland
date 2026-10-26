import React, { useState, useEffect } from 'react';
import { useWallet } from '../../context/WalletContext';
import { soundEngine } from '../../utils/audioFx';
import { Play, Sparkles, Trophy, Flame, Zap, RotateCw } from 'lucide-react';

interface SlotSymbol {
  id: string;
  name: string;
  icon: string;
  multiplier: number;
  color: string;
}

const SYMBOLS: SlotSymbol[] = [
  { id: '777', name: 'Lucky 777', icon: '7️⃣', multiplier: 50, color: 'text-amber-400' },
  { id: 'diamond', name: 'Apex Diamond', icon: '💎', multiplier: 25, color: 'text-cyan-400' },
  { id: 'bar', name: 'Gold Bar', icon: '🪙', multiplier: 15, color: 'text-yellow-300' },
  { id: 'bell', name: 'Vegas Bell', icon: '🔔', multiplier: 10, color: 'text-amber-200' },
  { id: 'cherry', name: 'Royal Cherry', icon: '🍒', multiplier: 5, color: 'text-rose-400' },
  { id: 'crown', name: 'Crown Wild', icon: '👑', multiplier: 30, color: 'text-purple-400' },
];

export const SlotMachineGame: React.FC = () => {
  const { balance, recordCasinoTransaction } = useWallet();

  const [betPerSpin, setBetPerSpin] = useState<number>(25);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [reels, setReels] = useState<SlotSymbol[][]>([
    [SYMBOLS[0], SYMBOLS[1], SYMBOLS[2]],
    [SYMBOLS[1], SYMBOLS[0], SYMBOLS[3]],
    [SYMBOLS[0], SYMBOLS[0], SYMBOLS[0]],
    [SYMBOLS[2], SYMBOLS[3], SYMBOLS[1]],
    [SYMBOLS[4], SYMBOLS[0], SYMBOLS[2]],
  ]);

  const [jackpotPool, setJackpotPool] = useState<number>(2489120.45);
  const [winMessage, setWinMessage] = useState<string | null>(null);
  const [lastWinAmount, setLastWinAmount] = useState<number>(0);
  const [autoSpinCount, setAutoSpinCount] = useState<number>(0);

  // Jackpot ticker increment
  useEffect(() => {
    const timer = setInterval(() => {
      setJackpotPool((prev) => prev + Math.random() * 0.45);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const spin = () => {
    if (isSpinning) return;
    if (betPerSpin > balance) {
      setWinMessage('Insufficient vault balance to spin.');
      return;
    }

    setIsSpinning(true);
    setWinMessage(null);
    setLastWinAmount(0);
    soundEngine.click();

    // Fast reel shuffling animation
    const interval = setInterval(() => {
      setReels([
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      ]);
    }, 80);

    setTimeout(() => {
      clearInterval(interval);

      // Generate final result
      const finalReels: SlotSymbol[][] = [];
      for (let c = 0; c < 5; c++) {
        finalReels.push([getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]);
      }

      setReels(finalReels);
      setIsSpinning(false);

      // Check center row payline for matches
      const centerRow = [
        finalReels[0][1],
        finalReels[1][1],
        finalReels[2][1],
        finalReels[3][1],
        finalReels[4][1],
      ];

      // Count symbol occurrences on payline
      const counts: Record<string, number> = {};
      centerRow.forEach((s) => {
        counts[s.id] = (counts[s.id] || 0) + 1;
      });

      let totalWin = 0;
      let winningSymbol: SlotSymbol | null = null;
      let matchCount = 0;

      for (const [symId, count] of Object.entries(counts)) {
        if (count >= 3) {
          const sym = SYMBOLS.find((s) => s.id === symId)!;
          winningSymbol = sym;
          matchCount = count;
          if (count === 3) totalWin += betPerSpin * (sym.multiplier * 0.4);
          if (count === 4) totalWin += betPerSpin * (sym.multiplier * 1.2);
          if (count === 5) totalWin += betPerSpin * (sym.multiplier * 5.0);
        }
      }

      // Check for Jackpot 777 trigger
      if (counts['777'] >= 4) {
        totalWin += betPerSpin * 100;
      }

      totalWin = Number(totalWin.toFixed(2));
      setLastWinAmount(totalWin);

      if (totalWin > 0) {
        setWinMessage(`JACKPOT PAYLINE! ${matchCount}x ${winningSymbol?.name} pays +$${totalWin.toFixed(2)}!`);
      } else {
        setWinMessage('Spin again! Match 3+ on center payline to win.');
      }

      recordCasinoTransaction({
        betAmount: betPerSpin,
        winAmount: totalWin,
        gameName: 'Mega 777 Slots',
        details: totalWin > 0 ? `Won $${totalWin.toFixed(2)} with ${matchCount}x ${winningSymbol?.name}` : 'No payline match',
      });
    }, 1200);
  };

  function getRandomSymbol(): SlotSymbol {
    // Weighted probabilities
    const rand = Math.random();
    if (rand < 0.08) return SYMBOLS[0]; // 777 (rare)
    if (rand < 0.18) return SYMBOLS[1]; // Diamond
    if (rand < 0.32) return SYMBOLS[5]; // Crown Wild
    if (rand < 0.50) return SYMBOLS[2]; // Bar
    if (rand < 0.72) return SYMBOLS[3]; // Bell
    return SYMBOLS[4]; // Cherry
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-2xl relative">
      {/* Progressive Jackpot Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between pb-4 border-b border-zinc-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-400/10 text-amber-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>MEGA APEX 777 VIDEO SLOTS</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/20 text-amber-400 border border-amber-400/30">
                50X MULTIPLIER JACKPOT
              </span>
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              5-reel high-roller video slot with wild crowns and scatter bonuses.
            </p>
          </div>
        </div>

        {/* Live Jackpot Meter */}
        <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/20 border border-amber-400/40 rounded-xl px-4 py-2 text-center shadow-lg font-mono">
          <span className="text-[10px] text-amber-300 uppercase tracking-widest font-bold block">
            SUPER PROGRESSIVE JACKPOT
          </span>
          <span className="text-xl font-black text-amber-400 animate-pulse">
            ${jackpotPool.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* 5-Reel Slot Window */}
      <div className="bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 p-6 rounded-2xl border-2 border-amber-500/30 shadow-2xl relative">
        {/* Center Payline Indicator */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent z-10 pointer-events-none opacity-80" />
        <div className="absolute top-1/2 left-2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-amber-400 text-zinc-950 font-mono text-[9px] font-black z-20">
          LINE 1
        </div>
        <div className="absolute top-1/2 right-2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-amber-400 text-zinc-950 font-mono text-[9px] font-black z-20">
          LINE 1
        </div>

        {/* 5 Columns / Reels */}
        <div className="grid grid-cols-5 gap-3">
          {reels.map((column, colIdx) => (
            <div
              key={colIdx}
              className="bg-zinc-950 border border-zinc-800 rounded-xl p-2 flex flex-col justify-between items-center space-y-3 shadow-inner"
            >
              {column.map((sym, rowIdx) => {
                const isCenter = rowIdx === 1;
                return (
                  <div
                    key={rowIdx}
                    className={`w-full py-4 rounded-lg flex flex-col items-center justify-center transition-all ${
                      isCenter
                        ? 'bg-zinc-900/90 border border-amber-400/40 shadow-md scale-105'
                        : 'bg-zinc-950/60 opacity-60'
                    } ${isSpinning ? 'blur-[1px] animate-pulse' : ''}`}
                  >
                    <span className="text-3xl filter drop-shadow">{sym.icon}</span>
                    <span className={`text-[10px] font-mono font-bold mt-1 ${sym.color}`}>
                      {sym.name}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Win Banner Message */}
        {winMessage && (
          <div className="mt-4 p-2.5 rounded-xl bg-zinc-950 border border-amber-400/40 text-center font-mono text-xs font-bold text-amber-300 animate-bounce">
            {winMessage}
          </div>
        )}
      </div>

      {/* Control Panel: Bet per spin, Auto-spin, Spin CTA */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-zinc-400 font-semibold">BET PER SPIN:</span>
          {[5, 20, 50, 100, 250].map((amt) => (
            <button
              key={amt}
              onClick={() => setBetPerSpin(amt)}
              disabled={isSpinning}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                betPerSpin === amt
                  ? 'bg-amber-400 text-zinc-950 font-black shadow-md'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              ${amt}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="font-mono text-xs text-zinc-400">
            TOTAL WIN: <span className="text-emerald-400 font-bold text-sm">${lastWinAmount.toFixed(2)}</span>
          </div>

          <button
            onClick={spin}
            disabled={isSpinning || betPerSpin > balance}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-30 text-zinc-950 font-black text-sm tracking-wide transition-all shadow-xl shadow-amber-500/20 cursor-pointer flex items-center gap-2"
          >
            <RotateCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{isSpinning ? 'SPINNING REELS...' : `SPIN ($${betPerSpin})`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
