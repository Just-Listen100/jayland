import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { soundEngine } from '../../utils/audioFx';
import { 
  Spade, 
  Heart, 
  Diamond, 
  Club, 
  RotateCcw, 
  ShieldCheck, 
  Zap, 
  Trophy, 
  Coins, 
  Sparkles 
} from 'lucide-react';

interface Card {
  suit: '♠' | '♥' | '♦' | '♣';
  value: string;
  weight: number;
}

const SUITS: ('♠' | '♥' | '♦' | '♣')[] = ['♠', '♥', '♦', '♣'];
const VALUES = [
  { val: 'A', weight: 11 },
  { val: '2', weight: 2 },
  { val: '3', weight: 3 },
  { val: '4', weight: 4 },
  { val: '5', weight: 5 },
  { val: '6', weight: 6 },
  { val: '7', weight: 7 },
  { val: '8', weight: 8 },
  { val: '9', weight: 9 },
  { val: '10', weight: 10 },
  { val: 'J', weight: 10 },
  { val: 'Q', weight: 10 },
  { val: 'K', weight: 10 },
];

function drawRandomCard(): Card {
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  const item = VALUES[Math.floor(Math.random() * VALUES.length)];
  return { suit, value: item.val, weight: item.weight };
}

function calculateHandScore(hand: Card[]): number {
  let score = 0;
  let aces = 0;

  for (const card of hand) {
    score += card.weight;
    if (card.value === 'A') aces++;
  }

  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }

  return score;
}

