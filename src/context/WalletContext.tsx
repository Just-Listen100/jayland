import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Bet, BetLeg, BetType, LedgerEntry, OddsFormat } from '../types/betting';
import { calculateLiveCashoutValue } from '../utils/oddsEngine';
import { soundEngine } from '../utils/audioFx';

interface WalletContextType {
  userId: string;
  balance: number;
  lockedFunds: number;
  totalNetWorth: number;
  bets: Bet[];
  pendingBets: Bet[];
  settledBets: Bet[];
  ledger: LedgerEntry[];
  oddsFormat: OddsFormat;
  soundEnabled: boolean;
  setOddsFormat: (format: OddsFormat) => void;
  setSoundEnabled: (enabled: boolean) => void;
  placeBet: (params: { type: BetType; amount: number; legs: BetLeg[] }) => { success: boolean; error?: string; bet?: Bet };
  cashoutBet: (betId: string, currentOdds: number) => { success: boolean; error?: string; cashoutAmount?: number };
  settleBet: (betId: string, outcome: 'WON' | 'LOST' | 'CANCELLED') => { success: boolean; error?: string };
  settleGameBets: (gameId: string, winningOutcome: 'home' | 'away' | 'draw') => { settledCount: number };
  deposit: (amount: number) => void;
  resetBankroll: (amount?: number) => void;
  recordCasinoTransaction: (params: {
    betAmount: number;
    winAmount: number;
    gameName: string;
    details: string;
  }) => { success: boolean; netPayout: number; error?: string };
}

const STORAGE_KEY_WALLET = 'propx_wallet_v2';
const STORAGE_KEY_BETS = 'propx_bets_v2';
const STORAGE_KEY_LEDGER = 'propx_ledger_v2';
const STORAGE_KEY_PREFS = 'propx_prefs_v2';

