import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'finora_db.json');

export interface DbUser {
  id: string;
  firstName: string;
  lastName: string;
  phone: string; // 10-digit clean mobile
  pinHash: string; // securely hashed (never plaintext!)
  pinSalt: string;
  createdAt: string;
  lastLogin: string;
  status: 'Active' | 'Disabled';
  role: 'user' | 'admin';
  isOnboarded: boolean;
  bankAccounts: Array<{
    id: string;
    bankName: string;
    accountNumberMasked: string; // •••• 4821
    accountNumberLast4: string;
    accountType?: string;
    balance: number;
    nickname?: string;
    isPrimary?: boolean;
  }>;
  bankDetails?: any;
  transactions?: any[];
  recurring?: any[];
  savingsGoals?: any[];
  categories?: any[];
}

export interface AuditLogEntry {
  id: string;
  adminUserId: string;
  adminPhone: string;
  action: string;
  targetUserId?: string;
  targetUserName?: string;
  details?: string;
  timestamp: string;
  ip?: string;
}

export interface SessionData {
  token: string;
  userId: string;
  role: 'user' | 'admin';
  phone: string;
  expiresAt: number;
}

interface DatabaseSchema {
  version: number;
  users: DbUser[];
  auditLogs: AuditLogEntry[];
}

// In-memory active session tokens mapped to user
const activeSessions = new Map<string, SessionData>();

