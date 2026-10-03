import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Building,
  CreditCard,
  Lock,
  Wallet,
  Zap,
  TrendingUp,
  Brain,
  Eye,
  ChevronLeft,
} from 'lucide-react';
import { UserProfile, BankAccountDetails } from '../types/finance';
import { formatCurrency } from '../utils/formatters';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (profile: Partial<UserProfile>) => void;
  initialName?: string;
}

const POPULAR_INDIAN_BANKS = [
  'HDFC Bank',
  'ICICI Bank',
  'State Bank of India',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Punjab National Bank',
  'Bank of Baroda',
  'IndusInd Bank',
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
  initialName = '',
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState(initialName || '');
  
  // Bank details state
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [customBank, setCustomBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState<'Savings' | 'Salary' | 'Current'>('Savings');
  const [initialBalance, setInitialBalance] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Derive final display values
  const effectiveBankName = selectedBank === 'Other' ? (customBank.trim() || 'Custom Bank') : selectedBank;
  const cleanAccountNum = accountNumber.replace(/\D/g, '');
  const last4 = cleanAccountNum.length >= 4 ? cleanAccountNum.slice(-4) : (cleanAccountNum || '0000');
  const maskedDisplay = `•••• ${last4}`;

  // Get user's first name for greeting
  const firstName = name.trim().split(' ')[0] || 'Friend';

  const handleNextFromScreen1 = () => {
    setStep(2);
  };

  const handleNextFromScreen2 = () => {
    if (!name.trim()) {
      setError('Please tell us your name to personalize your experience.');
      return;
    }
    setError(null);
    setStep(3);
  };

  const handleFinish = () => {
    if (!effectiveBankName) {
      setError('Please select or specify your bank name.');
      return;
    }
    if (cleanAccountNum.length < 4) {
      setError('Please enter at least the last 4 digits of your account number.');
      return;
    }

    const numBalance = initialBalance.trim() ? parseFloat(initialBalance) : 0;

    const bankDetails: BankAccountDetails = {
      bankName: effectiveBankName,
      accountNumberMasked: maskedDisplay,
      accountNumberLast4: last4,
      accountType: accountType,
      balance: isNaN(numBalance) ? 0 : numBalance,
      rawAccountNumber: cleanAccountNum,
    };

    onComplete({
      name: name.trim(),
      isOnboarded: true,
      bankDetails,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 overflow-y-auto animate-in fade-in duration-300">
      {/* Background ambient lighting effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-lg rounded-[36px] bg-slate-900/95 border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden p-6 sm:p-8">
        
        {/* Step Indicator Progress Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
              FINORA AI
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-medium">
              Step {step} of 3
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-7 bg-emerald-400'
                    : s < step
                    ? 'w-3 bg-emerald-500/50'
                    : 'w-3 bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SCREEN 1: LARGE CENTERED BRANDING & WELCOME */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="text-center space-y-6 py-4 animate-in fade-in zoom-in-95 duration-400">
            {/* Logo Emblem */}
            <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 p-0.5 shadow-2xl shadow-emerald-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-emerald-400 via-teal-300 to-indigo-300">
                  ₹
                </span>
              </div>
            </div>

            {/* Brand Title & Subtitle */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                FINORA AI
              </h1>
              <p className="text-sm sm:text-base text-slate-300 font-medium">
                "Your intelligent personal money companion."
              </p>
            </div>

            {/* Premium Feature Highlights */}
            <div className="grid grid-cols-2 gap-3 text-left pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <Brain className="h-4 w-4" />
                  <span>AI Financial Coach</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Numbers-grounded advice powered by Gemini 3.8 Flash
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-teal-400 text-xs font-bold">
                  <TrendingUp className="h-4 w-4" />
                  <span>Pacing & Velocity</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Predictive run-rate forecasting and burn rate radar
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
                  <Zap className="h-4 w-4" />
                  <span>Zombie Radar</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Detect idle subscriptions & leakage in Indian Rupees
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-purple-400 text-xs font-bold">
                  <Lock className="h-4 w-4" />
                  <span>Bank-Grade Privacy</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Client-side encrypted with masked account numbers
                </p>
              </div>
            </div>

            <button
              onClick={handleNextFromScreen1}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 2: PERSONAL DETAILS */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="space-y-6 py-2 animate-in fade-in slide-in-from-right-4 duration-300">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Personalize Your Companion
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                What should we call you?
              </h2>
              <p className="text-xs text-slate-400">
                We'll use this to greet you and tailor your monthly financial audits.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-300">
                Your Full Name <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="Enter your name (e.g. Afzal Hussain)"
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white font-semibold text-base placeholder:text-slate-600 outline-none transition-colors"
                autoFocus
              />

              {/* Dynamic personalized greeting upon input */}
              {name.trim().length > 0 && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="h-7 w-7 rounded-xl bg-emerald-500/20 flex items-center justify-center font-bold text-sm">
                    👋
                  </div>
                  <div className="text-xs">
                    <span className="font-extrabold text-sm block text-emerald-300">
                      Nice to meet you, {firstName} 👋
                    </span>
                    <span className="text-[11px] text-emerald-400/80">
                      Let's set up your primary account to track your cashflow.
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-xs text-rose-400 font-medium">
                  {error}
                </p>
              )}
            </div>

            <button
              onClick={handleNextFromScreen2}
              disabled={!name.trim()}
              className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <span>Continue</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 3: BANK DETAILS ONBOARDING */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div className="space-y-5 py-1 animate-in fade-in slide-in-from-right-4 duration-300">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Account Setup
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                  Protected
                </span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Link Your Primary Bank
              </h2>
              <p className="text-xs text-slate-300 flex items-center gap-1.5 pt-0.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                <span>"Your bank details are securely stored and protected."</span>
              </p>
            </div>

            {/* Masked Preview Card (CRED-style) */}
            <div className="rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-emerald-500/30 p-4 shadow-inner space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">{effectiveBankName}</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  {accountType}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-sm tracking-wider font-extrabold text-white">
                  Account {maskedDisplay}
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  {formatCurrency(parseFloat(initialBalance) || 0)}
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                🔒 Only the final four digits are displayed for maximum privacy.
              </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-3.5">
              {/* Bank Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Bank Name <span className="text-emerald-400">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {POPULAR_INDIAN_BANKS.slice(0, 4).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => {
                        setSelectedBank(b);
                        setError(null);
                      }}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors ${
                        selectedBank === b
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSelectedBank('Other')}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors ${
                      selectedBank === 'Other'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    Other...
                  </button>
                </div>

                {selectedBank === 'Other' && (
                  <input
                    type="text"
                    value={customBank}
                    onChange={(e) => setCustomBank(e.target.value)}
                    placeholder="Enter your Bank Name"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500"
                  />
                )}
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Account Number <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g. 501004821892"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs outline-none focus:border-emerald-500"
                />
              </div>

              {/* Starting Balance & Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Current Balance (₹) <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Account Type
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500"
                  >
                    <option value="Savings">Savings Account</option>
                    <option value="Salary">Salary Account</option>
                    <option value="Current">Current Account</option>
                  </select>
                </div>
              </div>

              {error && (
                <p className="text-xs text-rose-400 font-medium">
                  {error}
                </p>
              )}
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <span>Finish Setup & Enter FINORA AI</span>
              <CheckCircle2 className="h-4 w-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
