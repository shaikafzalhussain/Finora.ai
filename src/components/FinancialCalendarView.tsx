import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Repeat,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Tag,
} from 'lucide-react';
import { Category, RecurringExpense, Transaction } from '../types/finance';
import { formatCurrency, formatDate } from '../utils/formatters';

interface FinancialCalendarViewProps {
  currentMonthKey: string;
  transactions: Transaction[];
  recurring: RecurringExpense[];
  categories: Category[];
  formattedMonthName: string;
}

export const FinancialCalendarView: React.FC<FinancialCalendarViewProps> = ({
  currentMonthKey,
  transactions,
  recurring,
  categories,
  formattedMonthName,
}) => {
  const [yearStr, monthStr] = currentMonthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayWeekday = new Date(year, month - 1, 1).getDay(); // 0 is Sunday

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Index transactions by day
  const txByDay = new Map<number, Transaction[]>();
  for (const t of transactions) {
    if (t.date.startsWith(currentMonthKey)) {
      const day = parseInt(t.date.split('-')[2], 10);
      const list = txByDay.get(day) || [];
      list.push(t);
      txByDay.set(day, list);
    }
  }

  // Index recurring subscriptions by expected day in month
  const recurringByDay = new Map<number, RecurringExpense[]>();
  for (const r of recurring) {
    if (r.nextDueDate.startsWith(currentMonthKey)) {
      const day = parseInt(r.nextDueDate.split('-')[2], 10);
      const list = recurringByDay.get(day) || [];
      list.push(r);
      recurringByDay.set(day, list);
    }
  }

  const selectedDayTransactions = selectedDay ? txByDay.get(selectedDay) || [] : [];
  const selectedDayRecurring = selectedDay ? recurringByDay.get(selectedDay) || [] : [];

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-emerald-400" />
              <span>Financial Calendar: Cashflow & Renewal Pacing</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Track salary credits, auto-debits, recurring subscriptions, and daily spend for {formattedMonthName}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Income / Salary</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span>Auto-debit / Sub</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Daily Spend</span>
            </div>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-slate-500 uppercase tracking-wider mb-2">
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
          {/* Empty cells before month starts */}
          {Array.from({ length: firstDayWeekday }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[75px] rounded-xl bg-slate-950/20 border border-transparent" />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayTx = txByDay.get(day) || [];
            const dayRecurring = recurringByDay.get(day) || [];

            const totalExpense = dayTx
              .filter((t) => t.type === 'expense')
              .reduce((sum, t) => sum + t.amount, 0);

            const totalIncome = dayTx
              .filter((t) => t.type === 'income')
              .reduce((sum, t) => sum + t.amount, 0);

            const isSelected = selectedDay === day;

            return (
              <div
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`min-h-[85px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-800 border-emerald-500 shadow-md ring-1 ring-emerald-500/40'
                    : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${
                    isSelected ? 'text-emerald-400' : 'text-slate-300'
                  }`}>
                    {day}
                  </span>
                  {dayRecurring.length > 0 && (
                    <span
                      className="p-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-bold"
                      title={`${dayRecurring.length} recurring subscription(s) due`}
                    >
                      <Repeat className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>

                <div className="space-y-1 my-1">
                  {totalIncome > 0 && (
                    <div className="text-[10px] font-bold text-emerald-400 truncate">
                      +{formatCurrency(totalIncome)}
                    </div>
                  )}
                  {totalExpense > 0 && (
                    <div className="text-[10px] font-semibold text-rose-300 truncate">
                      -{formatCurrency(totalExpense)}
                    </div>
                  )}
                  {dayRecurring.length > 0 && totalExpense === 0 && (
                    <div className="text-[9px] text-indigo-300 truncate">
                      Due: {dayRecurring[0].name}
                    </div>
                  )}
                </div>

                <div className="text-[9px] text-slate-500 text-right">
                  {dayTx.length > 0 ? `${dayTx.length} items` : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Panel */}
      {selectedDay && (
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="font-bold text-white text-sm">
              Schedule for {selectedDay} {formattedMonthName}
            </h4>
            <span className="text-xs text-slate-400">
              {selectedDayTransactions.length} transaction(s) • {selectedDayRecurring.length} recurring bill(s)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recurring subscriptions due today */}
            <div>
              <span className="text-xs font-bold text-indigo-300 block mb-2 flex items-center gap-1.5">
                <Repeat className="h-3.5 w-3.5" />
                <span>Auto-debit / Subscriptions Due</span>
              </span>
              {selectedDayRecurring.length > 0 ? (
                <div className="space-y-2">
                  {selectedDayRecurring.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-xl bg-slate-950 border border-indigo-500/30 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-100">{r.name}</div>
                        <span className="text-[11px] text-slate-400 capitalize">{r.billingCycle} billing</span>
                      </div>
                      <span className="font-black text-white">{formatCurrency(r.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-500">
                  No fixed bills scheduled for this date.
                </div>
              )}
            </div>

            {/* Transactions logged on this day */}
            <div>
              <span className="text-xs font-bold text-slate-300 block mb-2 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>Logged Transactions</span>
              </span>
              {selectedDayTransactions.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedDayTransactions.map((t) => (
                    <div
                      key={t.id}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-200">{t.merchant}</div>
                        <span className="text-[10px] text-slate-400">
                          {categoryMap.get(t.categoryId)?.name || 'General'}
                        </span>
                      </div>
                      <span className={`font-black ${
                        t.type === 'income' ? 'text-emerald-400' : 'text-slate-100'
                      }`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-500">
                  No transactions recorded on this day.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
