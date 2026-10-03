import { Category, Transaction, UpcomingPayment, RecurringExpense, SavingsGoal } from '../types/finance';
import { formatCurrency } from './formatters';

export interface FinancialPipelineContext {
  monthKey: string; // e.g. "2026-10"
  monthName: string;
  transactions: Transaction[]; // current month or all
  allTransactions?: Transaction[]; // entire ledger
  categories: Category[];
  upcomingPayments: UpcomingPayment[];
  recurring: RecurringExpense[];
  savingsGoals: SavingsGoal[];
  totalIncome: number;
  totalExpenses: number;
  remainingBudget: number;
  savingsRate: number;
  totalBalance: number;
}

export interface PipelineResult {
  intent: string;
  categoryName?: string;
  calculatedAnswer: string;
  structuredFacts: Record<string, any>;
  suggestedPrompts: string[];
  isEmpty: boolean;
}

// Typo correction and keyword map
export const KEYWORD_MAP: Array<{
  keywords: string[];
  categoryId: string;
  categoryName: string;
}> = [
  {
    keywords: [
      'food', 'dining', 'swiggy', 'swigy', 'zomato', 'restaurant', 'dinner',
      'lunch', 'breakfast', 'biryani', 'pizza', 'burger', 'cafe', 'eat', 'eating', 'takeout'
    ],
    categoryId: 'cat-dining',
    categoryName: 'Food Delivery & Dining Out',
  },
  {
    keywords: [
      'groceries', 'grocery', 'groccery', 'blinkit', 'zepto', 'dmart', 'instamart',
      'cooking oil', 'soap', 'brush', 'toothpaste', 'vegetables', 'veggies',
      'milk', 'rice', 'dal', 'provisions', 'pantry', 'supermarket', 'kirana'
    ],
    categoryId: 'cat-groceries',
    categoryName: 'Groceries & Daily Supplies',
  },
  {
    keywords: [
      'health', 'healthcare', 'medicine', 'medcine', 'tablets', 'pill', 'pills',
      'doctor', 'hospital', 'hosptial', 'apollo', 'pharma', 'pharmacy',
      'dad medicine', 'brother medicine', 'dad hospital bill', 'dad tablets',
      'clinic', 'medical', 'meds', 'gym', 'fitness'
    ],
    categoryId: 'cat-health',
    categoryName: 'Healthcare & Pharmacy',
  },
  {
    keywords: [
      'electricity', 'eletricty', 'bescom', 'power', 'utility', 'utilities',
      'water', 'gas', 'cylinder', 'broadband', 'jiofiber', 'wifi', 'internet', 'bill'
    ],
    categoryId: 'cat-utilities',
    categoryName: 'Electricity & Internet Bills',
  },
  {
    keywords: [
      'recharge', 'mobile recharge', 'phone recharge', "dad's recharge", 'dad recharge',
      'jio', 'airtel', 'vi', 'vodafone'
    ],
    categoryId: 'cat-utilities',
    categoryName: 'Mobile & Recharge',
  },
  {
    keywords: [
      'sip', 'invest', 'investment', 'investments', 'mutual fund', 'stocks',
      'groww', 'zerodha', 'nifty', 'wealth', 'equity', 'gold'
    ],
    categoryId: 'cat-investments',
    categoryName: 'SIP & Wealth Building',
  },
  {
    keywords: [
      'rent', 'housing', 'apartment', 'flat', 'landlord', 'maintenance'
    ],
    categoryId: 'cat-housing',
    categoryName: 'Housing & Rent',
  },
  {
    keywords: [
      'transport', 'travel', 'commute', 'cab', 'uber', 'ola', 'auto', 'fuel',
      'petrol', 'diesel', 'metro'
    ],
    categoryId: 'cat-transport',
    categoryName: 'Cab, Metro & Fuel',
  },
  {
    keywords: [
      'shopping', 'clothes', 'apparel', 'myntra', 'amazon', 'flipkart',
      'shoes', 'fashion'
    ],
    categoryId: 'cat-shopping',
    categoryName: 'Shopping & Apparel',
  },
  {
    keywords: [
      'entertainment', 'movie', 'movies', 'netflix', 'spotify', 'hotstar',
      'prime', 'ott', 'cinema'
    ],
    categoryId: 'cat-entertainment',
    categoryName: 'Entertainment & OTT',
  },
  {
    keywords: [
      'loan', 'emi', 'borrowed', 'debt', 'credit card bill'
    ],
    categoryId: 'cat-loan',
    categoryName: 'Loan EMI & Debt',
  },
];

