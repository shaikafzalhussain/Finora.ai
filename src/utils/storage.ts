import {
  Category,
  Transaction,
  RecurringExpense,
  SavingsGoal,
  BudgetOptimizationResult,
  UserProfile,
  UpcomingPayment,
} from '../types/finance';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_TRANSACTIONS,
  DEFAULT_RECURRING,
  DEFAULT_SAVINGS_GOALS,
  DEFAULT_UPCOMING_PAYMENTS,
} from './initialData';
import {
  EXISTING_ADMIN_PHONE,
  EXISTING_USER_BANK_ACCOUNTS,
  getExistingUserTransactions,
  EXISTING_USER_RECURRING,
  EXISTING_USER_GOALS,
  EXISTING_USER_UPCOMING,
} from './existingUserData';

const STORAGE_KEYS = {
  CATEGORIES: 'finora_prod_categories_v2',
  TRANSACTIONS: 'finora_prod_transactions_v2',
  RECURRING: 'finora_prod_recurring_v2',
  UPCOMING: 'finora_prod_upcoming_v2',
  GOALS: 'finora_prod_goals_v2',
  AI_AUDIT: 'finora_prod_ai_audit_v2',
  USER_PROFILE: 'finora_prod_user_profile_v2',
  REGISTERED_USERS: 'finora_prod_registered_users_v2',
  MIGRATION_CLEANED: 'finora_demo_data_purged_v2',
};

// Production Clean State: No hardcoded demo user or fake bank balance
export const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'user-fresh-1',
  name: '',
  firstName: '',
  lastName: '',
  phone: '',
  isOnboarded: false,
  isAuthenticated: false,
  bankDetails: undefined,
  bankAccounts: [],
  salaryDate: 1,
  createdAt: new Date().toISOString(),
  hideBalance: false,
  theme: 'dark',
  notificationsEnabled: true,
};

// Purge any legacy demo artifacts from previous versions
function purgeLegacyDemoData(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const isCleaned = localStorage.getItem(STORAGE_KEYS.MIGRATION_CLEANED);
    if (!isCleaned) {
      // Remove all demo keys from older development sessions
      localStorage.removeItem('finora_transactions_v1');
      localStorage.removeItem('finora_recurring_v1');
      localStorage.removeItem('finora_upcoming_v1');
      localStorage.removeItem('finora_goals_v1');
      localStorage.removeItem('finora_ai_audit_v1');
      localStorage.removeItem('spendwise_transactions_v1');
      localStorage.removeItem('spendwise_recurring_v1');
      localStorage.removeItem('spendwise_goals_v1');
      localStorage.removeItem('spendwise_categories_v1');
      localStorage.removeItem('spendwise_ai_audit_v1');

      // Check if existing user profile has demo data (e.g. 76650 or 124850)
      const oldProfile = localStorage.getItem('finora_user_profile_v1');
      if (oldProfile && (oldProfile.includes('76650') || oldProfile.includes('tx-oct-01'))) {
        localStorage.removeItem('finora_user_profile_v1');
      }

      localStorage.setItem(STORAGE_KEYS.MIGRATION_CLEANED, 'true');
    }
  } catch (e) {
    console.error('Storage migration notice', e);
  }
}

// Run cleanup immediately on script execution
purgeLegacyDemoData();

export function isExistingAdminUser(phoneOrId?: string): boolean {
  if (!phoneOrId) return false;
  const clean = String(phoneOrId).replace(/\D/g, '').slice(-10);
  return clean === '7702994407' || phoneOrId === 'admin-master-001' || phoneOrId === 'usr-afzal-master';
}

