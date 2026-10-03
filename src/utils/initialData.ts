import { Category, Transaction, RecurringExpense, SavingsGoal, UpcomingPayment } from '../types/finance';

// Clean standard category taxonomy for Indian personal finances (zero pre-set budgets)
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-housing', name: 'Housing & Rent', type: 'expense', icon: 'Home', color: '#6366f1', monthlyBudget: 0, isEssential: true },
  { id: 'cat-groceries', name: 'Groceries & Daily Supplies', type: 'expense', icon: 'ShoppingCart', color: '#10b981', monthlyBudget: 0, isEssential: true },
  { id: 'cat-dining', name: 'Food Delivery & Dining Out', type: 'expense', icon: 'Utensils', color: '#f59e0b', monthlyBudget: 0, isEssential: false },
  { id: 'cat-utilities', name: 'Electricity & Internet Bills', type: 'expense', icon: 'Zap', color: '#06b6d4', monthlyBudget: 0, isEssential: true },
  { id: 'cat-transport', name: 'Cab, Metro & Fuel', type: 'expense', icon: 'Car', color: '#3b82f6', monthlyBudget: 0, isEssential: true },
  { id: 'cat-shopping', name: 'Shopping & Apparel', type: 'expense', icon: 'ShoppingBag', color: '#8b5cf6', monthlyBudget: 0, isEssential: false },
  { id: 'cat-entertainment', name: 'Entertainment & OTT', type: 'expense', icon: 'Film', color: '#ec4899', monthlyBudget: 0, isEssential: false },
  { id: 'cat-health', name: 'Healthcare & Pharmacy', type: 'expense', icon: 'Activity', color: '#ef4444', monthlyBudget: 0, isEssential: true },
  { id: 'cat-personal', name: 'Personal Care & Salon', type: 'expense', icon: 'Smile', color: '#a855f7', monthlyBudget: 0, isEssential: false },
  { id: 'cat-travel', name: 'Travel & Vacations', type: 'expense', icon: 'Plane', color: '#14b8a6', monthlyBudget: 0, isEssential: false },
  { id: 'cat-investments', name: 'SIP & Wealth Building', type: 'expense', icon: 'PiggyBank', color: '#22c55e', monthlyBudget: 0, isEssential: true },
  { id: 'cat-income-salary', name: 'Primary Salary', type: 'income', icon: 'Briefcase', color: '#22c55e', monthlyBudget: 0, isEssential: true },
  { id: 'cat-income-freelance', name: 'Consulting & Freelance', type: 'income', icon: 'Laptop', color: '#10b981', monthlyBudget: 0, isEssential: false },
  { id: 'cat-income-dividends', name: 'Dividends & Interest', type: 'income', icon: 'TrendingUp', color: '#38bdf8', monthlyBudget: 0, isEssential: false },
];

// Production Clean State: Zero demo recurring payments
export const DEFAULT_RECURRING: RecurringExpense[] = [];

// Production Clean State: Zero demo savings goals
export const DEFAULT_SAVINGS_GOALS: SavingsGoal[] = [];

// Production Clean State: Zero demo transactions
export const DEFAULT_TRANSACTIONS: Transaction[] = [];

// Production Clean State: Zero demo upcoming payments
export const DEFAULT_UPCOMING_PAYMENTS: UpcomingPayment[] = [];