const DEFAULT_USER_ID = 'trader_88019';
const INITIAL_BALANCE = 5000.00;

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const userId = DEFAULT_USER_ID;

  // State
  const [balance, setBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WALLET);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.balance === 'number') return parsed.balance;
      }
    } catch {}
    return INITIAL_BALANCE;
  });

  const [lockedFunds, setLockedFunds] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WALLET);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.lockedFunds === 'number') return parsed.lockedFunds;
      }
    } catch {}
    return 0;
  });

  const [bets, setBets] = useState<Bet[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BETS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [ledger, setLedger] = useState<LedgerEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LEDGER);
      if (saved) return JSON.parse(saved);
    } catch {}
    // Initial seed deposit
    return [
      {
        id: 'led_genesis_01',
        userId: DEFAULT_USER_ID,
        amount: 5000.00,
        type: 'DEPOSIT',
        reference: 'VAULT_GENESIS_ALLOCATION',
        timestamp: Date.now() - 3600000 * 24,
        balanceAfter: 5000.00,
        lockedAfter: 0,
        description: 'Initial institutional liquidity deposit (Instant Settlement Vault)',
      },
    ];
  });

  const [oddsFormat, setOddsFormatState] = useState<OddsFormat>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.oddsFormat) return parsed.oddsFormat;
      }
    } catch {}
    return 'DECIMAL';
  });

  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.soundEnabled === 'boolean') return parsed.soundEnabled;
      }
    } catch {}
    return true;
  });

  // Sync soundEngine setting
  useEffect(() => {
    soundEngine.enabled = soundEnabled;
  }, [soundEnabled]);

  // Persist wallet
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WALLET, JSON.stringify({ balance, lockedFunds }));
    } catch {}
  }, [balance, lockedFunds]);

  // Persist bets
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BETS, JSON.stringify(bets));
    } catch {}
  }, [bets]);

  // Persist ledger
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LEDGER, JSON.stringify(ledger));
    } catch {}
  }, [ledger]);

  // Persist prefs
  const setOddsFormat = (format: OddsFormat) => {
    setOddsFormatState(format);
    try {
      localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify({ oddsFormat: format, soundEnabled }));
    } catch {}
  };

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    try {
      localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify({ oddsFormat, soundEnabled: enabled }));
    } catch {}
  };

  const totalNetWorth = Number((balance + lockedFunds).toFixed(2));
  const pendingBets = bets.filter((b) => b.status === 'PENDING');
  const settledBets = bets.filter((b) => b.status !== 'PENDING');

  /**
   * ATOMIC PLACE BET ENGINE
   * Simulates Prisma row-level lock (`FOR UPDATE`)
   * Decrements available balance, increments locked funds, creates active ticket & ledger row
   */
  const placeBet = useCallback((params: { type: BetType; amount: number; legs: BetLeg[] }) => {
    const { type, amount, legs } = params;
    const stake = parseFloat(amount.toString());

    if (isNaN(stake) || stake <= 0) {
      return { success: false, error: 'Wager amount must be greater than $0.00' };
    }

    if (legs.length === 0) {
      return { success: false, error: 'Slip must contain at least one selection' };
    }

    // Atomic Balance Check
    if (balance < stake) {
      return {
        success: false,
        error: `Insufficient available funds ($${balance.toFixed(2)} available, $${stake.toFixed(2)} requested). Deposit or reduce stake.`,
      };
    }

    // Compute compound odds
    const totalOdds = legs.reduce((acc, leg) => acc * Math.max(1.01, leg.odds), 1.0);
    const potentialPayout = Number((stake * totalOdds).toFixed(2));
    const betId = `bet_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    const newBet: Bet = {
      id: betId,
      userId,
      type,
      amount: stake,
      totalOdds: Number(totalOdds.toFixed(4)),
      payout: potentialPayout,
      status: 'PENDING',
      legs: legs.map((leg) => ({
        ...leg,
        status: 'PENDING',
        currentLiveOdds: leg.odds,
      })),
      placedAt: Date.now(),
      currentLiveOdds: Number(totalOdds.toFixed(4)),
      currentCashoutValue: Number((stake * 0.95).toFixed(2)), // Initial cashout before match drifts
    };

    const newBalance = Number((balance - stake).toFixed(2));
    const newLocked = Number((lockedFunds + stake).toFixed(2));

    const ledgerItem: LedgerEntry = {
      id: `led_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`,
      userId,
      amount: -stake,
      type: 'BET_PLACE',
      reference: betId,
      timestamp: Date.now(),
      balanceAfter: newBalance,
      lockedAfter: newLocked,
      description: `${type === 'PARLAY' ? `${legs.length}-Leg Parlay` : 'Single Bet'} placed @ ${totalOdds.toFixed(2)}x on ${legs.map((l) => l.selectionName).join(' + ')}`,
    };

    setBalance(newBalance);
    setLockedFunds(newLocked);
    setBets((prev) => [newBet, ...prev]);
    setLedger((prev) => [ledgerItem, ...prev]);

    soundEngine.betConfirmed();
    return { success: true, bet: newBet };
  }, [balance, lockedFunds, userId]);

  /**
   * ATOMIC CASHOUT ENGINE
   * Dynamic Net Present Value Cashout settlement:
   * Releases locked stake, credits cashout value, logs CASHOUT in ledger
   */
  const cashoutBet = useCallback((betId: string, currentOdds: number) => {
    const bet = bets.find((b) => b.id === betId);
    if (!bet) {
      return { success: false, error: 'Bet position not found' };
    }

    if (bet.status !== 'PENDING') {
      return { success: false, error: `Position already resolved as ${bet.status}` };
    }

    // Dynamic NPV valuation
    const cashoutVal = calculateLiveCashoutValue(bet.payout, currentOdds, 0.05);

    const newBalance = Number((balance + cashoutVal).toFixed(2));
    const newLocked = Math.max(0, Number((lockedFunds - bet.amount).toFixed(2)));

    const ledgerItem: LedgerEntry = {
      id: `led_co_${Date.now().toString(36)}`,
      userId,
      amount: cashoutVal,
      type: 'CASHOUT',
      reference: betId,
      timestamp: Date.now(),
      balanceAfter: newBalance,
      lockedAfter: newLocked,
      description: `Early Dynamic Cashout on ${bet.type} (${bet.legs.map((l) => l.selectionName).join(', ')}). Locked profit/salvage: $${cashoutVal.toFixed(2)} (Stake was $${bet.amount.toFixed(2)})`,
    };

    setBets((prev) =>
      prev.map((b) =>
        b.id === betId
          ? {
              ...b,
              status: 'CASHED_OUT',
              cashedOutAmount: cashoutVal,
              settledAt: Date.now(),
            }
          : b
      )
    );

    setBalance(newBalance);
    setLockedFunds(newLocked);
    setLedger((prev) => [ledgerItem, ...prev]);

    soundEngine.cashoutWin();
    return { success: true, cashoutAmount: cashoutVal };
  }, [bets, balance, lockedFunds, userId]);

  /**
   * ATOMIC SETTLE BET (WON / LOST / CANCELLED)
   */
  const settleBet = useCallback((betId: string, outcome: 'WON' | 'LOST' | 'CANCELLED') => {
    const bet = bets.find((b) => b.id === betId);
    if (!bet || bet.status !== 'PENDING') {
      return { success: false, error: 'Position not pending' };
    }

    let newBalance = balance;
    let newLocked = Math.max(0, Number((lockedFunds - bet.amount).toFixed(2)));
    let ledgerItem: LedgerEntry | null = null;

    if (outcome === 'WON') {
      newBalance = Number((balance + bet.payout).toFixed(2));
      ledgerItem = {
        id: `led_win_${Date.now().toString(36)}`,
        userId,
        amount: bet.payout,
        type: 'BET_WIN',
        reference: betId,
        timestamp: Date.now(),
        balanceAfter: newBalance,
        lockedAfter: newLocked,
        description: `MATCH WON: Payout for ${bet.type} (${bet.legs.map((l) => l.selectionName).join(' + ')}). Return: +$${bet.payout.toFixed(2)}`,
      };
      soundEngine.cashoutWin();
    } else if (outcome === 'CANCELLED') {
      newBalance = Number((balance + bet.amount).toFixed(2));
      ledgerItem = {
        id: `led_ref_${Date.now().toString(36)}`,
        userId,
        amount: bet.amount,
        type: 'REFUND',
        reference: betId,
        timestamp: Date.now(),
        balanceAfter: newBalance,
        lockedAfter: newLocked,
        description: `MATCH VOID / PUSH: Full stake refund for ${bet.id}`,
      };
    } else {
      // LOST: stake is forfeited to house
      ledgerItem = {
        id: `led_loss_${Date.now().toString(36)}`,
        userId,
        amount: 0,
        type: 'BET_PLACE',
        reference: betId,
        timestamp: Date.now(),
        balanceAfter: newBalance,
        lockedAfter: newLocked,
        description: `MATCH SETTLED LOSS: Stake $${bet.amount.toFixed(2)} captured by house ledger`,
      };
      soundEngine.tickDown();
    }

    setBets((prev) =>
      prev.map((b) =>
        b.id === betId
          ? {
              ...b,
              status: outcome,
              settledAt: Date.now(),
            }
          : b
      )
    );

    setBalance(newBalance);
    setLockedFunds(newLocked);
    if (ledgerItem) {
      setLedger((prev) => [ledgerItem!, ...prev]);
    }

    return { success: true };
  }, [bets, balance, lockedFunds, userId]);

  /**
   * SETTLE ENTIRE GAME CRON / ADMIN SIMULATION
   * Resolves any bets that contain legs from this game
   */
  const settleGameBets = useCallback((gameId: string, winningOutcome: 'home' | 'away' | 'draw') => {
    let settledCount = 0;

    setBets((currentBets) => {
      let currentBal = balance;
      let currentLocked = lockedFunds;
      const newLedgerItems: LedgerEntry[] = [];

      const updated = currentBets.map((bet) => {
        if (bet.status !== 'PENDING') return bet;

        const matchingLegs = bet.legs.filter((l) => l.gameId === gameId);
        if (matchingLegs.length === 0) return bet;

        // Check if all legs in the bet are resolved
        let isBetWinner = true;
        let anyLegLost = false;

        const updatedLegs = bet.legs.map((leg) => {
          if (leg.gameId !== gameId) return leg;

          const legWon = leg.selectionKey === winningOutcome;
          if (!legWon) anyLegLost = true;
          return {
            ...leg,
            status: (legWon ? 'WON' : 'LOST') as 'WON' | 'LOST',
          };
        });

        if (anyLegLost) {
          isBetWinner = false;
        }

        settledCount++;
        const finalStatus = isBetWinner ? 'WON' : 'LOST';

        currentLocked = Math.max(0, Number((currentLocked - bet.amount).toFixed(2)));

        if (isBetWinner) {
          currentBal = Number((currentBal + bet.payout).toFixed(2));
          newLedgerItems.push({
            id: `led_auto_win_${Date.now().toString(36)}_${bet.id}`,
            userId,
            amount: bet.payout,
            type: 'BET_WIN',
            reference: bet.id,
            timestamp: Date.now(),
            balanceAfter: currentBal,
            lockedAfter: currentLocked,
            description: `AUTO-SETTLED CRON: ${bet.type} WON. Winner: ${winningOutcome.toUpperCase()}. Payout: +$${bet.payout.toFixed(2)}`,
          });
        } else {
          newLedgerItems.push({
            id: `led_auto_loss_${Date.now().toString(36)}_${bet.id}`,
            userId,
            amount: 0,
            type: 'BET_PLACE',
            reference: bet.id,
            timestamp: Date.now(),
            balanceAfter: currentBal,
            lockedAfter: currentLocked,
            description: `AUTO-SETTLED CRON: ${bet.type} LOST on game ${gameId}. Result: ${winningOutcome.toUpperCase()}`,
          });
        }

        return {
          ...bet,
          legs: updatedLegs,
          status: finalStatus as 'WON' | 'LOST',
          settledAt: Date.now(),
        };
      });

      if (settledCount > 0) {
        setBalance(currentBal);
        setLockedFunds(currentLocked);
        if (newLedgerItems.length > 0) {
          setLedger((prev) => [...newLedgerItems, ...prev]);
        }
        soundEngine.cashoutWin();
      }

      return updated;
    });

    return { settledCount };
  }, [balance, lockedFunds, userId]);

  /**
   * Deposit demo capital
   */
  const deposit = useCallback((amount: number) => {
    if (amount <= 0) return;
    const newBal = Number((balance + amount).toFixed(2));
    const ledgerItem: LedgerEntry = {
      id: `led_dep_${Date.now().toString(36)}`,
      userId,
      amount,
      type: 'DEPOSIT',
      reference: `VAULT_DEPOSIT_${Date.now().toString(36).toUpperCase()}`,
      timestamp: Date.now(),
      balanceAfter: newBal,
      lockedAfter: lockedFunds,
      description: `Institutional liquidity replenishment: +$${amount.toFixed(2)}`,
    };

    setBalance(newBal);
    setLedger((prev) => [ledgerItem, ...prev]);
    soundEngine.cashoutWin();
  }, [balance, lockedFunds, userId]);

  /**
   * Reset bankroll
   */
  const resetBankroll = useCallback((amount: number = 5000.00) => {
    const ledgerItem: LedgerEntry = {
      id: `led_rst_${Date.now().toString(36)}`,
      userId,
      amount,
      type: 'RESET',
      reference: 'ACCOUNT_RESET',
      timestamp: Date.now(),
      balanceAfter: amount,
      lockedAfter: 0,
      description: `Bankroll re-initialized to standard institutional testing balance $${amount.toFixed(2)}`,
    };

    setBalance(amount);
    setLockedFunds(0);
    setBets([]);
    setLedger((prev) => [ledgerItem, ...prev]);
    soundEngine.click();
  }, [userId]);

  /**
   * RECORD CASINO TRANSACTION (Blackjack, Roulette, Slots, Crash)
   */
  const recordCasinoTransaction = useCallback(
    (params: {
      betAmount: number;
      winAmount: number;
      gameName: string;
      details: string;
    }) => {
      const { betAmount, winAmount, gameName, details } = params;
      const stake = parseFloat(betAmount.toString()) || 0;
      const win = parseFloat(winAmount.toString()) || 0;

      if (stake > balance) {
        return {
          success: false,
          netPayout: 0,
          error: `Insufficient available funds ($${balance.toFixed(2)} available, $${stake.toFixed(2)} required).`,
        };
      }

      const netDelta = Number((win - stake).toFixed(2));
      const newBal = Number((balance + netDelta).toFixed(2));

      const isWin = win > stake;
      const isPush = win === stake;
      const entryType = win > 0 ? 'CASINO_WIN' : 'CASINO_BET';

      const ledgerItem: LedgerEntry = {
        id: `led_cas_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`,
        userId,
        amount: isWin ? netDelta : isPush ? 0 : -stake,
        type: entryType,
        reference: `CASINO_${gameName.toUpperCase()}`,
        timestamp: Date.now(),
        balanceAfter: newBal,
        lockedAfter: lockedFunds,
        description: `[${gameName}] ${details} · Stake: $${stake.toFixed(2)} | Returned: $${win.toFixed(2)} (${netDelta >= 0 ? `+$${netDelta.toFixed(2)}` : `-$${Math.abs(netDelta).toFixed(2)}`})`,
      };

      setBalance(newBal);
      setLedger((prev) => [ledgerItem, ...prev]);

      if (win > stake) {
        soundEngine.cashoutWin();
      } else if (win === 0 && stake > 0) {
        soundEngine.tickDown();
      } else {
        soundEngine.click();
      }

      return { success: true, netPayout: netDelta };
    },
    [balance, lockedFunds, userId]
  );

  return (
    <WalletContext.Provider
      value={{
        userId,
        balance,
        lockedFunds,
        totalNetWorth,
        bets,
        pendingBets,
        settledBets,
        ledger,
        oddsFormat,
        soundEnabled,
        setOddsFormat,
        setSoundEnabled,
        placeBet,
        cashoutBet,
        settleBet,
        settleGameBets,
        deposit,
        resetBankroll,
        recordCasinoTransaction,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
