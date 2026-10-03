import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Building,
  TrendingDown,
  TrendingUp,
  PieChart,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Bot,
  Zap,
  Filter,
} from 'lucide-react';
import { Category, Transaction, BankAccountDetails } from '../types/finance';
import { MonthlyStats } from '../utils/financeCalculations';
import { formatCurrency, formatPercent, getCategoryIcon } from '../utils/formatters';
import { SavingsHeatmap } from './SavingsHeatmap';

interface AnalyticsViewProps {
  currentMonthTransactions: Transaction[];
  allTransactions: Transaction[];
  categories: Category[];
  bankAccounts?: BankAccountDetails[];
  monthlyStats: MonthlyStats;
  currentMonthKey: string;
  formattedMonthName: string;
  onSelectTransaction?: (transaction: Transaction) => void;
  onAskAiAboutDay?: (summary: string) => void;
  onNavigateToOptimizer?: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  currentMonthTransactions,
  allTransactions,
  categories,
  bankAccounts = [],
  monthlyStats,
  currentMonthKey,
  formattedMonthName,
  onSelectTransaction,
  onAskAiAboutDay,
  onNavigateToOptimizer,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Filter transactions by selected account (Requirement 3)
  const filteredMonthTransactions = useMemo(() => {
    if (selectedAccountId === 'all') return currentMonthTransactions;
    return currentMonthTransactions.filter((t) => {
      if (selectedAccountId === 'cash') {
        return !t.accountId || t.accountId === 'cash';
      }
      return t.accountId === selectedAccountId;
    });
  }, [currentMonthTransactions, selectedAccountId]);

  const filteredAllTransactions = useMemo(() => {
    if (selectedAccountId === 'all') return allTransactions;
    return allTransactions.filter((t) => {
      if (selectedAccountId === 'cash') {
        return !t.accountId || t.accountId === 'cash';
      }
      return t.accountId === selectedAccountId;
    });
  }, [allTransactions, selectedAccountId]);

  // Compute active stats for the filtered account
  const activeStats = useMemo(() => {
    if (selectedAccountId === 'all') return monthlyStats;
    let totalIncome = 0;
    let totalExpenses = 0;
    for (const t of filteredMonthTransactions) {
      if (t.type === 'income') totalIncome += t.amount;
      else if (t.type === 'expense') totalExpenses += t.amount;
    }
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;
    return {
      ...monthlyStats,
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
    };
  }, [selectedAccountId, monthlyStats, filteredMonthTransactions]);

