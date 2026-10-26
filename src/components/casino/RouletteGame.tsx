import React, { useState, useRef, useEffect } from 'react';
import { useWallet } from '../../context/WalletContext';
import { soundEngine } from '../../utils/audioFx';
import { Play, RotateCcw, Sparkles, Trophy, Disc } from 'lucide-react';

// European numbers order on standard wheel
const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

interface BetPlacements {
  red: number;
  black: number;
  even: number;
  odd: number;
  low: number; // 1-18
  high: number; // 19-36
  dozen1: number; // 1-12
  dozen2: number; // 13-24
  dozen3: number; // 25-36
  numbers: Record<number, number>; // individual straight up numbers
}

export const RouletteGame: React.FC = () => {
  const { balance, recordCasinoTransaction } = useWallet();

  const [chipValue, setChipValue] = useState<number>(25);
  const [bets, setBets] = useState<BetPlacements>({
    red: 0,
    black: 0,
    even: 0,
    odd: 0,
    low: 0,
    high: 0,
    dozen1: 0,
    dozen2: 0,
    dozen3: 0,
    numbers: {},
  });

  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([14, 2, 33, 0, 19, 7]);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  // Calculate total stake placed on table
  const totalStake =
    bets.red +
    bets.black +
    bets.even +
    bets.odd +
    bets.low +
    bets.high +
    bets.dozen1 +
    bets.dozen2 +
    bets.dozen3 +
    Object.values(bets.numbers).reduce((a, b) => a + b, 0);

  const placeBet = (field: keyof Omit<BetPlacements, 'numbers'>) => {
    if (isSpinning) return;
    if (totalStake + chipValue > balance) {
      setResultMessage('Insufficient vault funds.');
      return;
    }
    setBets((prev) => ({
      ...prev,
      [field]: prev[field] + chipValue,
    }));
    soundEngine.click();
  };

  const placeNumberBet = (num: number) => {
    if (isSpinning) return;
    if (totalStake + chipValue > balance) {
      setResultMessage('Insufficient vault funds.');
      return;
    }
    setBets((prev) => ({
      ...prev,
      numbers: {
        ...prev.numbers,
        [num]: (prev.numbers[num] || 0) + chipValue,
      },
    }));
    soundEngine.click();
  };

  const clearBets = () => {
    if (isSpinning) return;
    setBets({
      red: 0,
      black: 0,
      even: 0,
      odd: 0,
      low: 0,
      high: 0,
      dozen1: 0,
      dozen2: 0,
      dozen3: 0,
      numbers: {},
    });
    setResultMessage(null);
    soundEngine.click();
  };

  const spinWheel = () => {
    if (totalStake <= 0 || isSpinning) return;
    if (totalStake > balance) {
      setResultMessage('Total stake exceeds available balance.');
      return;
    }

    setIsSpinning(true);
    setResultMessage(null);
    setWinningNumber(null);

    // Pick random outcome
    const targetNumber = WHEEL_NUMBERS[Math.floor(Math.random() * WHEEL_NUMBERS.length)];

    // Spin animation with 5-8 full rotations
    const spinDelta = 360 * 6 + Math.floor(Math.random() * 360);
    setWheelRotation((prev) => prev + spinDelta);

    soundEngine.click();

    setTimeout(() => {
      setIsSpinning(false);
      setWinningNumber(targetNumber);
      setHistory((prev) => [targetNumber, ...prev.slice(0, 7)]);

      // Calculate payouts
      let totalWon = 0;
      const isRed = RED_NUMBERS.includes(targetNumber);
      const isBlack = targetNumber !== 0 && !isRed;
      const isEven = targetNumber !== 0 && targetNumber % 2 === 0;
      const isOdd = targetNumber !== 0 && targetNumber % 2 !== 0;

      // 1:1 Outside bets
      if (isRed && bets.red > 0) totalWon += bets.red * 2;
      if (isBlack && bets.black > 0) totalWon += bets.black * 2;
      if (isEven && bets.even > 0) totalWon += bets.even * 2;
      if (isOdd && bets.odd > 0) totalWon += bets.odd * 2;
      if (targetNumber >= 1 && targetNumber <= 18 && bets.low > 0) totalWon += bets.low * 2;
      if (targetNumber >= 19 && targetNumber <= 36 && bets.high > 0) totalWon += bets.high * 2;

      // 2:1 Dozens
      if (targetNumber >= 1 && targetNumber <= 12 && bets.dozen1 > 0) totalWon += bets.dozen1 * 3;
      if (targetNumber >= 13 && targetNumber <= 24 && bets.dozen2 > 0) totalWon += bets.dozen2 * 3;
      if (targetNumber >= 25 && targetNumber <= 36 && bets.dozen3 > 0) totalWon += bets.dozen3 * 3;

      // 35:1 Straight up single numbers
      if (bets.numbers[targetNumber]) {
        totalWon += bets.numbers[targetNumber] * 36;
      }

      const netDelta = totalWon - totalStake;
      const isWinning = totalWon > totalStake;

      const numColor = targetNumber === 0 ? 'GREEN' : isRed ? 'RED' : 'BLACK';

      if (totalWon > 0) {
        setResultMessage(
          `BALL LANDED ON ${targetNumber} (${numColor})! ${
            isWinning ? `YOU WON +$${netDelta.toFixed(2)}!` : `Push return: $${totalWon.toFixed(2)}`
          }`
        );
      } else {
        setResultMessage(`BALL LANDED ON ${targetNumber} (${numColor}). No win this round.`);
      }

      recordCasinoTransaction({
        betAmount: totalStake,
        winAmount: totalWon,
        gameName: 'European Roulette',
        details: `Ball landed on ${targetNumber} (${numColor})`,
      });
    }, 2800);
  };

  const getNumberColor = (num: number) => {
    if (num === 0) return 'bg-emerald-600 text-white';
    return RED_NUMBERS.includes(num) ? 'bg-rose-600 text-white' : 'bg-zinc-900 text-white border-zinc-700';
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-2xl relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-400/10 text-amber-400">
            <Disc className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>VEGAS LIVE EUROPEAN ROULETTE</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/20 text-amber-400 border border-amber-400/30">
                SINGLE ZERO 2.7% HOUSE EDGE
              </span>
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              35:1 straight up numbers · 2:1 dozens · 1:1 red/black even/odd
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="text-zinc-400">HISTORY:</span>
          <div className="flex items-center gap-1">
            {history.map((h, i) => (
              <span
                key={i}
                className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] ${
                  h === 0
                    ? 'bg-emerald-600 text-white'
                    : RED_NUMBERS.includes(h)
                    ? 'bg-rose-600 text-white'
                    : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {h}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Center Layout: Wheel & Recent Spin display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Animated Roulette Wheel (4 cols) */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
          <div className="relative w-56 h-56 flex items-center justify-center">
            {/* Spinning wheel SVG/CSS */}
            <div
              className="w-48 h-48 rounded-full border-4 border-amber-400/80 shadow-2xl relative flex items-center justify-center overflow-hidden transition-transform ease-out"
              style={{
                transform: `rotate(${wheelRotation}deg)`,
                transitionDuration: isSpinning ? '2.8s' : '0s',
                background: 'conic-gradient(#059669 0deg 9.7deg, #e11d48 9.7deg 19.4deg, #18181b 19.4deg 29.1deg, #e11d48 29.1deg 38.8deg, #18181b 38.8deg 48.5deg, #e11d48 48.5deg 58.2deg, #18181b 58.2deg 68deg, #e11d48 68deg 77.7deg, #18181b 77.7deg 87.4deg, #e11d48 87.4deg 97.1deg, #18181b 97.1deg 106.8deg, #e11d48 106.8deg 116.5deg, #18181b 116.5deg 126.2deg, #e11d48 126.2deg 135.9deg, #18181b 135.9deg 145.6deg, #e11d48 145.6deg 155.3deg, #18181b 155.3deg 165deg, #e11d48 165deg 174.7deg, #18181b 174.7deg 184.4deg, #e11d48 184.4deg 194.1deg, #18181b 194.1deg 203.8deg, #e11d48 203.8deg 213.5deg, #18181b 213.5deg 223.2deg, #e11d48 223.2deg 232.9deg, #18181b 232.9deg 242.6deg, #e11d48 242.6deg 252.3deg, #18181b 252.3deg 262deg, #e11d48 262deg 271.7deg, #18181b 271.7deg 281.4deg, #e11d48 281.4deg 291.1deg, #18181b 291.1deg 300.8deg, #e11d48 300.8deg 310.5deg, #18181b 310.5deg 320.2deg, #e11d48 320.2deg 330deg, #18181b 330deg 339.7deg, #e11d48 339.7deg 349.4deg, #18181b 349.4deg 360deg)',
              }}
            >
              <div className="w-20 h-20 rounded-full bg-zinc-950 border-2 border-amber-400 flex items-center justify-center text-white font-mono font-bold text-xs shadow-inner">
                {isSpinning ? 'SPINNING...' : winningNumber !== null ? winningNumber : 'READY'}
              </div>
            </div>

            {/* Pointer Pin at top */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-5 bg-amber-400 clip-triangle shadow-lg z-10" />
          </div>

          {resultMessage && (
            <div className="mt-3 text-center text-xs font-mono font-bold text-amber-300 animate-fade-in">
              {resultMessage}
            </div>
          )}
        </div>

        {/* Roulette Betting Grid (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          {/* Numbers Grid (0 on left, 1-36 in 3 rows) */}
          <div className="grid grid-cols-13 gap-1 p-2 bg-zinc-950 rounded-xl border border-zinc-800 text-center font-mono font-bold text-xs">
            {/* Zero (spans 3 rows on left) */}
            <button
              onClick={() => placeNumberBet(0)}
              className="row-span-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg flex flex-col items-center justify-center p-1 text-white relative transition-transform hover:scale-105 cursor-pointer"
            >
              <span className="text-sm font-black">0</span>
              {bets.numbers[0] && (
                <span className="text-[9px] bg-amber-400 text-zinc-950 px-1 rounded-full font-bold mt-1">
                  ${bets.numbers[0]}
                </span>
              )}
            </button>

            {/* 3 rows of numbers 1-36 */}
            {[
              [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
              [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
              [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
            ].map((row, rIdx) =>
              row.map((num) => {
                const betOnNum = bets.numbers[num] || 0;
                return (
                  <button
                    key={num}
                    onClick={() => placeNumberBet(num)}
                    className={`h-11 rounded-md flex flex-col items-center justify-center text-xs border transition-transform hover:scale-110 cursor-pointer ${getNumberColor(
                      num
                    )}`}
                  >
                    <span>{num}</span>
                    {betOnNum > 0 && (
                      <span className="text-[9px] bg-amber-400 text-zinc-950 px-1 rounded-full font-bold">
                        ${betOnNum}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Dozens (1st 12, 2nd 12, 3rd 12) */}
          <div className="grid grid-cols-3 gap-2 font-mono text-xs">
            {[
              { key: 'dozen1' as const, label: '1st 12 (1-12)', val: bets.dozen1 },
              { key: 'dozen2' as const, label: '2nd 12 (13-24)', val: bets.dozen2 },
              { key: 'dozen3' as const, label: '3rd 12 (25-36)', val: bets.dozen3 },
            ].map((d) => (
              <button
                key={d.key}
                onClick={() => placeBet(d.key)}
                className="py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold flex items-center justify-between px-3 cursor-pointer transition-colors"
              >
                <span>{d.label}</span>
                {d.val > 0 && (
                  <span className="bg-amber-400 text-zinc-950 px-1.5 py-0.2 rounded font-black text-[10px]">
                    ${d.val}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Outside Bets (1-18, Even, Red, Black, Odd, 19-36) */}
          <div className="grid grid-cols-6 gap-2 font-mono text-xs">
            <button
              onClick={() => placeBet('low')}
              className="py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold flex flex-col items-center justify-center cursor-pointer"
            >
              <span>1-18</span>
              {bets.low > 0 && <span className="text-[10px] text-amber-400">${bets.low}</span>}
            </button>

            <button
              onClick={() => placeBet('even')}
              className="py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold flex flex-col items-center justify-center cursor-pointer"
            >
              <span>EVEN</span>
              {bets.even > 0 && <span className="text-[10px] text-amber-400">${bets.even}</span>}
            </button>

            <button
              onClick={() => placeBet('red')}
              className="py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold flex flex-col items-center justify-center cursor-pointer shadow-md"
            >
              <span>RED</span>
              {bets.red > 0 && <span className="text-[10px] text-amber-300">${bets.red}</span>}
            </button>

            <button
              onClick={() => placeBet('black')}
              className="py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-700 text-white font-bold flex flex-col items-center justify-center cursor-pointer shadow-md"
            >
              <span>BLACK</span>
              {bets.black > 0 && <span className="text-[10px] text-amber-400">${bets.black}</span>}
            </button>

            <button
              onClick={() => placeBet('odd')}
              className="py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold flex flex-col items-center justify-center cursor-pointer"
            >
              <span>ODD</span>
              {bets.odd > 0 && <span className="text-[10px] text-amber-400">${bets.odd}</span>}
            </button>

            <button
              onClick={() => placeBet('high')}
              className="py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold flex flex-col items-center justify-center cursor-pointer"
            >
              <span>19-36</span>
              {bets.high > 0 && <span className="text-[10px] text-amber-400">${bets.high}</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Chip Selection & Spin Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-800 bg-zinc-950 p-4 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-400 font-semibold">CHIP:</span>
          {[10, 25, 50, 100, 250].map((v) => (
            <button
              key={v}
              onClick={() => setChipValue(v)}
              className={`w-10 h-10 rounded-full font-mono text-xs font-black border-2 flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                chipValue === v
                  ? 'border-amber-400 bg-amber-400 text-zinc-950 ring-2 ring-amber-400/30'
                  : 'border-zinc-700 bg-zinc-900 text-white'
              }`}
            >
              ${v}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="font-mono text-xs">
            <span className="text-zinc-500">TOTAL TABLE STAKE:</span>{' '}
            <span className="text-amber-400 font-bold text-sm">${totalStake}</span>
          </div>

          <button
            onClick={clearBets}
            disabled={totalStake === 0 || isSpinning}
            className="px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-300 text-xs font-mono transition-colors cursor-pointer"
          >
            Clear Board
          </button>

          <button
            onClick={spinWheel}
            disabled={totalStake === 0 || isSpinning || totalStake > balance}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-30 text-zinc-950 font-black text-sm tracking-wide transition-all shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            <span>{isSpinning ? 'SPINNING WHEEL...' : 'SPIN WHEEL'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
