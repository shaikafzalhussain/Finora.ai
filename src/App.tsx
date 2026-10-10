/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileHeroCard } from './components/MobileHeroCard';
import { SpendVelocityChart } from './components/SpendVelocityChart';
import { CategorySpendBars } from './components/CategorySpendBars';
import { TransactionsTable } from './components/TransactionsTable';
import { AIBudgetOptimizerView } from './components/AIBudgetOptimizerView';
import { AIMoneyCoachView } from './components/AIMoneyCoachView';
import { AnalyticsView } from './components/AnalyticsView';
import { BudgetsView } from './components/BudgetsView';
import { RecurringExpensesView } from './components/RecurringExpensesView';
import { SavingsGoalsView } from './components/SavingsGoalsView';
import { FinancialCalendarView } from './components/FinancialCalendarView';
import { MonthlyReportView } from './components/MonthlyReportView';
import { SmartAlertsBanner } from './components/SmartAlertsBanner';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { TransactionModal } from './components/TransactionModal';
import { NaturalLanguageModal } from './components/NaturalLanguageModal';
import { ReceiptScannerModal } from './components/ReceiptScannerModal';
import { ImportTransactionsModal } from './components/ImportTransactionsModal';
import { OnboardingModal } from './components/OnboardingModal';
import { BankDetailsModal } from './components/BankDetailsModal';
import { AuthModal } from './components/AuthModal';
import { BalanceInsightsCard } from './components/BalanceInsightsCard';
import { UpcomingPaymentsCard } from './components/UpcomingPaymentsCard';
import { ProfileView } from './components/ProfileView';
import { PhoneAuthModal } from './components/PhoneAuthModal';
import { IncomeView } from './components/IncomeView';
import { LandingPage } from './components/LandingPage';
import { AdminConsole } from './components/AdminConsole';
import { NotificationCenterModal } from './components/NotificationCenterModal';

import {
  Category,
  Transaction,
  RecurringExpense,
  SavingsGoal,
  BudgetOptimizationResult,
  SmartAlert,
  SubscriptionUtility,
  UserProfile,
  BankAccountDetails,
  UpcomingPayment,
  TransactionType,
} from './types/finance';

import {
  loadCategories,
  saveCategories,
  loadTransactions,
  saveTransactions,
  loadRecurring,
  saveRecurring,
  loadGoals,
  saveGoals,
  loadUpcomingPayments,
  saveUpcomingPayments,
  loadAiAudit,
  saveAiAudit,
  loadUserProfile,
  saveUserProfile,
  DEFAULT_USER_PROFILE,
  resetAllData,
  exportDataAsJson,
  exportTransactionsToCsv,
  loadTransactionsForUser,
  saveTransactionsForUser,
  loadRecurringForUser,
  saveRecurringForUser,
  loadGoalsForUser,
  saveGoalsForUser,
  loadUpcomingPaymentsForUser,
  saveUpcomingPaymentsForUser,
  isExistingAdminUser,
} from './utils/storage';
import { EXISTING_USER_BANK_ACCOUNTS } from './utils/existingUserData';
import { exportFinancialReportPDF } from './utils/pdfExport';

import {
  computeMonthlyStats,
  computeCategorySpend,
  computeDailySpendVelocity,
  filterTransactionsByMonth,
  parseMonthKey,
} from './utils/financeCalculations';

import { formatCurrency } from './utils/formatters';
import {
  Sparkles,
  ArrowRight,
  Bot,
  Plus,
  Lightbulb,
  AlertTriangle,
  Zap,
} from 'lucide-react';

