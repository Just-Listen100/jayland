import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { soundEngine } from '../../utils/audioFx';
import { Spade, Heart, Diamond, Club, Sparkles, Trophy, RotateCcw } from 'lucide-react';

interface PokerCard {
  suit: '♠' | '♥' | '♦' | '♣';
  val: string;
  rank: number; // 2..14 (Ace = 14)
}

const SUITS: ('♠' | '♥' | '♦' | '♣')[] = ['♠', '♥', '♦', '♣'];
const RANKS = [
  { val: '2', rank: 2 },
  { val: '3', rank: 3 },
  { val: '4', rank: 4 },
  { val: '5', rank: 5 },
  { val: '6', rank: 6 },
  { val: '7', rank: 7 },
  { val: '8', rank: 8 },
  { val: '9', rank: 9 },
  { val: '10', rank: 10 },
  { val: 'J', rank: 11 },
  { val: 'Q', rank: 12 },
  { val: 'K', rank: 13 },
  { val: 'A', rank: 14 },
];

function drawCard(): PokerCard {
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  const item = RANKS[Math.floor(Math.random() * RANKS.length)];
  return { suit, val: item.val, rank: item.rank };
}

function evaluatePokerHand(cards: PokerCard[]): { name: string; multiplier: number } {
  const ranks = cards.map((c) => c.rank).sort((a, b) => a - b);
  const suits = cards.map((c) => c.suit);

  const isFlush = suits.every((s) => s === suits[0]);
  let isStraight = false;

  // Regular straight
  if (
    ranks[4] - ranks[3] === 1 &&
    ranks[3] - ranks[2] === 1 &&
    ranks[2] - ranks[1] === 1 &&
    ranks[1] - ranks[0] === 1
  ) {
    isStraight = true;
  }
  // Wheel straight (A-2-3-4-5)
  if (ranks[0] === 2 && ranks[1] === 3 && ranks[2] === 4 && ranks[3] === 5 && ranks[4] === 14) {
    isStraight = true;
  }

  // Count rank frequencies
  const counts: Record<number, number> = {};
  ranks.forEach((r) => (counts[r] = (counts[r] || 0) + 1));
  const freqs = Object.values(counts).sort((a, b) => b - a);

  // Royal Flush: 10, J, Q, K, A of same suit
  if (isFlush && isStraight && ranks[0] === 10 && ranks[4] === 14) {
    return { name: 'Royal Flush', multiplier: 800 };
  }
  // Straight Flush
  if (isFlush && isStraight) {
    return { name: 'Straight Flush', multiplier: 50 };
  }
  // 4 of a Kind
  if (freqs[0] === 4) {
    return { name: '4 of a Kind', multiplier: 25 };
  }
  // Full House (3 of kind + pair)
  if (freqs[0] === 3 && freqs[1] === 2) {
    return { name: 'Full House', multiplier: 9 };
  }
  // Flush
  if (isFlush) {
    return { name: 'Flush', multiplier: 6 };
  }
  // Straight
  if (isStraight) {
    return { name: 'Straight', multiplier: 4 };
  }
  // 3 of a Kind
  if (freqs[0] === 3) {
    return { name: '3 of a Kind', multiplier: 3 };
  }
  // Two Pair
  if (freqs[0] === 2 && freqs[1] === 2) {
    return { name: 'Two Pair', multiplier: 2 };
  }
  // Jacks or Better (Pair of J, Q, K, or A)
  if (freqs[0] === 2) {
    const pairRank = Object.keys(counts).find((k) => counts[Number(k)] === 2);
    if (pairRank && Number(pairRank) >= 11) {
      return { name: 'Jacks or Better', multiplier: 1 };
    }
  }

  return { name: 'No Win', multiplier: 0 };
}

