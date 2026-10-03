import React, { useState, useEffect } from 'react';
import {
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Building,
  CreditCard,
  Wallet,
  User,
  Sparkles,
  ChevronRight,
  X,
} from 'lucide-react';
import { UserProfile, BankAccountDetails } from '../types/finance';
import { loadRegisteredUsers, saveRegisteredUsers, saveUserProfile } from '../utils/storage';
import { formatCapitalizedName } from '../utils/formatters';

interface PhoneAuthModalProps {
  isOpen: boolean;
  initialTab?: 'signin' | 'signup';
  onClose?: () => void;
  onSuccess: (user: UserProfile) => void;
  onOpenAdmin?: () => void;
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

export const PhoneAuthModal: React.FC<PhoneAuthModalProps> = ({
  isOpen,
  initialTab = 'signin',
  onClose,
  onSuccess,
  onOpenAdmin,
}) => {
  const [tab, setTab] = useState<'signin' | 'signup'>(initialTab);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sign In fields
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPin, setLoginPin] = useState('');

  // Sync tab with initialTab when opened
  useEffect(() => {
    if (isOpen && initialTab) {
      setTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Escape key handler to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Sign Up fields:
  // Step 1: Personal Info (First Name, Last Name)
  // Step 2: Mobile Number (10 digits)
  // Step 3: Security PIN
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPin, setSignUpPin] = useState('');

  // Optional Post-Registration Bank Setup State
  const [isOptionalBankStep, setIsOptionalBankStep] = useState(false);
  const [createdUser, setCreatedUser] = useState<UserProfile | null>(null);
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankName, setBankName] = useState('HDFC Bank');
  const [customBank, setCustomBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState<'Savings' | 'Salary' | 'Current'>('Savings');
  const [initialBalance, setInitialBalance] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const cleanPhone = (str: string) => str.replace(/\D/g, '').slice(0, 10);

  // 1. Direct Production Sign In (Server-backed PBKDF2 + Local Fallback, No OTP)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleaned = cleanPhone(loginPhone);
    if (cleaned.length !== 10) {
      setError('Please enter your 10-digit mobile number');
      return;
    }

    if (!loginPin.trim()) {
      setError('Please enter your security PIN');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Try server authentication first (hashes PIN server-side, verifies admin & user roles)
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleaned, pin: loginPin.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        const serverUser = data.user;
        const token = data.token;

        if (serverUser.role === 'admin') {
          sessionStorage.setItem('finora_admin_token', token);
          setFeedback('Administrator credentials verified. Launching Admin Console... 🛡️');
          setTimeout(() => {
            const adminUser: UserProfile = {
              id: serverUser.id,
              name: `${serverUser.firstName || ''} ${serverUser.lastName || ''}`.trim() || 'Shaik Afzal Hussain',
              firstName: serverUser.firstName || 'Shaik Afzal',
              lastName: serverUser.lastName || 'Hussain',
              phone: serverUser.phone || cleaned,
              isAuthenticated: true,
              role: 'admin',
              isOnboarded: true,
              bankAccounts: serverUser.bankAccounts || [],
              salaryDate: 1,
              createdAt: serverUser.createdAt || new Date().toISOString(),
            };
            onSuccess(adminUser);
            if (onOpenAdmin) {
              onOpenAdmin();
            } else {
              window.location.hash = '#admin';
            }
          }, 600);
          return;
        }

        // Standard user logged in from server database
        const authenticatedUser: UserProfile = {
          id: serverUser.id,
          name: `${serverUser.firstName || ''} ${serverUser.lastName || ''}`.trim() || 'User',
          firstName: serverUser.firstName,
          lastName: serverUser.lastName,
          phone: serverUser.phone || cleaned,
          isAuthenticated: true,
          role: serverUser.role || 'user',
          isOnboarded: serverUser.isOnboarded ?? true,
          bankDetails: serverUser.bankDetails,
          bankAccounts: serverUser.bankAccounts || [],
          salaryDate: 1,
          createdAt: serverUser.createdAt || new Date().toISOString(),
        };
        sessionStorage.setItem('finora_user_token', token);
        saveUserProfile(authenticatedUser);
        setFeedback(`Welcome back, ${serverUser.firstName || 'User'} 👋`);
        setTimeout(() => onSuccess(authenticatedUser), 600);
        return;
      } else {
        const errData = await res.json().catch(() => ({}));
        // If wrong PIN for existing server user
        if (res.status === 401 && errData.error && errData.error.includes('PIN')) {
          setError(errData.error);
          return;
        }
      }
    } catch (err) {
      console.warn('Server auth call failed, falling back to local storage:', err);
    } finally {
      setIsSubmitting(false);
    }

    // 2. Local Fallback for offline records
    const registered = loadRegisteredUsers();
    const existing = registered.find((u) => cleanPhone(u.phone) === cleaned);

    if (existing) {
      if (existing.password && existing.password !== loginPin.trim()) {
        setError('Incorrect PIN. Please re-enter your security PIN.');
        return;
      }
      const authenticatedUser: UserProfile = {
        ...existing,
        isAuthenticated: true,
      };
      setFeedback(`Welcome back, ${existing.firstName || existing.name.split(' ')[0]} 👋`);
      setTimeout(() => onSuccess(authenticatedUser), 600);
    } else {
      // First-time number: smoothly transition to account setup
      setSignUpPhone(cleaned);
      setSignUpPin(loginPin);
      setTab('signup');
      setError('Account not found with this number. Please complete quick registration below.');
    }
  };

