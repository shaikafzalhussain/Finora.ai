import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Bot,
  RefreshCw,
} from 'lucide-react';
import { Category, Transaction } from '../types/finance';
import { formatCurrency } from '../utils/formatters';

interface BalanceInsightsCardProps {
  currentMonthTransactions: Transaction[];
  previousMonthTransactions: Transaction[];
  currentMonthName: string;
  previousMonthName: string;
  categories: Category[];
  totalBalance: number;
}

export const BalanceInsightsCard: React.FC<BalanceInsightsCardProps> = ({
  currentMonthTransactions,
  previousMonthTransactions,
  currentMonthName,
  previousMonthName,
  categories,
  totalBalance,
}) => {
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // 1. Calculate Drivers
  const {
    topIncomeDrivers,
    topSpendingDrivers,
    netCashflow,
    totalIncome,
    totalExpenses,
    prevIncome,
    prevExpenses,
  } = useMemo(() => {
    const incomeTx = currentMonthTransactions.filter((t) => t.type === 'income');
    const expenseTx = currentMonthTransactions.filter((t) => t.type === 'expense');

    const totInc = incomeTx.reduce((sum, t) => sum + t.amount, 0);
    const totExp = expenseTx.reduce((sum, t) => sum + t.amount, 0);
    const net = totInc - totExp;

    const prevInc = previousMonthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const prevExp = previousMonthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const catMap = new Map(categories.map((c) => [c.id, c.name]));

    // Top 3 Spending Drivers
    const spendGroups: Record<string, { name: string; amount: number; merchant: string }> = {};
    for (const t of expenseTx) {
      const key = t.categoryId || t.merchant;
      const catName = catMap.get(t.categoryId) || t.merchant;
      if (!spendGroups[key]) {
        spendGroups[key] = { name: catName, amount: 0, merchant: t.merchant };
      }
      spendGroups[key].amount += t.amount;
    }
    const topSpend = Object.values(spendGroups)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    // Top 3 Income Drivers
    const incomeGroups: Record<string, { name: string; amount: number; merchant: string }> = {};
    for (const t of incomeTx) {
      const key = t.merchant || t.categoryId;
      const name = t.merchant || catMap.get(t.categoryId) || 'Income Source';
      if (!incomeGroups[key]) {
        incomeGroups[key] = { name, amount: 0, merchant: t.merchant };
      }
      incomeGroups[key].amount += t.amount;
    }
    const topInc = Object.values(incomeGroups)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    return {
      topIncomeDrivers: topInc,
      topSpendingDrivers: topSpend,
      netCashflow: net,
      totalIncome: totInc,
      totalExpenses: totExp,
      prevIncome: prevInc,
      prevExpenses: prevExp,
    };
  }, [currentMonthTransactions, previousMonthTransactions, categories]);

  // Deterministic fallback explanation
  const deterministicExplanation = useMemo(() => {
    const isSurplus = netCashflow >= 0;
    const topExpName = topSpendingDrivers[0]?.name || 'Fixed Outflows';
    const topIncName = topIncomeDrivers[0]?.name || 'Primary Salary';

    return `Your balance changed with a net ${isSurplus ? 'surplus' : 'deficit'} of **${formatCurrency(Math.abs(netCashflow))}** for ${currentMonthName}. The largest positive driver was **${topIncName}** (${formatCurrency(topIncomeDrivers[0]?.amount || 0)}), while your primary balance absorber was **${topExpName}** (${formatCurrency(topSpendingDrivers[0]?.amount || 0)}). Compared to ${previousMonthName}, your cashflow retained positive momentum.`;
  }, [netCashflow, topIncomeDrivers, topSpendingDrivers, currentMonthName, previousMonthName]);

  // Generate / Fetch AI Explanation
  const fetchAiInsight = async () => {
    setIsLoadingAi(true);
    try {
      const res = await fetch('/api/ai/balance-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentMonth: currentMonthName,
          previousMonth: previousMonthName,
          netCashflow,
          totalIncome,
          totalExpenses,
          prevIncome,
          prevExpenses,
          totalBalance,
          topIncomeDrivers,
          topSpendingDrivers,
        }),
      });

      if (!res.ok) {
        throw new Error('API request failed');
      }

      const data = await res.json();
      if (data?.explanation) {
        setAiExplanation(data.explanation);
      } else {
        setAiExplanation(deterministicExplanation);
      }
    } catch {
      setAiExplanation(deterministicExplanation);
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Helper to parse markdown-style bold text (**bold**)
  const renderFormattedExplanation = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const isNetPositive = netCashflow >= 0;

  // Requirement 9: Do not display balance insights prematurely without sufficient transaction data
  if (currentMonthTransactions.length < 2) {
    return (
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900/95 via-slate-900 to-indigo-950/70 border border-slate-800/80 p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 sm:p-2 rounded-xl bg-slate-800 text-slate-400 border border-slate-700/50 flex-shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Balance Insights
            </h3>
            <p className="text-[11px] text-slate-400">
              Not enough data yet
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl sm:rounded-2xl bg-slate-950/60 border border-white/5 text-center space-y-1.5">
          <p className="text-xs text-slate-300 font-medium">
            Add some transactions to receive personalized balance insights.
          </p>
          <p className="text-[11px] text-slate-500">
            FINORA AI will analyze your top spending and income drivers once activity is recorded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900/95 via-slate-900 to-indigo-950/70 border border-slate-800/80 p-3.5 sm:p-5 shadow-xl space-y-3 sm:space-y-4 transition-all">
      {/* Subtle ambient lighting gradients */}
      <div className="absolute top-0 right-0 w-36 h-36 sm:w-52 sm:h-52 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-44 sm:h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with clean typographic hierarchy */}
      <div className="flex items-center justify-between gap-2 relative z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex-shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Balance Insights
              </h3>
              <span className="px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                AI Driven
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 truncate">
              Monthly shift explanation vs {previousMonthName}
            </p>
          </div>
        </div>

        <button
          onClick={fetchAiInsight}
          disabled={isLoadingAi}
          className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 active:scale-95 transition-all flex-shrink-0 border border-white/5"
          title="Regenerate balance explanation"
          aria-label="Refresh balance insights"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoadingAi ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>

      {/* Net Change Metric Overview Card */}
      <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-950/60 border border-white/5 flex items-center justify-between gap-2.5 relative z-10">
        <div className="min-w-0">
          <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5 truncate">
            Net Monthly Shift ({currentMonthName})
          </span>
          <span
            className={`text-base sm:text-xl font-bold tracking-tight font-mono ${
              isNetPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isNetPositive ? '+' : ''}{formatCurrency(netCashflow)}
          </span>
        </div>

        <div className="text-right flex-shrink-0">
          <span className="text-[9px] sm:text-[10px] text-slate-400 block mb-0.5 uppercase tracking-wider font-semibold">
            Current Balance
          </span>
          <span className="text-xs sm:text-sm font-bold text-white font-mono">
            {formatCurrency(totalBalance)}
          </span>
        </div>
      </div>

      {/* Top 3 Spending Drivers & Top 3 Income Drivers (Mobile First Layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 relative z-10">
        {/* Top 3 Income Drivers */}
        <div className="p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-950/70 to-emerald-950/20 border border-emerald-500/20 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-400 gap-1">
            <span className="flex items-center gap-1.5 truncate">
              <ArrowUpRight className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">Top 3 Income Drivers</span>
            </span>
            <span className="text-[10px] text-slate-400 flex-shrink-0 font-mono font-medium">
              +{formatCurrency(totalIncome)}
            </span>
          </div>

          <div className="space-y-1.5 pt-0.5">
            {topIncomeDrivers.length > 0 ? (
              topIncomeDrivers.map((driver, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-none gap-2"
                >
                  <span className="text-slate-300 text-[11px] font-medium truncate flex-1 min-w-0">
                    <span className="text-slate-500 font-bold mr-1">{idx + 1}.</span>
                    {driver.name}
                  </span>
                  <span className="font-semibold text-emerald-300 font-mono text-[11px] flex-shrink-0">
                    +{formatCurrency(driver.amount)}
                  </span>
                </div>
              ))
            ) : (
              <span className="text-[11px] text-slate-500 italic block py-1">
                No income entries this month
              </span>
            )}
          </div>
        </div>

        {/* Top 3 Spending Drivers */}
        <div className="p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-950/70 to-rose-950/20 border border-rose-500/20 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-rose-400 gap-1">
            <span className="flex items-center gap-1.5 truncate">
              <ArrowDownRight className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">Top 3 Spending Drivers</span>
            </span>
            <span className="text-[10px] text-slate-400 flex-shrink-0 font-mono font-medium">
              -{formatCurrency(totalExpenses)}
            </span>
          </div>

          <div className="space-y-1.5 pt-0.5">
            {topSpendingDrivers.length > 0 ? (
              topSpendingDrivers.map((driver, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-none gap-2"
                >
                  <span className="text-slate-300 text-[11px] font-medium truncate flex-1 min-w-0">
                    <span className="text-slate-500 font-bold mr-1">{idx + 1}.</span>
                    {driver.name}
                  </span>
                  <span className="font-semibold text-rose-300 font-mono text-[11px] flex-shrink-0">
                    -{formatCurrency(driver.amount)}
                  </span>
                </div>
              ))
            ) : (
              <span className="text-[11px] text-slate-500 italic block py-1">
                No expenses logged yet
              </span>
            )}
          </div>
        </div>
      </div>

      {/* AI Explanation Narrative (Clean mobile typography and formatting) */}
      <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-indigo-950/30 via-slate-900/60 to-purple-950/30 border border-indigo-500/20 text-xs text-slate-200 leading-relaxed flex items-start gap-2.5 relative z-10">
        <Bot className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1 min-w-0 flex-1">
          <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-indigo-300 block">
            AI Balance Explanation
          </span>
          <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed break-words">
            {renderFormattedExplanation(aiExplanation || deterministicExplanation)}
          </p>
        </div>
      </div>
    </div>
  );
};