export const VideoPokerGame: React.FC = () => {
  const { balance, recordCasinoTransaction } = useWallet();

  const [bet, setBet] = useState<number>(25);
  const [stage, setStage] = useState<'DEAL' | 'DRAW'>('DEAL');
  const [cards, setCards] = useState<PokerCard[]>([
    { suit: '♠', val: '10', rank: 10 },
    { suit: '♠', val: 'J', rank: 11 },
    { suit: '♠', val: 'Q', rank: 12 },
    { suit: '♠', val: 'K', rank: 13 },
    { suit: '♠', val: 'A', rank: 14 },
  ]);
  const [held, setHeld] = useState<boolean[]>([false, false, false, false, false]);
  const [winMessage, setWinMessage] = useState<string | null>(null);

  const paytable = [
    { hand: 'Royal Flush', pay: '800x' },
    { hand: 'Straight Flush', pay: '50x' },
    { hand: '4 of a Kind', pay: '25x' },
    { hand: 'Full House', pay: '9x' },
    { hand: 'Flush', pay: '6x' },
    { hand: 'Straight', pay: '4x' },
    { hand: '3 of a Kind', pay: '3x' },
    { hand: 'Two Pair', pay: '2x' },
    { hand: 'Jacks or Better', pay: '1x' },
  ];

  const handleDealOrDraw = () => {
    if (stage === 'DEAL') {
      if (bet > balance) {
        setWinMessage('Insufficient balance to bet.');
        return;
      }
      // Deal 5 fresh cards
      const newHand = [drawCard(), drawCard(), drawCard(), drawCard(), drawCard()];
      setCards(newHand);
      setHeld([false, false, false, false, false]);
      setStage('DRAW');
      setWinMessage('Hold cards to keep, then press DRAW!');
      soundEngine.click();
    } else {
      // Draw replacements for unheld cards
      const finalHand = cards.map((c, i) => (held[i] ? c : drawCard()));
      setCards(finalHand);
      setStage('DEAL');

      const result = evaluatePokerHand(finalHand);
      const winAmount = Number((bet * (result.multiplier > 0 ? result.multiplier + 1 : 0)).toFixed(2));

      if (result.multiplier > 0) {
        setWinMessage(`${result.name.toUpperCase()}! You won +$${(winAmount - bet).toFixed(2)} (${result.multiplier}x payout)!`);
      } else {
        setWinMessage('No winning poker hand. Press Deal to play again.');
      }

      recordCasinoTransaction({
        betAmount: bet,
        winAmount,
        gameName: 'Video Poker',
        details: `${result.name}`,
      });
    }
  };

  const toggleHold = (index: number) => {
    if (stage !== 'DRAW') return;
    setHeld((prev) => {
      const copy = [...prev];
      copy[index] = !copy[index];
      return copy;
    });
    soundEngine.click();
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-2xl relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-400/10 text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>JACKS OR BETTER VIDEO POKER</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/20 text-amber-400 border border-amber-400/30">
                9/6 FULL-PAY TABLE · 800X ROYAL FLUSH
              </span>
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              5-Card Draw Vegas Poker with interactive card holds and double multipliers.
            </p>
          </div>
        </div>

        <div className="font-mono text-xs text-zinc-400">
          VAULT: <span className="text-emerald-400 font-bold">${balance.toFixed(2)}</span>
        </div>
      </div>

      {/* Paytable Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-9 gap-1 p-2 bg-zinc-950 rounded-xl border border-zinc-800 font-mono text-[10px] text-center">
        {paytable.map((p, idx) => (
          <div key={idx} className="p-1 rounded bg-zinc-900 border border-zinc-800/80">
            <span className="text-zinc-400 block truncate">{p.hand}</span>
            <span className="text-amber-400 font-bold">{p.pay}</span>
          </div>
        ))}
      </div>

      {/* 5 Video Poker Cards Display */}
      <div className="bg-gradient-to-b from-blue-950/40 via-zinc-950 to-zinc-950 p-6 rounded-2xl border border-zinc-800 min-h-[260px] flex flex-col justify-between items-center shadow-inner">
        <div className="grid grid-cols-5 gap-3 w-full max-w-2xl">
          {cards.map((c, i) => {
            const isRed = c.suit === '♥' || c.suit === '♦';
            const isHeld = held[i];

            return (
              <div key={i} className="flex flex-col items-center gap-2">
                <button
                  onClick={() => toggleHold(i)}
                  disabled={stage !== 'DRAW'}
                  className={`w-full aspect-[2/3] rounded-xl bg-white text-zinc-950 shadow-2xl p-2.5 flex flex-col justify-between font-bold border-2 transition-all cursor-pointer select-none ${
                    isHeld
                      ? 'border-amber-400 ring-4 ring-amber-400/40 -translate-y-2'
                      : 'border-zinc-200 hover:-translate-y-1'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span>{c.val}</span>
                    <span className={isRed ? 'text-red-600' : 'text-zinc-900'}>{c.suit}</span>
                  </div>
                  <div className={`text-2xl text-center font-bold ${isRed ? 'text-red-600' : 'text-zinc-900'}`}>
                    {c.suit}
                  </div>
                  <div className="flex justify-between items-center text-xs rotate-180">
                    <span>{c.val}</span>
                    <span className={isRed ? 'text-red-600' : 'text-zinc-900'}>{c.suit}</span>
                  </div>
                </button>

                {/* Held Badge */}
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                    isHeld
                      ? 'bg-amber-400 text-zinc-950 font-black'
                      : 'text-zinc-600'
                  }`}
                >
                  {isHeld ? 'HELD' : stage === 'DRAW' ? 'TAP TO HOLD' : '—'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Win Message */}
        {winMessage && (
          <div className="mt-4 p-2.5 rounded-xl bg-zinc-950 border border-amber-400/40 font-mono text-xs font-bold text-amber-300 animate-bounce text-center">
            {winMessage}
          </div>
        )}
      </div>

      {/* Control Panel: Bet Selection & Deal/Draw Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-zinc-400 font-semibold">BET:</span>
          {[10, 25, 50, 100, 250].map((amt) => (
            <button
              key={amt}
              onClick={() => setBet(amt)}
              disabled={stage === 'DRAW'}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                bet === amt
                  ? 'bg-amber-400 text-zinc-950 font-black shadow-md'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              ${amt}
            </button>
          ))}
        </div>

        <button
          onClick={handleDealOrDraw}
          disabled={bet > balance && stage === 'DEAL'}
          className="px-10 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-30 text-zinc-950 font-black text-sm tracking-wide transition-all shadow-xl shadow-amber-500/20 cursor-pointer"
        >
          {stage === 'DEAL' ? `DEAL HAND ($${bet})` : 'DRAW REPLACEMENTS'}
        </button>
      </div>
    </div>
  );
};
