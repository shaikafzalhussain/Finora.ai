import React from 'react';
import { ShieldCheck, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import { MonthlyStats } from '../utils/financeCalculations';

interface FinancialHealthCardProps {
  stats: MonthlyStats;
  score?: number;
  status?: string;
  onAuditClick?: () => void;
}

export const FinancialHealthCard: React.FC<FinancialHealthCardProps> = ({
  stats,
  score,
  status,
  onAuditClick,
}) => {
  // Requirement 21: Do NOT assign a financial health score to a new user without sufficient information
  if (stats.totalIncome === 0 && stats.totalExpenses === 0) {
    return (
      <div className="rounded-2xl sm:rounded-3xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 shadow-sm space-y-2.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-slate-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Financial Health Score
          </h3>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-1">
          <div className="text-sm font-bold text-slate-300">Not available yet</div>
          <p className="text-[11px] text-slate-400">
            Add your financial information to generate your personalized score.
          </p>
        </div>
      </div>
    );
  }

  // Transparent calculation based on actual application data
  const savingsPct = Math.max(0, Math.min(100, Math.round(stats.savingsRate)));
  const budgetPct = Math.max(0, Math.min(100, Math.round(stats.budgetUtilizationRate)));
  const spendingScore = Math.max(0, Math.min(100, Math.round(100 - (stats.totalExpenses / (stats.totalIncome || 1)) * 50)));

  // Derived overall score if not provided by server
  const derivedScore = score ?? Math.min(96, Math.max(45, Math.round(savingsPct * 0.4 + (100 - Math.min(100, budgetPct)) * 0.3 + spendingScore * 0.3)));
  const derivedStatus = status ?? (derivedScore >= 80 ? 'Healthy' : derivedScore >= 65 ? 'Good' : 'Needs Attention');

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Financial Health
          </h3>
        </div>
        {onAuditClick && (
          <button
            onClick={onAuditClick}
            className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
          >
            Audit Details →
          </button>
        )}
      </div>

      {/* Compact Score Row */}
      <div className="flex items-center justify-between gap-4 py-1">
        {/* Score & Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">
              {derivedScore}
            </span>
            <span className="text-xs text-slate-500 font-bold">/100</span>
          </div>

          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-black tracking-tight border ${
              derivedScore >= 80
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : derivedScore >= 65
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
            }`}
          >
            {derivedStatus}
          </span>
        </div>

        {/* 3 Compact Metrics: Savings, Budget, Spending */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 text-right">
          <div className="px-2 py-1 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Savings</span>
            <span className="text-xs font-black text-emerald-400 font-mono">{savingsPct}%</span>
          </div>
          <div className="px-2 py-1 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Budget</span>
            <span className="text-xs font-black text-indigo-400 font-mono">{budgetPct}%</span>
          </div>
          <div className="px-2 py-1 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Spending</span>
            <span className="text-xs font-black text-amber-400 font-mono">{spendingScore}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
