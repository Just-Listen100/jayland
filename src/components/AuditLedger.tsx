import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { LedgerEntry } from '../types/betting';
import { 
  FileText, 
  Download, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldCheck, 
  Database,
  Filter,
  CheckCircle2,
  TrendingUp,
  DollarSign
} from 'lucide-react';

export const AuditLedger: React.FC = () => {
  const { ledger, balance, lockedFunds, totalNetWorth, userId } = useWallet();
  const [filterType, setFilterType] = useState<'ALL' | 'BET_PLACE' | 'BET_WIN' | 'CASHOUT' | 'DEPOSIT' | 'CASINO'>('ALL');

  const filteredEntries = ledger.filter((entry) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'CASINO') return entry.type === 'CASINO_BET' || entry.type === 'CASINO_WIN';
    return entry.type === filterType;
  });

  // Calculate volume & metrics
  const totalWagered = ledger
    .filter((e) => e.type === 'BET_PLACE' || e.type === 'CASINO_BET')
    .reduce((acc, e) => acc + Math.abs(e.amount), 0);

  const totalWon = ledger
    .filter((e) => e.type === 'BET_WIN' || e.type === 'CASHOUT' || e.type === 'CASINO_WIN')
    .reduce((acc, e) => acc + e.amount, 0);

  const netPNL = totalWon - totalWagered;

  const handleExportCSV = () => {
    const headers = ['ID', 'Timestamp', 'Type', 'Amount', 'BalanceAfter', 'LockedAfter', 'Reference', 'Description'];
    const rows = ledger.map((e) => [
      e.id,
      new Date(e.timestamp).toISOString(),
      e.type,
      e.amount,
      e.balanceAfter,
      e.lockedAfter,
      e.reference,
      `"${e.description.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `propx_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="flex justify-between items-center text-xs text-zinc-400">
            <span>TOTAL VOLUME WAGERED</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <p className="font-mono text-xl font-black text-white mt-1">
            ${totalWagered.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-zinc-500 font-mono">Row-level locked stakes</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="flex justify-between items-center text-xs text-zinc-400">
            <span>TOTAL RETURNS &amp; CASHOUTS</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="font-mono text-xl font-black text-emerald-400 mt-1">
            ${totalWon.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-zinc-500 font-mono">Settled wins + early NPV liquidity</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="flex justify-between items-center text-xs text-zinc-400">
            <span>CUMULATIVE NET P&amp;L</span>
            <span className={`text-xs font-bold ${netPNL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netPNL >= 0 ? 'PROFIT' : 'DRAWDOWN'}
            </span>
          </div>
          <p className={`font-mono text-xl font-black mt-1 ${netPNL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netPNL >= 0 ? `+$${netPNL.toFixed(2)}` : `-$${Math.abs(netPNL).toFixed(2)}`}
          </p>
          <span className="text-[11px] text-zinc-500 font-mono">Realized ledger balance delta</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="flex justify-between items-center text-xs text-zinc-400">
            <span>TOTAL AUDIT ENTRIES</span>
            <Database className="w-4 h-4 text-amber-400" />
          </div>
          <p className="font-mono text-xl font-black text-amber-400 mt-1">
            {ledger.length} TXs
          </p>
          <span className="text-[11px] text-zinc-500 font-mono">Account ID: {userId}</span>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
        {/* Table Controls */}
        <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-white">Immutable Double-Entry Ledger</h3>
            <span className="text-zinc-500 text-xs font-mono">· ACID Audited</span>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            {/* Filter */}
            <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-1 border border-zinc-800 text-xs font-mono">
              <span className="text-zinc-500 px-1 hidden md:inline">TYPE:</span>
              {(['ALL', 'BET_PLACE', 'BET_WIN', 'CASHOUT', 'CASINO', 'DEPOSIT'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-2 py-1 rounded text-[11px] transition-colors ${
                    filterType === t
                      ? 'bg-amber-400 text-zinc-950 font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {t.replace('BET_', '')}
                </button>
              ))}
            </div>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-mono border border-zinc-700 transition-colors cursor-pointer"
              title="Download CSV report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-950 text-zinc-400 text-[11px] uppercase border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Balance After</th>
                <th className="py-3 px-4">Locked After</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500">
                    No transactions match current filter.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const isPositive = entry.amount > 0;
                  const isZero = entry.amount === 0;

                  return (
                    <tr key={entry.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-zinc-400">
                        {new Date(entry.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            entry.type === 'BET_WIN'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : entry.type === 'CASHOUT'
                              ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30'
                              : entry.type === 'CASINO_WIN'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : entry.type === 'CASINO_BET'
                              ? 'bg-zinc-800 text-purple-300 border border-zinc-700'
                              : entry.type === 'BET_PLACE'
                              ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                              : entry.type === 'DEPOSIT'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {entry.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-bold">
                        <span
                          className={
                            isPositive
                              ? 'text-emerald-400'
                              : isZero
                              ? 'text-zinc-500'
                              : 'text-rose-400'
                          }
                        >
                          {isPositive ? `+$${entry.amount.toFixed(2)}` : isZero ? '$0.00' : `-$${Math.abs(entry.amount).toFixed(2)}`}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-white font-semibold">
                        ${entry.balanceAfter.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-amber-400">
                        ${entry.lockedAfter.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-zinc-500 text-[11px]">
                        {entry.reference}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-zinc-400 text-[11px]" title={entry.description}>
                        {entry.description}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
