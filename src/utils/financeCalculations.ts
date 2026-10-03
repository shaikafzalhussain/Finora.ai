import { Category, Transaction } from '../types/finance';

export interface MonthlyStats {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number; // percentage
  totalBudgetedExpenses: number;
  remainingBudget: number;
  budgetUtilizationRate: number; // percentage
  dayOfMonth: number;
  daysInMonth: number;
  daysRemaining: number;
  avgDailySpend: number;
  projectedEndMonthSpend: number;
  projectedVariance: number; // positive = under budget, negative = over budget
  needsSpend: number;
  wantsSpend: number;
  needsPercent: number;
  wantsPercent: number;
}

export function getDaysInMonth(year: number, monthIndex0: number): number {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

export function parseMonthKey(monthKey: string): { year: number; month: number } {
  const [yearStr, monthStr] = monthKey.split('-');
  return {
    year: parseInt(yearStr, 10),
    month: parseInt(monthStr, 10),
  };
}

export function filterTransactionsByMonth(
  transactions: Transaction[],
  monthKey: string // YYYY-MM
): Transaction[] {
  return transactions.filter((t) => t.date.startsWith(monthKey));
}

export function computeMonthlyStats(
  transactions: Transaction[],
  categories: Category[],
  monthKey: string // YYYY-MM
): MonthlyStats {
  const monthTx = filterTransactionsByMonth(transactions, monthKey);
  const { year, month } = parseMonthKey(monthKey);
  const daysInMonth = getDaysInMonth(year, month - 1);

  // Determine current day of month or last day if looking at past month
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const isCurrentMonth = year === currentYear && month === currentMonth;
  const isPastMonth = year < currentYear || (year === currentYear && month < currentMonth);

  const dayOfMonth = isCurrentMonth ? Math.min(today.getDate(), daysInMonth) : isPastMonth ? daysInMonth : 1;
  const daysRemaining = Math.max(0, daysInMonth - dayOfMonth);

  let totalIncome = 0;
  let totalExpenses = 0;
  let needsSpend = 0;
  let wantsSpend = 0;

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  for (const t of monthTx) {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpenses += t.amount;
      const cat = categoryMap.get(t.categoryId);
      if (cat?.isEssential) {
        needsSpend += t.amount;
      } else {
        wantsSpend += t.amount;
      }
    }
  }

  const totalBudgetedExpenses = categories
    .filter((c) => c.type === 'expense')
    .reduce((sum, c) => sum + c.monthlyBudget, 0);

  const remainingBudget = Math.max(0, totalBudgetedExpenses - totalExpenses);
  const budgetUtilizationRate = totalBudgetedExpenses > 0 ? (totalExpenses / totalBudgetedExpenses) * 100 : 0;
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.max(-100, Math.min(100, (netSavings / totalIncome) * 100)) : 0;

  // Daily spend run-rate
  const avgDailySpend = dayOfMonth > 0 ? totalExpenses / dayOfMonth : 0;
  // If current month, project end of month. If past month, projected is actual.
  const projectedEndMonthSpend = isCurrentMonth
    ? totalExpenses + avgDailySpend * daysRemaining
    : totalExpenses;

  const projectedVariance = totalBudgetedExpenses - projectedEndMonthSpend;

  const totalSpentOrIncomeBasis = totalIncome > 0 ? totalIncome : totalExpenses || 1;
  const needsPercent = (needsSpend / totalSpentOrIncomeBasis) * 100;
  const wantsPercent = (wantsSpend / totalSpentOrIncomeBasis) * 100;

  return {
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
    totalBudgetedExpenses,
    remainingBudget,
    budgetUtilizationRate,
    dayOfMonth,
    daysInMonth,
    daysRemaining,
    avgDailySpend,
    projectedEndMonthSpend,
    projectedVariance,
    needsSpend,
    wantsSpend,
    needsPercent,
    wantsPercent,
  };
}

export interface CategorySpendSummary {
  category: Category;
  spent: number;
  budget: number;
  percentage: number;
  isOverBudget: boolean;
  transactionCount: number;
}

export function computeCategorySpend(
  transactions: Transaction[],
  categories: Category[],
  monthKey: string
): CategorySpendSummary[] {
  const monthTx = filterTransactionsByMonth(transactions, monthKey);
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const spendMap = new Map<string, { spent: number; count: number }>();
  for (const c of expenseCategories) {
    spendMap.set(c.id, { spent: 0, count: 0 });
  }

  for (const t of monthTx) {
    if (t.type === 'expense') {
      const current = spendMap.get(t.categoryId) || { spent: 0, count: 0 };
      spendMap.set(t.categoryId, {
        spent: current.spent + t.amount,
        count: current.count + 1,
      });
    }
  }

  return expenseCategories
    .map((category) => {
      const data = spendMap.get(category.id) || { spent: 0, count: 0 };
      const percentage = category.monthlyBudget > 0 ? (data.spent / category.monthlyBudget) * 100 : 0;
      return {
        category,
        spent: data.spent,
        budget: category.monthlyBudget,
        percentage,
        isOverBudget: data.spent > category.monthlyBudget,
        transactionCount: data.count,
      };
    })
    .sort((a, b) => b.spent - a.spent);
}

export interface DailySpendPoint {
  day: number;
  dateStr: string;
  actualDaily: number;
  cumulativeActual: number | null;
  idealCumulative: number;
  projectedCumulative?: number;
}

export function computeDailySpendVelocity(
  transactions: Transaction[],
  categories: Category[],
  monthKey: string
): DailySpendPoint[] {
  const monthTx = filterTransactionsByMonth(transactions, monthKey);
  const { year, month } = parseMonthKey(monthKey);
  const daysInMonth = getDaysInMonth(year, month - 1);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const isCurrentMonth = year === currentYear && month === currentMonth;
  const currentDay = isCurrentMonth ? Math.min(today.getDate(), daysInMonth) : daysInMonth;

  const totalBudget = categories
    .filter((c) => c.type === 'expense')
    .reduce((sum, c) => sum + c.monthlyBudget, 0);

  const idealDailyBudget = totalBudget / daysInMonth;

  const dailyAmounts: number[] = new Array(daysInMonth + 1).fill(0);
  for (const t of monthTx) {
    if (t.type === 'expense') {
      const day = parseInt(t.date.split('-')[2], 10);
      if (day >= 1 && day <= daysInMonth) {
        dailyAmounts[day] += t.amount;
      }
    }
  }

  const points: DailySpendPoint[] = [];
  let runningActual = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const paddedMonth = month.toString().padStart(2, '0');
    const paddedDay = day.toString().padStart(2, '0');
    const dateStr = `${year}-${paddedMonth}-${paddedDay}`;
    const ideal = idealDailyBudget * day;

    if (day <= currentDay) {
      runningActual += dailyAmounts[day];
      points.push({
        day,
        dateStr,
        actualDaily: dailyAmounts[day],
        cumulativeActual: runningActual,
        idealCumulative: Math.round(ideal),
      });
    } else {
      // Future day in month: project trajectory based on average daily burn
      const avg = runningActual / (currentDay || 1);
      const projected = runningActual + avg * (day - currentDay);
      points.push({
        day,
        dateStr,
        actualDaily: 0,
        cumulativeActual: null,
        idealCumulative: Math.round(ideal),
        projectedCumulative: Math.round(projected),
      });
    }
  }

  return points;
}
