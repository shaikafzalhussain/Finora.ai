import React, { useState } from 'react';
import { CategorySpendSummary } from '../utils/financeCalculations';
import { formatCurrency } from '../utils/formatters';
import { getCategoryIcon } from '../utils/formatters';
import { Category } from '../types/finance';
import { AlertCircle, CheckCircle, Edit3, PieChart, Sparkles } from 'lucide-react';

interface CategorySpendBarsProps {
  categoriesSummary: CategorySpendSummary[];
  onUpdateBudget: (categoryId: string, newBudget: number) => void;
  onFilterCategory?: (categoryId: string) => void;
  selectedCategoryId?: string | null;
}

export const CategorySpendBars: React.FC<CategorySpendBarsProps> = ({
  categoriesSummary,
  onUpdateBudget,
  onFilterCategory,
  selectedCategoryId,
}) => {
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editBudgetValue, setEditBudgetValue] = useState<string>('');

  const handleStartEdit = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditBudgetValue(category.monthlyBudget.toString());
  };

  const handleSaveBudget = (categoryId: string) => {
    const val = parseFloat(editBudgetValue);
    if (!isNaN(val) && val >= 0) {
      onUpdateBudget(categoryId, val);
    }
    setEditingCategoryId(null);
  };

  const totalSpent = categoriesSummary.reduce((sum, c) => sum + c.spent, 0);

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <PieChart className="h-4 w-4 text-indigo-400" />
            <span>Category Spending & Budget Limits</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any category to filter transactions or click edit to adjust budget caps
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-400">
          {categoriesSummary.length} Categories
        </div>
      </div>

      {totalSpent === 0 && (
        <div className="mb-4 p-3.5 rounded-xl bg-slate-950/60 border border-white/5 text-center text-xs text-slate-400">
          No category spending recorded yet for this month. Click any category to set its monthly budget cap.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {categoriesSummary.map((item) => {
          const { category, spent, budget, percentage, isOverBudget, transactionCount } = item;
          const IconComp = getCategoryIcon(category.icon);
          const isSelected = selectedCategoryId === category.id;
          const isEditing = editingCategoryId === category.id;

          const pct = Math.min(100, Math.round(percentage));
          const remaining = Math.max(0, budget - spent);

          let barColor = 'bg-emerald-500';
          let badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
          let statusText = 'On Track';

          if (budget === 0) {
            barColor = 'bg-slate-700';
            badgeColor = 'text-slate-400 bg-slate-800/80 border-slate-700/50';
            statusText = spent > 0 ? 'No budget cap' : 'No cap set';
          } else if (isOverBudget) {
            barColor = 'bg-rose-500';
            badgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
            statusText = `Over by ${formatCurrency(spent - budget)}`;
          } else if (percentage >= 85) {
            barColor = 'bg-amber-500';
            badgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            statusText = 'Near Limit';
          }

          return (
            <div
              key={category.id}
              className={`rounded-xl border p-3.5 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-800/90 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-850'
              }`}
              onClick={() => onFilterCategory?.(category.id)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="p-2 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: `${category.color}15`, color: category.color }}
                  >
                    <IconComp className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-100 truncate">
                        {category.name}
                      </span>
                      {category.isEssential && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          Need
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {transactionCount} transactions {totalSpent > 0 ? `(${Math.round((spent / totalSpent) * 100)}% of spend)` : ''}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${badgeColor} whitespace-nowrap`}>
                  {statusText}
                </div>
              </div>

              {/* Progress Bar & Amount Row */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-200">
                    {formatCurrency(spent)}
                  </span>
                  <div className="flex items-center gap-1 text-slate-400">
                    {isEditing ? (
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-slate-500 font-bold">₹</span>
                        <input
                          type="number"
                          value={editBudgetValue}
                          onChange={(e) => setEditBudgetValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveBudget(category.id);
                            if (e.key === 'Escape') setEditingCategoryId(null);
                          }}
                          autoFocus
                          className="w-16 px-1 py-0.5 text-xs bg-slate-950 border border-emerald-500 rounded text-white focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveBudget(category.id)}
                          className="px-1.5 py-0.5 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-1 group/cap hover:text-slate-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(category);
                        }}
                        title="Click to edit budget cap"
                      >
                        <span>Budget: {formatCurrency(budget)}</span>
                        <Edit3 className="h-3 w-3 text-slate-500 group-hover/cap:text-slate-300 transition-colors" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                  <span>{Math.round(percentage)}% of budget limit</span>
                  <span>{remaining > 0 ? `${formatCurrency(remaining)} remaining` : 'Limit reached'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
