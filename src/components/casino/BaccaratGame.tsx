import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { soundEngine } from '../../utils/audioFx';
import { ShieldCheck, Trophy, Sparkles, Coins, Crown } from 'lucide-react';

interface Card {
  suit: '♠' | '♥' | '♦' | '♣';
  value: string;
  points: number; // In Baccarat: 10, J, Q, K = 0; A = 1; 2-9 = face value
}

const SUITS: ('♠' | '♥' | '♦' | '♣')[] = ['♠', '♥', '♦', '♣'];
const VALUES = [
  { val: 'A', points: 1 },
  { val: '2', points: 2 },
  { val: '3', points: 3 },
  { val: '4', points: 4 },
  { val: '5', points: 5 },
  { val: '6', points: 6 },
  { val: '7', points: 7 },
  { val: '8', points: 8 },
  { val: '9', points: 9 },
  { val: '10', points: 0 },
  { val: 'J', points: 0 },
  { val: 'Q', points: 0 },
  { val: 'K', points: 0 },
];

function drawCard(): Card {
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  const item = VALUES[Math.floor(Math.random() * VALUES.length)];
  return { suit, value: item.val, points: item.points };
}

function calculateBaccaratScore(hand: Card[]): number {
  const sum = hand.reduce((acc, c) => acc + c.points, 0);
  return sum % 10;
}

