import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Building,
  CreditCard,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { UserProfile, BankAccountDetails } from '../types/finance';
import { loadRegisteredUsers, saveRegisteredUsers } from '../utils/storage';
import { formatCurrency, formatCapitalizedName } from '../utils/formatters';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  initialMode?: 'login' | 'signup' | 'profile' | 'reset';
  onOpenBankModal?: () => void;
}

const POPULAR_INDIAN_BANKS = [
  'HDFC Bank',
  'State Bank of India',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Punjab National Bank',
  'Bank of Baroda',
  'IndusInd Bank',
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
  onUpdateProfile,
  initialMode = 'profile',
  onOpenBankModal,
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'profile' | 'reset'>(initialMode);

  // Sign up fields (Clean defaults)
  const [firstName, setFirstName] = useState(currentUser.firstName || '');
  const [lastName, setLastName] = useState(currentUser.lastName || '');
  const [mobileNumber, setMobileNumber] = useState(currentUser.phone || '');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [customBank, setCustomBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [passcode, setPasscode] = useState('');

  // Login fields
  const [loginPhone, setLoginPhone] = useState(currentUser.phone || '');
  const [loginPasscode, setLoginPasscode] = useState('');

  // Reset fields (No OTP requirement)
  const [resetPhone, setResetPhone] = useState(currentUser.phone || '');
  const [newPasscode, setNewPasscode] = useState('');

  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const cleanPhone = (phoneStr: string) => phoneStr.replace(/\D/g, '').slice(-10);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleaned = cleanPhone(loginPhone);
    if (cleaned.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    if (!loginPasscode.trim()) {
      setError('Please enter your security PIN / Passcode');
      return;
    }

    const registered = loadRegisteredUsers();
    const match = registered.find((u) => cleanPhone(u.phone) === cleaned);

    if (match) {
      if (match.password && match.password !== loginPasscode.trim()) {
        setError('Incorrect PIN. Please try again or reset your PIN.');
        return;
      }
      onLogin(match);
      setFeedback(`Welcome back, ${match.firstName || match.name.split(' ')[0]} 👋`);
      setTimeout(() => onClose(), 600);
    } else {
      setError('No account found with this number. Please click "Create an account" below.');
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const capFirst = formatCapitalizedName(firstName);
    const capLast = formatCapitalizedName(lastName);

    if (!capFirst.trim()) {
      setError('First Name is required');
      return;
    }
    if (!capLast.trim()) {
      setError('Last Name is required');
      return;
    }

    const cleanedPhone = cleanPhone(mobileNumber);
    if (cleanedPhone.length !== 10) {
      setError('Mobile Number must be exactly 10 digits (+91)');
      return;
    }

    if (!passcode.trim() || passcode.trim().length < 4) {
      setError('Please choose a 4-digit security PIN');
      return;
    }

    const fullName = `${capFirst} ${capLast}`.trim();

    // Bank details are optional and do not block account creation (Requirement 7)
    let newBankDetails: BankAccountDetails | undefined;
    const cleanAccountNum = accountNumber.replace(/\D/g, '');
    if (cleanAccountNum.length >= 4) {
      const last4 = cleanAccountNum.slice(-4);
      const effectiveBank = bankName === 'Other' ? (customBank.trim() || 'Custom Bank') : bankName;
      const numBalance = currentBalance.trim() ? parseFloat(currentBalance) : 0;
      newBankDetails = {
        id: `acc-${Date.now()}`,
        bankName: effectiveBank,
        accountNumberMasked: `•••• ${last4}`,
        accountNumberLast4: last4,
        accountType: 'Savings',
        balance: isNaN(numBalance) ? 0 : numBalance,
        nickname: 'Primary Account',
        isPrimary: true,
        rawAccountNumber: cleanAccountNum || undefined,
      };
    }

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: fullName,
      firstName: capFirst,
      lastName: capLast,
      phone: cleanedPhone,
      password: passcode.trim(),
      isOnboarded: true,
      isAuthenticated: true,
      bankDetails: newBankDetails,
      bankAccounts: newBankDetails ? [newBankDetails] : [],
      salaryDate: 1,
      createdAt: new Date().toISOString(),
      hideBalance: false,
      theme: 'dark',
      notificationsEnabled: true,
    };

    const registered = loadRegisteredUsers();
    saveRegisteredUsers([...registered, newUser]);
    onLogin(newUser);

    setFeedback(`Account created! Welcome to FINORA AI, ${newUser.firstName} 👋`);
    setTimeout(() => onClose(), 600);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const capFirst = formatCapitalizedName(firstName);
    const capLast = formatCapitalizedName(lastName);
    if (!capFirst.trim()) {
      setError('First name cannot be empty');
      return;
    }
    const fullName = `${capFirst} ${capLast}`.trim();
    onUpdateProfile({
      name: fullName,
      firstName: capFirst,
      lastName: capLast,
      phone: cleanPhone(mobileNumber) || currentUser.phone,
    });
    setFeedback('Profile updated successfully');
    setTimeout(() => {
      setFeedback(null);
      onClose();
    }, 600);
  };

  const handleDirectResetPin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleaned = cleanPhone(resetPhone);
    if (cleaned.length !== 10) {
      setError('Please enter your 10-digit registered mobile number');
      return;
    }

    if (!newPasscode.trim()) {
      setError('Please enter your new 4-digit security PIN');
      return;
    }

    const registered = loadRegisteredUsers();
    const matchIndex = registered.findIndex((u) => cleanPhone(u.phone) === cleaned);

    if (matchIndex >= 0) {
      registered[matchIndex].password = newPasscode.trim();
      saveRegisteredUsers(registered);
      if (cleanPhone(currentUser.phone) === cleaned) {
        onUpdateProfile({ password: newPasscode.trim() });
      }
      setFeedback('Security PIN updated successfully! You can now log in.');
      setTimeout(() => {
        setMode('login');
        setLoginPhone(cleaned);
        setLoginPasscode(newPasscode);
        setFeedback(null);
      }, 700);
    } else {
      setError('No registered account was found with this mobile number.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-t-[32px] sm:rounded-3xl bg-slate-900 border border-white/10 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                {mode === 'profile' && 'User Profile & Identity'}
                {mode === 'login' && 'Sign In to FINORA AI'}
                {mode === 'signup' && 'Create Your Account'}
                {mode === 'reset' && 'Reset Security PIN'}
              </h2>
              <p className="text-[11px] text-slate-400">
                FINORA AI Secure Authentication
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
          <ShieldCheck className="h-4 w-4 flex-shrink-0" />
          <span>256-bit client-side security · Direct authenticated session</span>
        </div>

        {feedback && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* 1. SIGN IN MODE */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5 pt-1">
            <div>
              <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                10-Digit Mobile Number *
              </label>
              <div className="flex rounded-xl bg-slate-950 border border-slate-800 overflow-hidden focus-within:border-emerald-500">
                <span className="px-3 py-2.5 bg-slate-900 text-slate-400 font-bold text-xs flex items-center border-r border-slate-800">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(cleanPhone(e.target.value))}
                  placeholder="98765 43210"
                  className="flex-1 px-3 py-2.5 bg-transparent text-white text-xs font-mono focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  Security Passcode / PIN *
                </label>
                <button
                  type="button"
                  onClick={() => setMode('reset')}
                  className="text-[10px] text-emerald-400 hover:underline"
                >
                  Forgot PIN?
                </button>
              </div>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={loginPasscode}
                onChange={(e) => setLoginPasscode(e.target.value)}
                placeholder="••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 mt-2"
            >
              <span>Sign In to Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="pt-2 text-center border-t border-slate-800/80">
              <p className="text-xs text-slate-400">
                New to FINORA AI?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-emerald-400 font-bold hover:underline"
                >
                  Create an account
                </button>
              </p>
            </div>
          </form>
        )}

        {/* 2. SIGN UP MODE */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Afzal"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Hussain"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                10-Digit Mobile Number *
              </label>
              <div className="flex rounded-xl bg-slate-950 border border-slate-800 overflow-hidden focus-within:border-emerald-500">
                <span className="px-3 py-2 bg-slate-900 text-slate-400 font-bold text-xs flex items-center border-r border-slate-800">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(cleanPhone(e.target.value))}
                  placeholder="98765 43210"
                  className="flex-1 px-3 py-2 bg-transparent text-white text-xs font-mono focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                  Bank Name
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  {POPULAR_INDIAN_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                  <option value="Other">Other Bank</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  maxLength={18}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Last 4+ digits"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {bankName === 'Other' && (
              <div>
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                  Custom Bank Name
                </label>
                <input
                  type="text"
                  value={customBank}
                  onChange={(e) => setCustomBank(e.target.value)}
                  placeholder="Enter bank name"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  Current Bank Balance (₹)
                </label>
                <span className="text-[10px] text-slate-500">Optional · Default ₹0</span>
              </div>
              <input
                type="number"
                min="0"
                step="any"
                value={currentBalance}
                onChange={(e) => setCurrentBalance(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                Set Security PIN / Passcode *
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Choose a 4-digit PIN"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 mt-2"
            >
              <span>Initialize Clean Workspace</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="pt-2 text-center border-t border-slate-800/80">
              <p className="text-xs text-slate-400">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-emerald-400 font-bold hover:underline"
                >
                  Sign In
                </button>
              </p>
            </div>
          </form>
        )}

        {/* 3. PROFILE VIEW */}
        {mode === 'profile' && (
          <div className="space-y-4 pt-1">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Logged in as</span>
                <span className="font-bold text-white">
                  {currentUser.name || 'Financial Workspace User'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Mobile Number</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  +91 {currentUser.phone ? `••••••${cleanPhone(currentUser.phone).slice(-4)}` : 'Not linked'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Primary Bank</span>
                <span className="font-mono text-slate-300">
                  {currentUser.bankDetails?.bankName || 'No bank linked'} {currentUser.bankDetails?.accountNumberMasked || ''}
                </span>
              </div>
            </div>

            {onOpenBankModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBankModal();
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Building className="h-4 w-4 text-emerald-400" />
                <span>Manage Financial Accounts</span>
              </button>
            )}

            <div className="pt-2 flex items-center gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="flex-1 py-2 rounded-xl bg-slate-950 hover:bg-slate-850 text-slate-300 font-semibold text-xs border border-slate-800"
              >
                Switch Account
              </button>
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  setFeedback('Logged out of FINORA AI');
                  setTimeout(() => onClose(), 600);
                }}
                className="px-4 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 font-bold text-xs border border-rose-800 flex items-center gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. RESET PIN MODE (NO OTP) */}
        {mode === 'reset' && (
          <form onSubmit={handleDirectResetPin} className="space-y-3.5 pt-1">
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                Enter Registered Mobile Number
              </label>
              <div className="flex rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                <span className="px-3 py-2.5 bg-slate-900 text-slate-400 font-bold text-xs flex items-center border-r border-slate-800">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={resetPhone}
                  onChange={(e) => setResetPhone(cleanPhone(e.target.value))}
                  placeholder="98765 43210"
                  className="flex-1 px-3 py-2.5 bg-transparent text-white text-xs font-mono focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                Set New 4-Digit Security PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={newPasscode}
                onChange={(e) => setNewPasscode(e.target.value)}
                placeholder="New 4-digit PIN"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700 transition-colors"
              >
                Back to Sign In
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors"
              >
                Save New PIN
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