export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (raw) {
      const parsed: UserProfile = JSON.parse(raw);
      if (!parsed.firstName && parsed.name) {
        parsed.firstName = parsed.name.trim().split(' ')[0] || '';
      }

      // Check if this is the existing administrator / primary account holder
      if (isExistingAdminUser(parsed.phone || parsed.id)) {
        if (!parsed.bankAccounts || parsed.bankAccounts.length === 0) {
          parsed.bankAccounts = EXISTING_USER_BANK_ACCOUNTS;
          parsed.bankDetails = EXISTING_USER_BANK_ACCOUNTS[0];
        }
        parsed.role = 'admin';
        return parsed;
      }

      // For any other new user, ensure they NEVER inherit afzal's bank accounts
      if (parsed.bankAccounts?.some((a) => a.id === 'acc-hdfc-01' || a.accountNumberLast4 === '4821')) {
        parsed.bankAccounts = [];
        parsed.bankDetails = undefined;
      }
      if (!parsed.bankAccounts) {
        parsed.bankAccounts = parsed.bankDetails ? [parsed.bankDetails] : [];
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load user profile from storage', e);
  }
  return DEFAULT_USER_PROFILE;
}

export function syncUserProfileToRegistered(profile: UserProfile): void {
  try {
    const users = loadRegisteredUsers();
    const cleanPhone = (p: string) => (p || '').replace(/\D/g, '').slice(-10);
    const userPhone = cleanPhone(profile.phone);
    const idx = users.findIndex(
      (u) => (profile.id && u.id === profile.id) || (userPhone && cleanPhone(u.phone) === userPhone)
    );
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...profile };
      saveRegisteredUsers(users);
    } else if (profile.phone && profile.isAuthenticated) {
      users.push(profile);
      saveRegisteredUsers(users);
    }
  } catch (e) {
    console.error('Failed to sync user profile to registered users', e);
  }
}

export function saveUserProfile(profile: UserProfile): void {
  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  syncUserProfileToRegistered(profile);
}

// --- USER-SCOPED DATA ISOLATION (Guarantees New User = Zero Data, Existing User = Has Real Expenditure) ---

export function loadTransactionsForUser(phoneOrId?: string, monthKey?: string): Transaction[] {
  try {
    const isExisting = isExistingAdminUser(phoneOrId);
    if (!isExisting) {
      // For ANY other user: return clean EMPTY array unless user explicitly created their own transactions
      const clean = String(phoneOrId || '').replace(/\D/g, '').slice(-10);
      if (!clean) return [];
      const storageKey = `finora_tx_${clean}`;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed: Transaction[] = JSON.parse(raw);
        // Clean out any accidental pollution from afzal's dataset
        const hasPollution = parsed.some((t) => t.id && (t.id.startsWith('tx-afzal') || t.merchant.includes('TCS')));
        if (hasPollution) {
          localStorage.removeItem(storageKey);
          return [];
        }
        return parsed;
      }
      return [];
    }

    // If existing user: initialize with his expenditure records and save
    const storageKey = 'finora_tx_7702994407';
    const raw = localStorage.getItem(storageKey);
    if (raw) return JSON.parse(raw);

    const initialTxs = getExistingUserTransactions(monthKey);
    localStorage.setItem(storageKey, JSON.stringify(initialTxs));
    return initialTxs;
  } catch (e) {
    console.error('Failed to load transactions for user', e);
  }
  return [];
}

export function saveTransactionsForUser(phoneOrId: string | undefined, transactions: Transaction[]): void {
  try {
    const isExisting = isExistingAdminUser(phoneOrId);
    if (!isExisting) {
      // Never allow saving afzal transactions under a new user
      if (transactions.some((t) => t.id && (t.id.startsWith('tx-afzal') || t.merchant.includes('TCS')))) {
        return;
      }
      const clean = String(phoneOrId || '').replace(/\D/g, '').slice(-10);
      if (!clean) return;
      localStorage.setItem(`finora_tx_${clean}`, JSON.stringify(transactions));
      return;
    }
    localStorage.setItem('finora_tx_7702994407', JSON.stringify(transactions));
  } catch (e) {
    console.error('Failed to save transactions for user', e);
  }
}

