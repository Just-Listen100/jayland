/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { WalletProvider, useWallet } from './context/WalletContext';
import { LiveFeedProvider, useLiveFeed } from './context/LiveFeedContext';
import { BetLeg } from './types/betting';
import { TerminalHeader } from './components/TerminalHeader';
import { LiveOddsTerminal } from './components/LiveOddsTerminal';
import { ProSlipBuilder } from './components/ProSlipBuilder';
import { ActiveBetsHedging } from './components/ActiveBetsHedging';
import { AuditLedger } from './components/AuditLedger';
import { SettlementCronModal } from './components/SettlementCronModal';
import { StrategyGuide } from './components/StrategyGuide';
import { DepositModal } from './components/DepositModal';
import { LiveTvBrowser } from './components/LiveTvBrowser';
import { CasinoLobby } from './components/casino/CasinoLobby';
import { Layers, ChevronUp, ChevronDown, CheckCircle2, Tv, Trophy } from 'lucide-react';

function TerminalApp() {
  const [currentTab, setCurrentTab] = useState<'markets' | 'casino' | 'active_bets' | 'ledger' | 'cron_settlement' | 'strategies'>('markets');
  const [showLiveStream, setShowLiveStream] = useState<boolean>(true);
  const [parlaySlip, setParlaySlip] = useState<BetLeg[]>([]);
  const [isDepositOpen, setIsDepositOpen] = useState<boolean>(false);
  const [cronTargetGameId, setCronTargetGameId] = useState<string | null>(null);
  const [isCronModalOpen, setIsCronModalOpen] = useState<boolean>(false);
  const [mobileSlipExpanded, setMobileSlipExpanded] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { pendingBets } = useWallet();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const handleToggleLeg = (leg: BetLeg) => {
    setParlaySlip((prev) => {
      const exists = prev.some((l) => l.id === leg.id);
      if (exists) {
        return prev.filter((l) => l.id !== leg.id);
      }
      return [...prev, leg];
    });
  };

  const handleRemoveLeg = (legId: string) => {
    setParlaySlip((prev) => prev.filter((l) => l.id !== legId));
  };

  const handleClearSlip = () => {
    setParlaySlip([]);
  };

  const handleOpenCronForGame = (gameId?: string) => {
    if (gameId) setCronTargetGameId(gameId);
    setIsCronModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-400 selection:text-zinc-950">
      {/* Top Header */}
      <TerminalHeader
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenDeposit={() => setIsDepositOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 pb-24 md:pb-12">
        {/* VIEW: LIVE MARKETS */}
        {currentTab === 'markets' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Live Odds Feed & Match Stream Player (7 or 8 columns on large desktop) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-5">
              {/* Live Multi-Game TV Browser */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                    <span className="font-bold font-mono text-white text-xs">
                      LIVE MULTI-GAME TV BROWSER // SIMULCAST MATRIX
                    </span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-400 font-mono text-[11px]">
                      Multi-Screen Live Broadcast Feeds
                    </span>
                  </div>

                  <button
                    onClick={() => setShowLiveStream(!showLiveStream)}
                    className="text-zinc-400 hover:text-amber-400 font-mono text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Tv className="w-3.5 h-3.5 text-amber-400" />
                    <span>{showLiveStream ? 'Collapse TV Browser' : 'Open Multi-Game TV Browser'}</span>
                  </button>
                </div>

                {showLiveStream && (
                  <LiveTvBrowser
                    onToggleLeg={handleToggleLeg}
                    selectedLegs={parlaySlip}
                  />
                )}
              </div>

              {/* Live Odds Feed Cards */}
              <LiveOddsTerminal
                parlaySlip={parlaySlip}
                onToggleLeg={handleToggleLeg}
                onOpenCronModal={handleOpenCronForGame}
              />
            </div>

            {/* Smart Slip & Kelly Staking Builder (5 or 4 columns) - Desktop */}
            <div className="hidden lg:block lg:col-span-5 xl:col-span-4">
              <ProSlipBuilder
                slip={parlaySlip}
                onRemoveLeg={handleRemoveLeg}
                onClearSlip={handleClearSlip}
                onBetPlacedSuccessfully={() => {
                  showToast('Position locked in! Monitor in Active Positions tab.');
                }}
              />
            </div>
          </div>
        )}

        {/* VIEW: 10X BOVADA CASINO & GAMING */}
        {currentTab === 'casino' && <CasinoLobby />}

        {/* VIEW: ACTIVE BETS & CASHOUT HEDGING */}
        {currentTab === 'active_bets' && (
          <ActiveBetsHedging onGoToMarkets={() => setCurrentTab('markets')} />
        )}

        {/* VIEW: AUDIT LEDGER */}
        {currentTab === 'ledger' && <AuditLedger />}

        {/* VIEW: SETTLEMENT CRON ENGINE */}
        {currentTab === 'cron_settlement' && (
          <SettlementCronModal isStandaloneTab={true} />
        )}

        {/* VIEW: STRATEGY & KELLY GUIDE */}
        {currentTab === 'strategies' && <StrategyGuide />}
      </main>

      {/* Mobile Floating Slip Bar & Drawer */}
      {currentTab === 'markets' && parlaySlip.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-900 border-t border-zinc-800 p-3 shadow-2xl">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMobileSlipExpanded(!mobileSlipExpanded)}
              className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer"
            >
              <span className="p-1.5 rounded-lg bg-amber-400 text-zinc-950 font-mono text-[11px] font-black">
                {parlaySlip.length}
              </span>
              <span>{parlaySlip.length === 1 ? 'Straight Slip' : 'Multi-Leg Parlay'}</span>
              {mobileSlipExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setMobileSlipExpanded(true)}
              className="px-4 py-2 rounded-xl bg-amber-400 text-zinc-950 font-black text-xs cursor-pointer shadow-md"
            >
              Review &amp; Stake
            </button>
          </div>

          {mobileSlipExpanded && (
            <div className="mt-3 pt-3 border-t border-zinc-800 max-h-[75vh] overflow-y-auto">
              <ProSlipBuilder
                slip={parlaySlip}
                onRemoveLeg={handleRemoveLeg}
                onClearSlip={() => {
                  handleClearSlip();
                  setMobileSlipExpanded(false);
                }}
                onBetPlacedSuccessfully={() => {
                  setMobileSlipExpanded(false);
                  showToast('Position locked in! Check Active Positions.');
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Pop-up Cron Settlement Modal (when opened from live card) */}
      {isCronModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCronModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white text-lg font-bold"
            >
              ✕
            </button>
            <SettlementCronModal
              selectedGameId={cronTargetGameId}
              onClose={() => setIsCronModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-emerald-500/40 text-emerald-400 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-mono animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <LiveFeedProvider>
        <TerminalApp />
      </LiveFeedProvider>
    </WalletProvider>
  );
}