  // 1. Top Spending Categories with percentage and MoM shift
  const topCategories = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of filteredMonthTransactions) {
      if (t.type === 'expense') {
        map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amount);
      }
    }

    const total = activeStats.totalExpenses || 1;
    return Array.from(map.entries())
      .map(([catId, spent]) => {
        const cat = categoryMap.get(catId);
        return {
          catId,
          name: cat?.name || 'General',
          color: cat?.color || '#a855f7',
          icon: cat?.icon || 'Tag',
          spent,
          percent: (spent / total) * 100,
          budget: cat?.monthlyBudget || spent,
        };
      })
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5);
  }, [filteredMonthTransactions, categoryMap, activeStats]);

  // 2. Top Merchants by Spending
  const topMerchants = useMemo(() => {
    const merchantMap = new Map<string, { amount: number; count: number; categoryId: string }>();

    for (const t of filteredMonthTransactions) {
      if (t.type === 'expense') {
        const current = merchantMap.get(t.merchant) || { amount: 0, count: 0, categoryId: t.categoryId };
        merchantMap.set(t.merchant, {
          amount: current.amount + t.amount,
          count: current.count + 1,
          categoryId: t.categoryId,
        });
      }
    }

    return Array.from(merchantMap.entries())
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        count: data.count,
        category: categoryMap.get(data.categoryId)?.name || 'General',
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [filteredMonthTransactions, categoryMap]);

  // 3. Month-over-Month Comparison
  const momComparison = useMemo(() => {
    const [yStr, mStr] = currentMonthKey.split('-');
    const curYear = parseInt(yStr, 10);
    const curMonth = parseInt(mStr, 10);

    const prevDate = new Date(curYear, curMonth - 2, 1);
    const prevKey = `${prevDate.getFullYear()}-${(prevDate.getMonth() + 1).toString().padStart(2, '0')}`;
    const prevMonthName = new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(prevDate);

    const prevMonthTx = filteredAllTransactions.filter((t) => t.date.startsWith(prevKey));
    const prevExpense = prevMonthTx
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const prevIncome = prevMonthTx
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenseVariance = activeStats.totalExpenses - prevExpense;
    const expenseVariancePct = prevExpense > 0 ? (expenseVariance / prevExpense) * 100 : 0;

    return {
      prevMonthName,
      prevExpense,
      prevIncome,
      expenseVariance,
      expenseVariancePct,
    };
  }, [filteredAllTransactions, currentMonthKey, activeStats]);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Account Filter Bar (Requirement 3) */}
      {bankAccounts && bankAccounts.length > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl bg-slate-900 border border-slate-800">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Multi-Account Analytics
            </span>
            <h3 className="text-sm font-black text-white">Filter Insights by Bank Account</h3>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-emerald-400" />
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="bg-slate-950 border border-slate-700 hover:border-emerald-500 text-white text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Accounts</option>
              {bankAccounts.map((acc) => (
                <option key={acc.id || acc.accountNumberLast4} value={acc.id || acc.accountNumberLast4}>
                  {acc.bankName} ••••{acc.accountNumberLast4}
                </option>
              ))}
              <option value="cash">Cash</option>
            </select>
          </div>
        </div>
      )}

      {/* 1. Monthly Overview Header Bar */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-slate-800 text-center sm:text-left">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Inflow
          </span>
          <div className="text-sm sm:text-2xl font-black text-emerald-400 font-mono">
            {formatCurrency(activeStats.totalIncome)}
          </div>
          <p className="text-[10px] text-slate-500 hidden sm:block mt-1">Recorded earnings</p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-slate-800 text-center sm:text-left">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Outflow
          </span>
          <div className="text-sm sm:text-2xl font-black text-white font-mono">
            {formatCurrency(activeStats.totalExpenses)}
          </div>
          <p className="text-[10px] text-slate-500 hidden sm:block mt-1">Current total</p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-slate-800 text-center sm:text-left">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Saved
          </span>
          <div className={`text-sm sm:text-2xl font-black font-mono ${
            activeStats.netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {activeStats.netSavings >= 0 ? '+' : ''}{formatCurrency(activeStats.netSavings)}
          </div>
          <p className="text-[10px] text-slate-500 hidden sm:block mt-1">
            {Math.round(activeStats.savingsRate)}% rate
          </p>
        </div>
      </div>

      {/* 2. MoM Comparison Pill */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
            Month-over-Month Shift vs {momComparison.prevMonthName}
          </span>
          <div className="text-sm sm:text-base font-extrabold text-white mt-0.5">
            {momComparison.prevExpense === 0 && activeStats.totalExpenses === 0
              ? 'No month-over-month comparison data available yet'
              : momComparison.expenseVariance > 0
              ? `Spending is ₹${Math.round(momComparison.expenseVariance)} higher than last month`
              : `Spending is ₹${Math.abs(Math.round(momComparison.expenseVariance))} lower than last month`}
          </div>
        </div>

        {!(momComparison.prevExpense === 0 && activeStats.totalExpenses === 0) && (
          <div className={`px-3 py-1.5 rounded-2xl text-xs font-black flex items-center gap-1 border ${
            momComparison.expenseVariance > 0
              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
          }`}>
            {momComparison.expenseVariance > 0 ? (
              <>
                <ArrowUpRight className="h-4 w-4" />
                <span>+{Math.round(momComparison.expenseVariancePct)}%</span>
              </>
            ) : (
              <>
                <ArrowDownRight className="h-4 w-4" />
                <span>{Math.round(momComparison.expenseVariancePct)}%</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* 3. NEW REQUESTED COMPONENT: SAVINGS HEATMAP */}
      <SavingsHeatmap
        currentMonthKey={currentMonthKey}
        formattedMonthName={formattedMonthName}
        transactions={filteredMonthTransactions}
        categories={categories}
        totalBudgetedExpenses={activeStats.totalBudgetedExpenses}
        onSelectTransaction={onSelectTransaction}
        onAskAiAboutDay={onAskAiAboutDay}
      />

      {/* 4. Top Spending Categories with Percentages */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PieChart className="h-4 w-4 text-indigo-400" />
              <span>Top Spending Categories</span>
            </h3>
            <p className="text-xs text-slate-400">Where majority of expenses are concentrated</p>
          </div>
          {onNavigateToOptimizer && (
            <button
              onClick={onNavigateToOptimizer}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Optimize →
            </button>
          )}
        </div>

        {topCategories.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-950/60 border border-white/5 text-center space-y-1">
            <p className="text-xs font-bold text-slate-300">No category spending recorded yet</p>
            <p className="text-[11px] text-slate-500">
              Transactions you record will be automatically categorized and tracked here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {topCategories.map((c) => {
              const IconComp = getCategoryIcon(c.icon);

              return (
                <div key={c.catId} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
                  <div className="flex items-center justify-between mb-2 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="p-1.5 rounded-xl"
                        style={{ backgroundColor: `${c.color}20`, color: c.color }}
                      >
                        <IconComp className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-bold text-slate-200">{c.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-white">{formatCurrency(c.spent)}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                        ({Math.round(c.percent)}%)
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (c.spent / c.budget) * 100)}%`,
                        backgroundColor: c.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Top Merchants Analysis */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 shadow-sm">
        <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
          <Building className="h-4 w-4 text-purple-400" />
          <span>Top Merchants This Month</span>
        </h3>

        {topMerchants.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-950/60 border border-white/5 text-center space-y-1">
            <p className="text-xs font-bold text-slate-300">No merchant activity recorded yet</p>
            <p className="text-[11px] text-slate-500">
              Your top vendors and payees will appear here as transactions are logged.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topMerchants.map((m, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-slate-900 text-xs font-bold text-slate-400 flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{m.name}</h4>
                    <span className="text-[10px] text-slate-500">{m.category} • {m.count} order(s)</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black text-white">{formatCurrency(m.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
