import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  DollarSign,
  CheckCircle,
  HelpCircle,
  Flame,
  Brain,
  Zap,
  Target,
  Loader2,
  RefreshCw,
  Scale,
  Lightbulb,
} from 'lucide-react';
import {
  BudgetOptimizationResult,
  Category,
  RecurringExpense,
  SavingsGoal,
  Transaction,
  WhatIfScenarioResult,
} from '../types/finance';
import { formatCurrency } from '../utils/formatters';

interface AIBudgetOptimizerViewProps {
  categories: Category[];
  transactions: Transaction[];
  recurring: RecurringExpense[];
  savingsGoals: SavingsGoal[];
  currentMonthKey: string;
  totalIncome: number;
  totalExpenses: number;
  aiAudit: BudgetOptimizationResult | null;
  onAuditCompleted: (result: BudgetOptimizationResult) => void;
  onApplyBudgetCap: (categoryId: string, newCap: number) => void;
}

export const AIBudgetOptimizerView: React.FC<AIBudgetOptimizerViewProps> = ({
  categories,
  transactions,
  recurring,
  savingsGoals,
  currentMonthKey,
  totalIncome,
  totalExpenses,
  aiAudit,
  onAuditCompleted,
  onApplyBudgetCap,
}) => {
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Scenario Simulator State
  const [scenarioInput, setScenarioInput] = useState('');
  const [isLoadingScenario, setIsLoadingScenario] = useState(false);
  const [scenarioResult, setScenarioResult] = useState<WhatIfScenarioResult | null>(null);
  const [scenarioError, setScenarioError] = useState<string | null>(null);

  const PRESET_SCENARIOS = [
    'What if I cut food delivery by ₹1,500/month?',
    'What if I cancel gym subscription and workout at home saving ₹1,500/mo?',
    'Can I afford a ₹15,000 weekend trip without dipping into emergency reserves?',
    'If I move to a flat saving ₹3,000/mo, how much faster will I reach my emergency fund?',
  ];

  // Requirements 17 & 18: Analyze user data only when sufficient records exist
  const hasSufficientData = transactions.length > 0 || totalIncome > 0 || totalExpenses > 0;

  const realDataCategoryInsight = useMemo(() => {
    if (!hasSufficientData || totalExpenses <= 0) return null;
    const catSpendMap = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === 'expense') {
        catSpendMap.set(t.categoryId, (catSpendMap.get(t.categoryId) || 0) + t.amount);
      }
    }
    let topCatId = '';
    let topCatAmount = 0;
    for (const [id, amt] of catSpendMap.entries()) {
      if (amt > topCatAmount) {
        topCatAmount = amt;
        topCatId = id;
      }
    }
    if (!topCatId || topCatAmount <= 0) return null;
    const catObj = categories.find((c) => c.id === topCatId);
    const catName = catObj ? catObj.name : 'Top Category';
    const percent = Math.round((topCatAmount / totalExpenses) * 100);
    return `Your ${catName} spending represents ${percent}% of your recorded monthly expenses.`;
  }, [hasSufficientData, totalExpenses, transactions, categories]);

  const handleRunAudit = async () => {
    if (!hasSufficientData) {
      setAuditError('Not enough data yet. Add income, expenses, or transactions first.');
      return;
    }
    setIsLoadingAudit(true);
    setAuditError(null);
    try {
      const response = await fetch('/api/ai/optimize-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: currentMonthKey,
          totalIncome,
          totalExpenses,
          categories,
          transactions,
          recurring,
          savingsGoals,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data: BudgetOptimizationResult = await response.json();
      onAuditCompleted(data);
    } catch (err: any) {
      console.error(err);
      setAuditError('Failed to run AI budget audit. Please try again.');
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const handleRunScenario = async (textToRun?: string) => {
    const query = textToRun || scenarioInput;
    if (!query.trim()) return;

    setIsLoadingScenario(true);
    setScenarioError(null);
    setScenarioResult(null);

    try {
      const response = await fetch('/api/ai/simulate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioText: query,
          currentFinances: {
            income: totalIncome,
            expenses: totalExpenses,
            categories: categories.map((c) => ({ name: c.name, budget: c.monthlyBudget })),
            goals: savingsGoals.map((g) => ({ name: g.name, current: g.currentAmount, target: g.targetAmount })),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data: WhatIfScenarioResult = await response.json();
      setScenarioResult(data);
    } catch (err: any) {
      console.error(err);
      setScenarioError('Failed to simulate financial scenario. Please try again.');
    } finally {
      setIsLoadingScenario(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Audit Trigger */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-800/40 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Brain className="h-3.5 w-3.5" />
              <span>Algorithmic Financial Advisor (India ₹)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              AI Budget Optimization & Behavior Audit
            </h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Powered by Google Gemini 3.8 Flash. We analyze your cashflow to explain <strong>what happened, why it happened, and actionable alternatives</strong> to optimize your savings rate in ₹.
            </p>
          </div>

          <div className="flex-shrink-0">
            <button
              onClick={handleRunAudit}
              disabled={isLoadingAudit}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2.5 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {isLoadingAudit ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Auditing Finances in ₹...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>{aiAudit ? 'Re-Run Financial Audit' : 'Run Full AI Health Audit'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {auditError && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-sm flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 flex-shrink-0 text-rose-400" />
          <span>{auditError}</span>
        </div>
      )}

      {/* AI Audit Output Section */}
      {!hasSufficientData ? (
        /* Requirement 17: Zero Data State */
        <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-8 text-center max-w-xl mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center">
            <Brain className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              AI Health Audit
            </span>
            <h3 className="text-lg font-black text-white">Not enough data yet</h3>
          </div>
          <blockquote className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto italic border-l-2 border-indigo-500/40 pl-3 py-1">
            "Add income, expenses, investments, budgets, and other financial information to generate your personalized financial health audit."
          </blockquote>
        </div>
      ) : aiAudit ? (
        <div className="space-y-6">
          {/* Core Product Principle Card: What Happened, Why It Happened, What Could Be Changed */}
          <div className="rounded-3xl bg-slate-900 border border-indigo-500/30 p-6 sm:p-7 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                <span>Behavioral Insight & Decision Audit</span>
              </span>
              <span className="text-xs font-black text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-800/50">
                Potential Savings: ~{formatCurrency(aiAudit.potentialSavings || 0)}/mo
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="text-slate-400 uppercase font-bold text-[10px] block text-amber-300">
                  1. What Happened
                </span>
                <p className="text-slate-200 leading-relaxed">
                  {aiAudit.whatHappened || aiAudit.summary}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="text-slate-400 uppercase font-bold text-[10px] block text-purple-300">
                  2. Why It Happened
                </span>
                <p className="text-slate-200 leading-relaxed">
                  {aiAudit.whyItHappened || "Spending drivers are derived from your recorded expenses."}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="text-slate-400 uppercase font-bold text-[10px] block text-emerald-300">
                  3. What Could Be Changed & Impact
                </span>
                <p className="text-slate-200 leading-relaxed">
                  {aiAudit.alternativeSuggestion || "Actionable alternatives will update as you record more activity."}
                </p>
              </div>
            </div>
          </div>

          {/* Health Score & 50/30/20 Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Health Score Card */}
            <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Financial Health Score
                </span>
                <div className="mt-4 flex items-center gap-4">
                  <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-slate-950 border-4 border-slate-800 shadow-inner">
                    <span className="text-3xl font-black tracking-tight text-white">
                      {aiAudit.healthScore}
                    </span>
                    <span className="absolute -top-1 right-2 text-xs font-semibold text-slate-500">
                      /100
                    </span>
                  </div>
                  <div>
                    <span className={`text-sm font-black px-3 py-1 rounded-full border ${
                      aiAudit.healthScore >= 80
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : aiAudit.healthScore >= 65
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    }`}>
                      {aiAudit.healthStatus}
                    </span>
                    <p className="text-xs text-slate-400 mt-2">
                      Based on savings rate, budget adherence, emergency fund cover, and debt burden.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-300 leading-relaxed italic">
                "{aiAudit.summary}"
              </div>
            </div>

            {/* 50/30/20 Benchmark Card */}
            <div className="lg:col-span-2 rounded-3xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Scale className="h-4 w-4 text-indigo-400" />
                    <span>50/30/20 Rule Benchmark Analysis</span>
                  </span>
                  <span className="text-xs text-slate-400">
                    Needs (50%) • Wants (30%) • Savings (20%)
                  </span>
                </div>

                <div className="mt-4">
                  <div className="h-4 w-full rounded-full bg-slate-950 overflow-hidden flex p-0.5 border border-slate-800">
                    <div
                      className="h-full bg-indigo-500 rounded-l-full transition-all"
                      style={{ width: `${Math.min(100, aiAudit.needsVsWantsAnalysis.needsPercent)}%` }}
                      title={`Needs: ${Math.round(aiAudit.needsVsWantsAnalysis.needsPercent)}%`}
                    />
                    <div
                      className="h-full bg-amber-500 transition-all"
                      style={{ width: `${Math.min(100, aiAudit.needsVsWantsAnalysis.wantsPercent)}%` }}
                      title={`Wants: ${Math.round(aiAudit.needsVsWantsAnalysis.wantsPercent)}%`}
                    />
                    <div
                      className="h-full bg-emerald-500 rounded-r-full transition-all"
                      style={{ width: `${Math.max(0, Math.min(100, aiAudit.needsVsWantsAnalysis.savingsPercent))}%` }}
                      title={`Savings: ${Math.round(aiAudit.needsVsWantsAnalysis.savingsPercent)}%`}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div className="p-2.5 rounded-2xl bg-indigo-950/30 border border-indigo-800/40">
                      <div className="text-[11px] font-medium text-indigo-300">Needs (Rent, Bills, SIP)</div>
                      <div className="text-lg font-black text-indigo-200">
                        {Math.round(aiAudit.needsVsWantsAnalysis.needsPercent)}%
                      </div>
                      <div className="text-[10px] text-slate-400">Target ~50%</div>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-amber-950/30 border border-amber-800/40">
                      <div className="text-[11px] font-medium text-amber-300">Wants (Dining, Shopping)</div>
                      <div className="text-lg font-black text-amber-200">
                        {Math.round(aiAudit.needsVsWantsAnalysis.wantsPercent)}%
                      </div>
                      <div className="text-[10px] text-slate-400">Target ~30%</div>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-emerald-950/30 border border-emerald-800/40">
                      <div className="text-[11px] font-medium text-emerald-300">Savings & Growth</div>
                      <div className="text-lg font-black text-emerald-200">
                        {Math.round(aiAudit.needsVsWantsAnalysis.savingsPercent)}%
                      </div>
                      <div className="text-[10px] text-slate-400">Target ~20%</div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-300 border-t border-slate-800 pt-3">
                {aiAudit.needsVsWantsAnalysis.benchmarkComparison}
              </p>
            </div>
          </div>

          {/* Identified Financial Leaks */}
          {aiAudit.leakages && aiAudit.leakages.length > 0 && (
            <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="h-5 w-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">
                  Detected Financial Leakages & Waste (₹ INR)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiAudit.leakages.map((leak, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-rose-900/60 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                          {leak.title}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          leak.severity === 'high'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {leak.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {leak.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Estimated Waste:</span>
                      <div className="text-right">
                        <span className="font-extrabold text-rose-400">
                          {formatCurrency(leak.monthlyLoss)}/mo
                        </span>
                        <span className="text-[10px] text-slate-500 ml-1">
                          ({formatCurrency(leak.annualLoss)}/yr)
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Recommendations with 1-Click Cap Apply */}
          {aiAudit.actionableRecommendations && aiAudit.actionableRecommendations.length > 0 && (
            <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">
                    Prioritized Savings Optimization Plan
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  Total potential savings: ~
                  <strong className="text-emerald-400">
                    {formatCurrency(
                      aiAudit.actionableRecommendations.reduce(
                        (sum, r) => sum + r.estimatedMonthlySavings,
                        0
                      )
                    )}/mo
                  </strong>
                </span>
              </div>

              <div className="space-y-3">
                {aiAudit.actionableRecommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-emerald-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-100">
                          {rec.title}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          rec.difficulty === 'Easy'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : rec.difficulty === 'Moderate'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}>
                          {rec.difficulty}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {rec.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Monthly Boost</div>
                        <div className="text-base font-black text-emerald-400">
                          +{formatCurrency(rec.estimatedMonthlySavings)}
                        </div>
                      </div>

                      {rec.recommendedBudgetCap && (
                        <button
                          onClick={() => {
                            if (rec.recommendedBudgetCap) {
                              onApplyBudgetCap(
                                rec.recommendedBudgetCap.categoryId,
                                rec.recommendedBudgetCap.newCap
                              );
                            }
                          }}
                          className="px-3.5 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-700/60 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Apply Cap ({formatCurrency(rec.recommendedBudgetCap.newCap)})</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-3xl bg-slate-900/40 border border-slate-800 p-8 text-center max-w-xl mx-auto">
          <Sparkles className="h-10 w-10 text-indigo-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-white">No AI Audit Run Yet</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Click the button above to analyze your monthly cashflow in ₹, test 50/30/20 ratio, and discover hidden leaks.
          </p>
          <button
            onClick={handleRunAudit}
            disabled={isLoadingAudit}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-md inline-flex items-center gap-2"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Generate First Audit (₹)</span>
          </button>
        </div>
      )}

      {/* Real Data Insight Banner (Requirement 18) */}
      {hasSufficientData && realDataCategoryInsight && (
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-indigo-500/30 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 flex-shrink-0">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
              Grounded Database Analysis
            </span>
            <p className="text-xs font-semibold text-slate-200 mt-0.5">
              "{realDataCategoryInsight}"
            </p>
          </div>
        </div>
      )}

      {/* Interactive What-If Scenario Simulator */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="max-w-2xl mb-6">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">
            <Zap className="h-3.5 w-3.5" />
            <span>Interactive What-If Scenario Simulator (INR ₹)</span>
          </div>
          <h3 className="text-xl font-black text-white">
            Simulate Financial Decisions Before You Make Them
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Test life decisions in ₹. For example: "What if I cut dining by ₹1,500/mo?", "Can I afford buying a laptop?", or "What if I switch flats saving ₹3,000/mo?".
          </p>
        </div>

        {/* Preset Chips */}
        <div className="mb-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Quick Prompts:
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_SCENARIOS.map((scenario, i) => (
              <button
                key={i}
                onClick={() => {
                  setScenarioInput(scenario);
                  handleRunScenario(scenario);
                }}
                disabled={isLoadingScenario}
                className="px-3 py-1.5 text-xs text-slate-300 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 rounded-xl transition-all text-left"
              >
                {scenario}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={scenarioInput}
            onChange={(e) => setScenarioInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRunScenario()}
            placeholder="e.g. Can I afford a ₹15,000 Goa trip if I reduce dining out by ₹2,000/mo?"
            className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
          />
          <button
            onClick={() => handleRunScenario()}
            disabled={isLoadingScenario || !scenarioInput.trim()}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-purple-600/20"
          >
            {isLoadingScenario ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Simulating...</span>
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4" />
                <span>Simulate</span>
              </>
            )}
          </button>
        </div>

        {scenarioError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
            {scenarioError}
          </div>
        )}

        {/* Scenario Results Display */}
        {scenarioResult && (
          <div className="mt-6 p-6 rounded-2xl bg-slate-950 border border-purple-900/50 shadow-2xl space-y-5 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
                  Simulation Outcome (INR ₹)
                </span>
                <h4 className="text-base font-extrabold text-white mt-0.5">
                  "{scenarioResult.scenario}"
                </h4>
              </div>

              <div className={`px-3 py-1 rounded-full text-xs font-bold border self-start sm:self-auto ${
                scenarioResult.feasibilityRating === 'Highly Recommended'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : scenarioResult.feasibilityRating === 'Viable with Trade-offs'
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
              }`}>
                {scenarioResult.feasibilityRating}
              </div>
            </div>

            {/* Impact Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-xs text-slate-400">Monthly Cashflow Shift</span>
                <div className={`text-2xl font-black mt-1 ${
                  scenarioResult.monthlyImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {scenarioResult.monthlyImpact >= 0 ? '+' : ''}
                  {formatCurrency(scenarioResult.monthlyImpact)}/mo
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-xs text-slate-400">12-Month Cumulative Effect</span>
                <div className={`text-2xl font-black mt-1 ${
                  scenarioResult.annualImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {scenarioResult.annualImpact >= 0 ? '+' : ''}
                  {formatCurrency(scenarioResult.annualImpact)}/yr
                </div>
              </div>
            </div>

            {/* Breakdown & Trade-Offs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="font-bold text-slate-200 block mb-2">
                  Financial Shift Breakdown:
                </span>
                <ul className="space-y-1.5 text-slate-300">
                  {scenarioResult.breakdown.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-purple-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="font-bold text-slate-200 block mb-2">
                  Real-World Trade-Offs & Friction:
                </span>
                <ul className="space-y-1.5 text-slate-300">
                  {scenarioResult.tradeOffs.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Effect on Savings Timeline */}
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-200 flex items-center gap-2.5">
              <TrendingUp className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span>
                <strong>Goals Trajectory:</strong> {scenarioResult.savingsTimelineEffect}
              </span>
            </div>

            {/* Conclusion & Strategy */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <strong className="text-purple-400 block mb-1">Financial Strategist Advice:</strong>
              {scenarioResult.recommendation}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
