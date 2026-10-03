import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Download,
  Printer,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Loader2,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { Category, MonthlyReportData, RecurringExpense, Transaction } from '../types/finance';
import { MonthlyStats } from '../utils/financeCalculations';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface MonthlyReportViewProps {
  currentMonthKey: string;
  formattedMonthName: string;
  monthlyStats: MonthlyStats;
  categories: Category[];
  transactions: Transaction[];
  recurring: RecurringExpense[];
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  currentMonthKey,
  formattedMonthName,
  monthlyStats,
  categories,
  transactions,
  recurring,
}) => {
  const [report, setReport] = useState<MonthlyReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/monthly-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthKey: currentMonthKey,
          monthName: formattedMonthName,
          monthlyStats,
          categories,
          transactions,
          recurring,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data: MonthlyReportData = await response.json();
      setReport(data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to generate monthly AI executive report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-800/40 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>End-of-Month AI Executive Review</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Monthly Financial Performance Report — {formattedMonthName}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Synthesizes your total cash inflows, outflows, avoidable spends, and generates an optimized budget allocation for next month in ₹.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {report && (
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Save PDF</span>
            </button>
          )}

          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Compiling AI Report...</span>
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                <span>{report ? 'Regenerate Report' : 'Generate Monthly Report'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Generated Report Card */}
      {report ? (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6 print:border-none print:bg-white print:text-black">
          {/* Executive Summary */}
          <div className="border-b border-slate-800 pb-5">
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
              Executive Assessment
            </span>
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              {report.aiExecutiveSummary}
            </p>
          </div>

          {/* Core Monthly KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block mb-1">Total Income</span>
              <span className="text-lg font-black text-emerald-400">
                {formatCurrency(report.totalIncome)}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block mb-1">Total Expenses</span>
              <span className="text-lg font-black text-white">
                {formatCurrency(report.totalExpenses)}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block mb-1">Net Savings</span>
              <span className="text-lg font-black text-emerald-400">
                {formatCurrency(report.netSavings)}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block mb-1">Savings Rate</span>
              <span className="text-lg font-black text-indigo-400">
                {formatPercent(report.savingsRate)}
              </span>
            </div>
          </div>

          {/* Highlights & Unnecessary Spending Identified */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>Month Highlights & Performance</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {report.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <span>Avoidable & Unnecessary Outflows</span>
              </h4>
              <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 text-xs">
                <span className="text-slate-400 block">Total Discretionary Leakage Identified:</span>
                <span className="text-xl font-black text-rose-400">
                  {formatCurrency(report.unnecessarySpendingIdentified)}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Includes impulsive delivery surcharges, duplicate services, and unused subscription fees.
                </p>
              </div>

              <div className="text-xs text-slate-300 space-y-1">
                <span className="font-semibold text-slate-200">Recommendations for next month:</span>
                {report.strategicRecommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-slate-400">
                    <span className="text-indigo-400 font-bold">→</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Next Month Suggested Budget Plan */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-purple-400" />
              <span>AI Optimized Budget Allocation for Next Month</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {report.nextMonthBudgetPlan.map((plan, i) => {
                const diff = plan.recommendedBudget - plan.currentSpend;
                return (
                  <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 text-xs">
                    <div className="font-bold text-slate-200 truncate">{plan.categoryName}</div>
                    <div className="flex justify-between items-baseline mt-2">
                      <span className="text-slate-400 text-[11px]">Recommended:</span>
                      <span className="font-black text-white">{formatCurrency(plan.recommendedBudget)}</span>
                    </div>
                    <div className="flex justify-between items-baseline text-[10px] text-slate-500 mt-0.5">
                      <span>Spent this month:</span>
                      <span>{formatCurrency(plan.currentSpend)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="p-10 rounded-3xl bg-slate-900/50 border border-slate-800 text-center max-w-lg mx-auto space-y-2">
          <FileText className="h-10 w-10 text-slate-500 mx-auto mb-2 opacity-50" />
          <h3 className="text-base font-bold text-white">Your first report will appear after you start recording financial activity.</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Once you log transactions for {formattedMonthName}, FINORA AI will compile an executive summary with spending breakdowns and budget allocations.
          </p>
        </div>
      ) : (
        <div className="p-10 rounded-3xl bg-slate-900/50 border border-slate-800 text-center max-w-lg mx-auto">
          <FileText className="h-10 w-10 text-indigo-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-white">No Monthly Report Generated Yet</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Generate an executive summary of your income, expenses, savings rate, and next month's recommended budget in INR.
          </p>
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors shadow-md inline-flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            <span>Generate {formattedMonthName} Report</span>
          </button>
        </div>
      )}
    </div>
  );
};