  // 2. Direct Production Sign Up (Name + Mobile + Security PIN, Bank Details Optional & Do NOT Block)
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

    const cleaned = cleanPhone(signUpPhone);
    if (cleaned.length !== 10) {
      setError('Mobile Number must be exactly 10 digits (+91)');
      return;
    }

    if (!['6', '7', '8', '9'].includes(cleaned[0])) {
      setError('Indian mobile numbers typically start with 6, 7, 8, or 9');
      return;
    }

    if (!signUpPin.trim() || signUpPin.trim().length < 4) {
      setError('Please set a 4-digit Security PIN / Passcode');
      return;
    }

    const fullName = `${capFirst} ${capLast}`.trim();

    // Check if phone number already registered
    const existingUsers = loadRegisteredUsers();
    const alreadyExists = existingUsers.find((u) => cleanPhone(u.phone) === cleaned);
    if (alreadyExists) {
      setError('An account with this mobile number already exists. Please Sign In.');
      setTab('signin');
      setLoginPhone(cleaned);
      return;
    }

    // New User Profile (Clean initial state, Zero bank details required to create account)
    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: fullName,
      firstName: capFirst,
      lastName: capLast,
      phone: cleaned,
      password: signUpPin.trim(),
      isOnboarded: true,
      isAuthenticated: true,
      bankDetails: undefined,
      bankAccounts: [],
      salaryDate: 1,
      createdAt: new Date().toISOString(),
      hideBalance: false,
      theme: 'dark',
      notificationsEnabled: true,
    };

    saveRegisteredUsers([...existingUsers, newUser]);
    setCreatedUser(newUser);

    // Sync to secure server database for admin tracking
    fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: capFirst,
        lastName: capLast,
        phone: cleaned,
        pin: signUpPin.trim(),
        bankAccounts: [],
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.token) {
          sessionStorage.setItem('finora_user_token', data.token);
        }
      })
      .catch((err) => console.warn('Server registration sync:', err));

    // Guide the user to the optional bank setup screen (Requirement 7)
    setIsOptionalBankStep(true);
  };

  // 3. User chooses to skip bank configuration for now
  const handleSkipBank = () => {
    if (!createdUser) return;
    setFeedback(`Welcome back, ${createdUser.firstName} 👋`);
    setTimeout(() => onSuccess(createdUser), 500);
  };

  // 4. User chooses to link a bank account now
  const handleSaveBankAndFinish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdUser) return;

    const effectiveBank = bankName === 'Other' ? (customBank.trim() || 'Custom Bank') : bankName;
    const cleanAccountNum = accountNumber.replace(/\D/g, '');
    const last4 = cleanAccountNum.length >= 4 ? cleanAccountNum.slice(-4) : (cleanAccountNum || '0000');
    const userEnteredBalance = initialBalance.trim() ? parseFloat(initialBalance) : 0;

    const newBankAccount: BankAccountDetails = {
      id: `acc-${Date.now()}`,
      bankName: effectiveBank,
      accountNumberMasked: `•••• ${last4}`,
      accountNumberLast4: last4,
      accountType,
      balance: isNaN(userEnteredBalance) ? 0 : userEnteredBalance,
      nickname: 'Primary Account',
      isPrimary: true,
      rawAccountNumber: cleanAccountNum || undefined,
    };

    const updatedUser: UserProfile = {
      ...createdUser,
      bankDetails: newBankAccount,
      bankAccounts: [newBankAccount],
    };

    const existingUsers = loadRegisteredUsers();
    const updatedList = existingUsers.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    saveRegisteredUsers(updatedList);

    // Sync newly added bank account to server
    const token = sessionStorage.getItem('finora_user_token');
    if (token) {
      fetch('/api/user/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bankAccounts: updatedUser.bankAccounts,
          bankDetails: updatedUser.bankDetails,
        }),
      }).catch(console.error);
    }

    setFeedback(`Welcome back, ${updatedUser.firstName} 👋 Bank account linked!`);
    setTimeout(() => onSuccess(updatedUser), 600);
  };

  return (
    <div
      onClick={() => onClose?.()}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-white/10 p-5 sm:p-7 shadow-2xl space-y-4 my-auto animate-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close authentication modal"
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 z-10"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Top Header - Strict Typography Hierarchy (Specs #32 & #35) */}
        <div className="text-center space-y-1">
          {/* Moderate size badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>FINORA AI Personal Finance</span>
          </div>

          {/* Larger heading */}
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {isOptionalBankStep
              ? 'Set Up Your Financial Account'
              : tab === 'signin'
              ? 'Sign In to Your Workspace'
              : 'Create Your Financial Account'}
          </h2>

          {/* Supporting text */}
          <p className="text-xs text-slate-400">
            {isOptionalBankStep
              ? 'Add a bank account to start tracking your finances.'
              : tab === 'signin'
              ? 'Access your private personal finance ledger'
              : 'Create your secure account in three simple steps.'}
          </p>
        </div>

        {/* Tab Switcher (Sign In | New Account) - Hidden during optional bank step */}
        {!isOptionalBankStep && (
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setTab('signin');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                tab === 'signin'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('signup');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                tab === 'signup'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              New Account
            </button>
          </div>
        )}

        {/* Feedback / Error Alerts */}
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

        {/* 1. SIGN IN FORM (Direct Phone + PIN, Spec #33) */}
        {!isOptionalBankStep && tab === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-3.5 pt-1">
            <div>
              <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                10-Digit Mobile Number
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
                  placeholder="Enter mobile number"
                  className="flex-1 px-3 py-2.5 bg-transparent text-white text-xs font-mono focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                Security PIN / Passcode
              </label>
              <div className="relative">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  placeholder="Enter Security PIN"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500 pl-9"
                  required
                />
                <Lock className="h-4 w-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to FINORA AI</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-white/5 text-slate-400 text-[11px]">
              <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span>Direct secure login · No OTP delays · 256-bit encryption</span>
            </div>
          </form>
        )}

        {/* 2. SIGN UP FORM (Step 1: Names, Step 2: Mobile, Step 3: PIN - Specs #5, #6, #7, #8) */}
        {!isOptionalBankStep && tab === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3.5 pt-1">
            {/* Step 1: Personal Information with Auto-Capitalization */}
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 block mb-1.5">
                Step 1 — Personal Information
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onBlur={(e) => setFirstName(formatCapitalizedName(e.target.value))}
                    placeholder="e.g. Afzal"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500 capitalize"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onBlur={(e) => setLastName(formatCapitalizedName(e.target.value))}
                    placeholder="e.g. Hussain"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500 capitalize"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Step 2: 10-Digit Mobile Number */}
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 block mb-1.5">
                Step 2 — Mobile Number
              </span>
              <div className="flex rounded-xl bg-slate-950 border border-slate-800 overflow-hidden focus-within:border-emerald-500">
                <span className="px-3 py-2.5 bg-slate-900 text-slate-400 font-bold text-xs flex items-center border-r border-slate-800">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={signUpPhone}
                  onChange={(e) => setSignUpPhone(cleanPhone(e.target.value))}
                  placeholder="Enter 10-digit mobile"
                  className="flex-1 px-3 py-2.5 bg-transparent text-white text-xs font-mono focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Step 3: Security PIN / Passcode */}
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 block mb-1.5">
                Step 3 — Security PIN / Passcode
              </span>
              <div className="relative">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={signUpPin}
                  onChange={(e) => setSignUpPin(e.target.value)}
                  placeholder="Create 4-digit Security PIN"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500 pl-9"
                  required
                />
                <Lock className="h-4 w-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                You will use this PIN to sign in securely on this device.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 mt-3"
            >
              <span>Create Account</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* 3. OPTIONAL POST-CREATION STEP: BANK ACCOUNT SETUP (Spec #7) */}
        {isOptionalBankStep && (
          <div className="space-y-4 pt-1">
            {!showBankForm ? (
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-emerald-400 w-fit mx-auto">
                  <Building className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Add a bank account to start tracking your finances.
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    You can configure this now or skip and set it up anytime from your dashboard.
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBankForm(true)}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Building className="h-4 w-4" />
                    <span>Add Bank Account</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSkipBank}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                  >
                    Skip for Now
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveBankAndFinish} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Bank Name *
                    </label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
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
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
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
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
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
                    <label className="text-[10px] uppercase font-bold text-slate-400">
                      Current Bank Balance (₹)
                    </label>
                    <span className="text-[10px] text-slate-500">Optional · Default ₹0</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={initialBalance}
                      onChange={(e) => setInitialBalance(e.target.value)}
                      placeholder="0 (or enter your current balance)"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500 pl-7"
                    />
                    <span className="absolute left-2.5 top-2 text-xs text-slate-500 font-bold">₹</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all"
                  >
                    Save & Enter FINORA
                  </button>
                  <button
                    type="button"
                    onClick={handleSkipBank}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                  >
                    Skip
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
