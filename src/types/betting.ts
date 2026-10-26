export type OddsFormat = 'DECIMAL' | 'AMERICAN' | 'FRACTIONAL';

export type SportCategory = 'ALL' | 'NBA' | 'EPL' | 'NFL' | 'TENNIS' | 'ESPORTS';

export type BetType = 'SINGLE' | 'PARLAY';

export type BetStatus = 'PENDING' | 'WON' | 'LOST' | 'CASHED_OUT' | 'CANCELLED';

export type MarketType = 'MONEYLINE' | 'SPREAD' | 'TOTAL' | 'PLAYER_PROP';

export interface BetLeg {
  id: string;
  gameId: string;
  matchup: string;
  sport: SportCategory;
  selectionName: string;
  selectionKey: string; // e.g. "home", "away", "draw", "over", "under"
  marketType: MarketType;
  marketLabel: string;
  odds: number; // Decimal format (e.g., 2.15)
  status: BetStatus;
  currentLiveOdds?: number;
}

export interface Bet {
  id: string;
  userId: string;
  type: BetType;
  amount: number; // Initial stake
  totalOdds: number; // Combined multiplier
  payout: number; // Max potential payout
  cashedOutAmount?: number;
  status: BetStatus;
  legs: BetLeg[];
  placedAt: number;
  settledAt?: number;
  currentLiveOdds?: number; // Current parlay or leg odds
  currentCashoutValue?: number; // Computed live NPV
}

export interface LedgerEntry {
  id: string;
  userId: string;
  amount: number; // Positive (credit) or negative (debit)
  type: 'BET_PLACE' | 'BET_WIN' | 'CASHOUT' | 'DEPOSIT' | 'REFUND' | 'RESET' | 'CASINO_BET' | 'CASINO_WIN';
  reference: string;
  timestamp: number;
  balanceAfter: number;
  lockedAfter: number;
  description: string;
}

export interface GameMarket {
  homeOdds: number;
  awayOdds: number;
  drawOdds?: number;
  homeShift?: 'up' | 'down' | 'neutral';
  awayShift?: 'up' | 'down' | 'neutral';
  drawShift?: 'up' | 'down' | 'neutral';
  spreadLine?: number; // e.g., -4.5
  spreadHomeOdds?: number;
  spreadAwayOdds?: number;
  totalLine?: number; // e.g., 224.5
  totalOverOdds?: number;
  totalUnderOdds?: number;
  playerProps?: Array<{
    id: string;
    playerName: string;
    statType: string;
    line: number;
    overOdds: number;
    underOdds: number;
  }>;
}

export interface LiveGame {
  id: string;
  sport: SportCategory;
  league: string;
  homeTeam: {
    name: string;
    code: string;
    score: number;
    color: string;
  };
  awayTeam: {
    name: string;
    code: string;
    score: number;
    color: string;
  };
  status: 'LIVE' | 'UPCOMING' | 'HALFTIME' | 'FINAL';
  clock: string; // e.g., "Q3 06:42" or "68'"
  periodNumber: number;
  possession?: 'home' | 'away';
  markets: GameMarket;
  stats: {
    homeWinProb: number; // 0 - 100
    awayWinProb: number;
    momentum: 'home' | 'away' | 'even';
    keyMetricLabel: string;
    homeMetric: string;
    awayMetric: string;
  };
  lastEvent?: string;
  winner?: 'home' | 'away' | 'draw';
}
