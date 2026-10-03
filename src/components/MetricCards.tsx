import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { MonthlyStats } from '../utils/financeCalculations';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface MetricCardsProps {
  stats: MonthlyStats;
  previousMonthSpend: number;
  onOpenAudit: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  stats,
  previousMonthSpend,
  onOpenAudit,
}) => {
  const isOverBudget = stats.totalExpenses > stats.totalBudgetedExpenses;
  const isProjectedOver = stats.projectedEndMonthSpend > stats.totalBudgetedExpenses;
  const daysLeft = stats.daysRemaining;

  const momDiff = stats.totalExpenses - previousMonthSpend;
  const momPct = previousMonthSpend > 0 ? (momDiff / previousMonthSpend) * 100 : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Monthly Inflow & Net Savings */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Monthly Inflow (Income)
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black tracking-tight text-white">
            {formatCurrency(stats.totalIncome)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span className="text-emerald-400 font-bold">
              {stats.netSavings >= 0 ? `+${formatCurrency(stats.netSavings)}` : formatCurrency(stats.netSavings)} saved
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-bold text-[10px]">
              {formatPercent(Math.max(0, stats.savingsRate))} rate
            </span>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/50 to-teal-500/50" />
      </div>

      {/* 2. Total Outflow & Budget Cap */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Spend & Cap
          </span>
          <div className={`p-2 rounded-xl border ${
            isOverBudget
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
          }`}>
            <Wallet className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black tracking-tight text-white flex items-baseline gap-2">
            <span>{formatCurrency(stats.totalExpenses)}</span>
            <span className="text-xs font-normal text-slate-400">
              {stats.totalBudgetedExpenses > 0 ? `of ${formatCurrency(stats.totalBudgetedExpenses)}` : 'No budget set'}
            </span>
          </div>

          <div className="mt-3">
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>{stats.totalBudgetedExpenses > 0 ? `${Math.round(stats.budgetUtilizationRate)}% utilized` : 'No limit set'}</span>
              <span>Day {stats.dayOfMonth} of {stats.daysInMonth}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  stats.budgetUtilizationRate > 100
                    ? 'bg-rose-500'
                    : stats.budgetUtilizationRate > 85
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, stats.budgetUtilizationRate)}%` }}
              />
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500/50 to-blue-500/50" />
      </div>

      {/* 3. Remaining Headroom & Daily Safe Pacing */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Safe Headroom Remaining
          </span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className={`text-2xl font-black tracking-tight ${
            stats.remainingBudget <= 0 ? 'text-rose-400' : 'text-white'
          }`}>
            {formatCurrency(stats.remainingBudget)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>
              {daysLeft > 0 ? (
                <>
                  <strong className="text-amber-400 font-bold">
                    {formatCurrency(stats.remainingBudget / daysLeft)}
                  </strong>
                  /day safe limit
                </>
              ) : (
                'Month completed'
              )}
            </span>
            <span className="text-slate-500 font-mono text-[11px]">
              {daysLeft}d left
            </span>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/50 to-orange-500/50" />
      </div>

      {/* 4. AI Month-End Run-Rate Forecast & MoM shift */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <span>Month-End Run-Rate</span>
            <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-purple-500/20 text-purple-300">
              AI Forecast
            </span>
          </span>
          <div className={`p-2 rounded-xl border ${
            isProjectedOver
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            {isProjectedOver ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black tracking-tight text-white flex items-baseline gap-1.5">
            <span>{formatCurrency(stats.projectedEndMonthSpend)}</span>
          </div>

          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={`font-bold flex items-center gap-1 ${
              stats.totalBudgetedExpenses === 0
                ? 'text-slate-400'
                : isProjectedOver
                ? 'text-rose-400'
                : 'text-emerald-400'
            }`}>
              {stats.totalBudgetedExpenses === 0 ? (
                <span>No budget cap set</span>
              ) : isProjectedOver ? (
                <>
                  <TrendingDown className="h-3.5 w-3.5" />
                  <span>+{formatCurrency(Math.abs(stats.projectedVariance))} over cap</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>+{formatCurrency(stats.projectedVariance)} under cap</span>
                </>
              )}
            </span>
            <button
              onClick={onOpenAudit}
              className="text-[11px] text-purple-400 hover:text-purple-300 underline font-semibold"
            >
              Analyze
            </button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500/50 to-pink-500/50" />
      </div>
    </div>
  );
};
