import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Bot,
  Brain,
  Receipt,
  Layers,
  CheckCircle2,
  Calendar,
  CreditCard,
  Building,
  TrendingUp,
  PieChart,
  Lock,
  ChevronRight,
  Menu,
  X,
  MessageSquareText,
  SlidersHorizontal,
  FileText,
  Eye,
  Check,
  Zap,
  EyeOff,
  Database,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface LandingPageProps {
  isAuthenticated: boolean;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onOpenDashboard: () => void;
  onNavigateAdmin?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  isAuthenticated,
  onOpenAuth,
  onOpenDashboard,
  onNavigateAdmin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeInteractiveTab, setActiveInteractiveTab] = useState<'coach' | 'natural' | 'cashflow'>('coach');
  const [isScrolled, setIsScrolled] = useState(false);

  // Smooth scroll listener for compact sticky navigation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#07080c] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white antialiased overflow-x-hidden">
      {/* 1. COMPACT STICKY TOP NAVIGATION (Spec #2) */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled
            ? 'h-14 sm:h-16 bg-[#07080c]/95 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/40'
            : 'h-16 sm:h-18 bg-[#07080c]/70 backdrop-blur-md border-b border-white/5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          {/* Brand Logo */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-500 p-0.5 shadow-md shadow-emerald-500/20 flex items-center justify-center group-hover:shadow-emerald-500/40 transition-shadow">
              <div className="h-full w-full bg-[#07080c] rounded-[10px] flex items-center justify-center">
                <span className="font-black text-emerald-400 text-sm">₹</span>
              </div>
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block group-hover:text-emerald-300 transition-colors">
                FINORA AI
              </span>
              <span className="text-[10px] text-slate-400 hidden sm:block font-medium">
                Personal Finance Workspace
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-300">
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-white transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-white transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('why-finora')}
              className="hover:text-white transition-colors"
            >
              Why FINORA AI
            </button>
            <button
              onClick={() => scrollToSection('security')}
              className="hover:text-white transition-colors"
            >
              Security
            </button>
          </nav>

          {/* Prominent Action CTAs (Spec #2: Log In + Get Started) */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={onOpenDashboard}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-95 transition-all duration-200"
              >
                <span>Open FINORA AI</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onOpenAuth('signin')}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:text-white font-bold text-xs transition-colors hover:bg-white/5 active:scale-95"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('signup')}
                  className="group relative px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-200"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </>
            )}
          </div>

          {/* Mobile Navigation Controls */}
          <div className="flex sm:hidden items-center gap-2">
            {!isAuthenticated ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenAuth('signin')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('signup')}
                  className="px-3 py-1.5 rounded-lg text-xs font-black text-slate-950 bg-emerald-400 shadow-sm"
                >
                  Get Started
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenDashboard}
                className="px-3.5 py-1.5 rounded-lg text-xs font-black text-slate-950 bg-emerald-400"
              >
                Dashboard
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-white/5 bg-[#08090f] px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-150 shadow-2xl">
            <div className="flex flex-col space-y-2 text-xs font-semibold text-slate-300">
              <button
                onClick={() => scrollToSection('features')}
                className="text-left py-2 hover:text-white"
              >
                Core Features
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-left py-2 hover:text-white"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('why-finora')}
                className="text-left py-2 hover:text-white"
              >
                Why FINORA AI
              </button>
              <button
                onClick={() => scrollToSection('security')}
                className="text-left py-2 hover:text-white"
              >
                Security & Trust
              </button>
            </div>

            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenDashboard();
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2"
                >
                  <span>Open FINORA AI Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth('signup');
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth('signin');
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs"
                  >
                    Log In with Mobile & PIN
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION (+ SECURITY & TRUST VISUAL STRIP) */}
      <section className="relative pt-10 sm:pt-16 pb-12 sm:pb-20 overflow-hidden">
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 sm:space-y-7">
          {/* Eyebrow Kicker */}
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Intelligent Personal Finance Workspace</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-[1.12]">
            Your Money. Smarter.{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              With AI.
            </span>
          </h1>

          {/* Supporting Text */}
          <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            FINORA AI is an intelligent personal finance workspace that helps you understand your spending, manage your money, track financial activity, and turn your financial data into meaningful insights.
          </p>

          {/* Prominent Hero Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={onOpenDashboard}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-95 hover:scale-[1.02]"
              >
                <span>Open FINORA AI</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onOpenAuth('signup')}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 flex items-center justify-center gap-2 active:scale-95 hover:scale-[1.02]"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('signin')}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 text-slate-200 hover:text-white border border-white/10 font-bold text-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <span>Log In</span>
                </button>
              </>
            )}
          </div>

          {/* SECURITY & TRUST VISUAL STRIP (Prompt Requirement 1) */}
          <div className="pt-4 max-w-3xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md shadow-lg shadow-black/30">
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                  <Lock className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-white block">Data Encryption</span>
                  <span className="text-[10px] text-slate-400">Cryptographically hashed credentials</span>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-center sm:justify-start sm:border-x sm:border-white/5 sm:px-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex-shrink-0">
                  <EyeOff className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-white block">Zero-Tracking Guarantee</span>
                  <span className="text-[10px] text-slate-400">No ad profiling or third-party telemetry</span>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex-shrink-0">
                  <Database className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-white block">Private User Ledger</span>
                  <span className="text-[10px] text-slate-400">Strictly isolated sovereign workspaces</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Workspace Preview */}
          <div className="pt-4 max-w-4xl mx-auto">
            <div className="relative rounded-3xl bg-slate-950/90 border border-white/10 shadow-2xl p-4 sm:p-6 overflow-hidden text-left">
              {/* Preview Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-500/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
                  <span className="text-xs font-mono text-slate-400 pl-2">
                    FINORA AI Workspace · Live Interface
                  </span>
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => setActiveInteractiveTab('coach')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                      activeInteractiveTab === 'coach'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    AI Money Coach
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveInteractiveTab('natural')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                      activeInteractiveTab === 'natural'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Natural Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveInteractiveTab('cashflow')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                      activeInteractiveTab === 'cashflow'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Multi-Account
                  </button>
                </div>
              </div>

              {/* Preview Content */}
              {activeInteractiveTab === 'coach' && (
                <div className="pt-4 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0 text-slate-400 text-xs font-bold">
                      You
                    </div>
                    <div className="p-3 rounded-2xl rounded-tl-sm bg-slate-900 border border-slate-800 text-xs text-slate-200">
                      "Where did I spend the most this month?"
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="p-4 rounded-2xl rounded-tl-sm bg-gradient-to-r from-slate-900 to-slate-900/90 border border-emerald-500/20 text-xs text-slate-200 space-y-2 max-w-xl">
                      <p className="leading-relaxed">
                        Based on your verified ledger, your highest spending was <strong className="text-white">Dining & Food</strong> at <span className="text-emerald-400 font-mono font-bold">₹14,200</span> (28% of total expenses), followed by <strong className="text-white">Housing & Utilities</strong> at <span className="text-emerald-400 font-mono font-bold">₹12,500</span>.
                      </p>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-1 border-t border-white/5">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                        <span>Calculated from your verified transactions · Zero generic guesswork</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeInteractiveTab === 'natural' && (
                <div className="pt-4 space-y-3 animate-in fade-in duration-150">
                  <p className="text-xs text-white font-mono bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    "Spent ₹650 on dinner yesterday."
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">Amount</span>
                      <span className="text-xs font-black text-emerald-400 font-mono">₹650</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">Merchant</span>
                      <span className="text-xs font-bold text-white truncate block">Swiggy / Dining</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">Category</span>
                      <span className="text-xs font-bold text-amber-300 truncate block">Dining & Food</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">Date</span>
                      <span className="text-xs font-bold text-white truncate block">Yesterday (Editable)</span>
                    </div>
                  </div>
                </div>
              )}

              {activeInteractiveTab === 'cashflow' && (
                <div className="pt-4 space-y-3 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-xs font-bold text-white block">HDFC Bank ••••4821</span>
                      <span className="text-sm font-black text-emerald-400 font-mono">₹50,000</span>
                      <span className="text-[10px] text-slate-500 block">Primary Settlement</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-xs font-bold text-white block">SBI ••••1934</span>
                      <span className="text-sm font-black text-emerald-400 font-mono">₹25,000</span>
                      <span className="text-[10px] text-slate-500 block">Savings & Emergency</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-xs font-bold text-white block">Cash In Hand</span>
                      <span className="text-sm font-black text-emerald-400 font-mono">₹3,400</span>
                      <span className="text-[10px] text-slate-500 block">Daily Cash</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE FEATURES (Compact & Impactful Grid) */}
      <section id="features" className="py-14 sm:py-20 border-t border-white/5 bg-[#090b12]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-3xl mx-auto text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Core Capabilities
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Designed for Total Clarity
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Essential financial tools to organize, track, and understand your money.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* AI Money Coach */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5 hover:border-emerald-500/30 transition-all">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit">
                <Bot className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">AI Money Coach</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Ask questions about your finances in plain language. Inquire about category spending, cash flow variances, or upcoming obligations using your authenticated data.
              </p>
            </div>

            {/* Smart Expense Tracking */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5 hover:border-emerald-500/30 transition-all">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 w-fit">
                <CreditCard className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Smart Expense Tracking</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Log expenses with merchant, amount, category, date, and payment account. Expense dates are fully editable so forgotten or past records remain accurate.
              </p>
            </div>

            {/* Intelligent Categorization */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5 hover:border-emerald-500/30 transition-all">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 w-fit">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Intelligent Categorization</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Automated classification across 14 practical categories with manual user adjustments that refine future categorization.
              </p>
            </div>

            {/* Cash Flow Intelligence */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5 hover:border-emerald-500/30 transition-all">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Cash Flow Intelligence</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Deterministic tracking of inflow, outflow, investments, and net balance across All Accounts or individual bank accounts.
              </p>
            </div>

            {/* Recurring Payment Tracking */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5 hover:border-emerald-500/30 transition-all">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 w-fit">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Recurring Payment Tracking</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Track Rent, Electricity, SIPs, Loan EMIs, and Subscriptions. Receive due alerts and identify idle subscriptions effortlessly.
              </p>
            </div>

            {/* Receipt & Bill Intelligence */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5 hover:border-emerald-500/30 transition-all">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 w-fit">
                <Receipt className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Receipt & Bill Intelligence</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Upload receipts and invoices. Strict validation rejects random images and extracts merchant, total, GST, and items for your review.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW FINORA AI WORKS (Simple 3–4 Step Explanation) */}
      <section id="how-it-works" className="py-14 sm:py-20 border-t border-white/5 bg-[#07080c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-3xl mx-auto text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Simple 4-Step Process
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              How FINORA AI Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              From recording your initial transaction to uncovering deep spending clarity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-xs font-mono font-bold text-emerald-400">01</span>
              <h3 className="text-sm font-extrabold text-white">Connect Accounts</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Add your financial accounts (bank, cash, cards) without blocking registration.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-xs font-mono font-bold text-teal-400">02</span>
              <h3 className="text-sm font-extrabold text-white">Track Activity</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Record income, daily expenses, investments, and loans with complete date flexibility.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-xs font-mono font-bold text-cyan-400">03</span>
              <h3 className="text-sm font-extrabold text-white">AI Understands Data</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                FINORA AI categorizes records, detects patterns, and calculates exact cash flow metrics.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-xs font-mono font-bold text-indigo-400">04</span>
              <h3 className="text-sm font-extrabold text-white">Get Real Insights</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Ask questions, examine budget health, and uncover savings opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. WHY FINORA AI (Understanding vs Tracking) */}
      <section id="why-finora" className="py-14 sm:py-20 border-t border-white/5 bg-[#090b12]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Why FINORA AI
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Built Around Understanding, Not Just Tracking
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Tracking alone doesn't change financial habits. FINORA AI connects tracking, organization, analytics, and conversational intelligence into one unified workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h3 className="text-sm font-bold text-white">Conversational Finance</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Ask financial questions in plain words instead of getting lost in complex charts and filters.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h3 className="text-sm font-bold text-white">Context-Aware Insights</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Insights are derived from your authenticated records rather than generic national averages.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h3 className="text-sm font-bold text-white">Deterministic Calculations</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Balances, cash flow, and savings rates are calculated with strict mathematical accuracy.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h3 className="text-sm font-bold text-white">Zero-Data Commitment</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                No fake ₹2,000 numbers or invented scores. If you have no data yet, FINORA AI tells you cleanly.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h3 className="text-sm font-bold text-white">Private Isolated Ledger</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Every user's financial workspace is strictly isolated. Your data is yours alone.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h3 className="text-sm font-bold text-white">Sovereign Data Control</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Export your ledger as CSV or JSON anytime, or reset your records with one click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SECURITY / PRIVACY SECTION */}
      <section id="security" className="py-14 sm:py-20 border-t border-white/5 bg-[#07080c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              <span>Security & Privacy</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Your Financial Data Should Stay Yours.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Verified safeguards to protect your personal financial records.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <Lock className="h-4 w-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white">Direct PIN Login</h3>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Log in securely using your 10-digit mobile number and private 4-digit Security PIN with zero SMS delay.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <ShieldCheck className="h-4 w-4 text-teal-400" />
              <h3 className="text-xs font-bold text-white">Cryptographic Hashes</h3>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                User PINs are never stored in plaintext and are protected using salt and PBKDF2 cryptography.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <Eye className="h-4 w-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white">Masked Account Details</h3>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Bank accounts are safely masked as <span className="font-mono text-emerald-400">••••4821</span>. Full numbers are never shown.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <Layers className="h-4 w-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white">User Data Isolation</h3>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Server-side authorization guarantees that authenticated User A can only access User A's data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FINAL CALL TO ACTION */}
      <section className="py-16 sm:py-24 border-t border-white/5 bg-gradient-to-b from-[#090b12] to-[#07080c] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Start Understanding Your Money
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Bring your financial activity into one intelligent workspace and let FINORA AI help you understand it.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={onOpenDashboard}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-95 hover:scale-[1.02]"
              >
                <span>Open FINORA AI Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onOpenAuth('signup')}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 flex items-center justify-center gap-2 active:scale-95 hover:scale-[1.02]"
                >
                  <span>Get Started with FINORA AI</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('signin')}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <span>Log In</span>
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 8. FOOTER WITH AUTHOR CREDIT (Spec #3 & #19) */}
      <footer className="border-t border-white/5 bg-[#050609] py-10 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-white font-extrabold text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>FINORA AI</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                AI-powered personal finance workspace
              </p>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-slate-300">
              <button
                onClick={() => scrollToSection('features')}
                className="hover:text-emerald-400 transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="hover:text-emerald-400 transition-colors"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('security')}
                className="hover:text-emerald-400 transition-colors"
              >
                Security
              </button>
              {!isAuthenticated && (
                <>
                  <button
                    onClick={() => onOpenAuth('signin')}
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => onOpenAuth('signup')}
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Create Account
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Bottom Copyright & Subtle Author Credit (Spec #3: Created by Shaik Afzal Hussain) */}
          <div className="pt-5 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
            <p>© {new Date().getFullYear()} FINORA AI. All rights reserved.</p>
            <p className="text-slate-400 flex items-center gap-1.5">
              <span>Created by</span>
              <span className="text-slate-200 font-semibold">Shaik Afzal Hussain</span>
              {/* Discrete secret admin trigger for operator (Spec #4: Not an obvious public button) */}
              {onNavigateAdmin && (
                <button
                  type="button"
                  onClick={onNavigateAdmin}
                  className="opacity-30 hover:opacity-100 transition-opacity p-0.5 ml-1 text-slate-500 hover:text-emerald-400 focus:outline-none"
                  title="Operational Portal"
                  aria-label="Operational Portal"
                >
                  <Lock className="h-2.5 w-2.5" />
                </button>
              )}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
