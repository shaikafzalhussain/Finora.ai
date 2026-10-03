import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Sliders,
  DollarSign,
  Tag,
  Calendar,
  Building,
  ArrowRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Category, Transaction, BankAccountDetails, CustomBudget } from '../types/finance';
import { formatCurrency, formatPercent, getCategoryIcon } from '../utils/formatters';

interface BudgetsViewProps {
  categories: Category[];
  transactions?: Transaction[];
  bankAccounts?: BankAccountDetails[];
  totalExpenses: number;
  totalBudgetedExpenses: number;
  onUpdateBudget: (categoryId: string, newBudget: number) => void;
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onDeleteCategory: (categoryId: string) => void;
  onOpenOptimizer: () => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  categories,
  transactions = [],
  bankAccounts = [],
  totalExpenses,
  totalBudgetedExpenses,
  onUpdateBudget,
  onAddCategory,
  onDeleteCategory,
  onOpenOptimizer,
}) => {
  const [isCreateBudgetOpen, setIsCreateBudgetOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('6000');
  const [period, setPeriod] = useState<'monthly' | 'weekly' | 'custom'>('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAccountId, setSelectedAccountId] = useState('all');
  const [editingBudgetCatId, setEditingBudgetCatId] = useState<string | null>(null);
  const [tempBudgetInput, setTempBudgetInput] = useState('');

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  // Compute live spending per category
  const categorySpendMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === 'expense') {
        const cur = map.get(t.categoryId) || 0;
        map.set(t.categoryId, cur + t.amount);
      }
    }
    return map;
  }, [transactions]);

  const overallUtilization = totalBudgetedExpenses > 0 ? (totalExpenses / totalBudgetedExpenses) * 100 : 0;

  // AI Budget Alerts (Warnings, Exceeded, Positive)
  const budgetAlerts = useMemo(() => {
    const alerts: Array<{ type: 'warning' | 'exceeded' | 'positive'; text: string; catName: string }> = [];

    for (const cat of expenseCategories) {
      const spent = categorySpendMap.get(cat.id) || 0;
      const budget = cat.monthlyBudget || 0;
      if (budget <= 0) continue;

      const util = (spent / budget) * 100;
      if (spent > budget) {
        alerts.push({
          type: 'exceeded',
          catName: cat.name,
          text: `Your ${cat.name} spending has exceeded your ${formatCurrency(budget)} monthly budget by ${formatCurrency(spent - budget)}.`,
        });
      } else if (util >= 80) {
        alerts.push({
          type: 'warning',
          catName: cat.name,
          text: `You've used ${Math.round(util)}% of your ${formatCurrency(budget)} ${cat.name} budget.`,
        });
      } else if (util > 0 && util <= 40 && spent >= 500) {
        alerts.push({
          type: 'positive',
          catName: cat.name,
          text: `You're currently ${formatCurrency(budget - spent)} below your ${cat.name} budget.`,
        });
      }
    }

    return alerts.slice(0, 3);
  }, [expenseCategories, categorySpendMap]);

  const handleCreateBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(budgetAmount);
    if (isNaN(num) || num <= 0) return;

    if (selectedCatId === 'new-custom') {
      onAddCategory({
        name: 'Custom Budget Category',
        monthlyBudget: num,
        type: 'expense',
        isEssential: false,
        color: '#8b5cf6',
        icon: 'Tag',
        isCustom: true,
      });
    } else if (selectedCatId) {
      onUpdateBudget(selectedCatId, num);
    }

    setIsCreateBudgetOpen(false);
    setSelectedCatId('');
    setBudgetAmount('6000');
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* 1. Header & Overview Card */}
      <div className="rounded-[24px] sm:rounded-3xl bg-slate-900 border border-slate-800 p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-0.5">
              Monthly Budget Cap
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white flex items-baseline gap-2 flex-wrap">
              <span>{formatCurrency(totalExpenses)}</span>
              <span className="text-xs sm:text-sm font-medium text-slate-400">
                spent of {formatCurrency(totalBudgetedExpenses)}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
              Safe-to-spend headroom: <strong className="text-emerald-400 font-bold font-mono">{formatCurrency(Math.max(0, totalBudgetedExpenses - totalExpenses))}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenOptimizer}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/60 text-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              <span>AI Optimizer</span>
            </button>
            <button
              onClick={() => {
                setSelectedCatId(expenseCategories[0]?.id || '');
                setIsCreateBudgetOpen(true);
              }}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-500/20"
            >
              <Plus className="h-4 w-4" />
              <span>Create Budget</span>
            </button>
          </div>
        </div>

        {/* Overall Utilization Progress */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 text-[11px] font-medium">Cap Adherence</span>
            <span className={`font-bold font-mono text-xs ${
              overallUtilization > 100 ? 'text-rose-400' : overallUtilization > 85 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {Math.round(overallUtilization)}% Used
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden relative border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallUtilization > 100
                  ? 'bg-rose-500'
                  : overallUtilization > 85
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, overallUtilization)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. AI Budget Alerts Banner */}
      {budgetAlerts.length > 0 && (
        <div className="space-y-2">
          {budgetAlerts.map((alert, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 ${
                alert.type === 'exceeded'
                  ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                  : alert.type === 'warning'
                  ? 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                  : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
              }`}
            >
              {alert.type === 'exceeded' ? (
                <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
              ) : alert.type === 'warning' ? (
                <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              )}
              <span className="leading-snug">{alert.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* 3. Category Budgets Grid (Compact, Mobile-First Cards) */}
      <div className="rounded-[24px] sm:rounded-3xl bg-slate-900 border border-slate-800 p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
            <Sliders className="h-4 w-4 text-emerald-400" />
            <span>Category Budgets ({expenseCategories.length})</span>
          </h3>
          <span className="text-[11px] text-slate-400">
            Tap amount to modify
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
          {expenseCategories.map((c) => {
            const IconComp = getCategoryIcon(c.icon);
            const spent = categorySpendMap.get(c.id) || 0;
            const budget = c.monthlyBudget || 0;
            const remaining = Math.max(0, budget - spent);
            const progress = budget > 0 ? (spent / budget) * 100 : 0;
            const isEditing = editingBudgetCatId === c.id;

            return (
              <div
                key={c.id}
                className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2.5"
              >
                {/* Header row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="p-2 rounded-xl flex-shrink-0"
                      style={{ backgroundColor: `${c.color}20`, color: c.color }}
                    >
                      <IconComp className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-100 truncate">
                        {c.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 block truncate">
                        Budget: {formatCurrency(budget)}/mo · {c.isEssential ? 'Essential Need' : 'Discretionary'}
                      </span>
                    </div>
                  </div>

                  {c.isCustom && (
                    <button
                      onClick={() => onDeleteCategory(c.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 flex-shrink-0"
                      title="Delete category"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Used vs Remaining metrics */}
                <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-slate-900/60 border border-white/5 text-center">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Used</span>
                    <span className="text-xs font-black text-slate-200 font-mono">
                      {formatCurrency(spent)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Remaining</span>
                    <span className={`text-xs font-black font-mono ${spent > budget ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {spent > budget ? `-${formatCurrency(spent - budget)}` : formatCurrency(remaining)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Progress</span>
                    <span className={`text-xs font-black font-mono ${progress > 100 ? 'text-rose-400' : progress > 80 ? 'text-amber-400' : 'text-slate-200'}`}>
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      progress > 100 ? 'bg-rose-500' : progress > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>

                {/* Inline Edit Budget Cap */}
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5">
                  <span className="text-slate-400">Monthly Target Cap:</span>
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-bold">₹</span>
                      <input
                        type="number"
                        step="500"
                        value={tempBudgetInput}
                        onChange={(e) => setTempBudgetInput(e.target.value)}
                        className="w-20 px-2 py-0.5 bg-slate-900 border border-emerald-500 rounded text-white font-mono text-xs text-right"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          const val = parseFloat(tempBudgetInput);
                          if (!isNaN(val) && val >= 0) {
                            onUpdateBudget(c.id, val);
                          }
                          setEditingBudgetCatId(null);
                        }}
                        className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-bold"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingBudgetCatId(c.id);
                        setTempBudgetInput(c.monthlyBudget.toString());
                      }}
                      className="font-bold text-white font-mono flex items-center gap-1 hover:text-emerald-400 transition-colors"
                    >
                      <span>{formatCurrency(c.monthlyBudget)}</span>
                      <Edit2 className="h-2.5 w-2.5 text-slate-500" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Create Budget Modal / Drawer (Spec #12: Category, Budget Amount, Period, Start Date, Account) */}
      {isCreateBudgetOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-t-[28px] sm:rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Sliders className="h-4 w-4" />
                </div>
                <h3 className="text-base font-extrabold text-white">Create Budget</h3>
              </div>
              <button
                onClick={() => setIsCreateBudgetOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBudgetSubmit} className="space-y-3.5 text-xs">
              {/* Category */}
              <div>
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                  Category *
                </label>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="" disabled>Select Category</option>
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value="new-custom">＋ Create New Custom Category</option>
                </select>
              </div>

              {/* Budget Amount */}
              <div>
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                  Budget Amount (₹ INR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 font-bold">₹</span>
                  <input
                    type="number"
                    step="100"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    placeholder="6000"
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-xs focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Period: Monthly, Weekly, Custom */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                    Period
                  </label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Account (Optional account-specific budget) */}
              <div>
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                  Account (Optional specific budget)
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">All Linked Accounts</option>
                  {bankAccounts.map((acc) => (
                    <option key={acc.id || acc.accountNumberLast4} value={acc.id || acc.accountNumberLast4}>
                      {acc.bankName} •••• {acc.accountNumberLast4} ({acc.nickname || acc.accountType || 'Bank'})
                    </option>
                  ))}
                  <option value="cash">Cash in Hand</option>
                </select>
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateBudgetOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-850 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs transition-colors shadow-md shadow-emerald-500/20"
                >
                  Save Budget Cap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
