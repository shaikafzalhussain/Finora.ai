export type TransactionType = 'expense' | 'income' | 'investment' | 'loan';

export type PaymentMethod =
  | 'upi'
  | 'credit_card'
  | 'debit_card'
  | 'net_banking'
  | 'cash'
  | 'wallet';

export type SubscriptionUtility = 'essential' | 'useful' | 'unnecessary';

export interface BankAccountDetails {
  id?: string;
  bankName: string;
  accountNumberMasked: string; // e.g. "•••• 4821"
  accountNumberLast4: string; // "4821"
  accountType?: 'Savings' | 'Salary' | 'Current';
  balance?: number; // e.g. 72500
  nickname?: string;
  isPrimary?: boolean;
  rawAccountNumber?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone: string; // e.g. "9876504821"
  email?: string;
  password?: string;
  role?: 'admin' | 'user' | string;
  isOnboarded: boolean;
  isAuthenticated: boolean;
  bankDetails?: BankAccountDetails;
  bankAccounts?: BankAccountDetails[];
  salaryDate?: number; // e.g. 1st of month
  createdAt: string;
  hideBalance?: boolean;
  theme?: 'dark' | 'light';
  notificationsEnabled?: boolean;
}

export interface CustomBudget {
  id: string;
  categoryId: string;
  budgetAmount: number;
  period: 'monthly' | 'weekly' | 'custom';
  startDate?: string;
  accountId?: string;
  accountName?: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  monthlyBudget: number; // in INR
  isEssential: boolean; // Needs vs Wants
  subcategories?: string[];
  isCustom?: boolean;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // e.g. "08:42 PM"
  amount: number; // in INR
  type: TransactionType;
  categoryId: string;
  subCategory?: string;
  merchant: string;
  paymentMethod: PaymentMethod;
  accountId?: string;
  accountName?: string;
  description?: string;
  notes?: string;
  tags?: string[];
  isRecurring?: boolean;
  isFlaggedUnnecessary?: boolean;
}

export interface UpcomingPayment {
  id: string;
  name: string;
  amount: number; // in INR
  categoryId: string;
  dueDate: string; // YYYY-MM-DD
  status: 'pending' | 'completed';
  autoPayEnabled: boolean;
  isRecharge?: boolean;
  rechargeDetails?: {
    personOrAccount: string;
    operator?: string;
    validityDays: number;
    activationDate: string; // YYYY-MM-DD
    expiryDate: string; // YYYY-MM-DD
  };
  notes?: string;
}

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number; // in INR
  categoryId: string;
  billingCycle: 'monthly' | 'yearly' | 'weekly' | 'quarterly';
  nextDueDate: string; // YYYY-MM-DD
  status: 'active' | 'flagged' | 'cancelled';
  utility: SubscriptionUtility;
  description?: string;
  merchant?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number; // in INR
  currentAmount: number; // in INR
  targetDate: string; // YYYY-MM-DD
  category: string;
  color: string;
  emoji: string;
}

export interface SmartAlert {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  date: string;
  category?: string;
  actionText?: string;
  actionLink?: string;
  read?: boolean;
}

export interface BudgetOptimizationResult {
  healthScore: number; // 0 - 100
  healthStatus: 'Excellent' | 'Good' | 'Needs Attention' | 'Critical';
  summary: string;
  whatHappened: string;
  whyItHappened: string;
  alternativeSuggestion: string;
  potentialSavings: number; // in INR
  needsVsWantsAnalysis: {
    needsPercent: number;
    wantsPercent: number;
    savingsPercent: number;
    benchmarkComparison: string;
  };
  leakages: Array<{
    title: string;
    description: string;
    monthlyLoss: number;
    annualLoss: number;
    severity: 'high' | 'medium' | 'low';
  }>;
  actionableRecommendations: Array<{
    id: string;
    title: string;
    description: string;
    estimatedMonthlySavings: number;
    difficulty: 'Easy' | 'Moderate' | 'Challenging';
    recommendedBudgetCap?: {
      categoryId: string;
      categoryName: string;
      newCap: number;
      currentCap: number;
    };
  }>;
  forecastProjection: {
    projectedEndMonthSpend: number;
    projectedEndMonthSavings: number;
    budgetStatus: 'under_budget' | 'near_limit' | 'exceeded';
    recommendation: string;
  };
}

export interface WhatIfScenarioResult {
  scenario: string;
  monthlyImpact: number; // in INR
  annualImpact: number;
  feasibilityRating: 'Highly Recommended' | 'Viable with Trade-offs' | 'High Risk';
  breakdown: string[];
  tradeOffs: string[];
  savingsTimelineEffect: string;
  recommendation: string;
}

export interface MonthlyReportData {
  monthKey: string;
  monthName: string;
  totalIncome: number;
  totalExpenses: number;
  totalInvestments: number;
  netSavings: number;
  savingsRate: number;
  budgetUtilization: number;
  topCategories: Array<{ name: string; amount: number; percentage: number }>;
  topMerchants: Array<{ name: string; amount: number }>;
  aiExecutiveSummary: string;
  highlights: string[];
  unnecessarySpendingIdentified: number;
  nextMonthBudgetPlan: Array<{ categoryName: string; currentSpend: number; recommendedBudget: number }>;
  strategicRecommendations: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedPrompts?: string[];
  metricsContext?: {
    categoryName?: string;
    amount?: number;
  };
}

export interface CashFlowPeriodData {
  periodLabel: string;
  income: number;
  spending: number;
  investments: number;
  net: number;
}
