import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { LiveGame, SportCategory } from '../types/betting';
import { soundEngine } from '../utils/audioFx';
import { useWallet } from './WalletContext';

interface LiveFeedContextType {
  games: LiveGame[];
  activeSport: SportCategory;
  setActiveSport: (sport: SportCategory) => void;
  isConnected: boolean;
  pingLatency: number;
  isSimulating: boolean;
  setIsSimulating: (sim: boolean) => void;
  triggerGameEvent: (gameId: string, eventType: 'score_home' | 'score_away' | 'momentum_shift' | 'odds_swing') => void;
  settleGameMatch: (gameId: string, winner: 'home' | 'away' | 'draw') => void;
  resetAllGames: () => void;
}

const INITIAL_GAMES: LiveGame[] = [
  {
    id: 'game_nba_celtics_warriors',
    sport: 'NBA',
    league: 'NBA Regular Season',
    homeTeam: {
      name: 'Boston Celtics',
      code: 'BOS',
      score: 88,
      color: '#007A33',
    },
    awayTeam: {
      name: 'Golden State Warriors',
      code: 'GSW',
      score: 84,
      color: '#1D428A',
    },
    status: 'LIVE',
    clock: 'Q3 04:18',
    periodNumber: 3,
    possession: 'home',
    markets: {
      homeOdds: 1.62,
      awayOdds: 2.38,
      homeShift: 'neutral',
      awayShift: 'neutral',
      spreadLine: -3.5,
      spreadHomeOdds: 1.91,
      spreadAwayOdds: 1.91,
      totalLine: 219.5,
      totalOverOdds: 1.88,
      totalUnderOdds: 1.94,
      playerProps: [
        { id: 'p1', playerName: 'Jayson Tatum', statType: 'Points', line: 28.5, overOdds: 1.85, underOdds: 1.95 },
        { id: 'p2', playerName: 'Stephen Curry', statType: '3-Pointers Made', line: 4.5, overOdds: 2.10, underOdds: 1.75 },
      ],
    },
    stats: {
      homeWinProb: 63,
      awayWinProb: 37,
      momentum: 'home',
      keyMetricLabel: 'FG% / Rebounds',
      homeMetric: '48.2% / 34 REB',
      awayMetric: '45.1% / 29 REB',
    },
    lastEvent: 'Tatum baseline pull-up jumper is GOOD (2 pts)',
  },
  {
    id: 'game_epl_arsenal_mancity',
    sport: 'EPL',
    league: 'Premier League Matchday 28',
    homeTeam: {
      name: 'Arsenal FC',
      code: 'ARS',
      score: 1,
      color: '#EF0107',
    },
    awayTeam: {
      name: 'Manchester City',
      code: 'MCI',
      score: 1,
      color: '#6CABDD',
    },
    status: 'LIVE',
    clock: "72'",
    periodNumber: 2,
    possession: 'away',
    markets: {
      homeOdds: 2.95,
      awayOdds: 2.45,
      drawOdds: 3.10,
      homeShift: 'neutral',
      awayShift: 'neutral',
      drawShift: 'neutral',
      spreadLine: 0.0,
      spreadHomeOdds: 2.05,
      spreadAwayOdds: 1.80,
      totalLine: 2.5,
      totalOverOdds: 2.20,
      totalUnderOdds: 1.68,
      playerProps: [
        { id: 'p3', playerName: 'Bukayo Saka', statType: 'Shots on Target', line: 1.5, overOdds: 1.90, underOdds: 1.85 },
        { id: 'p4', playerName: 'Erling Haaland', statType: 'Anytime Goalscorer', line: 0.5, overOdds: 2.15, underOdds: 1.65 },
      ],
    },
    stats: {
      homeWinProb: 34,
      awayWinProb: 41,
      momentum: 'away',
      keyMetricLabel: 'Possession / xG',
      homeMetric: '44% (1.12 xG)',
      awayMetric: '56% (1.48 xG)',
    },
    lastEvent: 'De Bruyne dangerous free kick parried out for corner',
  },
  {
    id: 'game_nfl_chiefs_49ers',
    sport: 'NFL',
    league: 'NFL Championship Week',
    homeTeam: {
      name: 'Kansas City Chiefs',
      code: 'KC',
      score: 21,
      color: '#E31837',
    },
    awayTeam: {
      name: 'San Francisco 49ers',
      code: 'SF',
      score: 17,
      color: '#AA0000',
    },
    status: 'LIVE',
    clock: 'Q4 08:35',
    periodNumber: 4,
    possession: 'away',
    markets: {
      homeOdds: 1.48,
      awayOdds: 2.80,
      homeShift: 'neutral',
      awayShift: 'neutral',
      spreadLine: -2.5,
      spreadHomeOdds: 1.87,
      spreadAwayOdds: 1.95,
      totalLine: 47.5,
      totalOverOdds: 1.91,
      totalUnderOdds: 1.91,
      playerProps: [
        { id: 'p5', playerName: 'Patrick Mahomes', statType: 'Passing Yards', line: 265.5, overOdds: 1.88, underOdds: 1.92 },
        { id: 'p6', playerName: 'Christian McCaffrey', statType: 'Rushing Yards', line: 78.5, overOdds: 1.82, underOdds: 1.98 },
      ],
    },
    stats: {
      homeWinProb: 68,
      awayWinProb: 32,
      momentum: 'even',
      keyMetricLabel: 'Total Yards / Turnovers',
      homeMetric: '312 YDS (0 TO)',
      awayMetric: '284 YDS (1 TO)',
    },
    lastEvent: 'Purdy 14-yd pass complete to Aiyuk for 1st down at midfield',
  },
  {
    id: 'game_tennis_alcaraz_sinner',
    sport: 'TENNIS',
    league: 'US Open Final',
    homeTeam: {
      name: 'Carlos Alcaraz',
      code: 'ALC',
      score: 2, // Sets
      color: '#FFB800',
    },
    awayTeam: {
      name: 'Jannik Sinner',
      code: 'SIN',
      score: 1, // Sets
      color: '#FF4D00',
    },
    status: 'LIVE',
    clock: 'Set 4 (4-3, 30-15)',
    periodNumber: 4,
    possession: 'home',
    markets: {
      homeOdds: 1.36,
      awayOdds: 3.25,
      homeShift: 'neutral',
      awayShift: 'neutral',
      spreadLine: -1.5,
      spreadHomeOdds: 1.75,
      spreadAwayOdds: 2.10,
      totalLine: 38.5,
      totalOverOdds: 1.85,
      totalUnderOdds: 1.95,
    },
    stats: {
      homeWinProb: 74,
      awayWinProb: 26,
      momentum: 'home',
      keyMetricLabel: 'Aces / 1st Serve %',
      homeMetric: '14 Aces (72%)',
      awayMetric: '11 Aces (65%)',
    },
    lastEvent: 'Alcaraz 128mph unreturnable ace down the T',
  },
  {
    id: 'game_esports_faze_navi',
    sport: 'ESPORTS',
    league: 'CS2 Major Grand Final',
    homeTeam: {
      name: 'FaZe Clan',
      code: 'FAZE',
      score: 11,
      color: '#E41C24',
    },
    awayTeam: {
      name: 'Natus Vincere',
      code: 'NAVI',
      score: 9,
      color: '#FFF200',
    },
    status: 'LIVE',
    clock: 'Map 3 (Round 21)',
    periodNumber: 3,
    possession: 'home',
    markets: {
      homeOdds: 1.70,
      awayOdds: 2.15,
      homeShift: 'neutral',
      awayShift: 'neutral',
      spreadLine: -2.5,
      spreadHomeOdds: 1.92,
      spreadAwayOdds: 1.88,
      totalLine: 26.5,
      totalOverOdds: 2.05,
      totalUnderOdds: 1.78,
    },
    stats: {
      homeWinProb: 59,
      awayWinProb: 41,
      momentum: 'home',
      keyMetricLabel: 'ADR / First Kills',
      homeMetric: 'broky 84 ADR (5 FK)',
      awayMetric: 'b1t 79 ADR (3 FK)',
    },
    lastEvent: 'broky clutch 1v2 defuse with 3 seconds remaining',
  },
  {
    id: 'game_nba_lakers_nuggets',
    sport: 'NBA',
    league: 'NBA Western Clash',
    homeTeam: {
      name: 'Los Angeles Lakers',
      code: 'LAL',
      score: 62,
      color: '#552583',
    },
    awayTeam: {
      name: 'Denver Nuggets',
      code: 'DEN',
      score: 65,
      color: '#0E2240',
    },
    status: 'LIVE',
    clock: 'HALFTIME',
    periodNumber: 2,
    markets: {
      homeOdds: 2.25,
      awayOdds: 1.68,
      homeShift: 'neutral',
      awayShift: 'neutral',
      spreadLine: 2.5,
      spreadHomeOdds: 1.90,
      spreadAwayOdds: 1.90,
      totalLine: 226.5,
      totalOverOdds: 1.95,
      totalUnderOdds: 1.85,
    },
    stats: {
      homeWinProb: 42,
      awayWinProb: 58,
      momentum: 'away',
      keyMetricLabel: 'Paint Pts / Fastbreak',
      homeMetric: '32 Paint / 8 FB',
      awayMetric: '38 Paint / 14 FB',
    },
    lastEvent: 'Jokic buzzer-beating tip-in to close the 2nd quarter',
  },
];

