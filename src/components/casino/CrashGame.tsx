import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '../../context/WalletContext';
import { soundEngine } from '../../utils/audioFx';
import { Rocket, Zap, TrendingUp, AlertTriangle, CheckCircle2, DollarSign } from 'lucide-react';

interface OtherBettor {
  name: string;
  stake: number;
  cashedOutAt?: number;
}

export const CrashGame: React.FC = () => {
  const { balance, recordCasinoTransaction } = useWallet();

  const [stake, setStake] = useState<number>(50);
  const [gameState, setGameState] = useState<'IDLE' | 'FLYING' | 'CRASHED' | 'CASHED_OUT'>('IDLE');
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [crashPoint, setCrashPoint] = useState<number>(2.0);
  const [cashedOutAmount, setCashedOutAmount] = useState<number>(0);
  const [otherBettors, setOtherBettors] = useState<OtherBettor[]>([
    { name: 'ApexTrader_01', stake: 250 },
    { name: 'VegasWhale99', stake: 1000 },
    { name: 'CryptoQuant', stake: 75 },
    { name: 'SharpAction_BOS', stake: 500 },
  ]);

  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const startFlight = () => {
    if (gameState === 'FLYING') return;
    if (stake <= 0 || stake > balance) return;

    // Pick random crash point with house edge distribution
    // e.g. 1.05x to 45.0x
    const rand = Math.random();
    let point = 1.0 + Math.pow(Math.E, rand * 2.8) * 0.75;
    if (rand < 0.05) point = 1.05; // Instant crash
    point = Number(point.toFixed(2));

    setCrashPoint(point);
    setMultiplier(1.0);
    setGameState('FLYING');
    setCashedOutAmount(0);
    startTimeRef.current = Date.now();

    soundEngine.click();

    // Reset simulated other bettors
    setOtherBettors([
      { name: 'ApexTrader_01', stake: 250 },
      { name: 'VegasWhale99', stake: 1000 },
      { name: 'CryptoQuant', stake: 75 },
      { name: 'SharpAction_BOS', stake: 500 },
    ]);
  };

  useEffect(() => {
    if (gameState !== 'FLYING') return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      // Exponential curve: multiplier = e^(0.14 * t)
      const currentMult = Number(Math.max(1.0, Math.pow(Math.E, 0.16 * elapsed)).toFixed(2));

      // Simulate other bettors cashing out
      setOtherBettors((prev) =>
        prev.map((b) => {
          if (!b.cashedOutAt && Math.random() < 0.04 && currentMult > 1.3) {
            return { ...b, cashedOutAt: currentMult };
          }
          return b;
        })
      );

      if (currentMult >= crashPoint) {
        // CRASHED!
        clearInterval(interval);
        setMultiplier(crashPoint);
        setGameState('CRASHED');
        soundEngine.tickDown();

        recordCasinoTransaction({
          betAmount: stake,
          winAmount: 0,
          gameName: 'Rocket Crash',
          details: `Crashed at ${crashPoint.toFixed(2)}x before cashout`,
        });
      } else {
        setMultiplier(currentMult);
        if (Math.random() < 0.15) soundEngine.tickUp();
      }
    }, 45);

    return () => clearInterval(interval);
  }, [gameState, crashPoint, stake, recordCasinoTransaction]);

  const handleCashOut = () => {
    if (gameState !== 'FLYING') return;

    const finalMult = multiplier;
    const returnAmount = Number((stake * finalMult).toFixed(2));

    setGameState('CASHED_OUT');
    setCashedOutAmount(returnAmount);
    soundEngine.cashoutWin();

    recordCasinoTransaction({
      betAmount: stake,
      winAmount: returnAmount,
      gameName: 'Rocket Crash',
      details: `Cashed out at ${finalMult.toFixed(2)}x (+$${(returnAmount - stake).toFixed(2)})`,
    });
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-2xl relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-400/10 text-amber-400">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>HIGH-ROLLER ROCKET CRASH MULTIPLIER</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/20 text-amber-400 border border-amber-400/30">
                UP TO 100X MULTIPLIER
              </span>
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Cash out your rocket stake before the explosion to bank exponential profit.
            </p>
          </div>
        </div>

        <div className="font-mono text-xs text-zinc-400">
          VAULT: <span className="text-emerald-400 font-bold">${balance.toFixed(2)}</span>
        </div>
      </div>

      {/* Main Multiplier Screen & Flight Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Rocket Arena (8 cols) */}
        <div className="lg:col-span-8 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 rounded-2xl border border-zinc-800 min-h-[340px] flex flex-col justify-between p-6 relative overflow-hidden">
          {/* Animated Stars & Grid Background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="w-full h-full bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px]" />
          </div>

          <div className="flex justify-between items-center text-xs font-mono text-zinc-500 z-10">
            <span>PROVABLY FAIR RNG</span>
            <span>STATUS: {gameState}</span>
          </div>

          {/* Center Multiplier Display */}
          <div className="text-center z-10 my-auto">
            {gameState === 'CRASHED' ? (
              <div className="space-y-1 animate-bounce">
                <span className="text-5xl lg:text-7xl font-mono font-black text-rose-500">
                  {multiplier.toFixed(2)}x
                </span>
                <p className="text-rose-400 font-mono text-sm font-bold uppercase tracking-widest">
                  EXPLODED / CRASHED!
                </p>
              </div>
            ) : gameState === 'CASHED_OUT' ? (
              <div className="space-y-1 animate-fade-in">
                <span className="text-5xl lg:text-7xl font-mono font-black text-emerald-400">
                  {multiplier.toFixed(2)}x
                </span>
                <p className="text-emerald-300 font-mono text-sm font-bold uppercase tracking-widest">
                  BANKED +${(cashedOutAmount - stake).toFixed(2)}!
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <span
                  className={`text-5xl lg:text-7xl font-mono font-black ${
                    gameState === 'FLYING' ? 'text-amber-400' : 'text-zinc-600'
                  }`}
                >
                  {multiplier.toFixed(2)}x
                </span>
                {gameState === 'FLYING' && (
                  <p className="text-amber-300 font-mono text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-1">
                    <Rocket className="w-4 h-4 animate-pulse" />
                    <span>ROCKET IN ORBIT...</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Bottom flight progress */}
          <div className="z-10 flex justify-between items-center text-xs font-mono text-zinc-400 border-t border-zinc-800/80 pt-3">
            <span>Current Value: ${(stake * multiplier).toFixed(2)}</span>
            <span>Net Profit: +${Math.max(0, stake * multiplier - stake).toFixed(2)}</span>
          </div>
        </div>

        {/* Live Multiplayer Lobby (4 cols) */}
        <div className="lg:col-span-4 bg-zinc-950 rounded-2xl border border-zinc-800 p-4 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-zinc-400">
            <span>LIVE BETTORS</span>
            <span>OUTCOME</span>
          </div>

          <div className="space-y-2">
            {otherBettors.map((bettor, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800/60"
              >
                <div>
                  <span className="text-white font-bold">{bettor.name}</span>
                  <span className="text-zinc-500 block text-[10px]">${bettor.stake}</span>
                </div>
                <div>
                  {bettor.cashedOutAt ? (
                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[11px]">
                      {bettor.cashedOutAt.toFixed(2)}x (+${(bettor.stake * (bettor.cashedOutAt - 1)).toFixed(0)})
                    </span>
                  ) : gameState === 'CRASHED' ? (
                    <span className="text-rose-500 text-[11px]">Busted</span>
                  ) : (
                    <span className="text-zinc-500 text-[11px] animate-pulse">In flight...</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Control Panel: Stake & Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-zinc-400 font-semibold">STAKE:</span>
          {[10, 25, 50, 100, 250].map((amt) => (
            <button
              key={amt}
              onClick={() => setStake(amt)}
              disabled={gameState === 'FLYING'}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                stake === amt
                  ? 'bg-amber-400 text-zinc-950 font-black'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              ${amt}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {gameState === 'FLYING' ? (
            <button
              onClick={handleCashOut}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 font-black text-sm tracking-wide transition-all shadow-xl shadow-emerald-500/30 cursor-pointer animate-pulse flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              <span>CASH OUT NOW (${(stake * multiplier).toFixed(2)})</span>
            </button>
          ) : (
            <button
              onClick={startFlight}
              disabled={stake <= 0 || stake > balance}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-30 text-zinc-950 font-black text-sm tracking-wide transition-all shadow-xl shadow-amber-500/20 cursor-pointer flex items-center gap-2"
            >
              <Rocket className="w-4 h-4" />
              <span>LAUNCH ROCKET (${stake})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
