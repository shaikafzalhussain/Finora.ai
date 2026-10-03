import React, { useState, useMemo } from 'react';
import {
  Flame,
  TrendingUp,
  TrendingDown,
  Sparkles,
  X,
  ArrowRight,
  Info,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Bot,
} from 'lucide-react';
import { Transaction, Category } from '../types/finance';
import { formatCurrency, formatDate, getCategoryIcon } from '../utils/formatters';

interface SavingsHeatmapProps {
  currentMonthKey: string;
  formattedMonthName: string;
  transactions: Transaction[];
  categories: Category[];
  totalBudgetedExpenses: number;
  onSelectTransaction?: (transaction: Transaction) => void;
  onAskAiAboutDay?: (daySummary: string) => void;
}

interface DayData {
  day: number;
  dateStr: string;
  spent: number;
  income: number;
  netSaved: number;
  isSpike: boolean;
  isFrugal: boolean;
  intensity: number; // 0 to 4
  transactions: Transaction[];
}

export const SavingsHeatmap: React.FC<SavingsHeatmapProps> = ({
  currentMonthKey,
  formattedMonthName,
  transactions,
  categories,
  totalBudgetedExpenses,
  onSelectTransaction,
  onAskAiAboutDay,
}) => {
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  // Requirement 22: Show clean zero state for new users without transactions
  if (transactions.length === 0) {
    return (
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-slate-500" />
          <h3 className="text-base font-extrabold text-white">Savings Heatmap</h3>
        </div>
        <div className="p-6 rounded-2xl bg-slate-950/70 border border-white/5 text-center space-y-1.5">
          <p className="text-sm font-bold text-slate-300">No savings activity yet</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Add income and expenses to start tracking your daily savings patterns and spending intensity.
          </p>
        </div>
      </div>
    );
  }

  const [yearStr, monthStr] = currentMonthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayWeekday = new Date(year, month - 1, 1).getDay(); // 0 is Sun

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Daily budget reference
  const dailyTargetBudget = totalBudgetedExpenses / daysInMonth;

  // Process data for all days in month
  const { daysData, maxDailySpend, totalMonthlySaved, spikeCount } = useMemo(() => {
    const dayMap = new Map<number, { spent: number; income: number; txs: Transaction[] }>();

    for (let d = 1; d <= daysInMonth; d++) {
      dayMap.set(d, { spent: 0, income: 0, txs: [] });
    }

    for (const t of transactions) {
      if (t.date.startsWith(currentMonthKey)) {
        const day = parseInt(t.date.split('-')[2], 10);
        const data = dayMap.get(day);
        if (data) {
          if (t.type === 'expense') {
            data.spent += t.amount;
          } else {
            data.income += t.amount;
          }
          data.txs.push(t);
        }
      }
    }

    let maxSpend = 1000;
    for (let d = 1; d <= daysInMonth; d++) {
      const sp = dayMap.get(d)?.spent || 0;
      if (sp > maxSpend) maxSpend = sp;
    }

    let totalSaved = 0;
    let spikes = 0;

    const list: DayData[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const data = dayMap.get(d)!;
      const net = data.income - data.spent;
      totalSaved += net;

      // Spike definition: spent more than 2x the daily budget pacing or > ₹4,000 in a day
      const isSpike = data.spent > Math.max(dailyTargetBudget * 1.8, 3500);
      if (isSpike) spikes++;

      // Frugal day: zero or tiny spend (< ₹300) with positive/zero net
      const isFrugal = data.spent <= 300 && data.txs.length <= 1;

      // Savings intensity level (0 to 4)
      let intensity = 0;
      if (data.spent === 0 && data.income === 0) {
        intensity = 0; // neutral
      } else if (data.spent > dailyTargetBudget * 1.5) {
        intensity = 4; // High expense alert
      } else if (data.spent > dailyTargetBudget) {
        intensity = 3; // Moderate expense
      } else if (data.spent > 0) {
        intensity = 2; // Disciplined spend
      } else {
        intensity = 1; // Pure savings / zero spend
      }

      const paddedM = month.toString().padStart(2, '0');
      const paddedD = d.toString().padStart(2, '0');
      const dateStr = `${year}-${paddedM}-${paddedD}`;

      list.push({
        day: d,
        dateStr,
        spent: data.spent,
        income: data.income,
        netSaved: net,
        isSpike,
        isFrugal,
        intensity,
        transactions: data.txs,
      });
    }

    return {
      daysData: list,
      maxDailySpend: maxSpend,
      totalMonthlySaved: totalSaved,
      spikeCount: spikes,
    };
  }, [currentMonthKey, daysInMonth, transactions, dailyTargetBudget, year, month]);

  const handleCellClick = (item: DayData) => {
    setSelectedDay(item);
  };

  const dayAiInsight = useMemo(() => {
    if (!selectedDay) return '';
    if (selectedDay.isSpike) {
      return `You spent ${formatCurrency(
        selectedDay.spent
      )} today, which is significantly above your daily budget benchmark of ${formatCurrency(
        dailyTargetBudget
      )}. Major driver: ${selectedDay.transactions[0]?.merchant || 'Large expense'}.`;
    }
    if (selectedDay.isFrugal) {
      return `This was one of your most disciplined days this month! Discretionary purchases were zero or minimal, keeping your savings momentum strong.`;
    }
    if (selectedDay.spent > 0) {
      return `Spend was well-managed at ${formatCurrency(selectedDay.spent)} within safe daily limits.`;
    }
    return `No financial transactions logged on this day. Great zero-spend day!`;
  }, [selectedDay, dailyTargetBudget]);

  return (
    <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Flame className="h-4 w-4 text-emerald-400" />
              <span>Savings & Spend Intensity Heatmap</span>
            </h3>
            {spikeCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                <span>{spikeCount} Spikes</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Identify frugal days vs high-burn days across {formattedMonthName}. Tap any day for details.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 overflow-x-auto pb-1">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/30 border border-emerald-500/40" />
            <span>Frugal</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-700" />
            <span>Normal</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-500/30 border border-amber-500/50" />
            <span>Elevated</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-rose-500/40 border border-rose-500/60" />
            <span>Spike 🔥</span>
          </span>
        </div>
      </div>

      {/* Weekdays row */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {/* Leading empty days */}
        {Array.from({ length: firstDayWeekday }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="aspect-square rounded-2xl bg-slate-950/20 border border-transparent"
          />
        ))}

        {/* Days */}
        {daysData.map((item) => {
          let styleClass = 'bg-slate-950/80 border-slate-800/80 text-slate-400 hover:border-slate-700';

          if (item.isSpike) {
            styleClass = 'bg-rose-500/20 border-rose-500/50 text-rose-200 shadow-sm shadow-rose-950/50 font-bold';
          } else if (item.isFrugal && item.spent === 0) {
            styleClass = 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300';
          } else if (item.intensity === 3) {
            styleClass = 'bg-amber-500/20 border-amber-500/40 text-amber-200';
          } else if (item.spent > 0) {
            styleClass = 'bg-slate-900 border-slate-750 text-slate-200';
          }

          const isSelected = selectedDay?.day === item.day;

          return (
            <button
              key={item.day}
              onClick={() => handleCellClick(item)}
              className={`aspect-square min-h-[46px] sm:min-h-[56px] p-1.5 rounded-2xl border transition-all flex flex-col justify-between items-center text-left group relative active:scale-95 ${styleClass} ${
                isSelected ? 'ring-2 ring-emerald-400 border-emerald-400 z-10' : ''
              }`}
            >
              <div className="w-full flex items-center justify-between text-[10px]">
                <span className={`font-mono ${isSelected ? 'text-emerald-400 font-bold' : ''}`}>
                  {item.day}
                </span>
                {item.isSpike && (
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping" />
                )}
                {item.isFrugal && item.spent === 0 && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                )}
              </div>

              <div className="w-full text-center">
                {item.spent > 0 ? (
                  <span className="text-[10px] sm:text-[11px] font-black truncate block tracking-tight">
                    ₹{item.spent >= 1000 ? `${(item.spent / 1000).toFixed(1)}k` : Math.round(item.spent)}
                  </span>
                ) : item.income > 0 ? (
                  <span className="text-[10px] sm:text-[11px] font-black text-emerald-400 truncate block">
                    +₹{(item.income / 1000).toFixed(0)}k
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-600 block">—</span>
                )}
              </div>

              <div className="w-full flex justify-end">
                {item.transactions.length > 0 && (
                  <span className="text-[8px] opacity-60">
                    {item.transactions.length}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Mobile-Friendly Day Inspection Drawer / Bottom Sheet */}
      {selectedDay && (
        <div className="mt-5 p-5 rounded-3xl bg-slate-950 border border-emerald-500/40 shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-2">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Daily Breakdown
              </span>
              <h4 className="text-base font-black text-white">
                {formatDate(selectedDay.dateStr)}
              </h4>
            </div>

            <button
              onClick={() => setSelectedDay(null)}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2.5 text-xs text-center">
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">Total Spent</span>
              <span className={`text-sm font-black ${selectedDay.spent > 0 ? 'text-white' : 'text-slate-400'}`}>
                {formatCurrency(selectedDay.spent)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">Income Inflow</span>
              <span className="text-sm font-black text-emerald-400">
                {formatCurrency(selectedDay.income)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">Net Day Contribution</span>
              <span className={`text-sm font-black ${selectedDay.netSaved >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {selectedDay.netSaved >= 0 ? '+' : ''}{formatCurrency(selectedDay.netSaved)}
              </span>
            </div>
          </div>

          {/* AI Behavioral Insight */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-indigo-500/30 flex items-start gap-2.5 text-xs text-slate-200">
            <Bot className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-indigo-300 block mb-0.5">AI Day Assessment:</span>
              <p className="leading-relaxed opacity-90">{dayAiInsight}</p>
            </div>
          </div>

          {/* Transactions list */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Transactions on this date ({selectedDay.transactions.length})
            </span>

            {selectedDay.transactions.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedDay.transactions.map((tx) => {
                  const cat = categoryMap.get(tx.categoryId);
                  const IconComp = getCategoryIcon(cat?.icon || 'Tag');

                  return (
                    <div
                      key={tx.id}
                      onClick={() => onSelectTransaction?.(tx)}
                      className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 text-xs hover:border-slate-700 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="p-2 rounded-xl flex-shrink-0"
                          style={{ backgroundColor: `${cat?.color || '#a855f7'}20`, color: cat?.color || '#a855f7' }}
                        >
                          <IconComp className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-100 truncate block">
                            {tx.merchant}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {cat?.name || 'General'} • {tx.paymentMethod.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <span className={`font-black text-xs flex-shrink-0 ${
                        tx.type === 'income' ? 'text-emerald-400' : 'text-slate-100'
                      }`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-900 text-center text-xs text-slate-500">
                No transactions recorded on this day.
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            {onAskAiAboutDay && (
              <button
                onClick={() => onAskAiAboutDay(`Analyze my spending on ${selectedDay.dateStr} where I spent ${formatCurrency(selectedDay.spent)}.`)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Ask AI About This Day</span>
              </button>
            )}
            <button
              onClick={() => setSelectedDay(null)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