export function loadRecurringForUser(phoneOrId?: string): RecurringExpense[] {
  try {
    const isExisting = isExistingAdminUser(phoneOrId);
    if (!isExisting) {
      const clean = String(phoneOrId || '').replace(/\D/g, '').slice(-10);
      if (!clean) return [];
      const storageKey = `finora_rec_${clean}`;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed: RecurringExpense[] = JSON.parse(raw);
        if (parsed.some((r) => r.id === 'rec-01' || r.merchant === 'Apartment Rent')) {
          localStorage.removeItem(storageKey);
          return [];
        }
        return parsed;
      }
      return [];
    }

    const storageKey = 'finora_rec_7702994407';
    const raw = localStorage.getItem(storageKey);
    if (raw) return JSON.parse(raw);

    localStorage.setItem(storageKey, JSON.stringify(EXISTING_USER_RECURRING));
    return EXISTING_USER_RECURRING;
  } catch (e) {
    console.error('Failed to load recurring for user', e);
  }
  return [];
}

export function saveRecurringForUser(phoneOrId: string | undefined, recurring: RecurringExpense[]): void {
  try {
    const isExisting = isExistingAdminUser(phoneOrId);
    if (!isExisting) {
      if (recurring.some((r) => r.id === 'rec-01' || r.merchant === 'Apartment Rent')) {
        return;
      }
      const clean = String(phoneOrId || '').replace(/\D/g, '').slice(-10);
      if (!clean) return;
      localStorage.setItem(`finora_rec_${clean}`, JSON.stringify(recurring));
      return;
    }
    localStorage.setItem('finora_rec_7702994407', JSON.stringify(recurring));
  } catch (e) {
    console.error('Failed to save recurring for user', e);
  }
}

export function loadGoalsForUser(phoneOrId?: string): SavingsGoal[] {
  try {
    const isExisting = isExistingAdminUser(phoneOrId);
    if (!isExisting) {
      const clean = String(phoneOrId || '').replace(/\D/g, '').slice(-10);
      if (!clean) return [];
      const storageKey = `finora_goals_${clean}`;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed: SavingsGoal[] = JSON.parse(raw);
        if (parsed.some((g) => g.id === 'goal-01' || g.name.includes('Emergency Reserve'))) {
          localStorage.removeItem(storageKey);
          return [];
        }
        return parsed;
      }
      return [];
    }

    const storageKey = 'finora_goals_7702994407';
    const raw = localStorage.getItem(storageKey);
    if (raw) return JSON.parse(raw);

    localStorage.setItem(storageKey, JSON.stringify(EXISTING_USER_GOALS));
    return EXISTING_USER_GOALS;
  } catch (e) {
    console.error('Failed to load goals for user', e);
  }
  return [];
}

export function saveGoalsForUser(phoneOrId: string | undefined, goals: SavingsGoal[]): void {
  try {
    const isExisting = isExistingAdminUser(phoneOrId);
    if (!isExisting) {
      if (goals.some((g) => g.id === 'goal-01' || g.name.includes('Emergency Reserve'))) {
        return;
      }
      const clean = String(phoneOrId || '').replace(/\D/g, '').slice(-10);
      if (!clean) return;
      localStorage.setItem(`finora_goals_${clean}`, JSON.stringify(goals));
      return;
    }
    localStorage.setItem('finora_goals_7702994407', JSON.stringify(goals));
  } catch (e) {
    console.error('Failed to save goals for user', e);
  }
}

export function loadUpcomingPaymentsForUser(phoneOrId?: string): UpcomingPayment[] {
  try {
    const isExisting = isExistingAdminUser(phoneOrId);
    if (!isExisting) {
      const clean = String(phoneOrId || '').replace(/\D/g, '').slice(-10);
      if (!clean) return [];
      const storageKey = `finora_upc_${clean}`;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed: UpcomingPayment[] = JSON.parse(raw);
        if (parsed.some((u) => u.id === 'upc-01' || u.name.includes('Apartment Rent'))) {
          localStorage.removeItem(storageKey);
          return [];
        }
        return parsed;
      }
      return [];
    }

    const storageKey = 'finora_upc_7702994407';
    const raw = localStorage.getItem(storageKey);
    if (raw) return JSON.parse(raw);

    localStorage.setItem(storageKey, JSON.stringify(EXISTING_USER_UPCOMING));
    return EXISTING_USER_UPCOMING;
  } catch (e) {
    console.error('Failed to load upcoming payments for user', e);
  }
  return [];
}

