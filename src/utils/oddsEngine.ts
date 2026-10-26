import { OddsFormat } from '../types/betting';

/**
 * Format decimal odds into user-selected representation:
 * - DECIMAL: e.g. "2.45x"
 * - AMERICAN: e.g. "+145" or "-120"
 * - FRACTIONAL: e.g. "29/20"
 */
export function formatOdds(decimalOdds: number, format: OddsFormat = 'DECIMAL'): string {
  if (decimalOdds <= 1) return format === 'DECIMAL' ? '1.01x' : '+100';

  if (format === 'DECIMAL') {
    return `${decimalOdds.toFixed(2)}x`;
  }

  if (format === 'AMERICAN') {
    if (decimalOdds >= 2.0) {
      const val = Math.round((decimalOdds - 1) * 100);
      return `+${val}`;
    } else {
      const val = Math.round(100 / (decimalOdds - 1));
      return `-${val}`;
    }
  }

  if (format === 'FRACTIONAL') {
    return decimalToFraction(decimalOdds - 1);
  }

  return `${decimalOdds.toFixed(2)}x`;
}

/**
 * Convert decimal net return into closest common fractional odds (e.g. 1.5 -> 3/2)
 */
function decimalToFraction(val: number): string {
  const tolerance = 0.05;
  const commonDenominators = [1, 2, 3, 4, 5, 8, 10, 20];
  
  let bestNum = Math.round(val);
  let bestDen = 1;
  let minDiff = Math.abs(val - bestNum);

  for (const den of commonDenominators) {
    const num = Math.round(val * den);
    const diff = Math.abs(val - num / den);
    if (diff < minDiff && diff < tolerance) {
      minDiff = diff;
      bestNum = num;
      bestDen = den;
    }
  }

  return bestDen === 1 ? `${bestNum}/1` : `${bestNum}/${bestDen}`;
}

/**
 * Calculate multi-leg parlay odds compounding
 */
export function calculateParlayOdds(legs: { odds: number }[]): number {
  if (legs.length === 0) return 1.0;
  const product = legs.reduce((acc, leg) => acc * Math.max(1.01, leg.odds), 1.0);
  return Number(product.toFixed(4));
}

/**
 * Kelly Criterion Bankroll Management Formula:
 * f* = (b * p - q) / b
 * where:
 * b = decimal odds - 1 (net odds)
 * p = perceived true win probability (e.g. 0.55)
 * q = 1 - p (loss probability)
 * 
 * Fraction: usually 0.25 (Quarter-Kelly) to prevent ruin in volatile sports betting
 */
export function calculateKellyStake(
  bankroll: number,
  decimalOdds: number,
  perceivedWinProb: number = 0.55,
  fraction: number = 0.25
): {
  recommendedStake: number;
  kellyPercentage: number;
  expectedValuePercent: number;
  hasPositiveEV: boolean;
} {
  if (bankroll <= 0 || decimalOdds <= 1.0) {
    return { recommendedStake: 0, kellyPercentage: 0, expectedValuePercent: 0, hasPositiveEV: false };
  }

  const b = decimalOdds - 1.0;
  const p = Math.max(0.01, Math.min(0.99, perceivedWinProb));
  const q = 1.0 - p;

  // Expected Value: (p * (b + 1) - 1) * 100
  const expectedValuePercent = (p * decimalOdds - 1.0) * 100;

  // Full Kelly fraction
  const fullKellyFraction = (b * p - q) / b;

  if (fullKellyFraction <= 0) {
    return {
      recommendedStake: 0,
      kellyPercentage: 0,
      expectedValuePercent: Number(expectedValuePercent.toFixed(2)),
      hasPositiveEV: false,
    };
  }

  // Fractional Kelly (Quarter-Kelly is standard institutional practice)
  const appliedFraction = fullKellyFraction * fraction;
  const rawStake = bankroll * appliedFraction;
  const recommendedStake = Math.max(1, Math.floor(rawStake));

  return {
    recommendedStake: Math.min(bankroll, recommendedStake),
    kellyPercentage: Number((appliedFraction * 100).toFixed(2)),
    expectedValuePercent: Number(expectedValuePercent.toFixed(2)),
    hasPositiveEV: expectedValuePercent > 0,
  };
}

/**
 * Dynamic Auto-Cashout Formula (NPV):
 * Cashout Value = (Potential Payout / Current Live Odds) * (1 - House Cashout Margin)
 */
export const DEFAULT_HOUSE_CASHOUT_MARGIN = 0.05; // 5% liquidity fee

export function calculateLiveCashoutValue(
  potentialPayout: number,
  currentLiveOdds: number,
  houseMargin: number = DEFAULT_HOUSE_CASHOUT_MARGIN
): number {
  if (potentialPayout <= 0 || currentLiveOdds <= 0) return 0;
  
  const rawCashout = potentialPayout / currentLiveOdds;
  const finalCashout = rawCashout * (1 - houseMargin);
  
  // Floor at 0, cap at potential payout * 0.99
  const clamped = Math.max(0.1, Math.min(potentialPayout * 0.99, finalCashout));
  return Number(clamped.toFixed(2));
}

/**
 * Hedging Calculator:
 * When you hold a bet at originalOdds for originalStake, and now the opposing side is at currentOppositeOdds,
 * what stake on the opposite side locks in risk-free profit?
 */
export function calculateHedge(
  originalStake: number,
  originalPayout: number,
  currentOppositeOdds: number
): {
  recommendedHedgeStake: number;
  guaranteedProfit: number;
  roiPercent: number;
} {
  if (currentOppositeOdds <= 1.0) {
    return { recommendedHedgeStake: 0, guaranteedProfit: 0, roiPercent: 0 };
  }

  // To equalize payouts regardless of who wins:
  // HedgeStake = OriginalPayout / CurrentOppositeOdds
  const recommendedHedgeStake = Number((originalPayout / currentOppositeOdds).toFixed(2));
  const totalInvested = originalStake + recommendedHedgeStake;
  const guaranteedProfit = Number((originalPayout - totalInvested).toFixed(2));
  const roiPercent = Number(((guaranteedProfit / totalInvested) * 100).toFixed(2));

  return {
    recommendedHedgeStake,
    guaranteedProfit,
    roiPercent,
  };
}