export default function App() {
  const initialMonthKey = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${y}-${m}`;
  }, []);

  const [currentMonthKey, setCurrentMonthKey] = useState<string>(initialMonthKey);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // User Profile & Onboarding States (FINORA AI)
  const [userProfile, setUserProfile] = useState<UserProfile>(loadUserProfile);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => !loadUserProfile().isOnboarded);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'profile' | 'login' | 'signup' | 'reset'>('profile');

  // Core Data States (Strictly isolated per authenticated user - New users start with ZERO data)
  const currentDataUserRef = useRef<string>(userProfile.phone || userProfile.id);

  const [categories, setCategories] = useState<Category[]>(loadCategories);
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const p = loadUserProfile();
    return loadTransactionsForUser(p?.phone || p?.id, currentMonthKey);
  });
  const [recurring, setRecurring] = useState<RecurringExpense[]>(() => {
    const p = loadUserProfile();
    return loadRecurringForUser(p?.phone || p?.id);
  });
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    const p = loadUserProfile();
    return loadGoalsForUser(p?.phone || p?.id);
  });
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>(() => {
    const p = loadUserProfile();
    return loadUpcomingPaymentsForUser(p?.phone || p?.id);
  });
  const [aiAudit, setAiAudit] = useState<BudgetOptimizationResult | null>(loadAiAudit);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());

  // User Data Isolation: Reload isolated records whenever authenticated user changes
  useEffect(() => {
    const userIdentifier = userProfile.phone || userProfile.id;
    const isAfzal = isExistingAdminUser(userIdentifier);

    // If existing primary user (Shaik Afzal Hussain) and bank accounts empty, attach his 3 accounts
    if (isAfzal && (!userProfile.bankAccounts || userProfile.bankAccounts.length === 0)) {
      setUserProfile((prev) => ({
        ...prev,
        bankAccounts: EXISTING_USER_BANK_ACCOUNTS,
        bankDetails: EXISTING_USER_BANK_ACCOUNTS[0],
      }));
    }

    // Load isolated datasets for this specific user
    const userTxs = loadTransactionsForUser(userIdentifier, currentMonthKey);
    const userRec = loadRecurringForUser(userIdentifier);
    const userGls = loadGoalsForUser(userIdentifier);
    const userUpc = loadUpcomingPaymentsForUser(userIdentifier);

    setTransactions(userTxs);
    setRecurring(userRec);
    setSavingsGoals(userGls);
    setUpcomingPayments(userUpc);
    currentDataUserRef.current = userIdentifier;
  }, [userProfile.phone, userProfile.id, currentMonthKey]);

  // Modern Public Landing Page & Google AI Studio-style Auth Modal State
  const [isPhoneAuthOpen, setIsPhoneAuthOpen] = useState(false);
  const [phoneAuthInitialTab, setPhoneAuthInitialTab] = useState<'signin' | 'signup'>('signin');

  const handleOpenAuth = (mode: 'signin' | 'signup' = 'signin') => {
    setPhoneAuthInitialTab(mode);
    setIsPhoneAuthOpen(true);
  };

  // Dedicated Admin Console routing & state (Spec #4, #5, #6)
  const [isAdminView, setIsAdminView] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      return (
        path.startsWith('/admin') ||
        hash === '#admin' ||
        search.includes('admin=true')
      );
    }
    return false;
  });

  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (path.startsWith('/admin') || hash === '#admin' || search.includes('admin=true')) {
        setIsAdminView(true);
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const handleOpenAdmin = () => {
    setIsAdminView(true);
    window.history.pushState({}, '', '#admin');
  };

  const handleExitAdmin = () => {
    setIsAdminView(false);
    if (window.location.hash === '#admin' || window.location.pathname.startsWith('/admin')) {
      window.history.pushState({}, '', '/');
    }
  };

  // Filter States
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [transactionModalType, setTransactionModalType] = useState<TransactionType>('expense');
  const [isNaturalLanguageModalOpen, setIsNaturalLanguageModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isImportCsvModalOpen, setIsImportCsvModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Save to LocalStorage & Server isolated per authenticated user
  useEffect(() => {
    saveCategories(categories);
  }, [categories]);

  useEffect(() => {
    const userIdentifier = userProfile.phone || userProfile.id;
    if (currentDataUserRef.current !== userIdentifier) return;
    saveTransactionsForUser(userIdentifier, transactions);
    const token = sessionStorage.getItem('finora_user_token') || sessionStorage.getItem('finora_admin_token');
    if (token) {
      fetch('/api/user/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ transactions }),
      }).catch(console.error);
    }
  }, [transactions, userProfile.phone, userProfile.id]);

  useEffect(() => {
    const userIdentifier = userProfile.phone || userProfile.id;
    if (currentDataUserRef.current !== userIdentifier) return;
    saveRecurringForUser(userIdentifier, recurring);
    const token = sessionStorage.getItem('finora_user_token') || sessionStorage.getItem('finora_admin_token');
    if (token) {
      fetch('/api/user/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recurring }),
      }).catch(console.error);
    }
  }, [recurring, userProfile.phone, userProfile.id]);

  useEffect(() => {
    const userIdentifier = userProfile.phone || userProfile.id;
    if (currentDataUserRef.current !== userIdentifier) return;
    saveGoalsForUser(userIdentifier, savingsGoals);
    const token = sessionStorage.getItem('finora_user_token') || sessionStorage.getItem('finora_admin_token');
    if (token) {
      fetch('/api/user/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ savingsGoals }),
      }).catch(console.error);
    }
  }, [savingsGoals, userProfile.phone, userProfile.id]);

  useEffect(() => {
    if (aiAudit) {
      saveAiAudit(aiAudit);
    }
  }, [aiAudit]);

  useEffect(() => {
    saveUserProfile(userProfile);
  }, [userProfile]);

  useEffect(() => {
    const userIdentifier = userProfile.phone || userProfile.id;
    if (currentDataUserRef.current !== userIdentifier) return;
    saveUpcomingPaymentsForUser(userIdentifier, upcomingPayments);
  }, [upcomingPayments, userProfile.phone, userProfile.id]);

  const handleToggleUpcomingStatus = (id: string) => {
    setUpcomingPayments((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: p.status === 'completed' ? 'pending' : 'completed' } : p
      )
    );
  };

  const handleCompleteOnboarding = (profileData: Partial<UserProfile>) => {
    const updated = {
      ...userProfile,
      ...profileData,
      isOnboarded: true,
      isAuthenticated: true,
    };
    setUserProfile(updated);
    setIsOnboardingOpen(false);
  };

  const handleUpdateBankDetails = (details: BankAccountDetails | undefined) => {
    setUserProfile((prev) => ({
      ...prev,
      bankDetails: details,
      bankAccounts: details ? (prev.bankAccounts && prev.bankAccounts.length > 0 ? prev.bankAccounts : [details]) : [],
    }));
  };

  const handleUpdateBankAccounts = (accounts: BankAccountDetails[], primary?: BankAccountDetails) => {
    const primaryAccount = primary || accounts.find((a) => a.isPrimary) || accounts[0];
    setUserProfile((prev) => ({
      ...prev,
      bankAccounts: accounts,
      bankDetails: primaryAccount,
    }));
  };

  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setUserProfile((prev) => ({
      ...prev,
      ...updated,
    }));
  };

  const handleLogin = (user: UserProfile) => {
    setUserProfile(user);
    setIsAuthModalOpen(false);
  };

  const handlePhoneAuthSuccess = (authenticatedUser: UserProfile) => {
    setUserProfile(authenticatedUser);
    setIsPhoneAuthOpen(false);

    // Immediately load isolated dataset for this specific user
    const userIdentifier = authenticatedUser.phone || authenticatedUser.id;
    const userTxs = loadTransactionsForUser(userIdentifier, currentMonthKey);
    const userRec = loadRecurringForUser(userIdentifier);
    const userGls = loadGoalsForUser(userIdentifier);
    const userUpc = loadUpcomingPaymentsForUser(userIdentifier);

    setTransactions(userTxs);
    setRecurring(userRec);
    setSavingsGoals(userGls);
    setUpcomingPayments(userUpc);

    if (authenticatedUser.role === 'admin') {
      setIsAdminView(true);
      window.history.pushState({}, '', '#admin');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('finora_user_token');
    sessionStorage.removeItem('finora_admin_token');
    setUserProfile(DEFAULT_USER_PROFILE);
    setTransactions([]);
    setRecurring([]);
    setSavingsGoals([]);
    setUpcomingPayments([]);
    setActiveTab('dashboard');
    setIsPhoneAuthOpen(false);
  };

  const handleDeleteAccount = () => {
    resetAllData();
    setUserProfile({
      ...DEFAULT_USER_PROFILE,
      id: `user-${Date.now()}`,
      phone: '',
      isAuthenticated: false,
      isOnboarded: false,
    });
    window.location.reload();
  };

  // Derived calculations for current selected month
  const monthlyStats = useMemo(() => {
    return computeMonthlyStats(transactions, categories, currentMonthKey);
  }, [transactions, categories, currentMonthKey]);

  const categoriesSummary = useMemo(() => {
    return computeCategorySpend(transactions, categories, currentMonthKey);
  }, [transactions, categories, currentMonthKey]);

  const spendVelocityPoints = useMemo(() => {
    return computeDailySpendVelocity(transactions, categories, currentMonthKey);
  }, [transactions, categories, currentMonthKey]);

  const currentMonthTransactions = useMemo(() => {
    return filterTransactionsByMonth(transactions, currentMonthKey);
  }, [transactions, currentMonthKey]);

  // Previous Month Transactions & Spend for MoM Comparison
  const previousMonthTransactions = useMemo(() => {
    const [yStr, mStr] = currentMonthKey.split('-');
    const curYear = parseInt(yStr, 10);
    const curMonth = parseInt(mStr, 10);
    const prevDate = new Date(curYear, curMonth - 2, 1);
    const prevKey = `${prevDate.getFullYear()}-${(prevDate.getMonth() + 1).toString().padStart(2, '0')}`;
    return transactions.filter((t) => t.date.startsWith(prevKey));
  }, [transactions, currentMonthKey]);

  const previousMonthSpend = useMemo(() => {
    return previousMonthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [previousMonthTransactions]);

  const previousMonthName = useMemo(() => {
    const [yStr, mStr] = currentMonthKey.split('-');
    const curYear = parseInt(yStr, 10);
    const curMonth = parseInt(mStr, 10);
    const prevDate = new Date(curYear, curMonth - 2, 1);
    return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(prevDate);
  }, [currentMonthKey]);

  const currentMonthInvestments = useMemo(() => {
    return currentMonthTransactions
      .filter((t) => t.type === 'expense' && (t.categoryId === 'cat-investments' || t.merchant.toLowerCase().includes('sip')))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [currentMonthTransactions]);

  // Formatted Month Name
  const formattedMonthName = useMemo(() => {
    const { year, month } = parseMonthKey(currentMonthKey);
    const date = new Date(year, month - 1, 1);
    return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(date);
  }, [currentMonthKey]);

  // Spending Anomaly Detection & Smart Alerts
  const smartAlerts = useMemo<SmartAlert[]>(() => {
    // Requirement 5: First-time users with no transactions must not receive premature financial warnings
    if (currentMonthTransactions.length === 0) return [];

    const list: SmartAlert[] = [];

    // Anomaly: Single transaction > ₹4,000 on dining or shopping
    const largeExpenses = currentMonthTransactions.filter(
      (t) => t.type === 'expense' && t.amount >= 4000
    );
    if (largeExpenses.length > 0) {
      list.push({
        id: 'alert-large-expense',
        type: 'warning',
        title: '⚠️ Unusual Spending Spike Detected',
        message: `You spent ${formatCurrency(largeExpenses[0].amount)} on ${largeExpenses[0].merchant}, which is significantly above your typical ticket size.`,
        date: currentMonthKey,
        actionText: 'Review Transaction',
        actionLink: 'transactions',
      });
    }

    // Category Exceeded (only for categories with an active budget cap > 0)
    const exceeded = categoriesSummary.filter((c) => c.budget > 0 && c.isOverBudget);
    if (exceeded.length > 0) {
      list.push({
        id: 'alert-over-budget',
        type: 'danger',
        title: 'Budget Exceeded',
        message: `${exceeded[0].category.name} exceeded its limit by ${formatCurrency(
          exceeded[0].spent - exceeded[0].budget
        )}.`,
        date: currentMonthKey,
        actionText: 'Adjust Cap',
        actionLink: 'budgets',
      });
    }

    // Category Nearing Limit (>80% of active budget cap > 0)
    const nearLimit = categoriesSummary.filter((c) => c.budget > 0 && !c.isOverBudget && c.percentage >= 80);
    if (nearLimit.length > 0) {
      list.push({
        id: 'alert-near-limit',
        type: 'warning',
        title: 'Approaching Limit',
        message: `${nearLimit[0].category.name} is at ${Math.round(nearLimit[0].percentage)}% of its monthly cap.`,
        date: currentMonthKey,
        actionText: 'View Spending',
        actionLink: 'transactions',
      });
    }

    // Flagged Recurring Subscriptions
    const unnecessarySubs = recurring.filter(
      (r) => r.status === 'flagged' || r.utility === 'unnecessary'
    );
    if (unnecessarySubs.length > 0) {
      list.push({
        id: 'alert-zombie-subs',
        type: 'info',
        title: 'Review Idle Subscriptions',
        message: `You have ${unnecessarySubs.length} subscription(s) marked unnecessary or review (${formatCurrency(
          unnecessarySubs.reduce((s, r) => s + r.amount, 0)
        )}/mo).`,
        date: currentMonthKey,
        actionText: 'Manage Subscriptions',
        actionLink: 'subscriptions',
      });
    }

    return list.filter((a) => !dismissedAlertIds.has(a.id));
  }, [categoriesSummary, currentMonthTransactions, recurring, currentMonthKey, dismissedAlertIds]);

  // Handlers
  const handleSaveTransaction = (
    transactionData: Omit<Transaction, 'id'>,
    editId?: string
  ) => {
    // Requirements 11, 14, 15: Consistent account balance updates without double-counting
    const effectiveAccounts = userProfile.bankAccounts && userProfile.bankAccounts.length > 0
      ? userProfile.bankAccounts
      : userProfile.bankDetails
      ? [userProfile.bankDetails]
      : [];

    if (effectiveAccounts.length > 0) {
      const targetAccId = transactionData.accountId;
      let previousTx: Transaction | undefined;
      if (editId) {
        previousTx = transactions.find((t) => t.id === editId);
      }

      let delta = 0;
      if (previousTx) {
        if (previousTx.type === 'income') delta -= previousTx.amount;
        else if (previousTx.type === 'expense') delta += previousTx.amount;
      }
      if (transactionData.type === 'income') delta += transactionData.amount;
      else if (transactionData.type === 'expense') delta -= transactionData.amount;

      if (delta !== 0) {
        const updatedAccounts = effectiveAccounts.map((acc) => {
          const isMatch = (targetAccId && (acc.id === targetAccId || acc.accountNumberLast4 === targetAccId)) ||
                          (!targetAccId && acc.isPrimary) ||
                          effectiveAccounts.length === 1;
          if (isMatch) {
            const currentBal = acc.balance ?? 0;
            const newBal = Math.max(0, currentBal + delta);
            return { ...acc, balance: newBal };
          }
          return acc;
        });
        const primary = updatedAccounts.find((a) => a.isPrimary) || updatedAccounts[0];
        setUserProfile((prev) => ({
          ...prev,
          bankAccounts: updatedAccounts,
          bankDetails: primary,
        }));
      }
    }

    if (editId) {
      setTransactions((prev) =>
        prev.map((t) => (t.id === editId ? { ...transactionData, id: editId } : t))
      );
    } else {
      const newTx: Transaction = {
        ...transactionData,
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      };
      setTransactions((prev) => [newTx, ...prev]);
    }
    setEditingTransaction(null);
  };

  const handleDuplicateTransaction = (tx: Transaction) => {
    const duplicate: Transaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      merchant: `${tx.merchant} (Copy)`,
    };
    setTransactions((prev) => [duplicate, ...prev]);
  };

  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (tx) {
      const effectiveAccounts = userProfile.bankAccounts && userProfile.bankAccounts.length > 0
        ? userProfile.bankAccounts
        : userProfile.bankDetails
        ? [userProfile.bankDetails]
        : [];

      if (effectiveAccounts.length > 0) {
        const delta = tx.type === 'income' ? -tx.amount : tx.amount;
        const targetAccId = tx.accountId;
        const updatedAccounts = effectiveAccounts.map((acc) => {
          const isMatch = (targetAccId && (acc.id === targetAccId || acc.accountNumberLast4 === targetAccId)) ||
                          (!targetAccId && acc.isPrimary) ||
                          effectiveAccounts.length === 1;
          if (isMatch) {
            const currentBal = acc.balance ?? 0;
            const newBal = Math.max(0, currentBal + delta);
            return { ...acc, balance: newBal };
          }
          return acc;
        });
        const primary = updatedAccounts.find((a) => a.isPrimary) || updatedAccounts[0];
        setUserProfile((prev) => ({
          ...prev,
          bankAccounts: updatedAccounts,
          bankDetails: primary,
        }));
      }
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleImportBulk = (newItems: Omit<Transaction, 'id'>[]) => {
    const formatted: Transaction[] = newItems.map((item, idx) => ({
      ...item,
      id: `tx-import-${Date.now()}-${idx}`,
    }));
    setTransactions((prev) => [...formatted, ...prev]);
  };

  const handleUpdateCategoryBudget = (categoryId: string, newBudget: number) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, monthlyBudget: newBudget } : c))
    );
  };

  const handleAddCategory = (categoryData: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...categoryData,
      id: `cat-custom-${Date.now()}`,
    };
    setCategories((prev) => [...prev, newCat]);
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
  };

  const handleAddRecurring = (item: Omit<RecurringExpense, 'id'>) => {
    const newItem: RecurringExpense = {
      ...item,
      id: `rec-${Date.now()}`,
    };
    setRecurring((prev) => [...prev, newItem]);
  };

  const handleDeleteRecurring = (id: string) => {
    setRecurring((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateRecurringStatus = (
    id: string,
    status: 'active' | 'flagged' | 'cancelled'
  ) => {
    setRecurring((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  };

  const handleUpdateSubscriptionUtility = (
    id: string,
    utility: SubscriptionUtility
  ) => {
    setRecurring((prev) =>
      prev.map((r) => (r.id === id ? { ...r, utility } : r))
    );
  };

  const handleMarkRecurringAsPaid = (id: string) => {
    const item = recurring.find((r) => r.id === id);
    if (!item) return;

    const today = new Date().toISOString().split('T')[0];
    const primaryAcc = userProfile.bankAccounts?.[0] || userProfile.bankDetails;

    handleSaveTransaction({
      amount: item.amount,
      merchant: item.name,
      categoryId: item.categoryId,
      date: today,
      type: 'expense',
      paymentMethod: 'upi',
      accountId: primaryAcc?.id,
      notes: `Marked as paid: ${item.name} (${item.billingCycle})`,
      tags: ['recurring-paid'],
    });

    setRecurring((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const d = new Date(r.nextDueDate || today);
          if (r.billingCycle === 'yearly') {
            d.setFullYear(d.getFullYear() + 1);
          } else if (r.billingCycle === 'quarterly') {
            d.setMonth(d.getMonth() + 3);
          } else {
            d.setMonth(d.getMonth() + 1);
          }
          return {
            ...r,
            nextDueDate: d.toISOString().split('T')[0],
          };
        }
        return r;
      })
    );
  };

  const handleAddGoal = (goal: Omit<SavingsGoal, 'id'>) => {
    const newGoal: SavingsGoal = {
      ...goal,
      id: `goal-${Date.now()}`,
    };
    setSavingsGoals((prev) => [...prev, newGoal]);
  };

  const handleDeleteGoal = (id: string) => {
    setSavingsGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const handleContributeGoal = (id: string, amount: number) => {
    setSavingsGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g))
    );
  };

  const handleResetData = () => {
    if (window.confirm('Reset all financial tracker data to initial Indian Rupee (₹) demo state?')) {
      resetAllData();
      window.location.reload();
    }
  };

  // 0. Dedicated Protected Admin Console (Spec #4, #5, #6)
  if (isAdminView) {
    return (
      <AdminConsole
        onReturnToApp={handleExitAdmin}
      />
    );
  }

  // Public Product Landing Page & Authentication Experience
  if (!userProfile.isAuthenticated || activeTab === 'landing') {
    return (
      <>
        <LandingPage
          isAuthenticated={userProfile.isAuthenticated}
          onOpenAuth={handleOpenAuth}
          onOpenDashboard={() => setActiveTab('dashboard')}
          onNavigateAdmin={handleOpenAdmin}
        />

        {/* Modern Google AI Studio-style Centered Auth Modal with Escape/Close handlers */}
        <PhoneAuthModal
          isOpen={isPhoneAuthOpen}
          initialTab={phoneAuthInitialTab}
          onClose={() => setIsPhoneAuthOpen(false)}
          onSuccess={handlePhoneAuthSuccess}
          onOpenAdmin={handleOpenAdmin}
        />
      </>
    );
  }

  const handleExportPdf = () => {
    const bAccounts = userProfile.bankAccounts && userProfile.bankAccounts.length > 0
      ? userProfile.bankAccounts
      : (userProfile.bankDetails ? [userProfile.bankDetails] : []);
    exportFinancialReportPDF({
      userProfile,
      transactions,
      categories,
      bankAccounts: bAccounts,
      recurring,
      savingsGoals,
      monthlyStats,
    });
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white pb-24 md:pb-10 antialiased">
      {/* Top Header & Navigation */}
      <Header
        currentMonthKey={currentMonthKey}
        userProfile={userProfile}
        onMonthChange={setCurrentMonthKey}
        onOpenAddModal={() => {
          setEditingTransaction(null);
          setIsAddModalOpen(true);
        }}
        onOpenNaturalLanguageModal={() => setIsNaturalLanguageModalOpen(true)}
        onOpenReceiptModal={() => setIsReceiptModalOpen(true)}
        onOpenImportCsvModal={() => setIsImportCsvModalOpen(true)}
        onOpenAiAudit={() => setActiveTab('ai-optimizer')}
        onOpenProfileModal={() => {
          setAuthModalMode('profile');
          setIsAuthModalOpen(true);
        }}
        onOpenBankModal={() => setIsBankModalOpen(true)}
        onReopenOnboarding={() => setIsOnboardingOpen(true)}
        onExportCsv={() => exportTransactionsToCsv(transactions, categories)}
        onExportJson={() => exportDataAsJson(categories, transactions, recurring, savingsGoals)}
        onExportPdf={handleExportPdf}
        onResetData={handleResetData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAdmin={handleOpenAdmin}
        pendingRecurringCount={recurring.filter((r) => r.status === 'active').length}
        onOpenNotifications={() => setIsNotificationCenterOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
        {/* Smart Alerts Banner */}
        <SmartAlertsBanner
          alerts={smartAlerts}
          onDismissAlert={(id) => setDismissedAlertIds((prev) => new Set([...prev, id]))}
          onNavigateToTab={(tab) => setActiveTab(tab)}
        />

        {/* 1. DASHBOARD (Mobile-First + CRED Style) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5">
            {/* CRED-Inspired Mobile Hero Card with Greeting & Quick Actions */}
            <MobileHeroCard
              userName={userProfile.firstName || userProfile.name}
              bankDetails={userProfile.bankDetails}
              bankAccounts={
                userProfile.bankAccounts && userProfile.bankAccounts.length > 0
                  ? userProfile.bankAccounts
                  : userProfile.bankDetails
                  ? [userProfile.bankDetails]
                  : []
              }
              stats={monthlyStats}
              formattedMonthName={formattedMonthName}
              hideBalanceDefault={userProfile.hideBalance}
              investmentAmount={currentMonthInvestments || 0}
              onOpenAddExpense={() => {
                setEditingTransaction(null);
                setTransactionModalType('expense');
                setIsAddModalOpen(true);
              }}
              onOpenScanReceipt={() => setIsReceiptModalOpen(true)}
              onOpenAskAi={() => setActiveTab('coach')}
              onOpenAddIncome={() => {
                setEditingTransaction(null);
                setTransactionModalType('income');
                setIsAddModalOpen(true);
              }}
              onOpenAnalytics={() => setActiveTab('analytics')}
              onOpenBankDetails={() => setIsBankModalOpen(true)}
            />

            {/* Balance Insights AI Explanation Card */}
            <BalanceInsightsCard
              currentMonthTransactions={currentMonthTransactions}
              previousMonthTransactions={previousMonthTransactions}
              currentMonthName={formattedMonthName}
              previousMonthName={previousMonthName}
              categories={categories}
              totalBalance={userProfile.bankDetails?.balance ?? 0}
            />

            {/* Upcoming Payments Card (Electricity, SIP, Mobile Recharge) */}
            <UpcomingPaymentsCard
              payments={upcomingPayments}
              onToggleStatus={handleToggleUpcomingStatus}
              onViewAll={() => setActiveTab('calendar')}
            />

            {/* AI Financial Insight Card (Strictly Zero Assumptions on Fresh Users) */}
            <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-500/30 p-5 sm:p-6 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-purple-500/20 text-purple-300">
                      <Bot className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-300">
                      🤖 AI Money Coach
                    </span>
                  </div>

                  {currentMonthTransactions.length === 0 ? (
                    <>
                      <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug">
                        I'm ready to analyze your finances.
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                        Add some transactions, income, investments, budgets, or recurring payments and I'll start identifying patterns and opportunities for you.
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug">
                        {previousMonthSpend > 0 && monthlyStats.totalExpenses > previousMonthSpend
                          ? `Spending shifted by +${formatCurrency(monthlyStats.totalExpenses - previousMonthSpend)} vs ${previousMonthName}.`
                          : previousMonthSpend > 0
                          ? `Spending is ${formatCurrency(previousMonthSpend - monthlyStats.totalExpenses)} lower compared to last month!`
                          : `Total tracked expenses for ${formattedMonthName}: ${formatCurrency(monthlyStats.totalExpenses)}.`}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                        {categoriesSummary.find((c) => c.spent > 0)
                          ? `Primary spending driver: ${categoriesSummary.find((c) => c.spent > 0)?.category.name} (${formatCurrency(categoriesSummary.find((c) => c.spent > 0)?.spent || 0)}).`
                          : `Add more activity to unlock category breakdown.`}
                        {aiAudit && aiAudit.potentialSavings > 0
                          ? ` Potential savings: ~${formatCurrency(aiAudit.potentialSavings)}/mo.`
                          : ''}
                      </p>
                    </>
                  )}
                </div>

                <div className="flex sm:flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => setActiveTab('coach')}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors shadow-md flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <span>Talk to AI Coach</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingTransaction(null);
                      setIsAddModalOpen(true);
                    }}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
                  >
                    + Add Transaction
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive What-If Simulator right on Dashboard */}
            <WhatIfSimulator
              categories={categories}
              totalMonthlyExpenses={monthlyStats.totalExpenses}
              totalMonthlyIncome={monthlyStats.totalIncome}
            />

            {/* Spend Velocity Curve */}
            <SpendVelocityChart
              points={spendVelocityPoints}
              stats={monthlyStats}
              monthName={formattedMonthName}
            />

            {/* Category Budgets Grid */}
            <CategorySpendBars
              categoriesSummary={categoriesSummary}
              onUpdateBudget={handleUpdateCategoryBudget}
              onFilterCategory={(catId) => {
                setSelectedCategoryId(catId);
                setActiveTab('transactions');
              }}
              selectedCategoryId={selectedCategoryId}
            />

            {/* Recent Transactions Snippet */}
            <div className="rounded-[28px] bg-slate-900/80 border border-slate-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Recent Activity
                  </h3>
                  <p className="text-xs text-slate-400">
                    Latest {formattedMonthName} transactions
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('transactions')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                >
                  <span>All Ledger</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <TransactionsTable
                transactions={currentMonthTransactions.slice(0, 5)}
                categories={categories}
                bankAccounts={
                  userProfile.bankAccounts && userProfile.bankAccounts.length > 0
                    ? userProfile.bankAccounts
                    : userProfile.bankDetails
                    ? [userProfile.bankDetails]
                    : []
                }
                onDeleteTransaction={handleDeleteTransaction}
                onEditTransaction={(tx) => {
                  setEditingTransaction(tx);
                  setIsAddModalOpen(true);
                }}
                onDuplicateTransaction={handleDuplicateTransaction}
                onExportCsv={() => exportTransactionsToCsv(transactions, categories)}
                selectedCategoryId={selectedCategoryId}
                onClearCategoryFilter={() => setSelectedCategoryId(null)}
              />
            </div>
          </div>
        )}

        {/* 2. TRANSACTIONS SCREEN */}
        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-white">
                  Passbook & Ledger ({formattedMonthName})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mobile cards grouped by day with UPI & Card tagging
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsImportCsvModalOpen(true)}
                  className="px-3.5 py-2 text-xs font-bold text-indigo-300 bg-indigo-950/50 border border-indigo-800/60 rounded-xl hover:bg-indigo-900/60 transition-colors"
                >
                  Import Bank Statement
                </button>
                <button
                  onClick={() => setIsNaturalLanguageModalOpen(true)}
                  className="px-3.5 py-2 text-xs font-bold text-purple-300 bg-purple-950/50 border border-purple-800/60 rounded-xl hover:bg-purple-900/60 transition-colors"
                >
                  AI Fast Add
                </button>
                <button
                  onClick={() => {
                    setEditingTransaction(null);
                    setIsAddModalOpen(true);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-sm flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Expense</span>
                </button>
              </div>
            </div>

            <TransactionsTable
              transactions={currentMonthTransactions}
              categories={categories}
              bankAccounts={
                userProfile.bankAccounts && userProfile.bankAccounts.length > 0
                  ? userProfile.bankAccounts
                  : userProfile.bankDetails
                  ? [userProfile.bankDetails]
                  : []
              }
              onDeleteTransaction={handleDeleteTransaction}
              onEditTransaction={(tx) => {
                setEditingTransaction(tx);
                setIsAddModalOpen(true);
              }}
              onDuplicateTransaction={handleDuplicateTransaction}
              onExportCsv={() => exportTransactionsToCsv(transactions, categories)}
              selectedCategoryId={selectedCategoryId}
              onClearCategoryFilter={() => setSelectedCategoryId(null)}
            />
          </div>
        )}

        {/* 3. BUDGETS */}
        {activeTab === 'budgets' && (
          <BudgetsView
            categories={categories}
            totalExpenses={monthlyStats.totalExpenses}
            totalBudgetedExpenses={monthlyStats.totalBudgetedExpenses}
            onUpdateBudget={handleUpdateCategoryBudget}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onOpenOptimizer={() => setActiveTab('ai-optimizer')}
          />
        )}

        {/* 4. ANALYTICS (Contains SavingsHeatmap) */}
        {activeTab === 'analytics' && (
          <AnalyticsView
            currentMonthTransactions={currentMonthTransactions}
            allTransactions={transactions}
            categories={categories}
            bankAccounts={
              userProfile.bankAccounts && userProfile.bankAccounts.length > 0
                ? userProfile.bankAccounts
                : userProfile.bankDetails
                ? [userProfile.bankDetails]
                : []
            }
            monthlyStats={monthlyStats}
            currentMonthKey={currentMonthKey}
            formattedMonthName={formattedMonthName}
            onSelectTransaction={(tx) => {
              setEditingTransaction(tx);
              setIsAddModalOpen(true);
            }}
            onAskAiAboutDay={(daySummary) => {
              setActiveTab('coach');
            }}
            onNavigateToOptimizer={() => setActiveTab('ai-optimizer')}
          />
        )}

        {/* 5. AI MONEY COACH */}
        {activeTab === 'coach' && (
          <AIMoneyCoachView
            monthlyStats={monthlyStats}
            categories={categories}
            transactions={currentMonthTransactions}
            allTransactions={transactions}
            recurring={recurring}
            savingsGoals={savingsGoals}
            upcomingPayments={upcomingPayments}
            currentMonthKey={currentMonthKey}
            formattedMonthName={formattedMonthName}
            totalBalance={userProfile.bankDetails?.balance ?? 0}
            userName={userProfile.name}
          />
        )}

        {/* 6. AI BUDGET OPTIMIZER */}
        {activeTab === 'ai-optimizer' && (
          <AIBudgetOptimizerView
            categories={categories}
            transactions={transactions}
            recurring={recurring}
            savingsGoals={savingsGoals}
            currentMonthKey={currentMonthKey}
            totalIncome={monthlyStats.totalIncome}
            totalExpenses={monthlyStats.totalExpenses}
            aiAudit={aiAudit}
            onAuditCompleted={(res) => setAiAudit(res)}
            onApplyBudgetCap={handleUpdateCategoryBudget}
          />
        )}

        {/* 7. SUBSCRIPTIONS */}
        {activeTab === 'subscriptions' && (
          <RecurringExpensesView
            recurring={recurring}
            categories={categories}
            onAddRecurring={handleAddRecurring}
            onDeleteRecurring={handleDeleteRecurring}
            onUpdateStatus={handleUpdateRecurringStatus}
            onUpdateUtility={handleUpdateSubscriptionUtility}
            onMarkAsPaid={handleMarkRecurringAsPaid}
          />
        )}

        {/* 8. SAVINGS GOALS */}
        {activeTab === 'goals' && (
          <SavingsGoalsView
            goals={savingsGoals}
            onAddGoal={handleAddGoal}
            onDeleteGoal={handleDeleteGoal}
            onContribute={handleContributeGoal}
          />
        )}

        {/* 9. FINANCIAL CALENDAR */}
        {activeTab === 'calendar' && (
          <FinancialCalendarView
            currentMonthKey={currentMonthKey}
            transactions={transactions}
            recurring={recurring}
            categories={categories}
            formattedMonthName={formattedMonthName}
          />
        )}

        {/* 10. REPORTS */}
        {activeTab === 'reports' && (
          <MonthlyReportView
            currentMonthKey={currentMonthKey}
            formattedMonthName={formattedMonthName}
            monthlyStats={monthlyStats}
            categories={categories}
            transactions={currentMonthTransactions}
            recurring={recurring}
          />
        )}

        {/* 11. AUTHENTICATED PROFILE VIEW */}
        {activeTab === 'profile' && (
          <ProfileView
            user={userProfile}
            onUpdateUser={handleUpdateProfile}
            onOpenBankModal={() => setIsBankModalOpen(true)}
            onLogout={handleLogout}
            onExportCsv={() => exportTransactionsToCsv(transactions, categories)}
            onExportJson={() => exportDataAsJson(categories, transactions, recurring, savingsGoals)}
            onExportPdf={handleExportPdf}
            onResetData={handleResetData}
            onDeleteAccount={handleDeleteAccount}
            onOpenAdmin={handleOpenAdmin}
          />
        )}
      </main>

      {/* CRED-Style Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickAdd={() => {
          setEditingTransaction(null);
          setIsAddModalOpen(true);
        }}
      />

      {/* Modals & Bottom Sheets */}
      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTransaction(null);
        }}
        categories={categories}
        bankAccounts={
          userProfile.bankAccounts && userProfile.bankAccounts.length > 0
            ? userProfile.bankAccounts
            : userProfile.bankDetails
            ? [userProfile.bankDetails]
            : []
        }
        onSave={handleSaveTransaction}
        editTransaction={editingTransaction}
        defaultType={transactionModalType}
      />

      <NaturalLanguageModal
        isOpen={isNaturalLanguageModalOpen}
        onClose={() => setIsNaturalLanguageModalOpen(false)}
        categories={categories}
        onAddTransaction={(tx) => handleSaveTransaction(tx)}
      />

      <ReceiptScannerModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        categories={categories}
        onAddTransaction={(tx) => handleSaveTransaction(tx)}
      />

      <ImportTransactionsModal
        isOpen={isImportCsvModalOpen}
        onClose={() => setIsImportCsvModalOpen(false)}
        categories={categories}
        onImportBulk={handleImportBulk}
      />

      {/* FINORA AI Onboarding & Profile Modals */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={handleCompleteOnboarding}
        initialName={userProfile.name}
      />

      <BankDetailsModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        bankDetails={userProfile.bankDetails}
        bankAccounts={userProfile.bankAccounts}
        onUpdateBankDetails={handleUpdateBankDetails}
        onUpdateBankAccounts={handleUpdateBankAccounts}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={userProfile}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onUpdateProfile={handleUpdateProfile}
        initialMode={authModalMode}
        onOpenBankModal={() => setIsBankModalOpen(true)}
      />

      {/* Production Phone Authentication Screen (Direct PIN Login, No OTP) */}
      <PhoneAuthModal
        isOpen={isPhoneAuthOpen}
        initialTab={phoneAuthInitialTab}
        onClose={() => setIsPhoneAuthOpen(false)}
        onSuccess={handlePhoneAuthSuccess}
      />

      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        recurringExpenses={recurring}
        onNavigateToSubscriptions={() => setActiveTab('subscriptions')}
      />
    </div>
  );
}
