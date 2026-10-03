import React, { useState } from 'react';
import {
  X,
  Building,
  CreditCard,
  ShieldCheck,
  Edit2,
  Trash2,
  Plus,
  Check,
  AlertTriangle,
  Lock,
  Star,
  ChevronRight,
  Wallet,
} from 'lucide-react';
import { BankAccountDetails } from '../types/finance';
import { formatCurrency } from '../utils/formatters';

interface BankDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankDetails?: BankAccountDetails;
  bankAccounts?: BankAccountDetails[];
  onUpdateBankAccounts?: (accounts: BankAccountDetails[], primary?: BankAccountDetails) => void;
  onUpdateBankDetails?: (details: BankAccountDetails | undefined) => void;
}

const POPULAR_INDIAN_BANKS = [
  'HDFC Bank',
  'State Bank of India',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Punjab National Bank',
  'Bank of Baroda',
  'IndusInd Bank',
];

export const BankDetailsModal: React.FC<BankDetailsModalProps> = ({
  isOpen,
  onClose,
  bankDetails,
  bankAccounts = [],
  onUpdateBankAccounts,
  onUpdateBankDetails,
}) => {
  const [viewState, setViewState] = useState<'list' | 'add' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states for Add / Edit
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [balance, setBalance] = useState('');
  const [nickname, setNickname] = useState('');
  const [accountType, setAccountType] = useState<'Savings' | 'Salary' | 'Current'>('Savings');
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Accounts list (Strictly from user-linked accounts, no hardcoded demo accounts)
  const accounts: BankAccountDetails[] = bankAccounts.length > 0 
    ? bankAccounts 
    : bankDetails 
      ? [bankDetails] 
      : [];

  const handleOpenAdd = () => {
    setBankName('HDFC Bank');
    setAccountNumber('');
    setBalance('');
    setNickname('');
    setAccountType('Savings');
    setError(null);
    setViewState('add');
  };

  const handleOpenEdit = (acc: BankAccountDetails) => {
    setEditingId(acc.id || acc.accountNumberLast4);
    setBankName(acc.bankName);
    setAccountNumber(acc.rawAccountNumber || acc.accountNumberLast4);
    setBalance(acc.balance?.toString() || '0');
    setNickname(acc.nickname || '');
    setAccountType(acc.accountType || 'Savings');
    setError(null);
    setViewState('edit');
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim()) {
      setError('Please select or enter bank name');
      return;
    }
    const cleanNum = accountNumber.replace(/\D/g, '');
    if (cleanNum.length < 4) {
      setError('Account number must have at least 4 digits');
      return;
    }

    const last4 = cleanNum.slice(-4);
    const newAcc: BankAccountDetails = {
      id: `acc-${Date.now()}`,
      bankName: bankName.trim(),
      accountNumberMasked: `•••• ${last4}`,
      accountNumberLast4: last4,
      accountType: accountType,
      balance: parseFloat(balance) || 0,
      nickname: nickname.trim() || undefined,
      isPrimary: accounts.length === 0,
      rawAccountNumber: cleanNum,
    };

    const updated = [...accounts, newAcc];
    const primary = updated.find((a) => a.isPrimary) || updated[0];
    if (onUpdateBankAccounts) {
      onUpdateBankAccounts(updated, primary);
    } else {
      onUpdateBankDetails?.(primary);
    }
    setViewState('list');
    setError(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim()) {
      setError('Bank name is required');
      return;
    }
    const cleanNum = accountNumber.replace(/\D/g, '');
    if (cleanNum.length < 4) {
      setError('Account number must have at least 4 digits');
      return;
    }

    const last4 = cleanNum.slice(-4);
    const updated = accounts.map((acc) => {
      if ((acc.id && acc.id === editingId) || acc.accountNumberLast4 === editingId) {
        return {
          ...acc,
          bankName: bankName.trim(),
          accountNumberMasked: `•••• ${last4}`,
          accountNumberLast4: last4,
          accountType,
          balance: parseFloat(balance) || 0,
          nickname: nickname.trim() || undefined,
          rawAccountNumber: cleanNum,
        };
      }
      return acc;
    });

    const primary = updated.find((a) => a.isPrimary) || updated[0];
    if (onUpdateBankAccounts) {
      onUpdateBankAccounts(updated, primary);
    } else {
      onUpdateBankDetails?.(primary);
    }
    setViewState('list');
    setEditingId(null);
    setError(null);
  };

  const handleDelete = (idToDelete: string) => {
    if (accounts.length <= 1) {
      setError('You must maintain at least one linked financial account.');
      return;
    }

    const updated = accounts.filter(
      (a) => (a.id && a.id !== idToDelete) && a.accountNumberLast4 !== idToDelete
    );
    const primary = updated.find((a) => a.isPrimary) || updated[0];
    if (primary) primary.isPrimary = true;

    if (onUpdateBankAccounts) {
      onUpdateBankAccounts(updated, primary);
    } else {
      onUpdateBankDetails?.(primary);
    }
    setDeleteConfirmId(null);
  };

  const handleSetPrimary = (accId: string) => {
    const updated = accounts.map((a) => ({
      ...a,
      isPrimary: (a.id === accId || a.accountNumberLast4 === accId),
    }));
    const primary = updated.find((a) => a.isPrimary);
    if (onUpdateBankAccounts) {
      onUpdateBankAccounts(updated, primary);
    } else {
      onUpdateBankDetails?.(primary);
    }
  };

  const totalBankBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-t-[32px] sm:rounded-3xl bg-slate-900 border border-white/10 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Financial Accounts
              </h2>
              <p className="text-[11px] text-slate-400">
                {accounts.length} linked bank account{accounts.length > 1 ? 's' : ''} · Total: {formatCurrency(totalBankBalance)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Security Reassurance Notice */}
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
          <ShieldCheck className="h-4 w-4 flex-shrink-0" />
          <span className="leading-snug">"Your bank details are securely stored and protected."</span>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* VIEW 1: Accounts List */}
        {viewState === 'list' && (
          <div className="space-y-3 pt-1">
            {accounts.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-950/70 border border-white/5 text-center space-y-2.5">
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 w-fit mx-auto">
                  <Building className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-white">No Bank Accounts Linked Yet</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Link your primary bank account to monitor your balance, settlements, and auto-debits.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="mt-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Add Bank Account</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {accounts.map((acc, idx) => {
                const accKey = acc.id || acc.accountNumberLast4;
                const isPrimary = acc.isPrimary;

                return (
                  <div
                    key={accKey || idx}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                      isPrimary
                        ? 'bg-gradient-to-r from-slate-900 to-emerald-950/30 border-emerald-500/40 shadow-lg'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 flex-shrink-0">
                          <Building className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-extrabold text-sm text-white truncate">
                              {acc.bankName}
                            </h4>
                            {isPrimary && (
                              <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Primary
                              </span>
                            )}
                            {acc.nickname && (
                              <span className="text-[10px] text-slate-400">
                                ({acc.nickname})
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 font-mono tracking-wider mt-0.5">
                            {acc.accountNumberMasked || `•••• ${acc.accountNumberLast4}`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Balance
                        </span>
                        <span className="text-sm font-black text-white font-mono">
                          {formatCurrency(acc.balance || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Actions row */}
                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
                      {!isPrimary ? (
                        <button
                          onClick={() => handleSetPrimary(accKey)}
                          className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 font-semibold transition-colors"
                        >
                          <Star className="h-3 w-3" />
                          <span>Set as Primary</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          <span>Default settlement account</span>
                        </span>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(acc)}
                          className="px-2.5 py-1 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>

                        {deleteConfirmId === accKey ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(accKey)}
                              className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 text-[11px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(accKey)}
                            disabled={accounts.length <= 1}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-850 transition-colors disabled:opacity-30"
                            title={accounts.length <= 1 ? 'Cannot delete only account' : 'Remove account'}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}

            {/* Add Bank Account Trigger */}
            <button
              onClick={handleOpenAdd}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-950/50 hover:bg-slate-900/50 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <Plus className="h-4 w-4" />
              <span>+ Add Bank Account</span>
            </button>
          </div>
        )}

        {/* VIEW 2 & 3: Add / Edit Account Form */}
        {(viewState === 'add' || viewState === 'edit') && (
          <form onSubmit={viewState === 'add' ? handleSaveAdd : handleSaveEdit} className="space-y-3.5 pt-1">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-sm font-bold text-white">
                {viewState === 'add' ? 'Add Bank Account' : 'Edit Bank Details'}
              </h3>
              <button
                type="button"
                onClick={() => setViewState('list')}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            {/* Bank Name */}
            <div>
              <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                Bank Name *
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                {POPULAR_INDIAN_BANKS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Account Number */}
            <div>
              <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                Account Number * (Masked on save)
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. 501004821892"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                required
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                Will be displayed as •••• {accountNumber.slice(-4) || '4821'}
              </span>
            </div>

            {/* Current Balance */}
            <div>
              <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                Current Balance (₹) *
              </label>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="e.g. 72500"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            {/* Optional Nickname & Type */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                  Nickname (Optional)
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. Salary, Savings"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                  Account Type
                </label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="Savings">Savings</option>
                  <option value="Salary">Salary</option>
                  <option value="Current">Current</option>
                </select>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewState('list')}
                className="flex-1 py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs transition-colors shadow-md shadow-emerald-500/20"
              >
                {viewState === 'add' ? 'Save Bank Account' : 'Update Account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
