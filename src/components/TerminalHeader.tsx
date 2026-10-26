import React from 'react';
import { useWallet } from '../context/WalletContext';
import { useLiveFeed } from '../context/LiveFeedContext';
import { OddsFormat } from '../types/betting';
import { 
  Activity, 
  Volume2, 
  VolumeX, 
  Wallet, 
  Lock, 
  Coins, 
  PlusCircle, 
  RotateCcw, 
  SlidersHorizontal, 
  BookOpen, 
  ListFilter,
  Layers,
  FileText,
  Cpu,
  Trophy,
  Tv,
  Download,
  FileArchive
} from 'lucide-react';

interface TerminalHeaderProps {
  currentTab: 'markets' | 'casino' | 'active_bets' | 'ledger' | 'cron_settlement' | 'strategies';
  setCurrentTab: (tab: 'markets' | 'casino' | 'active_bets' | 'ledger' | 'cron_settlement' | 'strategies') => void;
  onOpenDeposit: () => void;
}

export const TerminalHeader: React.FC<TerminalHeaderProps> = ({
  currentTab,
  setCurrentTab,
  onOpenDeposit,
}) => {
  const { 
    balance, 
    lockedFunds, 
    totalNetWorth, 
    pendingBets, 
    oddsFormat, 
    setOddsFormat, 
    soundEnabled, 
    setSoundEnabled,
    resetBankroll 
  } = useWallet();

  const { isConnected, pingLatency, isSimulating, setIsSimulating } = useLiveFeed();

  const handleOddsFormatCycle = () => {
    const formats: OddsFormat[] = ['DECIMAL', 'AMERICAN', 'FRACTIONAL'];
    const nextIdx = (formats.indexOf(oddsFormat) + 1) % formats.length;
    setOddsFormat(formats[nextIdx]);
  };

  return (
    <header className="border-b border-zinc-800 bg-zinc-950 text-white sticky top-0 z-40 select-none backdrop-blur-md">
      {/* Topmost Institutional Status Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 border-b border-zinc-900 text-xs text-zinc-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono font-medium text-zinc-300">PROP-X QUANT // HIGH-FREQ ODDS FEED</span>
          </div>
          <span className="text-zinc-700">|</span>
          <div className="flex items-center gap-1 font-mono text-[11px] text-zinc-400">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>EDGE WS: {isConnected ? 'CONNECTED' : 'RECONNECTING'}</span>
            <span className="text-emerald-400">({pingLatency}ms)</span>
          </div>
          <span className="text-zinc-700">|</span>
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <span className="text-zinc-500">SIMULATION:</span>
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                isSimulating 
                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {isSimulating ? 'ACTIVE (2.8s TICK)' : 'PAUSED'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Audio toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            title={soundEnabled ? 'Mute Terminal Sounds' : 'Enable Terminal Sounds'}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
            )}
            <span className="text-[11px] font-mono">{soundEnabled ? 'AUDIO ON' : 'MUTED'}</span>
          </button>

          <span className="text-zinc-700">|</span>

          {/* Odds Format Switcher */}
          <button
            onClick={handleOddsFormatCycle}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-[11px] font-mono text-amber-400 border border-zinc-800 transition-colors"
            title="Click to cycle Decimal / American / Fractional"
          >
            <SlidersHorizontal className="w-3 h-3 text-zinc-400" />
            <span>FORMAT: {oddsFormat}</span>
          </button>

          <span className="text-zinc-700">|</span>

          {/* Reset Demo Bankroll */}
          <button
            onClick={() => resetBankroll(5000)}
            className="flex items-center gap-1 px-2 py-0.5 text-zinc-400 hover:text-rose-300 hover:bg-zinc-900 rounded text-[11px] transition-colors"
            title="Reset wallet to $5,000 demo baseline"
          >
            <RotateCcw className="w-3 h-3" />
            <span>RESET DEMO</span>
          </button>

          <span className="text-zinc-700">|</span>

          {/* Download Complete Project ZIP */}
          <a
            href="/propx-sportsbook-casino-v1.0.0.zip"
            download="propx-sportsbook-casino-v1.0.0.zip"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border border-amber-400/30 text-[11px] font-mono font-bold transition-all shadow-sm"
            title="Download complete project source code ZIP"
          >
            <Download className="w-3 h-3 text-amber-400" />
            <span>DOWNLOAD ZIP</span>
          </a>
        </div>
      </div>

      {/* Main Bar: Brand, Navigation Tabs, and Vault Financial Status */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between px-4 py-3 gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 font-black text-xl tracking-tighter shadow-md shadow-amber-500/20">
            PX
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-lg tracking-tight text-white leading-none">
                PROP<span className="text-amber-400">-X</span>
              </h1>
              <span className="text-[10px] font-mono tracking-wider px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/30 font-bold uppercase">
                PRO TERMINAL
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
              Multi-Strategy Odds Engine &amp; Hedging Desk
            </p>
          </div>
        </div>

        {/* View Navigation Tabs */}
        <nav className="flex items-center gap-1 p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl overflow-x-auto text-xs">
          <button
            onClick={() => setCurrentTab('markets')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
              currentTab === 'markets'
                ? 'bg-amber-400 text-zinc-950 shadow-sm font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Sportsbook &amp; Live Video</span>
          </button>

          <button
            onClick={() => setCurrentTab('casino')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap relative ${
              currentTab === 'casino'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 shadow-sm font-bold'
                : 'text-amber-400 hover:text-amber-300 hover:bg-zinc-800/80 bg-amber-400/10 border border-amber-400/20'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>10x Bovada Casino</span>
            <span className={`text-[9px] font-mono font-black px-1.5 py-0.2 rounded ${currentTab === 'casino' ? 'bg-zinc-950 text-amber-400' : 'bg-amber-400 text-zinc-950'}`}>
              VIP
            </span>
          </button>

          <button
            onClick={() => setCurrentTab('active_bets')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
              currentTab === 'active_bets'
                ? 'bg-amber-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Active Positions</span>
            {pendingBets.length > 0 && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                  currentTab === 'active_bets'
                    ? 'bg-zinc-950 text-amber-400'
                    : 'bg-amber-400 text-zinc-950'
                }`}
              >
                {pendingBets.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('ledger')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
              currentTab === 'ledger'
                ? 'bg-amber-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Audit Ledger</span>
          </button>

          <button
            onClick={() => setCurrentTab('cron_settlement')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
              currentTab === 'cron_settlement'
                ? 'bg-amber-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Settlement Cron</span>
          </button>

          <button
            onClick={() => setCurrentTab('strategies')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
              currentTab === 'strategies'
                ? 'bg-amber-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Strategies &amp; Kelly</span>
          </button>
        </nav>

        {/* Financial Vault Balance Display */}
        <div className="flex items-center gap-2">
          {/* Available Balance */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium leading-none">
                Available
              </p>
              <p className="font-mono font-bold text-sm text-emerald-400">
                ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Locked / In Play */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="p-1 rounded-md bg-amber-500/10 text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium leading-none">
                In-Play Locked
              </p>
              <p className="font-mono font-bold text-sm text-amber-400">
                ${lockedFunds.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Deposit / Replenish Button */}
          <button
            onClick={onOpenDeposit}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-bold text-xs transition-all shadow-md shadow-amber-500/10 cursor-pointer"
            title="Deposit funds or add demo capital"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Deposit</span>
          </button>
        </div>
      </div>
    </header>
  );
};