export function resolveCategoryFromQuery(query: string, categories: Category[]): {
  categoryId?: string;
  categoryName?: string;
} {
  const q = query.toLowerCase();

  for (const item of KEYWORD_MAP) {
    if (item.keywords.some((kw) => q.includes(kw))) {
      return { categoryId: item.categoryId, categoryName: item.categoryName };
    }
  }

  // Also check direct category names in the user's categories
  for (const cat of categories) {
    if (q.includes(cat.name.toLowerCase())) {
      return { categoryId: cat.id, categoryName: cat.name };
    }
  }

  return {};
}

/**
 * Deterministic Financial Calculations Pipeline
 * Ensures 100% mathematical accuracy using real user data.
 */
export function executeFinancialPipeline(
  query: string,
  ctx: FinancialPipelineContext
): PipelineResult {
  const q = query.toLowerCase().trim();

  // Full ledger vs current month ledger
  const allTx = ctx.allTransactions && ctx.allTransactions.length > 0 ? ctx.allTransactions : ctx.transactions;
  const currentMonthTx = allTx.filter((t) => t.date.startsWith(ctx.monthKey));
  const effectiveCurrentTx = currentMonthTx.length > 0 ? currentMonthTx : ctx.transactions;

  const currentExpenses = effectiveCurrentTx.filter((t) => t.type === 'expense');
  const currentIncome = effectiveCurrentTx.filter((t) => t.type === 'income');

  // Compute previous month key (e.g. 2026-10 -> 2026-09)
  const [yStr, mStr] = ctx.monthKey.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  const prevDate = new Date(y, m - 2, 1);
  const prevKey = `${prevDate.getFullYear()}-${(prevDate.getMonth() + 1).toString().padStart(2, '0')}`;
  const prevMonthTx = allTx.filter((t) => t.date.startsWith(prevKey));
  const prevExpenses = prevMonthTx.filter((t) => t.type === 'expense');
  const prevTotalExpense = prevExpenses.reduce((sum, t) => sum + t.amount, 0);

  // 0. Actionable Onboarding & Guide Prompts (Fresh User Setup)
  if (q.includes('add an expense') || q.includes('add expense')) {
    return {
      intent: 'add_expense_guide',
      calculatedAnswer: `To add an expense in FINORA:\n\n1. Tap the **+** button in the bottom navigation bar or click **+ Add Expense** on the Dashboard.\n2. Enter the merchant name, amount, date, and select a category.\n3. Alternatively, tap the **Camera** icon to scan any physical bill or receipt with Gemini Vision OCR.`,
      structuredFacts: {},
      suggestedPrompts: ['Add income', 'Set a budget', 'Add recurring payment'],
      isEmpty: true,
    };
  }

  if (q.includes('add income') || q.includes('record income')) {
    return {
      intent: 'add_income_guide',
      calculatedAnswer: `To record income in FINORA:\n\n1. Tap the **+** button in the navigation bar or click **+ Add Income** on the Dashboard.\n2. Switch the type toggle from **Expense** to **Income**.\n3. Enter the source (e.g. Primary Salary, Consulting, Dividends) and amount.\n4. Your cash flow and total balance will automatically update.`,
      structuredFacts: {},
      suggestedPrompts: ['Add an expense', 'Set a budget', 'Add recurring payment'],
      isEmpty: true,
    };
  }

  if (q.includes('add investment') || q.includes('record investment')) {
    return {
      intent: 'add_investment_guide',
      calculatedAnswer: `To track investments in FINORA:\n\n1. Tap **+ Add Transaction** and select the **SIP & Wealth Building** category.\n2. Enter the fund or stock name (e.g. Nifty 50 Index Fund, Zerodha, PPF).\n3. It will be tracked as a wealth-building investment in your cash flow overview.`,
      structuredFacts: {},
      suggestedPrompts: ['Add recurring payment', 'Set a budget', 'Add an expense'],
      isEmpty: true,
    };
  }

  if (q.includes('set a budget') || q.includes('set budget') || q.includes('how do i set a budget')) {
    return {
      intent: 'set_budget_guide',
      calculatedAnswer: `To set spending caps in FINORA:\n\n1. Go to the **Budgets** tab from the menu.\n2. Tap on any category (e.g. Groceries, Food Delivery, Fuel).\n3. Enter your monthly spending limit.\n4. FINORA will monitor your burn rate and warn you if you reach 80% of your cap.`,
      structuredFacts: {},
      suggestedPrompts: ['Add an expense', 'Add recurring payment', 'Add income'],
      isEmpty: true,
    };
  }

  if (q.includes('add recurring') || q.includes('add recurring payment') || q.includes('recurring payment')) {
    return {
      intent: 'add_recurring_guide',
      calculatedAnswer: `To track recurring payments or bills in FINORA:\n\n1. Navigate to the **Subscriptions & Recurring** tab.\n2. Tap **+ Add Subscription**.\n3. Specify the name (e.g. Electricity, Mobile Recharge, Rent, SIP), amount, billing cycle, and due date.\n4. Upcoming auto-debits will automatically appear in your upcoming schedule.`,
      structuredFacts: {},
      suggestedPrompts: ['Add an expense', 'Add income', 'Set a budget'],
      isEmpty: true,
    };
  }

  // 1. Where did I spend the most / Biggest Expenses / Top Spending
  if (
    q.includes('where did i spend the most') ||
    q.includes('where did i spend most') ||
    q.includes('spend the most') ||
    q.includes('spend most') ||
    q.includes('biggest expenses') ||
    q.includes('biggest expense') ||
    q.includes('highest expense') ||
    q.includes('highest expenses') ||
    q.includes('top spending') ||
    q.includes('top spend') ||
    q.includes('top expenses')
  ) {
    if (currentExpenses.length === 0) {
      return {
        intent: 'top_expenses',
        calculatedAnswer: `I don't have enough transaction history yet to determine your biggest spending category. Add a few expenses and I'll analyze them for you.`,
        structuredFacts: { topCategories: [] },
        suggestedPrompts: ['How do I add an expense?', 'How do I add income?', 'What are my upcoming payments?'],
        isEmpty: true,
      };
    }

    // Group by category
    const catSpendMap: Record<string, { name: string; amount: number; count: number }> = {};
    for (const tx of currentExpenses) {
      const cat = ctx.categories.find((c) => c.id === tx.categoryId);
      const name = cat?.name || 'Other';
      if (!catSpendMap[name]) {
        catSpendMap[name] = { name, amount: 0, count: 0 };
      }
      catSpendMap[name].amount += tx.amount;
      catSpendMap[name].count += 1;
    }

    const sortedCats = Object.values(catSpendMap).sort((a, b) => b.amount - a.amount);
    const topCat = sortedCats[0];
    const top3 = sortedCats.slice(0, 3);

    // Also get top single transactions
    const topTx = [...currentExpenses].sort((a, b) => b.amount - a.amount).slice(0, 3);

    const catListStr = top3
      .map((c, i) => `${i + 1}. **${c.name}**: ${formatCurrency(c.amount)} (${Math.round((c.amount / (ctx.totalExpenses || 1)) * 100)}%)`)
      .join('\n');

    return {
      intent: 'top_expenses',
      calculatedAnswer: `You spent the most on **${topCat.name}** at **${formatCurrency(topCat.amount)}** (${Math.round((topCat.amount / (ctx.totalExpenses || 1)) * 100)}% of your total spend).\n\nHere are your top 3 spending drivers for ${ctx.monthName}:\n${catListStr}\n\nYour highest individual expense was **${formatCurrency(topTx[0]?.amount || 0)}** at **${topTx[0]?.merchant || 'Rent'}**.`,
      structuredFacts: {
        topCategory: topCat.name,
        topAmount: topCat.amount,
        top3Categories: top3,
        topTransactions: topTx,
      },
      suggestedPrompts: ['How can I save ₹5,000?', 'Compare this month with last month', 'Show me my spending by category'],
      isEmpty: false,
    };
  }

  // 2. Specific Category Spending (Food, Health, Groceries, Utilities, SIP, Transport, etc.)
  const matchedCategory = resolveCategoryFromQuery(q, ctx.categories);
  if (
    matchedCategory.categoryId ||
    q.includes('on food') ||
    q.includes('on health') ||
    q.includes('on groceries') ||
    q.includes('on grocery') ||
    q.includes('on medicine') ||
    q.includes('on recharge') ||
    q.includes('on electricity') ||
    q.includes('on sip') ||
    q.includes('on transport') ||
    q.includes('on shopping')
  ) {
    const targetCatId = matchedCategory.categoryId;
    const catObj = ctx.categories.find((c) => c.id === targetCatId);
    const catName = matchedCategory.categoryName || catObj?.name || 'Selected Category';

    const categoryKeywords = KEYWORD_MAP.find((k) => k.categoryId === targetCatId)?.keywords || [];
    const matchingTx = currentExpenses.filter((t) => {
      if (t.categoryId === targetCatId) return true;
      const desc = `${t.merchant} ${t.description || ''} ${(t.tags || []).join(' ')}`.toLowerCase();
      return categoryKeywords.some((kw) => desc.includes(kw));
    });

    const catTotal = matchingTx.reduce((sum, t) => sum + t.amount, 0);

    if (matchingTx.length === 0 || catTotal === 0) {
      return {
        intent: 'category_spend',
        categoryName: catName,
        calculatedAnswer: `I couldn't find any **${catName}** expenses recorded for ${ctx.monthName}. You currently have ₹0 logged in this category.`,
        structuredFacts: { category: catName, spent: 0, count: 0 },
        suggestedPrompts: ['How much did I spend on food?', 'Where did I spend the most?', 'Show my grocery expenses'],
        isEmpty: true,
      };
    }

    // Previous month spending for same category
    const prevCatTx = prevExpenses.filter((t) => {
      if (t.categoryId === targetCatId) return true;
      const desc = `${t.merchant} ${t.description || ''} ${(t.tags || []).join(' ')}`.toLowerCase();
      return categoryKeywords.some((kw) => desc.includes(kw));
    });
    const prevCatTotal = prevCatTx.reduce((sum, t) => sum + t.amount, 0);
    const catDiff = catTotal - prevCatTotal;

    const diffPhrase = prevCatTotal > 0
      ? ` That's **${formatCurrency(Math.abs(catDiff))} ${catDiff >= 0 ? 'more' : 'less'}** than last month (${formatCurrency(prevCatTotal)}).`
      : '';

    const topItem = [...matchingTx].sort((a, b) => b.amount - a.amount)[0];
    const topItemText = topItem
      ? ` Your largest ticket was **${formatCurrency(topItem.amount)}** at ${topItem.merchant}.`
      : '';

    return {
      intent: 'category_spend',
      categoryName: catName,
      calculatedAnswer: `You spent **${formatCurrency(catTotal)}** on **${catName}** this month across ${matchingTx.length} transaction(s).${diffPhrase}${topItemText}`,
      structuredFacts: {
        category: catName,
        spent: catTotal,
        count: matchingTx.length,
        previousMonthSpent: prevCatTotal,
        diff: catDiff,
        topMerchant: topItem?.merchant,
        topAmount: topItem?.amount,
      },
      suggestedPrompts: ['Where did I spend the most?', 'What are my biggest expenses?', 'How can I save ₹5,000?'],
      isEmpty: false,
    };
  }

  // 3. Total Spending ("How much did I spend this month?")
  if (
    q.includes('how much did i spend') ||
    q.includes('how much have i spent') ||
    q.includes('total spend') ||
    q.includes('total expense') ||
    q.includes('spend this month') ||
    q.includes('spending this month') ||
    q === 'spend' ||
    q === 'spending'
  ) {
    if (currentExpenses.length === 0) {
      return {
        intent: 'total_spend',
        calculatedAnswer: `You haven't recorded any expenses this month yet.`,
        structuredFacts: { totalSpent: 0, count: 0 },
        suggestedPrompts: ['How do I add an expense?', 'How do I add income?', 'What are my upcoming payments?'],
        isEmpty: true,
      };
    }

    const diff = ctx.totalExpenses - prevTotalExpense;
    const compText = prevTotalExpense > 0
      ? ` (₹${Math.abs(Math.round(diff)).toLocaleString('en-IN')} ${diff >= 0 ? 'more' : 'less'} than last month)`
      : '';

    return {
      intent: 'total_spend',
      calculatedAnswer: `Your total spending for ${ctx.monthName} is **${formatCurrency(ctx.totalExpenses)}** across ${currentExpenses.length} transactions${compText}. You have **${formatCurrency(ctx.remainingBudget)}** remaining in your safe-to-spend budget.`,
      structuredFacts: {
        totalSpent: ctx.totalExpenses,
        count: currentExpenses.length,
        remainingBudget: ctx.remainingBudget,
        prevTotalExpense,
        diff,
      },
      suggestedPrompts: ['Where did I spend the most?', 'How much did I spend on food?', 'What are my upcoming payments?'],
      isEmpty: false,
    };
  }

  // 4. Upcoming Payments ("What are my upcoming payments?")
  if (
    q.includes('upcoming') ||
    q.includes('upcoming payments') ||
    q.includes('bills due') ||
    q.includes('next payment') ||
    q.includes('what do i owe') ||
    q.includes('due payments')
  ) {
    if (ctx.upcomingPayments.length === 0) {
      return {
        intent: 'upcoming_payments',
        calculatedAnswer: `You have no upcoming bills or payments scheduled for the rest of this month.`,
        structuredFacts: { upcoming: [] },
        suggestedPrompts: ['How much money is remaining?', 'How much did I save this month?'],
        isEmpty: true,
      };
    }

    const pending = ctx.upcomingPayments.filter((p) => p.status === 'pending');
    const totalPending = pending.reduce((sum, p) => sum + p.amount, 0);

    const list = pending
      .map((p) => `• **${p.name}**: ${formatCurrency(p.amount)} · Due **${p.dueDate}**${p.autoPayEnabled ? ' (Auto-debit active)' : ''}`)
      .join('\n');

    return {
      intent: 'upcoming_payments',
      calculatedAnswer: `You have **${pending.length} upcoming payments** totaling **${formatCurrency(totalPending)}**:\n\n${list}\n\nMake sure to maintain adequate balance in your linked account for auto-debits.`,
      structuredFacts: {
        count: pending.length,
        total: totalPending,
        items: pending,
      },
      suggestedPrompts: ['How much money is remaining?', 'How much did I invest?', 'Where did I spend the most?'],
      isEmpty: false,
    };
  }

  // 5. Investments & SIP ("How much did I invest?")
  if (
    q.includes('invest') ||
    q.includes('investment') ||
    q.includes('investments') ||
    q.includes('sip') ||
    q.includes('mutual fund') ||
    q.includes('stocks')
  ) {
    const investTx = currentExpenses.filter(
      (t) => t.categoryId === 'cat-investments' || t.merchant.toLowerCase().includes('sip') || t.merchant.toLowerCase().includes('groww') || t.merchant.toLowerCase().includes('zerodha')
    );
    const investTotal = investTx.reduce((sum, t) => sum + t.amount, 0);

    if (investTotal === 0) {
      return {
        intent: 'investments',
        calculatedAnswer: `You have not recorded any investments yet for ${ctx.monthName}. You can log SIPs, mutual funds, or stock contributions under the **SIP & Wealth Building** category.`,
        structuredFacts: { totalInvested: 0, count: 0, items: [] },
        suggestedPrompts: ['Add investment', 'How much did I save this month?', 'What are my upcoming payments?'],
        isEmpty: true,
      };
    }

    return {
      intent: 'investments',
      calculatedAnswer: `You have invested **${formatCurrency(investTotal)}** in ${ctx.monthName} across ${investTx.length} contribution(s). That represents **${Math.round((investTotal / (ctx.totalIncome || 1)) * 100)}%** of your monthly income!`,
      structuredFacts: {
        totalInvested: investTotal,
        count: investTx.length,
        items: investTx,
      },
      suggestedPrompts: ['How much did I save this month?', 'What are my upcoming payments?', 'How can I save ₹5,000?'],
      isEmpty: false,
    };
  }

  // 6. Savings & Advice to Save ("How much did I save this month?" & "What can I reduce to save ₹5,000?")
  if (
    q.includes('save') ||
    q.includes('saved') ||
    q.includes('savings') ||
    q.includes('savings rate')
  ) {
    if (q.includes('5000') || q.includes('5,000') || q.includes('reduce') || q.includes('save more') || q.includes('how to save') || q.includes('what can i cut')) {
      if (currentExpenses.length === 0) {
        return {
          intent: 'save_money_advice',
          calculatedAnswer: `You haven't recorded any expenses for ${ctx.monthName} yet. Add your regular spending, and I'll identify actionable optimizations to help you save ₹5,000+!`,
          structuredFacts: { target: 5000 },
          suggestedPrompts: ['Add an expense', 'Add income', 'Set a budget'],
          isEmpty: true,
        };
      }

      const diningSpend = currentExpenses
        .filter((t) => t.categoryId === 'cat-dining' || t.merchant.toLowerCase().includes('swiggy') || t.merchant.toLowerCase().includes('zomato'))
        .reduce((sum, t) => sum + t.amount, 0);
      const shoppingSpend = currentExpenses
        .filter((t) => t.categoryId === 'cat-shopping')
        .reduce((sum, t) => sum + t.amount, 0);
      const idleSubs = ctx.recurring.filter((r) => r.status === 'flagged' || r.utility === 'unnecessary');
      const subSavings = idleSubs.reduce((sum, r) => sum + r.amount, 0);

      const tips: string[] = [];
      if (diningSpend > 1000) {
        tips.push(`• **Trim Dining Out**: You spent ${formatCurrency(diningSpend)}. Trimming takeout can save ~${formatCurrency(Math.min(2500, Math.round(diningSpend * 0.4)))}.`);
      }
      if (idleSubs.length > 0) {
        tips.push(`• **Pause Idle Subscriptions**: Pause flagged services (${idleSubs.map((s) => s.name).join(', ')}) to save **${formatCurrency(subSavings)}/mo**.`);
      }
      if (shoppingSpend > 1000) {
        tips.push(`• **Defer Discretionary Shopping**: Postponing non-essential apparel/gadget purchases saves ~${formatCurrency(Math.min(2000, Math.round(shoppingSpend * 0.5)))}.`);
      }

      const adviceText = tips.length > 0
        ? `To save **₹5,000** this month, here are targeted adjustments based on your real spending:\n\n${tips.join('\n')}\n\nRedirecting these savings into an emergency fund or index SIP builds lasting wealth!`
        : `To save **₹5,000** this month, set category budget caps for your largest outflow categories in the **Budgets** section.`;

      return {
        intent: 'save_money_advice',
        calculatedAnswer: adviceText,
        structuredFacts: {
          target: 5000,
          diningSpend,
          shoppingSpend,
          subscriptionSavings: subSavings,
        },
        suggestedPrompts: ['Where did I spend the most?', 'What are my upcoming payments?', 'Compare this month with last month'],
        isEmpty: false,
      };
    }

    const netSaved = ctx.totalIncome - ctx.totalExpenses;
    return {
      intent: 'net_savings',
      calculatedAnswer: `You have saved **${formatCurrency(netSaved)}** so far in ${ctx.monthName} (Savings Rate: **${Math.round(ctx.savingsRate)}%**).\n\n• **Total Income**: ${formatCurrency(ctx.totalIncome)}\n• **Total Spends**: ${formatCurrency(ctx.totalExpenses)}\n• **Net Retained Cashflow**: ${formatCurrency(netSaved)}`,
      structuredFacts: {
        income: ctx.totalIncome,
        expenses: ctx.totalExpenses,
        netSaved,
        rate: ctx.savingsRate,
      },
      suggestedPrompts: ['What can I reduce to save ₹5,000?', 'Where did I spend the most?', 'What are my upcoming payments?'],
      isEmpty: false,
    };
  }

  // 7. Highest Spending Day ("What was my highest spending day?")
  if (
    q.includes('highest spending day') ||
    q.includes('biggest spending day') ||
    q.includes('highest spend day') ||
    q.includes('peak spending') ||
    q.includes('most expensive day')
  ) {
    if (currentExpenses.length === 0) {
      return {
        intent: 'highest_spending_day',
        calculatedAnswer: `No expense records found for ${ctx.monthName}.`,
        structuredFacts: {},
        suggestedPrompts: ['How much money is remaining?'],
        isEmpty: true,
      };
    }

    const dayMap: Record<string, number> = {};
    for (const tx of currentExpenses) {
      dayMap[tx.date] = (dayMap[tx.date] || 0) + tx.amount;
    }

    const sortedDays = Object.entries(dayMap).sort((a, b) => b[1] - a[1]);
    const peakDay = sortedDays[0];
    const dayTx = currentExpenses.filter((t) => t.date === peakDay[0]);

    return {
      intent: 'highest_spending_day',
      calculatedAnswer: `Your highest spending day was **${peakDay[0]}**, where you spent a total of **${formatCurrency(peakDay[1])}** across ${dayTx.length} transaction(s) (including **${dayTx[0]?.merchant}**).`,
      structuredFacts: {
        date: peakDay[0],
        amount: peakDay[1],
        transactions: dayTx,
      },
      suggestedPrompts: ['Where did I spend the most?', 'How much did I spend this month?'],
      isEmpty: false,
    };
  }

  // 8. Compare this month with last month ("Compare this month with last month.")
  if (
    q.includes('compare') ||
    q.includes('vs last month') ||
    q.includes('with last month') ||
    q.includes('comparison') ||
    q.includes('month over month')
  ) {
    const diff = ctx.totalExpenses - prevTotalExpense;
    const isHigher = diff > 0;
    const pct = prevTotalExpense > 0 ? Math.round((Math.abs(diff) / prevTotalExpense) * 100) : 0;

    return {
      intent: 'compare_months',
      calculatedAnswer: `In **${ctx.monthName}**, your total spending is **${formatCurrency(ctx.totalExpenses)}**, compared to **${formatCurrency(prevTotalExpense)}** last month (${prevKey}).\n\n${
        isHigher
          ? `You have spent **${formatCurrency(diff)} (${pct}%) more** than last month.`
          : `You have spent **${formatCurrency(Math.abs(diff))} (${pct}%) less** than last month — outstanding pacing!`
      }`,
      structuredFacts: {
        currentMonth: ctx.totalExpenses,
        previousMonth: prevTotalExpense,
        difference: diff,
        percentage: pct,
      },
      suggestedPrompts: ['Where did I spend the most?', 'What can I reduce to save ₹5,000?', 'What are my upcoming payments?'],
      isEmpty: false,
    };
  }

  // 9. Remaining Balance & Budget ("How much money is remaining?")
  if (
    q.includes('remaining') ||
    q.includes('how much money is remaining') ||
    q.includes('balance') ||
    q.includes('safe to spend') ||
    q.includes('how much is left')
  ) {
    return {
      intent: 'remaining_balance',
      calculatedAnswer: `Your Total Account Balance is **${formatCurrency(ctx.totalBalance)}**.\n\nFor ${ctx.monthName}, your Remaining Safe-to-Spend Budget is **${formatCurrency(ctx.remainingBudget)}** against your monthly budget cap.`,
      structuredFacts: {
        totalBalance: ctx.totalBalance,
        remainingBudget: ctx.remainingBudget,
      },
      suggestedPrompts: ['What are my upcoming payments?', 'Where did I spend the most?', 'How much did I invest?'],
      isEmpty: false,
    };
  }

  // 10. Spending by Category ("Show me my spending by category.")
  if (
    q.includes('by category') ||
    q.includes('spending by category') ||
    q.includes('breakdown') ||
    q.includes('categories')
  ) {
    const catSpendMap: Record<string, number> = {};
    for (const tx of currentExpenses) {
      const cat = ctx.categories.find((c) => c.id === tx.categoryId);
      const name = cat?.name || 'Other';
      catSpendMap[name] = (catSpendMap[name] || 0) + tx.amount;
    }

    const list = Object.entries(catSpendMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, amt]) => `• **${name}**: ${formatCurrency(amt)} (${Math.round((amt / (ctx.totalExpenses || 1)) * 100)}%)`)
      .join('\n');

    return {
      intent: 'spending_breakdown',
      calculatedAnswer: `Here is your complete spending breakdown for ${ctx.monthName}:\n\n${list || 'No expenses logged yet.'}`,
      structuredFacts: { breakdown: catSpendMap },
      suggestedPrompts: ['Where did I spend the most?', 'What can I reduce to save ₹5,000?', 'What are my upcoming payments?'],
      isEmpty: Object.keys(catSpendMap).length === 0,
    };
  }

  // Fallback / General overview
  return {
    intent: 'general_overview',
    calculatedAnswer: `In **${ctx.monthName}**, you've recorded **${formatCurrency(ctx.totalExpenses)}** in expenses and **${formatCurrency(ctx.totalIncome)}** in income. Your remaining safe-to-spend budget is **${formatCurrency(ctx.remainingBudget)}**.\n\nAsk me anything specific like *"Where did I spend the most?"*, *"How much did I spend on food?"*, or *"Show upcoming payments"*.`,
    structuredFacts: {
      income: ctx.totalIncome,
      expenses: ctx.totalExpenses,
      remaining: ctx.remainingBudget,
    },
    suggestedPrompts: [
      'Where did I spend the most?',
      'How much did I spend on food?',
      'What are my upcoming payments?',
      'What can I reduce to save ₹5,000?',
    ],
    isEmpty: false,
  };
}
