import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { Wallet, PlusCircle, CheckCircle2, ShieldCheck, X } from 'lucide-react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose }) => {
  const { deposit, balance } = useWallet();
  const [amount, setAmount] = useState<string>('1000');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDeposit = () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;

    deposit(num);
    setSuccessMsg(`Vault credited with +$${num.toFixed(2)} USD!`);

    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-400/10 text-amber-400">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Deposit Institutional Funds</h3>
            <p className="text-xs text-zinc-400 font-mono">Instant zero-fee vault credit</p>
          </div>
        </div>

        {/* Current Balance */}
        <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex justify-between items-center text-xs font-mono">
          <span className="text-zinc-400">Current Available Vault:</span>
          <span className="text-emerald-400 font-bold text-sm">${balance.toFixed(2)}</span>
        </div>

        {/* Input */}
        <div className="space-y-2">
          <label className="text-xs text-zinc-400 font-mono block">Deposit Amount ($ USD):</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-base font-bold">
              $
            </span>
            <input
              type="number"
              min="10"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-400 rounded-xl py-3 pl-8 pr-4 font-mono text-lg text-white font-bold outline-none"
            />
          </div>

          {/* Quick presets */}
          <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-xs">
            {['250', '500', '1000', '2500'].map((val) => (
              <button
                key={val}
                onClick={() => setAmount(val)}
                className="py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer text-center"
              >
                +${val}
              </button>
            ))}
          </div>
        </div>

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Action */}
        <button
          onClick={handleDeposit}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-black text-sm transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
        >
          CONFIRM INSTANT DEPOSIT
        </button>

        <p className="text-[10px] text-zinc-500 text-center font-mono flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Double-entry ledger transaction created on confirmation</span>
        </p>
      </div>
    </div>
  );
};