export function saveUpcomingPaymentsForUser(phoneOrId: string | undefined, payments: UpcomingPayment[]): void {
  try {
    const isExisting = isExistingAdminUser(phoneOrId);
    if (!isExisting) {
      if (payments.some((u) => u.id === 'upc-01' || u.name.includes('Apartment Rent'))) {
        return;
      }
      const clean = String(phoneOrId || '').replace(/\D/g, '').slice(-10);
      if (!clean) return;
      localStorage.setItem(`finora_upc_${clean}`, JSON.stringify(payments));
      return;
    }
    localStorage.setItem('finora_upc_7702994407', JSON.stringify(payments));
  } catch (e) {
    console.error('Failed to save upcoming payments for user', e);
  }
}

export function loadUpcomingPayments(): UpcomingPayment[] {
  const profile = loadUserProfile();
  return loadUpcomingPaymentsForUser(profile?.phone || profile?.id);
}

export function saveUpcomingPayments(payments: UpcomingPayment[]): void {
  const profile = loadUserProfile();
  saveUpcomingPaymentsForUser(profile?.phone || profile?.id, payments);
}

export function loadRegisteredUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load registered users', e);
  }
  return [];
}

export function saveRegisteredUsers(users: UserProfile[]): void {
  localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(users));
}

export function loadCategories(): Category[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load categories from storage', e);
  }
  return DEFAULT_CATEGORIES;
}

export function saveCategories(categories: Category[]): void {
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
}

export function loadTransactions(monthKey?: string): Transaction[] {
  const profile = loadUserProfile();
  return loadTransactionsForUser(profile?.phone || profile?.id, monthKey);
}

export function saveTransactions(transactions: Transaction[]): void {
  const profile = loadUserProfile();
  saveTransactionsForUser(profile?.phone || profile?.id, transactions);
}

export function loadRecurring(): RecurringExpense[] {
  const profile = loadUserProfile();
  return loadRecurringForUser(profile?.phone || profile?.id);
}

export function saveRecurring(recurring: RecurringExpense[]): void {
  const profile = loadUserProfile();
  saveRecurringForUser(profile?.phone || profile?.id, recurring);
}

export function loadGoals(): SavingsGoal[] {
  const profile = loadUserProfile();
  return loadGoalsForUser(profile?.phone || profile?.id);
}

export function saveGoals(goals: SavingsGoal[]): void {
  const profile = loadUserProfile();
  saveGoalsForUser(profile?.phone || profile?.id, goals);
}

export function loadAiAudit(): BudgetOptimizationResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AI_AUDIT);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load AI audit from storage', e);
  }
  return null;
}

export function saveAiAudit(audit: BudgetOptimizationResult): void {
  localStorage.setItem(STORAGE_KEYS.AI_AUDIT, JSON.stringify(audit));
}

export function resetAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
  localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
  localStorage.removeItem(STORAGE_KEYS.RECURRING);
  localStorage.removeItem(STORAGE_KEYS.UPCOMING);
  localStorage.removeItem(STORAGE_KEYS.GOALS);
  localStorage.removeItem(STORAGE_KEYS.AI_AUDIT);
  localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
  localStorage.removeItem(STORAGE_KEYS.REGISTERED_USERS);
}

export function exportDataAsJson(
  categories: Category[],
  transactions: Transaction[],
  recurring: RecurringExpense[],
  goals: SavingsGoal[]
): void {
  const data = {
    version: '2.0',
    exportDate: new Date().toISOString(),
    categories,
    transactions,
    recurring,
    goals,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finora_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportTransactionsToCsv(transactions: Transaction[], categories: Category[]): void {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const headers = ['Date', 'Type', 'Category', 'Merchant', 'Amount', 'Payment Method', 'Notes', 'Recurring'];
  const rows = transactions.map((t) => [
    t.date,
    t.type,
    `"${catMap.get(t.categoryId) || t.categoryId}"`,
    `"${t.merchant.replace(/"/g, '""')}"`,
    t.amount.toFixed(2),
    t.paymentMethod,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
    t.isRecurring ? 'Yes' : 'No',
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finora_transactions_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
