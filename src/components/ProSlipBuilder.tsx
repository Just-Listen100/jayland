import React, { useState } from 'react';
import { BetLeg, BetType } from '../types/betting';
import { useWallet } from '../context/WalletContext';
import { formatOdds, calculateKellyStake } from '../utils/oddsEngine';
import { 
  Trash2, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  Info, 
  ArrowRight, 
  AlertCircle,
  HelpCircle,
  Layers,
  Zap
} from 'lucide-react';

interface ProSlipBuilderProps {
  slip: BetLeg[];
  onRemoveLeg: (legId: string) => void;
  onClearSlip: () => void;
  onBetPlacedSuccessfully: () => void;
}

export const ProSlipBuilder: React.FC<ProSlipBuilderProps> = ({
  slip,
  onRemoveLeg,
  onClearSlip,
  onBetPlacedSuccessfully,
}) => {
  const { balance, placeBet, oddsFormat } = useWallet();
  const [betType, setBetType] = useState<BetType>('PARLAY');
  const [stake, setStake] = useState<string>('50');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Kelly Criterion Controls
  const [showKellyGuide, setShowKellyGuide] = useState<boolean>(false);
  const [perceivedWinProb, setPerceivedWinProb] = useState<number>(0.56); // 56% estimated edge

  const isParlay = slip.length > 1;
  const stakeNum = parseFloat(stake) || 0;

  // Calculate compound multiplier
  const totalMultiplier = slip.reduce((acc, leg) => acc * Math.max(1.01, leg.odds), 1.0);
  const totalMultiplierFixed = Number(totalMultiplier.toFixed(4));

  const potentialPayout = (stakeNum * totalMultiplierFixed).toFixed(2);
  const netProfit = (stakeNum * totalMultiplierFixed - stakeNum).toFixed(2);

  // Calculate Kelly recommendation
  const kellyResult = calculateKellyStake(balance, totalMultiplierFixed, perceivedWinProb, 0.25);

  const applyKellyStake = () => {
    if (kellyResult.recommendedStake > 0) {
      setStake(kellyResult.recommendedStake.toString());
    }
  };

  const handlePlaceOrder = async () => {
    if (slip.length === 0) return;
    if (stakeNum <= 0) {
      setSubmissionFeedback({ type: 'error', message: 'Please enter a valid stake amount.' });
      return;
    }
    if (stakeNum > balance) {
      setSubmissionFeedback({
        type: 'error',
        message: `Insufficient vault funds! Available: $${balance.toFixed(2)}, Requested: $${stakeNum.toFixed(2)}.`,
      });
      return;
    }

    setIsSubmitting(true);
    setSubmissionFeedback(null);

    // Atomic execution simulation
    const actualType: BetType = slip.length > 1 ? 'PARLAY' : 'SINGLE';
    const res = placeBet({
      type: actualType,
      amount: stakeNum,
      legs: slip,
    });

    setTimeout(() => {
      setIsSubmitting(false);
      if (res.success) {
        setSubmissionFeedback({
          type: 'success',
          message: `Position Locked In! Ref: ${res.bet?.id} | Potential Payout: $${potentialPayout}`,
        });
        onClearSlip();
        onBetPlacedSuccessfully();
      } else {
        setSubmissionFeedback({
          type: 'error',
          message: res.error || 'Failed to place bet.',
        });
      }
    }, 250);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between space-y-5 sticky top-24 shadow-xl">
      {/* Slip Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-base text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Smart Slip Builder</span>
            </h2>
            <span className="bg-amber-400/20 text-amber-400 border border-amber-400/30 font-mono text-xs px-2 py-0.5 rounded-full font-bold">
              {slip.length} {slip.length === 1 ? 'Leg' : 'Legs'}
            </span>
          </div>

          {slip.length > 0 && (
            <button
              onClick={onClearSlip}
              className="text-zinc-500 hover:text-rose-400 text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
              title="Clear all selections"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Strategy Selector (Parlay vs Single) */}
        {slip.length > 1 && (
          <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-950 rounded-xl my-3 border border-zinc-800 text-xs">
            <button
              onClick={() => setBetType('PARLAY')}
              className={`py-1.5 rounded-lg font-bold transition-all ${
                betType === 'PARLAY'
                  ? 'bg-amber-400 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Multi-Leg Parlay ({totalMultiplierFixed.toFixed(2)}x)
            </button>
            <button
              onClick={() => setBetType('SINGLE')}
              className={`py-1.5 rounded-lg font-bold transition-all ${
                betType === 'SINGLE'
                  ? 'bg-amber-400 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Straight Bets ({slip.length}x)
            </button>
          </div>
        )}

        {/* Selected Legs Container */}
        <div className="py-3 space-y-2 max-h-64 overflow-y-auto pr-1">
          {slip.length === 0 ? (
            <div className="text-center py-10 px-4 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40">
              <Zap className="w-6 h-6 text-amber-400 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-zinc-300">Your slip is empty</p>
              <p className="text-xs text-zinc-500 mt-1">
                Click any odds button on the live board to build a single or multi-leg parlay wager.
              </p>
            </div>
          ) : (
            slip.map((leg) => (
              <div
                key={leg.id}
                className="bg-zinc-950/90 border border-zinc-800 p-3 rounded-xl flex items-center justify-between text-xs group hover:border-zinc-700 transition-all"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono uppercase px-1 rounded bg-zinc-800 text-zinc-400">
                      {leg.sport}
                    </span>
                    <span className="text-zinc-400 font-medium">{leg.matchup}</span>
                  </div>
                  <p className="font-bold text-white text-[13px]">{leg.selectionName}</p>
                  <p className="text-[10px] text-zinc-500 font-mono">{leg.marketLabel}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-amber-400 font-black text-sm bg-amber-400/10 px-2 py-1 rounded border border-amber-400/20">
                    {formatOdds(leg.odds, oddsFormat)}
                  </span>
                  <button
                    onClick={() => onRemoveLeg(leg.id)}
                    className="text-zinc-500 hover:text-rose-400 p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Remove from slip"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Compound Multiplier Summary Bar */}
        {slip.length > 0 && (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-400/30 rounded-xl p-3 my-3">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {slip.length > 1 ? `${slip.length}-Leg Parlay Multiplier:` : 'Single Wager Odds:'}
                </span>
              </div>
              <span className="font-mono font-black text-amber-400 text-base">
                {formatOdds(totalMultiplierFixed, oddsFormat)}
              </span>
            </div>
            {slip.length > 1 && (
              <p className="text-[10px] text-zinc-400 font-mono mt-1">
                Compound leverage: all legs must win to collect max payout.
              </p>
            )}
          </div>
        )}

        {/* Stake Input & Presets */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center text-xs text-zinc-400">
            <span className="font-medium text-zinc-300">Wager Stake ($)</span>
            <span className="font-mono text-zinc-400">
              Vault Bal: <span className="text-emerald-400 font-bold">${balance.toFixed(2)}</span>
            </span>
          </div>

          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-base font-bold">
              $
            </span>
            <input
              type="number"
              min="1"
              max={balance}
              step="any"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-400 rounded-xl py-3 pl-8 pr-4 font-mono text-lg text-white font-bold outline-none transition-colors"
              placeholder="0.00"
            />
          </div>

          {/* Quick Stake Buttons */}
          <div className="grid grid-cols-5 gap-1.5 text-xs font-mono">
            {['10', '50', '100', '250'].map((amt) => (
              <button
                key={amt}
                onClick={() => setStake(amt)}
                className="bg-zinc-800 hover:bg-zinc-700 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer text-center"
              >
                ${amt}
              </button>
            ))}
            <button
              onClick={() => setStake(Math.floor(balance).toString())}
              className="bg-zinc-800 hover:bg-zinc-700 py-1.5 rounded-lg border border-zinc-700 text-amber-400 hover:text-amber-300 transition-colors font-bold cursor-pointer text-center"
              title="Bet entire available balance"
            >
              MAX
            </button>
          </div>

          {/* Kelly Criterion Smart Staking Advisor */}
          <div className="border border-zinc-800 rounded-xl p-3 bg-zinc-950/60 text-xs space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Quarter-Kelly Staking Advisor</span>
              </div>
              <button
                onClick={() => setShowKellyGuide(!showKellyGuide)}
                className="text-zinc-500 hover:text-amber-400 text-[11px] flex items-center gap-0.5 cursor-pointer"
              >
                <HelpCircle className="w-3 h-3" />
                <span>Formula</span>
              </button>
            </div>

            {showKellyGuide && (
              <div className="text-[11px] text-zinc-400 p-2 rounded bg-zinc-900 border border-zinc-800 space-y-1 font-mono">
                <p className="text-amber-400 font-bold">Kelly Formula: f* = (b·p - q) / b</p>
                <p>
                  Institutional sportsbooks use Fractional Kelly (0.25) to prevent risk of ruin while
                  optimizing long-term bankroll growth rate.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-400">
                Model Win Edge: <span className="text-amber-400 font-mono font-bold">{Math.round(perceivedWinProb * 100)}%</span>
              </span>
              <input
                type="range"
                min="0.45"
                max="0.75"
                step="0.01"
                value={perceivedWinProb}
                onChange={(e) => setPerceivedWinProb(parseFloat(e.target.value))}
                className="w-24 accent-amber-400 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-zinc-900">
              <span className="text-[11px] text-zinc-400">
                Rec. Stake: <span className="font-mono text-emerald-400 font-bold">${kellyResult.recommendedStake.toFixed(2)}</span> ({kellyResult.kellyPercentage}%)
              </span>
              <button
                onClick={applyKellyStake}
                disabled={kellyResult.recommendedStake <= 0}
                className="px-2.5 py-1 rounded bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 text-[10px] font-bold font-mono transition-colors cursor-pointer disabled:opacity-30"
              >
                APPLY KELLY
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payout Summary & Submission */}
      <div className="pt-3 border-t border-zinc-800 space-y-3">
        <div className="space-y-1.5 text-xs font-mono">
          <div className="flex justify-between text-zinc-400">
            <span>Potential Return:</span>
            <span className="font-bold text-emerald-400 text-base font-mono">
              ${potentialPayout}
            </span>
          </div>
          <div className="flex justify-between text-zinc-500 text-[11px]">
            <span>Net Profit:</span>
            <span className="text-zinc-300">+${netProfit}</span>
          </div>
        </div>

        {/* Feedback Message */}
        {submissionFeedback && (
          <div
            className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
              submissionFeedback.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {submissionFeedback.type === 'success' ? (
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="text-[11px]">{submissionFeedback.message}</span>
          </div>
        )}

        {/* Execution Button */}
        <button
          onClick={handlePlaceOrder}
          disabled={isSubmitting || slip.length === 0 || stakeNum <= 0 || stakeNum > balance}
          className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-black py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer text-sm"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              <span>EXECUTING ATOMIC LEDGER TX...</span>
            </>
          ) : (
            <>
              <span>
                {slip.length > 1 ? `LOCK IN ${slip.length}-LEG PARLAY` : 'LOCK IN WAGER SLIP'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-[10px] text-zinc-500 text-center font-mono">
          Prisma FOR UPDATE row-level atomic lock simulation protects against double-spending.
        </p>
      </div>
    </div>
  );
};
