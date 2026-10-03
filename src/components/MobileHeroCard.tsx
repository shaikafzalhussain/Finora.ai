import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Camera,
  Bot,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Wallet,
  Zap,
  Eye,
  EyeOff,
  Building,
  ChevronRight,
  ShieldCheck,
  PiggyBank,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { MonthlyStats } from '../utils/financeCalculations';
import { BankAccountDetails } from '../types/finance';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface MobileHeroCardProps {
  userName?: string;
  bankDetails?: BankAccountDetails;
  bankAccounts?: BankAccountDetails[];
  stats: MonthlyStats;
  formattedMonthName: string;
  hideBalanceDefault?: boolean;
  investmentAmount?: number;
  onOpenAddExpense: () => void;
  onOpenScanReceipt: () => void;
  onOpenAskAi: () => void;
  onOpenAddIncome: () => void;
  onOpenAnalytics: () => void;
  onOpenBankDetails: () => void;
}

export const MobileHeroCard: React.FC<MobileHeroCardProps> = ({
  userName = 'Friend',
  bankDetails,
  bankAccounts = [],
  stats,
  formattedMonthName,
  hideBalanceDefault = false,
  investmentAmount = 0,
  onOpenAddExpense,
  onOpenScanReceipt,
  onOpenAskAi,
  onOpenAddIncome,
  onOpenAnalytics,
  onOpenBankDetails,
}) => {
  const [showBalance, setShowBalance] = useState(!hideBalanceDefault);

  const firstName = userName ? userName.trim().split(' ')[0] : 'Friend';

  // Compute total balance from actual user-linked bank accounts (Requirement 1 & 15)
  const accounts: BankAccountDetails[] = bankAccounts.length > 0
    ? bankAccounts
    : bankDetails
    ? [bankDetails]
    : [];

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const hasFinancialActivity = stats.totalIncome > 0 || stats.totalExpenses > 0 || investmentAmount > 0;

  return (
    <div className="space-y-4">
      {/* Refined Main Hero Card */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-white/10 p-5 sm:p-6 shadow-2xl">
        {/* Subtle ambient backdrops */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Top Section: Small refined FINORA AI branding + Prominent User Welcome */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              {/* Refined FINORA AI tag */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-white/5 text-[10px] font-bold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>FINORA AI</span>
              </div>

              {/* Larger primary heading: Welcome back, Afzal */}
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Welcome back, {firstName} 👋</span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Here's your financial overview
              </p>
            </div>

            <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {formattedMonthName}
            </span>
          </div>

          {/* My Total Balance Section with Visibility Toggle */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                My Total Balance
              </span>

              {/* Visibility Toggle 👁 Show / Hide balance */}
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-400 transition-colors px-2 py-0.5 rounded-lg hover:bg-slate-800"
                title={showBalance ? 'Hide balance' : 'Show balance'}
              >
                {showBalance ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[11px]">Hide balance</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-[11px] text-emerald-400 font-semibold">Show balance</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-baseline gap-2">
              <span className="font-mono">
                {showBalance ? formatCurrency(totalBalance) : '••••••••'}
              </span>
            </div>

            {/* Bank Card / Financial Accounts (Below Total Balance - Requirements 1 & 2) */}
            {accounts.length > 0 ? (
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                {accounts.map((acc) => (
                  <button
                    key={acc.id || acc.accountNumberLast4}
                    onClick={onOpenBankDetails}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-white/10 hover:border-emerald-500/40 transition-all text-left group"
                    title={`Manage ${acc.bankName}`}
                  >
                    <Building className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white font-mono">
                      {acc.bankName} ••••{acc.accountNumberLast4 || '0000'}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      {formatCurrency(acc.balance ?? 0)}
                    </span>
                  </button>
                ))}
                <button
                  onClick={onOpenBankDetails}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-dashed border-slate-700 hover:border-emerald-500/40 text-slate-400 hover:text-emerald-400 text-xs font-bold transition-all"
                  title="Add another bank account"
                >
                  + Add
                </button>
              </div>
            ) : (
              <div className="mt-2.5">
                <button
                  onClick={onOpenBankDetails}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-dashed border-slate-700 hover:border-emerald-500/50 transition-all text-slate-400 hover:text-white text-xs font-medium"
                >
                  <Building className="h-3.5 w-3.5 text-slate-500" />
                  <span>+ Link Bank Account</span>
                </button>
              </div>
            )}
          </div>

          {/* Cash Flow Section (Incoming, Spends, Investments, Net) */}
          <div className="pt-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Cash Flow ({formattedMonthName})
            </span>

            {!hasFinancialActivity ? (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 text-center space-y-2">
                <div className="text-2xl font-black text-white font-mono">₹0</div>
                <div className="text-xs font-bold text-slate-200">No financial activity recorded yet</div>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Add your income, expenses, or investments to start seeing your cash flow.
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    onClick={onOpenAddIncome}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-bold text-xs"
                  >
                    + Add Income
                  </button>
                  <button
                    onClick={onOpenAddExpense}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                  >
                    + Add Expense
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Incoming */}
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-emerald-500/20">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-1">
                      <ArrowDownLeft className="h-3 w-3 text-emerald-400" />
                      <span>Incoming</span>
                    </span>
                    <span className="text-sm sm:text-base font-black text-emerald-400 font-mono">
                      {showBalance ? formatCurrency(stats.totalIncome) : '••••••'}
                    </span>
                  </div>

                  {/* Spends */}
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-1">
                      <TrendingDown className="h-3 w-3 text-rose-400" />
                      <span>Spends</span>
                    </span>
                    <span className="text-sm sm:text-base font-black text-white font-mono">
                      {showBalance ? formatCurrency(stats.totalExpenses) : '••••••'}
                    </span>
                  </div>

                  {/* Investments */}
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-indigo-500/20">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-1">
                      <PiggyBank className="h-3 w-3 text-indigo-400" />
                      <span>Investments</span>
                    </span>
                    <span className="text-sm sm:text-base font-black text-indigo-300 font-mono">
                      {showBalance ? formatCurrency(investmentAmount) : '••••••'}
                    </span>
                  </div>

                  {/* Net */}
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-1">
                      <ArrowUpRight className="h-3 w-3 text-teal-400" />
                      <span>Net</span>
                    </span>
                    <span className={`text-sm sm:text-base font-black font-mono ${stats.netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {showBalance ? `${stats.netSavings >= 0 ? '+' : ''}${formatCurrency(stats.netSavings)}` : '••••••'}
                    </span>
                  </div>
                </div>

                {stats.totalBudgetedExpenses > 0 && (
                  <div className="mt-3.5 space-y-1.5">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>
                        Safe-to-Spend: <strong className="text-white">{showBalance ? formatCurrency(stats.remainingBudget) : '••••••'}</strong>
                      </span>
                      <span>{Math.round(stats.budgetUtilizationRate)}% cap used ({stats.daysRemaining}d left)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          stats.budgetUtilizationRate > 100
                            ? 'bg-rose-500'
                            : stats.budgetUtilizationRate > 85
                            ? 'bg-amber-500'
                            : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.min(100, stats.budgetUtilizationRate)}%` }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-5 gap-2 text-center">
        {/* + Add Expense */}
        <button
          onClick={onOpenAddExpense}
          className="p-3 rounded-2xl bg-slate-900 border border-white/10 hover:border-emerald-500/40 active:scale-95 transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm group"
        >
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
            <Plus className="h-4 w-4 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold text-slate-200 truncate w-full">
            + Expense
          </span>
        </button>

        {/* Scan Bill */}
        <button
          onClick={onOpenScanReceipt}
          className="p-3 rounded-2xl bg-slate-900 border border-white/10 hover:border-blue-500/40 active:scale-95 transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm group"
        >
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
            <Camera className="h-4 w-4 stroke-[2.2]" />
          </div>
          <span className="text-[10px] font-bold text-slate-200 truncate w-full">
            Scan Bill
          </span>
        </button>

        {/* Ask AI */}
        <button
          onClick={onOpenAskAi}
          className="p-3 rounded-2xl bg-slate-900 border border-white/10 hover:border-purple-500/40 active:scale-95 transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm group"
        >
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
            <Bot className="h-4 w-4 stroke-[2.2]" />
          </div>
          <span className="text-[10px] font-bold text-slate-200 truncate w-full">
            Ask AI
          </span>
        </button>

        {/* Add Income */}
        <button
          onClick={onOpenAddIncome}
          className="p-3 rounded-2xl bg-slate-900 border border-white/10 hover:border-teal-500/40 active:scale-95 transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm group"
        >
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 group-hover:bg-teal-500/20 transition-colors">
            <Wallet className="h-4 w-4 stroke-[2.2]" />
          </div>
          <span className="text-[10px] font-bold text-slate-200 truncate w-full">
            + Income
          </span>
        </button>

        {/* View Analytics */}
        <button
          onClick={onOpenAnalytics}
          className="p-3 rounded-2xl bg-slate-900 border border-white/10 hover:border-indigo-500/40 active:scale-95 transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm group"
        >
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
            <BarChart3 className="h-4 w-4 stroke-[2.2]" />
          </div>
          <span className="text-[10px] font-bold text-slate-200 truncate w-full">
            Analytics
          </span>
        </button>
      </div>
    </div>
  );
};
