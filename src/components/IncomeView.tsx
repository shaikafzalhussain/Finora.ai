import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Plus,
  Building,
  Calendar,
  DollarSign,
  Tag,
  Clock,
  Edit2,
  Trash2,
  Sparkles,
  ArrowDownLeft,
  Filter,
} from 'lucide-react';
import { Category, Transaction, BankAccountDetails } from '../types/finance';
import { formatCurrency, formatDate, getCategoryIcon } from '../utils/formatters';

interface IncomeViewProps {
  transactions: Transaction[];
  categories: Category[];
  bankAccounts?: BankAccountDetails[];
  formattedMonthName: string;
  onOpenAddIncome: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const IncomeView: React.FC<IncomeViewProps> = ({
  transactions,
  categories,
  bankAccounts = [],
  formattedMonthName,
  onOpenAddIncome,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // All income transactions for the month
  const incomeTransactions = useMemo(() => {
    return transactions.filter((t) => t.type === 'income');
  }, [transactions]);

  // Filtered by account and search query
  const filteredIncome = useMemo(() => {
    return incomeTransactions.filter((t) => {
      if (selectedAccountId !== 'all') {
        if (selectedAccountId === 'cash') {
          if (t.accountId && t.accountId !== 'cash') return false;
        } else if (t.accountId !== selectedAccountId) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const catName = categoryMap.get(t.categoryId)?.name.toLowerCase() || '';
        const matchMerchant = t.merchant.toLowerCase().includes(q);
        const matchNotes = (t.notes || t.description || '').toLowerCase().includes(q);
        const matchCategory = catName.includes(q);
        if (!matchMerchant && !matchNotes && !matchCategory) return false;
      }
      return true;
    });
  }, [incomeTransactions, selectedAccountId, searchQuery, categoryMap]);

  const totalIncome = useMemo(() => {
    return filteredIncome.reduce((sum, t) => sum + t.amount, 0);
  }, [filteredIncome]);

  const topSource = useMemo(() => {
    if (filteredIncome.length === 0) return 'None';
    const sorted = [...filteredIncome].sort((a, b) => b.amount - a.amount);
    return sorted[0].merchant;
  }, [filteredIncome]);

  return (
    <div className="space-y-5 pb-20 md:pb-6">
      {/* Top Header & Add Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Income & Cash Inflow ({formattedMonthName})</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Income Streams & Earnings
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track salaries, client retainers, consulting, dividends, and interest payouts.
          </p>
        </div>

        <button
          onClick={onOpenAddIncome}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>+ Add Income</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Recorded Income
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            {formatCurrency(totalIncome)}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">For {formattedMonthName}</p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Inflow Records
          </span>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {filteredIncome.length}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Entries logged this month</p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Primary Income Source
          </span>
          <div className="text-lg sm:text-2xl font-black text-slate-200 truncate">
            {topSource}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Highest individual inflow</p>
        </div>
      </div>

      {/* Account Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search salary, consulting, client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        {bankAccounts && bankAccounts.length > 1 && (
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-emerald-400" />
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-white text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Deposit Accounts</option>
              {bankAccounts.map((acc) => (
                <option key={acc.id || acc.accountNumberLast4} value={acc.id || acc.accountNumberLast4}>
                  {acc.bankName} ••••{acc.accountNumberLast4}
                </option>
              ))}
              <option value="cash">Cash</option>
            </select>
          </div>
        )}
      </div>

      {/* Income Records List */}
      {filteredIncome.length === 0 ? (
        <div className="rounded-3xl bg-slate-900/40 border border-slate-800 p-8 sm:p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
            <ArrowDownLeft className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white">No income recorded for this month</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Click + Add Income to record salary, consulting fees, dividends, freelance earnings, or other revenue.
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenAddIncome}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors"
            >
              + Add Income
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredIncome.map((tx) => {
            const cat = categoryMap.get(tx.categoryId);
            const IconComp = cat ? getCategoryIcon(cat.icon) : Tag;

            return (
              <div
                key={tx.id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-0.5">
                    <IconComp className="h-4 w-4" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm sm:text-base text-white">
                        {tx.merchant}
                      </span>
                      {tx.isRecurring && (
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                          Recurring
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                      <span>{cat?.name || 'Income'}</span>
                      <span>•</span>
                      <span className="font-mono">{formatDate(tx.date)}</span>
                      {tx.time && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-slate-500">{tx.time}</span>
                        </>
                      )}
                      {tx.accountName && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-slate-300">{tx.accountName}</span>
                        </>
                      )}
                    </div>

                    {(tx.description || tx.notes) && (
                      <p className="text-xs text-slate-400 italic">
                        {tx.description || tx.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-800/80 pt-2 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <span className="text-base sm:text-xl font-black text-emerald-400 font-mono block">
                      +{formatCurrency(tx.amount)}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">
                      {tx.paymentMethod}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEditTransaction(tx)}
                      className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                      title="Edit Income"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteTransaction(tx.id)}
                      className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Delete Income"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