export const BlackjackGame: React.FC = () => {
  const { balance, recordCasinoTransaction } = useWallet();

  const [currentChip, setCurrentChip] = useState<number>(50);
  const [betAmount, setBetAmount] = useState<number>(50);
  const [gameState, setGameState] = useState<'BETTING' | 'PLAYER_TURN' | 'ROUND_OVER'>('BETTING');

  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [outcomeMessage, setOutcomeMessage] = useState<string | null>(null);
  const [payoutResult, setPayoutResult] = useState<number>(0);

  const chips = [10, 25, 50, 100, 250, 500];

  // Deal initial hands
  const handleDeal = () => {
    if (betAmount <= 0) return;
    if (betAmount > balance) {
      setOutcomeMessage('Insufficient balance to deal.');
      return;
    }

    setOutcomeMessage(null);
    setPayoutResult(0);

    const c1 = drawRandomCard();
    const c2 = drawRandomCard();
    const d1 = drawRandomCard();
    const d2 = drawRandomCard();

    const pHand = [c1, c2];
    const dHand = [d1, d2];

    setPlayerHand(pHand);
    setDealerHand(dHand);

    const pScore = calculateHandScore(pHand);
    const dScore = calculateHandScore(dHand);

    soundEngine.click();

    // Check for natural Blackjack 21
    if (pScore === 21) {
      if (dScore === 21) {
        // Push
        setGameState('ROUND_OVER');
        setOutcomeMessage('Both hit Blackjack! PUSH (Tie). Stake returned.');
        recordCasinoTransaction({
          betAmount,
          winAmount: betAmount,
          gameName: 'Blackjack Pro',
          details: 'Blackjack Push vs Dealer',
        });
      } else {
        // Player Natural Blackjack (3:2 Payout!)
        const winPayout = Number((betAmount * 2.5).toFixed(2));
        setGameState('ROUND_OVER');
        setPayoutResult(winPayout);
        setOutcomeMessage(`BLACKJACK! Natural 21 pays 3:2 (+$${(winPayout - betAmount).toFixed(2)})!`);
        recordCasinoTransaction({
          betAmount,
          winAmount: winPayout,
          gameName: 'Blackjack Pro',
          details: 'Natural 21 Blackjack (3:2 payout)',
        });
      }
    } else {
      setGameState('PLAYER_TURN');
    }
  };

  // Player hits
  const handleHit = () => {
    if (gameState !== 'PLAYER_TURN') return;
    const newCard = drawRandomCard();
    const newHand = [...playerHand, newCard];
    setPlayerHand(newHand);
    soundEngine.click();

    const score = calculateHandScore(newHand);
    if (score > 21) {
      // BUST
      setGameState('ROUND_OVER');
      setOutcomeMessage(`BUST! You scored ${score}. Dealer wins.`);
      recordCasinoTransaction({
        betAmount,
        winAmount: 0,
        gameName: 'Blackjack Pro',
        details: `Player BUST with ${score}`,
      });
    }
  };

  // Player stands: dealer draws to 17
  const handleStand = () => {
    if (gameState !== 'PLAYER_TURN') return;
    resolveDealer([...dealerHand], calculateHandScore(playerHand), betAmount);
  };

  // Double Down
  const handleDoubleDown = () => {
    if (gameState !== 'PLAYER_TURN' || playerHand.length !== 2) return;
    const doubledBet = betAmount * 2;
    if (doubledBet > balance) {
      setOutcomeMessage('Insufficient funds to Double Down.');
      return;
    }

    setBetAmount(doubledBet);
    const newCard = drawRandomCard();
    const newHand = [...playerHand, newCard];
    setPlayerHand(newHand);
    soundEngine.click();

    const pScore = calculateHandScore(newHand);
    if (pScore > 21) {
      setGameState('ROUND_OVER');
      setOutcomeMessage(`BUST on Double Down (${pScore}). Dealer wins.`);
      recordCasinoTransaction({
        betAmount: doubledBet,
        winAmount: 0,
        gameName: 'Blackjack Pro',
        details: `Double Down BUST with ${pScore}`,
      });
    } else {
      resolveDealer([...dealerHand], pScore, doubledBet);
    }
  };

  const resolveDealer = (currentDealerHand: Card[], pScore: number, finalStake: number) => {
    let dHand = [...currentDealerHand];
    let dScore = calculateHandScore(dHand);

    while (dScore < 17) {
      dHand.push(drawRandomCard());
      dScore = calculateHandScore(dHand);
    }

    setDealerHand(dHand);
    setGameState('ROUND_OVER');

    if (dScore > 21) {
      // Dealer Bust, Player Wins!
      const winPayout = finalStake * 2;
      setPayoutResult(winPayout);
      setOutcomeMessage(`Dealer BUSTED with ${dScore}! YOU WIN +$${finalStake.toFixed(2)}!`);
      recordCasinoTransaction({
        betAmount: finalStake,
        winAmount: winPayout,
        gameName: 'Blackjack Pro',
        details: `Dealer bust (${dScore}), Player wins`,
      });
    } else if (pScore > dScore) {
      // Player beats dealer
      const winPayout = finalStake * 2;
      setPayoutResult(winPayout);
      setOutcomeMessage(`YOU WIN! ${pScore} beats Dealer's ${dScore} (+${finalStake.toFixed(2)})!`);
      recordCasinoTransaction({
        betAmount: finalStake,
        winAmount: winPayout,
        gameName: 'Blackjack Pro',
        details: `Player ${pScore} beat Dealer ${dScore}`,
      });
    } else if (pScore === dScore) {
      // Push
      setPayoutResult(finalStake);
      setOutcomeMessage(`PUSH! Tied at ${pScore}. Stake returned.`);
      recordCasinoTransaction({
        betAmount: finalStake,
        winAmount: finalStake,
        gameName: 'Blackjack Pro',
        details: `Push at ${pScore}`,
      });
    } else {
      // Dealer wins
      setOutcomeMessage(`Dealer's ${dScore} beats your ${pScore}. Better luck next deal!`);
      recordCasinoTransaction({
        betAmount: finalStake,
        winAmount: 0,
        gameName: 'Blackjack Pro',
        details: `Dealer ${dScore} beat Player ${pScore}`,
      });
    }
  };

  const playerScore = calculateHandScore(playerHand);
  const dealerScore =
    gameState === 'PLAYER_TURN' && dealerHand.length > 0
      ? dealerHand[0].weight // Only show upcard score during turn
      : calculateHandScore(dealerHand);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Background VIP Table Felt styling */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/40 via-zinc-950 to-zinc-950 pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-400/10 text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>VEGAS VIP BLACKJACK 21</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/20 text-amber-400 border border-amber-400/30">
                PAYS 3:2 · DEALER STANDS ON 17
              </span>
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Live casino deck with double-down and natural blackjack payout rules.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-zinc-400">VAULT:</span>
          <span className="font-bold text-emerald-400 text-sm">${balance.toFixed(2)}</span>
        </div>
      </div>

      {/* Table Green Felt Felt Area */}
      <div className="relative bg-gradient-to-b from-[#0b2416] to-[#07170e] border border-emerald-900/60 rounded-2xl p-6 min-h-[360px] flex flex-col justify-between shadow-inner">
        {/* Dealer Zone */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-emerald-300 font-semibold uppercase tracking-wider">
            <span>DEALER</span>
            {dealerHand.length > 0 && (
              <span className="bg-emerald-900/60 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                {gameState === 'PLAYER_TURN' ? `${dealerScore} + ?` : dealerScore}
              </span>
            )}
          </div>

          {/* Dealer Cards */}
          <div className="flex items-center justify-center gap-3 min-h-[100px]">
            {dealerHand.length === 0 ? (
              <div className="h-24 w-16 rounded-xl border border-dashed border-emerald-800/40 flex items-center justify-center text-emerald-700/50 text-xs font-mono">
                DECK
              </div>
            ) : (
              dealerHand.map((card, idx) => {
                const isHiddenHoleCard = gameState === 'PLAYER_TURN' && idx === 1;
                const isRed = card.suit === '♥' || card.suit === '♦';

                if (isHiddenHoleCard) {
                  return (
                    <div
                      key={idx}
                      className="h-24 w-16 rounded-xl bg-gradient-to-br from-red-900 to-red-950 border-2 border-red-700 shadow-xl flex items-center justify-center text-amber-400 font-mono font-black text-sm select-none animate-fade-in"
                    >
                      PX
                    </div>
                  );
                }

                return (
                  <div
                    key={idx}
                    className="h-24 w-16 rounded-xl bg-white text-zinc-950 shadow-xl flex flex-col justify-between p-2 select-none border border-zinc-200 transform hover:-translate-y-1 transition-transform animate-fade-in"
                  >
                    <div className="flex justify-between items-center text-xs font-bold leading-none">
                      <span>{card.value}</span>
                      <span className={isRed ? 'text-red-600' : 'text-zinc-900'}>{card.suit}</span>
                    </div>
                    <div className={`text-center text-xl font-bold ${isRed ? 'text-red-600' : 'text-zinc-900'}`}>
                      {card.suit}
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold leading-none rotate-180">
                      <span>{card.value}</span>
                      <span className={isRed ? 'text-red-600' : 'text-zinc-900'}>{card.suit}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center Banner / Game Outcome Message */}
        <div className="my-4 text-center min-h-[44px] flex items-center justify-center">
          {outcomeMessage ? (
            <div className="px-5 py-2.5 rounded-xl bg-zinc-950/90 border border-amber-400/40 text-amber-300 font-mono font-bold text-sm shadow-xl flex items-center gap-2 animate-bounce">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{outcomeMessage}</span>
            </div>
          ) : (
            <div className="text-emerald-500/60 font-mono text-xs uppercase tracking-widest font-semibold">
              INSURANCE PAYS 2:1 · BLACKJACK PAYS 3:2
            </div>
          )}
        </div>

        {/* Player Zone */}
        <div className="text-center space-y-2">
          {/* Player Cards */}
          <div className="flex items-center justify-center gap-3 min-h-[100px]">
            {playerHand.length === 0 ? (
              <div className="h-24 w-16 rounded-xl border border-dashed border-emerald-800/40 flex items-center justify-center text-emerald-700/50 text-xs font-mono">
                YOU
              </div>
            ) : (
              playerHand.map((card, idx) => {
                const isRed = card.suit === '♥' || card.suit === '♦';
                return (
                  <div
                    key={idx}
                    className="h-24 w-16 rounded-xl bg-white text-zinc-950 shadow-2xl flex flex-col justify-between p-2 select-none border border-zinc-200 transform hover:-translate-y-1 transition-transform animate-fade-in"
                  >
                    <div className="flex justify-between items-center text-xs font-bold leading-none">
                      <span>{card.value}</span>
                      <span className={isRed ? 'text-red-600' : 'text-zinc-900'}>{card.suit}</span>
                    </div>
                    <div className={`text-center text-xl font-bold ${isRed ? 'text-red-600' : 'text-zinc-900'}`}>
                      {card.suit}
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold leading-none rotate-180">
                      <span>{card.value}</span>
                      <span className={isRed ? 'text-red-600' : 'text-zinc-900'}>{card.suit}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-mono text-emerald-300 font-semibold uppercase tracking-wider">
            <span>YOUR HAND</span>
            {playerHand.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full font-bold ${playerScore > 21 ? 'bg-rose-900 text-rose-200' : 'bg-emerald-900/60 text-emerald-200'}`}>
                {playerScore} {playerScore === 21 && '★'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Control Buttons & Chips Tray */}
      <div className="relative space-y-4">
        {gameState === 'BETTING' || gameState === 'ROUND_OVER' ? (
          <div className="space-y-4">
            {/* Chips selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
              <span className="text-xs font-mono text-zinc-400 font-semibold">SELECT CHIP VALUE:</span>

              <div className="flex items-center gap-2">
                {chips.map((val) => (
                  <button
                    key={val}
                    onClick={() => {
                      setCurrentChip(val);
                      setBetAmount(val);
                      soundEngine.click();
                    }}
                    className={`w-11 h-11 rounded-full font-mono text-xs font-black border-2 flex items-center justify-center transition-transform hover:scale-110 shadow-lg cursor-pointer ${
                      betAmount === val
                        ? 'border-amber-400 scale-105 bg-amber-500 text-zinc-950 ring-2 ring-amber-400/40'
                        : val >= 250
                        ? 'border-purple-500 bg-purple-950 text-purple-200'
                        : val >= 100
                        ? 'border-zinc-300 bg-zinc-900 text-white'
                        : val >= 50
                        ? 'border-blue-500 bg-blue-950 text-blue-200'
                        : 'border-emerald-500 bg-emerald-950 text-emerald-200'
                    }`}
                  >
                    ${val}
                  </button>
                ))}
              </div>

              <div className="font-mono text-xs text-zinc-300">
                STAKE: <span className="text-amber-400 font-bold text-sm">${betAmount}</span>
              </div>
            </div>

            {/* Deal Button */}
            <button
              onClick={handleDeal}
              disabled={betAmount <= 0 || betAmount > balance}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-40 text-zinc-950 font-black text-sm tracking-wide transition-all shadow-xl shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{gameState === 'ROUND_OVER' ? 'DEAL NEXT HAND' : 'PLACE WAGER & DEAL'} (${betAmount})</span>
            </button>
          </div>
        ) : (
          /* In-play action buttons: Hit, Stand, Double Down */
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleHit}
              className="py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm font-mono tracking-wide shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              HIT (+ CARD)
            </button>

            <button
              onClick={handleStand}
              className="py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm font-mono tracking-wide shadow-lg shadow-rose-600/20 cursor-pointer"
            >
              STAND (LOCK)
            </button>

            <button
              onClick={handleDoubleDown}
              disabled={playerHand.length !== 2 || betAmount * 2 > balance}
              className="py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-zinc-950 font-black text-sm font-mono tracking-wide shadow-lg shadow-amber-500/20 cursor-pointer"
              title="Double your bet and receive exactly 1 final card"
            >
              DOUBLE DOWN (2X)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
