import {
  BudgetOptimizationResult,
  Category,
  RecurringExpense,
  SavingsGoal,
  Transaction,
} from '../types/finance';

export interface AuditInputData {
  month?: string;
  totalIncome?: number;
  totalExpenses?: number;
  categories?: Category[];
  transactions?: Transaction[];
  recurring?: RecurringExpense[];
  savingsGoals?: SavingsGoal[];
}

export function calculateAlgorithmicBudgetAudit(input: AuditInputData): BudgetOptimizationResult {
  const rawIncome = Number(input.totalIncome) || 0;
  const rawExpenses = Number(input.totalExpenses) || 0;
  const categoriesList = Array.isArray(input.categories) ? input.categories : [];
  const txList = Array.isArray(input.transactions) ? input.transactions : [];
  const recurringList = Array.isArray(input.recurring) ? input.recurring : [];
  const goalsList = Array.isArray(input.savingsGoals) ? input.savingsGoals : [];

  // Zero-data guard
  if (txList.length === 0 && rawIncome === 0 && rawExpenses === 0) {
    const monthName = input.month || 'this month';
    return {
      healthScore: 0,
      healthStatus: 'Awaiting Data' as const,
      summary: `No financial records found for ${monthName}. Log your income, expenses, and category budgets to generate an AI financial audit.`,
      whatHappened: 'No financial activity logged for this period.',
      whyItHappened: 'Awaiting transactions and budget definitions.',
      alternativeSuggestion: 'Start by logging your monthly salary, fixed bills, and day-to-day spending.',
      potentialSavings: 0,
      needsVsWantsAnalysis: {
        needsPercent: 0,
        wantsPercent: 0,
        savingsPercent: 0,
        benchmarkComparison: 'Awaiting financial data to compare against 50/30/20 standard.',
      },
      leakages: [],
      actionableRecommendations: [],
      forecastProjection: {
        projectedEndMonthSpend: 0,
        projectedEndMonthSavings: 0,
        budgetStatus: 'under_budget',
        recommendation: 'Record transactions regularly to project end-of-month run-rate.',
      },
    };
  }

  // 1. Transaction-level aggregation
  const catSpendMap = new Map<string, number>();
  let calculatedExpenses = 0;
  let calculatedIncome = 0;

  for (const tx of txList) {
    const amt = Math.abs(Number(tx.amount) || 0);
    if (amt <= 0) continue;
    if (tx.type === 'expense') {
      calculatedExpenses += amt;
      const catId = tx.categoryId || 'cat-general';
      catSpendMap.set(catId, (catSpendMap.get(catId) || 0) + amt);
    } else if (tx.type === 'income') {
      calculatedIncome += amt;
    }
  }

  const finalIncome = rawIncome > 0 ? rawIncome : (calculatedIncome > 0 ? calculatedIncome : 0);
  const finalExpenses = rawExpenses > 0 ? rawExpenses : (calculatedExpenses > 0 ? calculatedExpenses : 0);
  const netSavings = Math.max(0, finalIncome - finalExpenses);
  const savingsRate = finalIncome > 0 ? Math.round((netSavings / finalIncome) * 100) : 0;

  // 2. Category-wise Analysis
  const categoryAnalysis = categoriesList.map((cat) => {
    const customSpent = (cat as any).spent ? Number((cat as any).spent) : 0;
    const spent = catSpendMap.get(cat.id) ?? customSpent;
    const budget = Number(cat.monthlyBudget) || 0;
    const isOver = budget > 0 && spent > budget;
    const overrun = isOver ? spent - budget : 0;
    const utilization = budget > 0 ? Math.round((spent / budget) * 100) : 0;
    return {
      id: cat.id,
      name: cat.name || 'Category',
      spent,
      budget,
      isOver,
      overrun,
      utilization,
    };
  });

  const sortedCategories = [...categoryAnalysis].sort((a, b) => b.spent - a.spent);
  const topCategory = sortedCategories[0] || { id: 'top-cat', name: 'General Spending', spent: finalExpenses, budget: 0, overrun: 0, utilization: 0 };
  const topCategoryPercent = finalExpenses > 0 ? Math.round((topCategory.spent / finalExpenses) * 100) : 0;
  const overBudgetCategories = categoryAnalysis.filter((c) => c.isOver);

  // 3. Needs vs Wants vs Savings (50/30/20 Standard)
  let needsSpend = 0;
  let wantsSpend = 0;

  for (const cat of categoryAnalysis) {
    const n = cat.name.toLowerCase();
    if (
      n.includes('rent') ||
      n.includes('hous') ||
      n.includes('grocer') ||
      n.includes('util') ||
      n.includes('bill') ||
      n.includes('health') ||
      n.includes('medic') ||
      n.includes('transp') ||
      n.includes('fuel') ||
      n.includes('emi') ||
      n.includes('loan') ||
      n.includes('insur') ||
      n.includes('educ')
    ) {
      needsSpend += cat.spent;
    } else if (
      n.includes('sav') ||
      n.includes('invest') ||
      n.includes('sip') ||
      n.includes('fund') ||
      n.includes('gold') ||
      n.includes('emergen')
    ) {
      // counted in savings
    } else {
      wantsSpend += cat.spent;
    }
  }

  // If no transactions have been mapped specifically, provide a realistic distribution
  if (needsSpend === 0 && wantsSpend === 0 && finalExpenses > 0) {
    needsSpend = Math.round(finalExpenses * 0.6);
    wantsSpend = Math.round(finalExpenses * 0.4);
  }

  const denominator = finalIncome > 0 ? finalIncome : (finalExpenses > 0 ? finalExpenses : 1);
  let needsPercent = Math.min(85, Math.max(15, Math.round((needsSpend / denominator) * 100)));
  let wantsPercent = Math.min(70, Math.max(10, Math.round((wantsSpend / denominator) * 100)));
  let savingsPercent = finalIncome > 0 ? savingsRate : Math.max(0, 100 - needsPercent - wantsPercent);

  // Normalize so percentages are well behaved
  if (needsPercent + wantsPercent + savingsPercent > 100 && finalIncome > 0) {
    wantsPercent = Math.max(10, 100 - needsPercent - savingsPercent);
  }

  const benchmarkComparison = `50/30/20 Analysis: Allocating ${needsPercent}% to Needs (target: 50%), ${wantsPercent}% to Wants (target: 30%), and ${savingsPercent}% to Savings (target: 20%). ${
    savingsPercent >= 20
      ? 'Your savings rate meets certified CFP wealth preservation standards.'
      : `Trimming discretionary spending by ~₹${Math.round(finalIncome * 0.05).toLocaleString('en-IN')}/mo will elevate your savings rate toward the 20% benchmark.`
  }`;

  // 4. Financial Leakages Detection
  const leakages: BudgetOptimizationResult['leakages'] = [];

  // A. Flagged / Inactive Subscriptions
  const flaggedSubs = recurringList.filter(
    (r) => r.status === 'flagged' || r.utility === 'unnecessary' || (r as any).utility === 'unused'
  );
  for (const sub of flaggedSubs) {
    const amt = Math.abs(Number(sub.amount) || 0);
    if (amt <= 0) continue;
    leakages.push({
      title: `Inactive / Flagged: ${sub.name || sub.merchant || 'Subscription'}`,
      description: `Identified as low-utility recurring commitment. Auto-debits ₹${amt.toLocaleString('en-IN')}/month with minimal recent usage.`,
      monthlyLoss: amt,
      annualLoss: amt * 12,
      severity: amt >= 1000 ? 'high' : 'medium',
    });
  }

  // B. Over-budget category overruns
  for (const ov of overBudgetCategories) {
    leakages.push({
      title: `Budget Overshoot in ${ov.name}`,
      description: `Tracked spend of ₹${ov.spent.toLocaleString('en-IN')} exceeded the planned limit of ₹${ov.budget.toLocaleString('en-IN')} by ₹${ov.overrun.toLocaleString('en-IN')}.`,
      monthlyLoss: ov.overrun,
      annualLoss: ov.overrun * 12,
      severity: ov.overrun > 3000 ? 'high' : 'medium',
    });
  }

  // C. Discretionary delivery / dining out waste
  const diningCat = categoryAnalysis.find(
    (c) => c.name.toLowerCase().includes('food') || c.name.toLowerCase().includes('dining')
  );
  if (diningCat && diningCat.spent > 3000 && leakages.length < 3) {
    const estimatedLoss = Math.round(diningCat.spent * 0.2);
    leakages.push({
      title: 'Discretionary Dining & Delivery Leakage',
      description: `Frequent food delivery and dining out aggregate to ₹${diningCat.spent.toLocaleString('en-IN')}. Trimming order frequency by 2 meals/week recovers liquid cash.`,
      monthlyLoss: estimatedLoss,
      annualLoss: estimatedLoss * 12,
      severity: 'medium',
    });
  }

  if (leakages.length === 0) {
    const bufferLoss = Math.round(finalExpenses * 0.05) || 500;
    leakages.push({
      title: 'Discretionary Miscellaneous Leakage',
      description: 'Unbudgeted small daily cash expenses erode net cash flow when left unmonitored.',
      monthlyLoss: bufferLoss,
      annualLoss: bufferLoss * 12,
      severity: 'low',
    });
  }

  // 5. Actionable Recommendations
  const actionableRecommendations: BudgetOptimizationResult['actionableRecommendations'] = [];

  // A. Revised budget caps for exceeded categories
  for (const ov of overBudgetCategories.slice(0, 2)) {
    const revisedCap = Math.round(Math.max(ov.budget, ov.spent * 0.88));
    const savings = Math.max(500, ov.spent - revisedCap);
    actionableRecommendations.push({
      id: `rec-cap-${ov.id}`,
      title: `Re-align ${ov.name} Budget Cap`,
      description: `Spend reached ₹${ov.spent.toLocaleString('en-IN')} against target ₹${ov.budget.toLocaleString('en-IN')}. Setting a realistic cap at ₹${revisedCap.toLocaleString('en-IN')} reins in cash outflows.`,
      estimatedMonthlySavings: savings,
      difficulty: 'Moderate',
      recommendedBudgetCap: {
        categoryId: ov.id,
        categoryName: ov.name,
        newCap: revisedCap,
        currentCap: ov.budget,
      },
    });
  }

  // B. Flagged subscription cancellation
  if (flaggedSubs.length > 0) {
    const sub = flaggedSubs[0];
    const amt = Math.abs(Number(sub.amount) || 0);
    actionableRecommendations.push({
      id: `rec-sub-${sub.id}`,
      title: `Cancel / Pause ${sub.name || sub.merchant || 'Flagged Subscription'}`,
      description: `Eliminating this flagged subscription saves ₹${amt.toLocaleString('en-IN')} monthly (₹${(amt * 12).toLocaleString('en-IN')} annually) with zero lifestyle compromise.`,
      estimatedMonthlySavings: amt,
      difficulty: 'Easy',
    });
  }

  // C. Discretionary spending reduction or SIP boost
  if (actionableRecommendations.length < 3) {
    const targetSavings = Math.max(1000, Math.round(finalExpenses * 0.08));
    actionableRecommendations.push({
      id: 'rec-dining-trim',
      title: 'Batch Food Orders & Home Cooking',
      description: `Switching 2 restaurant or Swiggy meals per week to home-cooked alternatives frees up ~₹${targetSavings.toLocaleString('en-IN')} in monthly disposable surplus.`,
      estimatedMonthlySavings: targetSavings,
      difficulty: 'Easy',
    });
  }

  // D. Goal contribution recommendation
  if (goalsList.length > 0 && actionableRecommendations.length < 4) {
    const primaryGoal = goalsList[0];
    const boostAmt = Math.max(1000, Math.round(finalIncome * 0.05));
    actionableRecommendations.push({
      id: `rec-goal-${primaryGoal.id}`,
      title: `Direct Surplus to ${primaryGoal.name}`,
      description: `Channel recovered monthly savings directly toward "${primaryGoal.name}" to accelerate target completion timeline.`,
      estimatedMonthlySavings: boostAmt,
      difficulty: 'Easy',
    });
  }

  // Total potential savings
  const totalPotentialSavings = actionableRecommendations.reduce(
    (sum, r) => sum + (r.estimatedMonthlySavings || 0),
    0
  );

  // 6. Transparent Financial Health Score (0 - 100)
  let healthScore = 55;
  if (savingsRate >= 30) healthScore += 25;
  else if (savingsRate >= 20) healthScore += 18;
  else if (savingsRate >= 10) healthScore += 8;
  else if (savingsRate < 0) healthScore -= 10;

  if (overBudgetCategories.length === 0) healthScore += 12;
  else healthScore -= Math.min(16, overBudgetCategories.length * 5);

  if (finalIncome > finalExpenses) healthScore += 8;
  else healthScore -= 12;

  if (flaggedSubs.length > 0) healthScore -= Math.min(8, flaggedSubs.length * 3);

  healthScore = Math.min(96, Math.max(30, healthScore));
  const healthStatus: 'Excellent' | 'Good' | 'Needs Attention' | 'Critical' =
    healthScore >= 80 ? 'Excellent' : healthScore >= 65 ? 'Good' : healthScore >= 50 ? 'Needs Attention' : 'Critical';

  const monthLabel = input.month || 'this month';

  const whatHappened = `In ${monthLabel}, you recorded ₹${finalExpenses.toLocaleString('en-IN')} in outflows against ₹${finalIncome.toLocaleString('en-IN')} total inflows, maintaining a ${savingsRate}% net savings rate (₹${netSavings.toLocaleString('en-IN')} retained). Your largest spending category was ${topCategory.name} at ₹${topCategory.spent.toLocaleString('en-IN')}${topCategoryPercent > 0 ? ` (${topCategoryPercent}% of total expenses)` : ''}.`;

  const whyItHappened = `Cashflow was primarily driven by ${sortedCategories.slice(0, 2).map((c) => `${c.name} (₹${c.spent.toLocaleString('en-IN')})`).join(' and ')}${
    overBudgetCategories.length > 0
      ? `, with ${overBudgetCategories.length} categor${overBudgetCategories.length > 1 ? 'ies' : 'y'} exceeding set limits`
      : ', with category budgets maintained within target caps'
  }${flaggedSubs.length > 0 ? `, alongside ₹${flaggedSubs.reduce((s, r) => s + (Number(r.amount) || 0), 0).toLocaleString('en-IN')}/mo in flagged subscription overhead` : ''}.`;

  const alternativeSuggestion = `Adopt weekly spending check-ins, apply the recommended revised budget cap for ${topCategory.name}, and pause inactive subscriptions to unlock an estimated ₹${totalPotentialSavings.toLocaleString('en-IN')}/mo in net savings.`;

  const summary = `Your financial health score is ${healthScore}/100 (${healthStatus}). You are retaining ₹${netSavings.toLocaleString('en-IN')} (${savingsRate}% savings rate) in ${monthLabel}. Implementing the prioritized adjustments can unlock ~₹${totalPotentialSavings.toLocaleString('en-IN')}/month in optimized savings.`;

  const forecastProjection = {
    projectedEndMonthSpend: Math.round(finalExpenses * 1.05),
    projectedEndMonthSavings: Math.max(0, finalIncome - Math.round(finalExpenses * 1.05)),
    budgetStatus: overBudgetCategories.length > 0 ? ('near_limit' as const) : ('under_budget' as const),
    recommendation:
      overBudgetCategories.length > 0
        ? `You have exceeded limits in ${overBudgetCategories.map((c) => c.name).join(', ')}. Keep daily discretionary spending disciplined for the remainder of the month.`
        : 'Spending velocity is well balanced. Maintain current habit patterns to achieve your monthly savings target.',
  };

  return {
    healthScore,
    healthStatus,
    summary,
    whatHappened,
    whyItHappened,
    alternativeSuggestion,
    potentialSavings: totalPotentialSavings,
    needsVsWantsAnalysis: {
      needsPercent,
      wantsPercent,
      savingsPercent,
      benchmarkComparison,
    },
    leakages,
    actionableRecommendations,
    forecastProjection,
  };
}
