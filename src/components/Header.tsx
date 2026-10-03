import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Camera,
  MessageSquareText,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Download,
  RotateCcw,
  SlidersHorizontal,
  Upload,
  Bot,
  FileSpreadsheet,
  User,
  Building,
  LogOut,
  Compass,
  ShieldCheck,
} from 'lucide-react';
import { UserProfile } from '../types/finance';

interface HeaderProps {
  currentMonthKey: string; // YYYY-MM
  userProfile?: UserProfile;
  onMonthChange: (monthKey: string) => void;
  onOpenAddModal: () => void;
  onOpenNaturalLanguageModal: () => void;
  onOpenReceiptModal: () => void;
  onOpenImportCsvModal: () => void;
  onOpenAiAudit: () => void;
  onOpenProfileModal: () => void;
  onOpenBankModal: () => void;
  onReopenOnboarding: () => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  onResetData: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMonthKey,
  userProfile,
  onMonthChange,
  onOpenAddModal,
  onOpenNaturalLanguageModal,
  onOpenReceiptModal,
  onOpenImportCsvModal,
  onOpenAiAudit,
  onOpenProfileModal,
  onOpenBankModal,
  onReopenOnboarding,
  onExportCsv,
  onExportJson,
  onResetData,
  activeTab,
  setActiveTab,
  onOpenAdmin,
}) => {
  const [yearStr, monthStr] = currentMonthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const monthDate = new Date(year, month - 1, 1);
  const formattedMonth = new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric',
  }).format(monthDate);

  const handlePrevMonth = () => {
    const prev = new Date(year, month - 2, 1);
    const pYear = prev.getFullYear();
    const pMonth = (prev.getMonth() + 1).toString().padStart(2, '0');
    onMonthChange(`${pYear}-${pMonth}`);
  };

  const handleNextMonth = () => {
    const next = new Date(year, month, 1);
    const nYear = next.getFullYear();
    const nMonth = (next.getMonth() + 1).toString().padStart(2, '0');
    onMonthChange(`${nYear}-${nMonth}`);
  };

  const handleJumpToCurrent = () => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    onMonthChange(`${curYear}-${curMonth}`);
  };

  const NAV_TABS = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'income', label: 'Income' },
    { id: 'transactions', label: 'Passbook & Ledger' },
    { id: 'budgets', label: 'Budgets' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'coach', label: 'AI Money Coach', badge: 'Active' },
    { id: 'ai-optimizer', label: 'AI Health Audit', badge: 'Smart' },
    { id: 'subscriptions', label: 'Subscriptions' },
    { id: 'goals', label: 'Savings Goals' },
    { id: 'calendar', label: 'Financial Calendar' },
    { id: 'reports', label: 'Reports' },
    { id: 'profile', label: 'Profile' },
  ];

  const displayName = userProfile?.name?.split(' ')[0] || 'Afzal';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & App Brand (FINORA AI - Navigates to Home/Dashboard) */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left group focus:outline-none transition-transform active:scale-95"
              title="Go to Dashboard / Home"
            >
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-500 p-0.5 shadow-md shadow-emerald-500/20 flex items-center justify-center group-hover:shadow-emerald-500/40 transition-shadow">
                <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <span className="font-black text-emerald-400 text-sm">₹</span>
                </div>
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white block group-hover:text-emerald-300 transition-colors">
                  FINORA AI
                </span>
                <p className="text-[10px] text-slate-400 hidden sm:block">
                  Your intelligent personal money companion.
                </p>
              </div>
            </button>

            {/* Mobile Controls: Month Navigator & Profile Icon */}
            <div className="flex items-center gap-2 md:hidden">
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
                <button
                  onClick={handlePrevMonth}
                  aria-label="Previous Month"
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-semibold text-slate-200 px-1">
                  {formattedMonth}
                </span>
                <button
                  onClick={handleNextMonth}
                  aria-label="Next Month"
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* User Avatar Button (Mobile) - Opens authenticated profile directly */}
              <button
                onClick={() => setActiveTab('profile')}
                className="h-8 w-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-500 p-0.5 flex items-center justify-center shadow-sm"
                title="Account Settings"
              >
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-xs font-black text-emerald-400">
                  {displayName.charAt(0)}
                </div>
              </button>
            </div>
          </div>

          {/* Desktop Month Selector */}
          <div className="hidden md:flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-2xl px-2 py-1 shadow-inner">
            <button
              onClick={handlePrevMonth}
              aria-label="Previous Month"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1">
              <Calendar className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-bold text-white tracking-wide">
                {formattedMonth}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              aria-label="Next Month"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={handleJumpToCurrent}
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-emerald-400 hover:bg-slate-800/80 rounded-lg transition-colors"
            >
              Today
            </button>
          </div>

          {/* Action Triggers & User Profile Dropdown */}
          <div className="hidden md:flex items-center gap-2">
            {/* AI Fast Add (NL) */}
            <button
              onClick={onOpenNaturalLanguageModal}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-purple-200 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/50 rounded-xl transition-all shadow-sm group"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-400 group-hover:rotate-12 transition-transform" />
              <span>AI Fast Add</span>
            </button>

            {/* Receipt Scan */}
            <button
              onClick={onOpenReceiptModal}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-200 bg-blue-950/40 hover:bg-blue-900/50 border border-blue-800/50 rounded-xl transition-all shadow-sm"
            >
              <Camera className="h-3.5 w-3.5 text-blue-400" />
              <span>Scan Bill</span>
            </button>

            {/* Add Transaction */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Add</span>
            </button>

            {/* User Profile & Options Menu */}
            <div className="relative group">
              <button
                className="flex items-center gap-2 p-1.5 pl-2.5 text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl transition-colors"
                title="Account & Data"
              >
                <span className="text-xs font-bold">{displayName}</span>
                <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-500 p-0.5 flex items-center justify-center">
                  <div className="h-full w-full bg-slate-950 rounded-[9px] flex items-center justify-center font-black text-emerald-400 text-xs">
                    {displayName.charAt(0)}
                  </div>
                </div>
              </button>

              <div className="absolute right-0 mt-2 w-60 py-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                <div className="px-4 py-2 border-b border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Signed in as
                  </span>
                  <span className="text-xs font-extrabold text-white truncate block">
                    {userProfile?.name || 'Afzal Hussain'}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate block">
                    {userProfile?.email || 'safzalhussain3@gmail.com'}
                  </span>
                </div>

                <button
                  onClick={() => setActiveTab('profile')}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <User className="h-3.5 w-3.5 text-emerald-400" />
                  <span>My Profile & Settings</span>
                </button>

                <button
                  onClick={onOpenBankModal}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Building className="h-3.5 w-3.5 text-teal-400" />
                  <span>Bank Account Details</span>
                </button>

                <button
                  onClick={onReopenOnboarding}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Compass className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Replay Onboarding Tour</span>
                </button>

                <button
                  onClick={() => setActiveTab('landing')}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Product Overview & Features</span>
                </button>

                {(userProfile?.role === 'admin' || Boolean(sessionStorage.getItem('finora_admin_token'))) && onOpenAdmin && (
                  <button
                    onClick={onOpenAdmin}
                    className="w-full text-left px-3.5 py-2 text-xs text-emerald-400 hover:bg-emerald-950/40 flex items-center gap-2 font-bold"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Admin Operations Console</span>
                  </button>
                )}

                <div className="border-t border-slate-800 my-1"></div>

                <button
                  onClick={onOpenImportCsvModal}
                  className="w-full text-left px-3.5 py-2 text-xs text-indigo-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Import Bank Statement CSV</span>
                </button>

                <button
                  onClick={onExportCsv}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Download className="h-3.5 w-3.5 text-slate-400" />
                  <span>Export Transactions CSV</span>
                </button>

                <button
                  onClick={onExportJson}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Download className="h-3.5 w-3.5 text-slate-400" />
                  <span>Export JSON Backup</span>
                </button>

                <div className="border-t border-slate-800 my-1"></div>

                <button
                  onClick={onResetData}
                  className="w-full text-left px-3.5 py-2 text-xs text-rose-400 hover:bg-rose-950/30 flex items-center gap-2"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-rose-400" />
                  <span>Reset Demo Data (INR)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 sm:gap-2 mt-3 pt-2.5 border-t border-slate-800/80 overflow-x-auto scrollbar-none">
          {NAV_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.2 text-[9px] font-extrabold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