export const BaccaratGame: React.FC = () => {
  const { balance, recordCasinoTransaction } = useWallet();

  const [chipValue, setChipValue] = useState<number>(50);
  const [playerStake, setPlayerStake] = useState<number>(0);
  const [bankerStake, setBankerStake] = useState<number>(50);
  const [tieStake, setTieStake] = useState<number>(0);

  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [bankerHand, setBankerHand] = useState<Card[]>([]);
  const [isDealing, setIsDealing] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [roadmap, setRoadmap] = useState<('P' | 'B' | 'T')[]>(['B', 'B', 'P', 'B', 'T', 'P', 'B']);

  const totalBet = playerStake + bankerStake + tieStake;

  const handleDeal = () => {
    if (totalBet <= 0 || isDealing) return;
    if (totalBet > balance) {
      setResultMessage('Total bet exceeds available vault balance.');
      return;
    }

    setIsDealing(true);
    setResultMessage(null);
    soundEngine.click();

    setTimeout(() => {
      // Deal 2 cards each
      let pCards = [drawCard(), drawCard()];
      let bCards = [drawCard(), drawCard()];

      let pScore = calculateBaccaratScore(pCards);
      let bScore = calculateBaccaratScore(bCards);

      // Check for Natural 8 or 9
      if (pScore >= 8 || bScore >= 8) {
        // Natural Win
      } else {
        // Player draws 3rd card if score <= 5
        let playerThirdCardVal: number | null = null;
        if (pScore <= 5) {
          const third = drawCard();
          pCards.push(third);
          playerThirdCardVal = third.points;
          pScore = calculateBaccaratScore(pCards);
        }

        // Banker 3rd card rules
        if (playerThirdCardVal === null) {
          if (bScore <= 5) {
            bCards.push(drawCard());
            bScore = calculateBaccaratScore(bCards);
          }
        } else {
          // Standard Tableau rules
          if (bScore <= 2) {
            bCards.push(drawCard());
          } else if (bScore === 3 && playerThirdCardVal !== 8) {
            bCards.push(drawCard());
          } else if (bScore === 4 && [2, 3, 4, 5, 6, 7].includes(playerThirdCardVal)) {
            bCards.push(drawCard());
          } else if (bScore === 5 && [4, 5, 6, 7].includes(playerThirdCardVal)) {
            bCards.push(drawCard());
          } else if (bScore === 6 && [6, 7].includes(playerThirdCardVal)) {
            bCards.push(drawCard());
          }
          bScore = calculateBaccaratScore(bCards);
        }
      }

      setPlayerHand(pCards);
      setBankerHand(bCards);
      setIsDealing(false);

      // Determine Winner
      let totalWon = 0;
      let winnerText = '';
      let outcomeSymbol: 'P' | 'B' | 'T' = 'B';

      if (pScore > bScore) {
        outcomeSymbol = 'P';
        winnerText = `PLAYER WINS (${pScore} vs ${bScore})!`;
        if (playerStake > 0) totalWon += playerStake * 2; // 1:1
      } else if (bScore > pScore) {
        outcomeSymbol = 'B';
        winnerText = `BANKER WINS (${bScore} vs ${pScore})!`;
        if (bankerStake > 0) totalWon += bankerStake * 1.95; // 0.95:1 (5% commission)
      } else {
        outcomeSymbol = 'T';
        winnerText = `TIE GAME (${pScore} vs ${bScore})!`;
        if (tieStake > 0) totalWon += tieStake * 9; // 8:1 payout
        // Push on Player & Banker
        totalWon += playerStake + bankerStake;
      }

      setRoadmap((prev) => [outcomeSymbol, ...prev.slice(0, 11)]);
      totalWon = Number(totalWon.toFixed(2));

      if (totalWon > 0) {
        setResultMessage(`${winnerText} You won +$${(totalWon - totalBet).toFixed(2)}!`);
      } else {
        setResultMessage(`${winnerText} House takes the hand.`);
      }

      recordCasinoTransaction({
        betAmount: totalBet,
        winAmount: totalWon,
        gameName: 'VIP Baccarat',
        details: `${winnerText}`,
      });
    }, 800);
  };

  const clearBets = () => {
    setPlayerStake(0);
    setBankerStake(0);
    setTieStake(0);
    soundEngine.click();
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Background Gold VIP Styling */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-950/20 via-zinc-950 to-zinc-950 pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-400/10 text-amber-400">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>MACAU VIP LIVE BACCARAT</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/20 text-amber-400 border border-amber-400/30">
                PUNTO BANCO · 5% COMMISSION
              </span>
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Player (1:1) · Banker (0.95:1) · Tie (8:1) · Natural 8 &amp; 9 Detection
            </p>
          </div>
        </div>

        {/* Roadmap Bead Plate */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-zinc-500 hidden sm:inline">ROADMAP:</span>
          <div className="flex items-center gap-1">
            {roadmap.map((res, i) => (
              <span
                key={i}
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                  res === 'B'
                    ? 'bg-rose-600 text-white'
                    : res === 'P'
                    ? 'bg-blue-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {res}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Felt Table Layout: Player vs Banker cards */}
      <div className="relative bg-gradient-to-b from-[#181124] to-[#0c0814] border border-purple-900/40 rounded-2xl p-6 min-h-[300px] flex flex-col justify-between shadow-inner">
        <div className="grid grid-cols-2 gap-6">
          {/* Player Hand Zone */}
          <div className="text-center space-y-3 p-4 rounded-xl bg-blue-950/20 border border-blue-900/30">
            <div className="flex items-center justify-center gap-2 font-mono text-xs font-bold text-blue-400 uppercase">
              <span>PLAYER</span>
              {playerHand.length > 0 && (
                <span className="bg-blue-900/60 text-white px-2 py-0.5 rounded-full text-sm">
                  {calculateBaccaratScore(playerHand)}
                </span>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 min-h-[96px]">
              {playerHand.length === 0 ? (
                <div className="h-24 w-16 rounded-xl border border-dashed border-blue-800/40 flex items-center justify-center text-blue-500/40 text-xs font-mono">
                  PLAYER
                </div>
              ) : (
                playerHand.map((c, i) => (
                  <div
                    key={i}
                    className="h-24 w-16 rounded-xl bg-white text-zinc-950 shadow-2xl flex flex-col justify-between p-2 select-none border border-zinc-200 animate-fade-in font-bold text-xs"
                  >
                    <span>{c.value}</span>
                    <span className="text-lg text-center">{c.suit}</span>
                    <span className="rotate-180">{c.value}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Banker Hand Zone */}
          <div className="text-center space-y-3 p-4 rounded-xl bg-rose-950/20 border border-rose-900/30">
            <div className="flex items-center justify-center gap-2 font-mono text-xs font-bold text-rose-400 uppercase">
              <span>BANKER</span>
              {bankerHand.length > 0 && (
                <span className="bg-rose-900/60 text-white px-2 py-0.5 rounded-full text-sm">
                  {calculateBaccaratScore(bankerHand)}
                </span>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 min-h-[96px]">
              {bankerHand.length === 0 ? (
                <div className="h-24 w-16 rounded-xl border border-dashed border-rose-800/40 flex items-center justify-center text-rose-500/40 text-xs font-mono">
                  BANKER
                </div>
              ) : (
                bankerHand.map((c, i) => (
                  <div
                    key={i}
                    className="h-24 w-16 rounded-xl bg-white text-zinc-950 shadow-2xl flex flex-col justify-between p-2 select-none border border-zinc-200 animate-fade-in font-bold text-xs"
                  >
                    <span>{c.value}</span>
                    <span className="text-lg text-center">{c.suit}</span>
                    <span className="rotate-180">{c.value}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Center Banner Message */}
        {resultMessage && (
          <div className="my-4 p-2.5 rounded-xl bg-zinc-950/90 border border-amber-400/40 text-center font-mono text-xs font-bold text-amber-300 animate-bounce">
            {resultMessage}
          </div>
        )}

        {/* 3 Main Baccarat Betting Spots: Player, Tie, Banker */}
        <div className="grid grid-cols-3 gap-4 pt-4">
          {/* Player Bet (1:1) */}
          <button
            onClick={() => setPlayerStake((prev) => prev + chipValue)}
            disabled={isDealing}
            className="p-4 rounded-xl bg-blue-950/50 hover:bg-blue-900/50 border-2 border-blue-600/60 text-center transition-all cursor-pointer flex flex-col items-center justify-center shadow-lg hover:scale-105"
          >
            <span className="text-xs font-black text-blue-400 uppercase font-mono">PLAYER (1:1)</span>
            {playerStake > 0 ? (
              <span className="mt-2 bg-amber-400 text-zinc-950 px-2 py-0.5 rounded font-black font-mono text-sm">
                ${playerStake}
              </span>
            ) : (
              <span className="text-[11px] text-zinc-500 font-mono mt-1">Tap to Bet</span>
            )}
          </button>

          {/* Tie Bet (8:1) */}
          <button
            onClick={() => setTieStake((prev) => prev + chipValue)}
            disabled={isDealing}
            className="p-4 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/50 border-2 border-emerald-600/60 text-center transition-all cursor-pointer flex flex-col items-center justify-center shadow-lg hover:scale-105"
          >
            <span className="text-xs font-black text-emerald-400 uppercase font-mono">TIE (8:1)</span>
            {tieStake > 0 ? (
              <span className="mt-2 bg-amber-400 text-zinc-950 px-2 py-0.5 rounded font-black font-mono text-sm">
                ${tieStake}
              </span>
            ) : (
              <span className="text-[11px] text-zinc-500 font-mono mt-1">Tap to Bet</span>
            )}
          </button>

          {/* Banker Bet (0.95:1) */}
          <button
            onClick={() => setBankerStake((prev) => prev + chipValue)}
            disabled={isDealing}
            className="p-4 rounded-xl bg-rose-950/50 hover:bg-rose-900/50 border-2 border-rose-600/60 text-center transition-all cursor-pointer flex flex-col items-center justify-center shadow-lg hover:scale-105"
          >
            <span className="text-xs font-black text-rose-400 uppercase font-mono">BANKER (0.95:1)</span>
            {bankerStake > 0 ? (
              <span className="mt-2 bg-amber-400 text-zinc-950 px-2 py-0.5 rounded font-black font-mono text-sm">
                ${bankerStake}
              </span>
            ) : (
              <span className="text-[11px] text-zinc-500 font-mono mt-1">Tap to Bet</span>
            )}
          </button>
        </div>
      </div>

      {/* Chip Tray & Deal Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-400 font-semibold">CHIP:</span>
          {[25, 50, 100, 250, 500].map((val) => (
            <button
              key={val}
              onClick={() => setChipValue(val)}
              className={`w-10 h-10 rounded-full font-mono text-xs font-black border-2 flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                chipValue === val
                  ? 'border-amber-400 bg-amber-400 text-zinc-950'
                  : 'border-zinc-700 bg-zinc-900 text-white'
              }`}
            >
              ${val}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={clearBets}
            disabled={totalBet === 0 || isDealing}
            className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-300 text-xs font-mono transition-colors cursor-pointer"
          >
            Clear
          </button>

          <button
            onClick={handleDeal}
            disabled={totalBet === 0 || isDealing || totalBet > balance}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-30 text-zinc-950 font-black text-sm tracking-wide transition-all shadow-xl shadow-amber-500/20 cursor-pointer"
          >
            {isDealing ? 'DEALING TABLEAU...' : `DEAL HAND ($${totalBet})`}
          </button>
        </div>
      </div>
    </div>
  );
};