const LiveFeedContext = createContext<LiveFeedContextType | undefined>(undefined);

export const LiveFeedProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { settleGameBets } = useWallet();
  const [games, setGames] = useState<LiveGame[]>(INITIAL_GAMES);
  const [activeSport, setActiveSport] = useState<SportCategory>('ALL');
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [pingLatency, setPingLatency] = useState<number>(14);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  // Ping fluctuation simulation (11ms - 22ms)
  useEffect(() => {
    const pingTimer = setInterval(() => {
      setPingLatency(Math.floor(11 + Math.random() * 9));
    }, 4000);
    return () => clearInterval(pingTimer);
  }, []);

  // Main Live Ticker Loop: adjusts odds, updates clock, adds live game atmosphere
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setGames((prevGames) => {
        // Pick one or two random active games to drift
        const targetIndex = Math.floor(Math.random() * prevGames.length);
        const game = prevGames[targetIndex];

        if (!game || game.status === 'FINAL') return prevGames;

        // Random small drift: +/- 0.02 to 0.06
        const delta = (Math.random() - 0.5) * 0.08;
        const newHomeOdds = Number(Math.max(1.05, Math.min(12.0, game.markets.homeOdds + delta)).toFixed(2));
        
        // Inverse drift on away team (with margin preserved)
        const homeShift = delta > 0.01 ? 'up' : delta < -0.01 ? 'down' : 'neutral';
        const awayShift = homeShift === 'up' ? 'down' : homeShift === 'down' ? 'up' : 'neutral';
        
        let newAwayOdds = game.markets.awayOdds;
        if (homeShift === 'up') {
          newAwayOdds = Number(Math.max(1.05, game.markets.awayOdds - Math.abs(delta) * 0.9).toFixed(2));
        } else if (homeShift === 'down') {
          newAwayOdds = Number(Math.min(12.0, game.markets.awayOdds + Math.abs(delta) * 0.9).toFixed(2));
        }

        // Draw odds for soccer if present
        let newDrawOdds = game.markets.drawOdds;
        let drawShift: 'up' | 'down' | 'neutral' = 'neutral';
        if (game.markets.drawOdds) {
          const drawDelta = (Math.random() - 0.5) * 0.04;
          newDrawOdds = Number(Math.max(1.5, Math.min(10.0, game.markets.drawOdds + drawDelta)).toFixed(2));
          drawShift = drawDelta > 0 ? 'up' : 'down';
        }

        // Trigger audio blip if odds changed significantly
        if (Math.abs(delta) >= 0.02) {
          if (homeShift === 'up') soundEngine.tickUp();
          else if (homeShift === 'down') soundEngine.tickDown();
        }

        // Update home/away win probability
        const impliedHomeProb = 1 / newHomeOdds;
        const impliedAwayProb = 1 / newAwayOdds;
        const totalProb = impliedHomeProb + impliedAwayProb;
        const homeWinProb = Math.round((impliedHomeProb / totalProb) * 100);
        const awayWinProb = 100 - homeWinProb;

        const updatedGames = [...prevGames];
        updatedGames[targetIndex] = {
          ...game,
          markets: {
            ...game.markets,
            homeOdds: newHomeOdds,
            awayOdds: newAwayOdds,
            drawOdds: newDrawOdds,
            homeShift,
            awayShift,
            drawShift,
          },
          stats: {
            ...game.stats,
            homeWinProb,
            awayWinProb,
            momentum: homeWinProb > 55 ? 'home' : homeWinProb < 45 ? 'away' : 'even',
          },
        };

        return updatedGames;
      });

      // Clear tick shift highlights after 1.1 seconds
      setTimeout(() => {
        setGames((cur) =>
          cur.map((g) => ({
            ...g,
            markets: {
              ...g.markets,
              homeShift: 'neutral',
              awayShift: 'neutral',
              drawShift: 'neutral',
            },
          }))
        );
      }, 1100);
    }, 2800);

    return () => clearInterval(interval);
  }, [isSimulating]);

  /**
   * Manual event trigger (e.g., home team scores, away team run)
   */
  const triggerGameEvent = useCallback((gameId: string, eventType: 'score_home' | 'score_away' | 'momentum_shift' | 'odds_swing') => {
    setGames((prev) =>
      prev.map((g) => {
        if (g.id !== gameId) return g;

        let homeScore = g.homeTeam.score;
        let awayScore = g.awayTeam.score;
        let newHomeOdds = g.markets.homeOdds;
        let newAwayOdds = g.markets.awayOdds;
        let eventText = g.lastEvent || '';

        if (eventType === 'score_home') {
          if (g.sport === 'NBA') {
            homeScore += 3;
            eventText = `${g.homeTeam.code} SPLASH! 3-pointer connects! (${homeScore}-${awayScore})`;
          } else if (g.sport === 'EPL') {
            homeScore += 1;
            eventText = `GOAL! ${g.homeTeam.name} finds the back of the net! (${homeScore}-${awayScore})`;
          } else if (g.sport === 'NFL') {
            homeScore += 7;
            eventText = `TOUCHDOWN! ${g.homeTeam.name} punches it in! (${homeScore}-${awayScore})`;
          } else {
            homeScore += 1;
            eventText = `${g.homeTeam.name} wins crucial point/round! (${homeScore}-${awayScore})`;
          }
          // Odds shorten for home
          newHomeOdds = Number(Math.max(1.10, newHomeOdds * 0.75).toFixed(2));
          newAwayOdds = Number(Math.min(10.0, newAwayOdds * 1.35).toFixed(2));
        } else if (eventType === 'score_away') {
          if (g.sport === 'NBA') {
            awayScore += 3;
            eventText = `${g.awayTeam.code} answering three-pointer is GOOD! (${homeScore}-${awayScore})`;
          } else if (g.sport === 'EPL') {
            awayScore += 1;
            eventText = `GOAL! ${g.awayTeam.name} equalizes/scores! (${homeScore}-${awayScore})`;
          } else if (g.sport === 'NFL') {
            awayScore += 7;
            eventText = `TOUCHDOWN! ${g.awayTeam.name} takes momentum! (${homeScore}-${awayScore})`;
          } else {
            awayScore += 1;
            eventText = `${g.awayTeam.name} secures key point/round! (${homeScore}-${awayScore})`;
          }
          // Odds lengthen for home, shorten for away
          newHomeOdds = Number(Math.min(10.0, newHomeOdds * 1.35).toFixed(2));
          newAwayOdds = Number(Math.max(1.10, newAwayOdds * 0.75).toFixed(2));
        } else if (eventType === 'odds_swing') {
          // Sharp money / heavy volume swing
          newHomeOdds = Number((newHomeOdds * 1.2).toFixed(2));
          newAwayOdds = Number(Math.max(1.12, newAwayOdds * 0.82).toFixed(2));
          eventText = 'Institutional sharp money influx detected on away line';
        }

        return {
          ...g,
          homeTeam: { ...g.homeTeam, score: homeScore },
          awayTeam: { ...g.awayTeam, score: awayScore },
          markets: {
            ...g.markets,
            homeOdds: newHomeOdds,
            awayOdds: newAwayOdds,
            homeShift: newHomeOdds < g.markets.homeOdds ? 'down' : 'up',
            awayShift: newAwayOdds < g.markets.awayOdds ? 'down' : 'up',
          },
          lastEvent: eventText,
        };
      })
    );
    soundEngine.tickUp();
  }, []);

  /**
   * Settle Match Cron Simulator:
   * Sets game status to 'FINAL', assigns winner, and cascades to Wallet settlement!
   */
  const settleGameMatch = useCallback((gameId: string, winner: 'home' | 'away' | 'draw') => {
    setGames((prev) =>
      prev.map((g) => {
        if (g.id !== gameId) return g;
        return {
          ...g,
          status: 'FINAL',
          clock: 'FINAL',
          winner,
          lastEvent: `MATCH OFFICIAL FINAL: Winner is ${
            winner === 'home' ? g.homeTeam.name : winner === 'away' ? g.awayTeam.name : 'DRAW'
          }`,
        };
      })
    );

    // Call atomic settlement engine for all active tickets!
    settleGameBets(gameId, winner);
  }, [settleGameBets]);

  /**
   * Reset all games to starting state
   */
  const resetAllGames = useCallback(() => {
    setGames(INITIAL_GAMES);
    soundEngine.click();
  }, []);

  return (
    <LiveFeedContext.Provider
      value={{
        games,
        activeSport,
        setActiveSport,
        isConnected,
        pingLatency,
        isSimulating,
        setIsSimulating,
        triggerGameEvent,
        settleGameMatch,
        resetAllGames,
      }}
    >
      {children}
    </LiveFeedContext.Provider>
  );
};

export const useLiveFeed = () => {
  const context = useContext(LiveFeedContext);
  if (!context) {
    throw new Error('useLiveFeed must be used within a LiveFeedProvider');
  }
  return context;
};