// Helper to hash PIN with PBKDF2
export function hashPin(pin: string, providedSalt?: string): { hash: string; salt: string } {
  const salt = providedSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(pin, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPin(pin: string, storedHash: string, salt: string): boolean {
  try {
    const computed = crypto.pbkdf2Sync(pin, salt, 10000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch {
    return false;
  }
}

// Clean phone helper
export function cleanPhone(raw: string): string {
  return (raw || '').replace(/\D/g, '').slice(-10);
}

// Mask mobile number for privacy (Spec #10: e.g. +91 ******4407)
export function maskPhone(phone: string): string {
  const clean = cleanPhone(phone);
  if (clean.length === 10) {
    return `+91 ******${clean.slice(-4)}`;
  }
  return `+91 ******${clean.slice(-4) || '****'}`;
}

const INITIAL_AFZAL_BANK_ACCOUNTS = [
  {
    id: 'acc-hdfc-01',
    bankName: 'HDFC Bank',
    accountNumberMasked: '•••• 4821',
    accountNumberLast4: '4821',
    accountType: 'Salary',
    balance: 50000,
    nickname: 'Primary Salary',
    isPrimary: true,
  },
  {
    id: 'acc-sbi-02',
    bankName: 'State Bank of India',
    accountNumberMasked: '•••• 1934',
    accountNumberLast4: '1934',
    accountType: 'Savings',
    balance: 25000,
    nickname: 'Emergency Savings',
    isPrimary: false,
  },
  {
    id: 'acc-cash-03',
    bankName: 'Cash In Hand',
    accountNumberMasked: '•••• CASH',
    accountNumberLast4: 'CASH',
    accountType: 'Cash',
    balance: 3400,
    nickname: 'Daily Pocket Cash',
    isPrimary: false,
  },
];

const INITIAL_AFZAL_TRANSACTIONS = [
  { id: 'tx-afzal-01', date: '2026-10-01', merchant: 'TCS / Tech Corp Payroll', amount: 75000, type: 'income', categoryId: 'cat-income-salary', paymentMethod: 'bank_transfer', accountId: 'acc-hdfc-01', notes: 'Monthly Net Take-Home Salary credited' },
  { id: 'tx-afzal-02', date: '2026-10-03', merchant: 'FinTech UI Consulting', amount: 1650, type: 'income', categoryId: 'cat-income-freelance', paymentMethod: 'upi', accountId: 'acc-sbi-02', notes: 'Advisory retainer payment' },
  { id: 'tx-afzal-03', date: '2026-10-05', merchant: 'Landlord / Apartment Rent', amount: 18000, type: 'expense', categoryId: 'cat-housing', paymentMethod: 'bank_transfer', accountId: 'acc-hdfc-01', notes: '2BHK Apartment Monthly Rent (HDFC IMPS)' },
  { id: 'tx-afzal-04', date: '2026-10-07', merchant: 'Zerodha Coin / Nifty 50 Index', amount: 10000, type: 'expense', categoryId: 'cat-investments', paymentMethod: 'bank_transfer', accountId: 'acc-hdfc-01', notes: 'Monthly Automated SIP Mutual Fund Allocation' },
  { id: 'tx-afzal-05', date: '2026-10-08', merchant: 'Blinkit Superstore', amount: 3850, type: 'expense', categoryId: 'cat-groceries', paymentMethod: 'upi', accountId: 'acc-hdfc-01', notes: 'Monthly staples, dry fruits, fresh produce' },
  { id: 'tx-afzal-06', date: '2026-10-10', merchant: 'TSSPDCL Power Distribution', amount: 2450, type: 'expense', categoryId: 'cat-utilities', paymentMethod: 'upi', accountId: 'acc-hdfc-01', notes: 'Electricity bill payment for current billing cycle' },
  { id: 'tx-afzal-07', date: '2026-10-12', merchant: 'Airtel Xstream Fibernet', amount: 1179, type: 'expense', categoryId: 'cat-utilities', paymentMethod: 'upi', accountId: 'acc-hdfc-01', notes: 'High-speed broadband monthly subscription with GST' },
  { id: 'tx-afzal-08', date: '2026-10-14', merchant: 'Shell India Fuel Station', amount: 1800, type: 'expense', categoryId: 'cat-transport', paymentMethod: 'card', accountId: 'acc-hdfc-01', notes: 'Vehicle petrol tank full recharge' },
  { id: 'tx-afzal-09', date: '2026-10-16', merchant: 'Swiggy / Biryani House', amount: 650, type: 'expense', categoryId: 'cat-dining', paymentMethod: 'upi', accountId: 'acc-hdfc-01', notes: 'Weekend dinner order for family' },
  { id: 'tx-afzal-10', date: '2026-10-18', merchant: 'Apollo Pharmacy & Wellness', amount: 640, type: 'expense', categoryId: 'cat-health', paymentMethod: 'cash', accountId: 'acc-cash-03', notes: 'Monthly multivitamin and healthcare supplies' },
  { id: 'tx-afzal-11', date: '2026-10-20', merchant: 'Netflix India Premium', amount: 649, type: 'expense', categoryId: 'cat-entertainment', paymentMethod: 'card', accountId: 'acc-hdfc-01', notes: '4K Ultra HD monthly streaming plan' },
  { id: 'tx-afzal-12', date: '2026-10-22', merchant: 'Myntra Fashion', amount: 2500, type: 'expense', categoryId: 'cat-shopping', paymentMethod: 'card', accountId: 'acc-hdfc-01', notes: 'Work wear & casual sneakers' },
  { id: 'tx-afzal-13', date: '2026-10-24', merchant: 'Barbeque Nation Dining', amount: 1420, type: 'expense', categoryId: 'cat-dining', paymentMethod: 'upi', accountId: 'acc-hdfc-01', notes: 'Team celebration dinner buffet' },
  { id: 'tx-afzal-14', date: '2026-10-26', merchant: 'Third Wave Coffee Roasters', amount: 480, type: 'expense', categoryId: 'cat-dining', paymentMethod: 'cash', accountId: 'acc-cash-03', notes: 'Artisan cold brew and bakery snack' },
];

const INITIAL_AFZAL_RECURRING = [
  { id: 'rec-01', merchant: 'Apartment Rent', amount: 18000, categoryId: 'cat-housing', billingCycle: 'monthly', billingDay: 5, status: 'active', utility: 'essential' },
  { id: 'rec-02', merchant: 'Zerodha Index Fund SIP', amount: 10000, categoryId: 'cat-investments', billingCycle: 'monthly', billingDay: 7, status: 'active', utility: 'essential' },
  { id: 'rec-03', merchant: 'TSSPDCL Electricity Board', amount: 2450, categoryId: 'cat-utilities', billingCycle: 'monthly', billingDay: 10, status: 'active', utility: 'essential' },
  { id: 'rec-04', merchant: 'Airtel Xstream Fibernet', amount: 1179, categoryId: 'cat-utilities', billingCycle: 'monthly', billingDay: 12, status: 'active', utility: 'essential' },
  { id: 'rec-05', merchant: 'Netflix Premium 4K', amount: 649, categoryId: 'cat-entertainment', billingCycle: 'monthly', billingDay: 20, status: 'active', utility: 'moderate' },
];

const INITIAL_AFZAL_GOALS = [
  { id: 'goal-01', name: 'Emergency Reserve Fund (6 Months)', targetAmount: 150000, currentAmount: 75000, targetDate: '2027-03-31', category: 'Emergency', color: '#10b981', emoji: '🛡️' },
  { id: 'goal-02', name: 'Workstation Tech Hardware Upgrade', targetAmount: 80000, currentAmount: 45000, targetDate: '2026-12-31', category: 'Gadgets & Tech', color: '#6366f1', emoji: '💻' },
];

class DatabaseManager {
  private db: DatabaseSchema = {
    version: 1,
    users: [],
    auditLogs: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.db = JSON.parse(raw);
      } else {
        this.db = {
          version: 1,
          users: [],
          auditLogs: [],
        };
        this.seedInitialAdmin();
        this.save();
      }

      // Ensure existing user/admin exists with full expenditure
      const adminIdx = this.db.users.findIndex((u) => cleanPhone(u.phone) === '7702994407');
      if (adminIdx === -1) {
        this.seedInitialAdmin();
        this.save();
      } else {
        // Guarantee existing user has his full accounts, expenditure & transactions populated
        const existingAdmin = this.db.users[adminIdx];
        existingAdmin.transactions = INITIAL_AFZAL_TRANSACTIONS;
        existingAdmin.bankAccounts = INITIAL_AFZAL_BANK_ACCOUNTS;
        existingAdmin.recurring = INITIAL_AFZAL_RECURRING;
        existingAdmin.savingsGoals = INITIAL_AFZAL_GOALS;
      }

      // Guarantee any OTHER non-admin user in the database has ZERO data unless explicitly created
      for (const u of this.db.users) {
        if (cleanPhone(u.phone) !== '7702994407' && u.id !== 'admin-master-001') {
          // If transactions or bank accounts were accidentally synced from afzal, clear them to zero
          if (u.transactions && u.transactions.some((t: any) => t.id && t.id.startsWith('tx-afzal'))) {
            u.transactions = [];
          }
          if (u.bankAccounts && u.bankAccounts.some((a: any) => a.id && a.id.startsWith('acc-hdfc-01'))) {
            u.bankAccounts = [];
          }
          if (u.recurring && u.recurring.some((r: any) => r.id && r.id.startsWith('rec-01'))) {
            u.recurring = [];
          }
          if (u.savingsGoals && u.savingsGoals.some((g: any) => g.id && g.id.startsWith('goal-01'))) {
            u.savingsGoals = [];
          }
          if (!u.transactions) u.transactions = [];
          if (!u.bankAccounts) u.bankAccounts = [];
          if (!u.recurring) u.recurring = [];
          if (!u.savingsGoals) u.savingsGoals = [];
        }
      }
      this.save();
    } catch (err) {
      console.error('Failed to initialize database, creating fallback memory store', err);
      this.seedInitialAdmin();
    }
  }

  private seedInitialAdmin() {
    // Requirements #5: Mobile: 7702994407, Security PIN: admin (Hashed securely, NEVER plaintext!)
    const { hash, salt } = hashPin('admin');
    const adminUser: DbUser = {
      id: 'admin-master-001',
      firstName: 'Shaik Afzal',
      lastName: 'Hussain',
      phone: '7702994407',
      pinHash: hash,
      pinSalt: salt,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      status: 'Active',
      role: 'admin',
      isOnboarded: true,
      bankAccounts: INITIAL_AFZAL_BANK_ACCOUNTS,
      transactions: INITIAL_AFZAL_TRANSACTIONS,
      recurring: INITIAL_AFZAL_RECURRING,
      savingsGoals: INITIAL_AFZAL_GOALS,
    };

    // Filter out any stale admin records
    this.db.users = this.db.users.filter((u) => cleanPhone(u.phone) !== '7702994407');
    this.db.users.push(adminUser);

    this.db.auditLogs.push({
      id: `audit-${Date.now()}`,
      adminUserId: adminUser.id,
      adminPhone: adminUser.phone,
      action: 'system_initialized',
      details: 'Secure Admin console credentials provisioned with cryptographic hash and existing user ledger.',
      timestamp: new Date().toISOString(),
    });
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database to disk', err);
    }
  }

  // Session Token Management
  public createSession(user: DbUser): string {
    const token = crypto.randomBytes(32).toString('hex');
    activeSessions.set(token, {
      token,
      userId: user.id,
      role: user.role,
      phone: user.phone,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return token;
  }

  public getSession(token: string): SessionData | null {
    if (!token) return null;
    const session = activeSessions.get(token);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      activeSessions.delete(token);
      return null;
    }
    return session;
  }

  public destroySession(token: string): void {
    activeSessions.delete(token);
  }

  // User Operations
  public findUserByPhone(phone: string): DbUser | undefined {
    const clean = cleanPhone(phone);
    return this.db.users.find((u) => cleanPhone(u.phone) === clean);
  }

  public findUserById(id: string): DbUser | undefined {
    return this.db.users.find((u) => u.id === id);
  }

  public registerUser(params: {
    firstName: string;
    lastName: string;
    phone: string;
    pin: string;
    bankAccounts?: any[];
  }): { user: DbUser; token: string } {
    const clean = cleanPhone(params.phone);
    if (clean.length !== 10) {
      throw new Error('Invalid mobile number: must be 10 digits');
    }
    if (!params.pin || params.pin.length < 4) {
      throw new Error('Security PIN must be at least 4 digits');
    }

    const existing = this.findUserByPhone(clean);
    if (existing) {
      throw new Error('User with this mobile number already exists');
    }

    const { hash, salt } = hashPin(params.pin);
    const newUser: DbUser = {
      id: `usr-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      firstName: params.firstName.trim(),
      lastName: params.lastName.trim(),
      phone: clean,
      pinHash: hash,
      pinSalt: salt,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      status: 'Active',
      role: 'user',
      isOnboarded: true,
      bankAccounts: params.bankAccounts || [],
      transactions: [],
      recurring: [],
      savingsGoals: [],
    };

    this.db.users.push(newUser);
    this.save();

    const token = this.createSession(newUser);
    return { user: newUser, token };
  }

  public authenticate(phone: string, pin: string, ip?: string): { user: DbUser; token: string } | null {
    const clean = cleanPhone(phone);
    const user = this.findUserByPhone(clean);
    if (!user) return null;

    if (user.status === 'Disabled') {
      throw new Error('Account has been deactivated. Please contact support.');
    }

    const isValid = verifyPin(pin, user.pinHash, user.pinSalt);
    if (!isValid) return null;

    user.lastLogin = new Date().toISOString();
    this.save();

    const token = this.createSession(user);

    if (user.role === 'admin') {
      this.addAuditLog({
        adminUserId: user.id,
        adminPhone: user.phone,
        action: 'admin_login',
        details: 'Admin signed in successfully.',
        ip,
      });
    }

    return { user, token };
  }

  public updateUser(userId: string, updates: Partial<DbUser>): DbUser {
    const idx = this.db.users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error('User not found');

    // Never allow updating pinHash directly through this method
    delete (updates as any).pinHash;
    delete (updates as any).pinSalt;
    delete (updates as any).role; // role changes must be explicit

    this.db.users[idx] = { ...this.db.users[idx], ...updates };
    this.save();
    return this.db.users[idx];
  }

  public syncUserData(
    userId: string,
    data: {
      transactions?: any[];
      recurring?: any[];
      savingsGoals?: any[];
      bankAccounts?: any[];
      bankDetails?: any;
    }
  ): void {
    const user = this.findUserById(userId);
    if (!user) return;

    // Prevent cross-user data leakage: non-admin user must never inherit afzal transactions/accounts
    if (cleanPhone(user.phone) !== '7702994407' && user.id !== 'admin-master-001') {
      if (data.transactions && data.transactions.some((t: any) => t.id && t.id.startsWith('tx-afzal'))) {
        return;
      }
      if (data.bankAccounts && data.bankAccounts.some((a: any) => a.id && a.id.startsWith('acc-hdfc-01'))) {
        return;
      }
      if (data.recurring && data.recurring.some((r: any) => r.id && r.id.startsWith('rec-01'))) {
        return;
      }
    }

    if (data.transactions !== undefined) user.transactions = data.transactions;
    if (data.recurring !== undefined) user.recurring = data.recurring;
    if (data.savingsGoals !== undefined) user.savingsGoals = data.savingsGoals;
    if (data.bankAccounts !== undefined) user.bankAccounts = data.bankAccounts;
    if (data.bankDetails !== undefined) user.bankDetails = data.bankDetails;

    this.save();
  }

  // Admin Methods (Protected)
  public getAdminMetrics() {
    const users = this.db.users;
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.status === 'Active').length;

    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    const newUsersMonth = users.filter((u) => new Date(u.createdAt) >= oneMonthAgo).length;

    let totalLinkedAccounts = 0;
    let totalReportedBalance = 0;
    const accountsByInstitution: Record<string, number> = {};

    for (const u of users) {
      const accs = u.bankAccounts || (u.bankDetails ? [u.bankDetails] : []);
      totalLinkedAccounts += accs.length;
      for (const a of accs) {
        totalReportedBalance += a.balance || 0;
        const bank = a.bankName || 'Other';
        accountsByInstitution[bank] = (accountsByInstitution[bank] || 0) + 1;
      }
    }

    return {
      totalUsers,
      activeUsers,
      newUsersMonth,
      totalLinkedAccounts,
      totalReportedBalance,
      accountsByInstitution,
      totalAuditLogs: this.db.auditLogs.length,
    };
  }

  public getAdminUsersList() {
    // Return sanitized users list with masked phone numbers and NO PIN fields
    return this.db.users
      .map((u) => {
        const accs = u.bankAccounts || (u.bankDetails ? [u.bankDetails] : []);
        const totalBal = accs.reduce((sum, a) => sum + (a.balance || 0), 0);
        return {
          id: u.id,
          name: `${u.firstName} ${u.lastName}`.trim(),
          firstName: u.firstName,
          lastName: u.lastName,
          maskedPhone: maskPhone(u.phone),
          createdAt: u.createdAt,
          lastLogin: u.lastLogin,
          status: u.status,
          role: u.role,
          accountCount: accs.length,
          totalReportedBalance: totalBal,
          transactionCount: u.transactions?.length || 0,
          authStatus: 'Protected', // Requirement #8: Never expose PIN
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getUserDetailForAdmin(adminUser: DbUser, targetUserId: string) {
    const user = this.findUserById(targetUserId);
    if (!user) throw new Error('Target user not found');

    this.addAuditLog({
      adminUserId: adminUser.id,
      adminPhone: adminUser.phone,
      action: 'user_profile_viewed',
      targetUserId: user.id,
      targetUserName: `${user.firstName} ${user.lastName}`.trim(),
      details: `Viewed financial metadata for user ID ${user.id}`,
    });

    const accs = user.bankAccounts || (user.bankDetails ? [user.bankDetails] : []);

    return {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      firstName: user.firstName,
      lastName: user.lastName,
      maskedPhone: maskPhone(user.phone),
      status: user.status,
      role: user.role,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      authStatus: 'Protected (SHA-512 Encrypted)',
      financialAccounts: accs.map((a) => ({
        id: a.id,
        bankName: a.bankName,
        accountNumberMasked: a.accountNumberMasked || `•••• ${a.accountNumberLast4}`,
        accountType: a.accountType || 'Savings',
        balance: a.balance || 0,
        isPrimary: !!a.isPrimary,
      })),
      activitySummary: {
        transactionCount: user.transactions?.length || 0,
        recentTransactions: (user.transactions || []).slice(0, 15),
        recurringCount: user.recurring?.length || 0,
        recurring: user.recurring || [],
        savingsGoalsCount: user.savingsGoals?.length || 0,
        savingsGoals: user.savingsGoals || [],
      },
    };
  }

  public updateUserStatus(adminUser: DbUser, targetUserId: string, newStatus: 'Active' | 'Disabled') {
    const user = this.findUserById(targetUserId);
    if (!user) throw new Error('Target user not found');
    if (user.role === 'admin') throw new Error('Cannot change status of an administrator');

    user.status = newStatus;
    this.save();

    this.addAuditLog({
      adminUserId: adminUser.id,
      adminPhone: adminUser.phone,
      action: 'user_status_changed',
      targetUserId: user.id,
      targetUserName: `${user.firstName} ${user.lastName}`.trim(),
      details: `Changed account status to ${newStatus}`,
    });

    return { success: true, status: newStatus };
  }

  public changeAdminPin(adminUserId: string, oldPin: string, newPin: string) {
    const admin = this.findUserById(adminUserId);
    if (!admin || admin.role !== 'admin') throw new Error('Unauthorized');

    const isValid = verifyPin(oldPin, admin.pinHash, admin.pinSalt);
    if (!isValid) throw new Error('Current PIN is incorrect');

    if (!newPin || newPin.length < 4) {
      throw new Error('New PIN must be at least 4 characters');
    }

    const { hash, salt } = hashPin(newPin);
    admin.pinHash = hash;
    admin.pinSalt = salt;
    this.save();

    this.addAuditLog({
      adminUserId: admin.id,
      adminPhone: admin.phone,
      action: 'admin_pin_rotated',
      details: 'Administrator security PIN rotated securely.',
    });

    return { success: true };
  }

  public addAuditLog(entry: {
    adminUserId: string;
    adminPhone: string;
    action: string;
    targetUserId?: string;
    targetUserName?: string;
    details?: string;
    ip?: string;
  }) {
    const log: AuditLogEntry = {
      id: `log-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      ...entry,
      timestamp: new Date().toISOString(),
    };
    this.db.auditLogs.unshift(log);
    // Keep last 1000 logs
    if (this.db.auditLogs.length > 1000) {
      this.db.auditLogs = this.db.auditLogs.slice(0, 1000);
    }
    this.save();
  }

  public getAuditLogs(limit: number = 100) {
    return this.db.auditLogs.slice(0, limit);
  }
}

export const dbManager = new DatabaseManager();
