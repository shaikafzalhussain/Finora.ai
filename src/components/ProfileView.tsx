import React, { useState } from 'react';
import {
  User,
  Phone,
  ShieldCheck,
  Building,
  CreditCard,
  Bell,
  Moon,
  Bot,
  Lock,
  LogOut,
  Download,
  RotateCcw,
  Trash2,
  Check,
  Edit2,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  ChevronRight,
  AlertTriangle,
  Calendar,
  Filter,
  FileText,
} from 'lucide-react';
import { UserProfile, BankAccountDetails, Transaction } from '../types/finance';
import { formatCurrency } from '../utils/formatters';
import { DateFilterRange } from '../utils/pdfExport';

interface ProfileViewProps {
  user: UserProfile;
  transactions?: Transaction[];
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onOpenBankModal: () => void;
  onLogout: () => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  onExportPdf: (dateRange?: DateFilterRange) => void;
  onResetData: () => void;
  onDeleteAccount: () => void;
  onOpenAdmin?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onUpdateUser,
  onOpenBankModal,
  onLogout,
  onExportCsv,
  onExportJson,
  onExportPdf,
  onResetData,
  onDeleteAccount,
  onOpenAdmin,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user.name);
  const [showMaskedPhone, setShowMaskedPhone] = useState(true);
  const [notifications, setNotifications] = useState(user.notificationsEnabled ?? true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isConfirmDelete, setIsConfirmDelete] = useState(false);
  const [isChangingPasscode, setIsChangingPasscode] = useState(false);
  const [newPasscode, setNewPasscode] = useState('');

  // Timeframe states for PDF Report Generation
  const now = new Date();
  const defaultMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  const defaultYearStr = now.getFullYear().toString();
  const defaultDateStr = now.toISOString().split('T')[0];
  const firstDayOfMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`;

  const [pdfTimeframeMode, setPdfTimeframeMode] = useState<'month' | 'year' | 'custom' | 'all'>('month');
  const [pdfSelectedMonth, setPdfSelectedMonth] = useState<string>(defaultMonthStr);
  const [pdfSelectedYear, setPdfSelectedYear] = useState<string>(defaultYearStr);
  const [pdfCustomStart, setPdfCustomStart] = useState<string>(firstDayOfMonthStr);
  const [pdfCustomEnd, setPdfCustomEnd] = useState<string>(defaultDateStr);

  const availableYears = [
    now.getFullYear(),
    now.getFullYear() - 1,
    now.getFullYear() - 2,
  ];

  const handleDownloadPdfReport = () => {
    let dateRange: DateFilterRange | undefined;

    if (pdfTimeframeMode === 'month') {
      const [y, m] = pdfSelectedMonth.split('-');
      const year = parseInt(y, 10);
      const month = parseInt(m, 10);
      const lastDay = new Date(year, month, 0).getDate();
      const monthDate = new Date(year, month - 1, 1);
      const monthName = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(monthDate);

      dateRange = {
        startDate: `${pdfSelectedMonth}-01`,
        endDate: `${pdfSelectedMonth}-${lastDay.toString().padStart(2, '0')}`,
        label: `Month of ${monthName}`,
      };
    } else if (pdfTimeframeMode === 'year') {
      dateRange = {
        startDate: `${pdfSelectedYear}-01-01`,
        endDate: `${pdfSelectedYear}-12-31`,
        label: `Calendar Year ${pdfSelectedYear}`,
      };
    } else if (pdfTimeframeMode === 'custom') {
      dateRange = {
        startDate: pdfCustomStart || '2020-01-01',
        endDate: pdfCustomEnd || '2099-12-31',
        label: `Custom Range (${pdfCustomStart} to ${pdfCustomEnd})`,
      };
    } else {
      dateRange = {
        label: 'Entire Recorded Ledger History',
      };
    }

    onExportPdf(dateRange);
  };

  // Format phone number
  const rawPhone = user.phone || '9876504821';
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const last4 = cleanPhone.slice(-4) || '4821';
  const maskedPhone = `+91 ••••••${last4}`;
  const fullPhone = `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    onUpdateUser({ name: nameInput.trim() });
    setIsEditingName(false);
    setFeedback('Profile name updated!');
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleSavePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasscode.length < 4) {
      alert('Passcode must be at least 4 digits');
      return;
    }
    onUpdateUser({ password: newPasscode });
    setIsChangingPasscode(false);
    setNewPasscode('');
    setFeedback('Security passcode updated!');
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleToggleNotifications = () => {
    const newVal = !notifications;
    setNotifications(newVal);
    onUpdateUser({ notificationsEnabled: newVal });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/70 border border-white/10 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
              <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-2xl text-emerald-400">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>

            <div>
              {isEditingName ? (
                <form onSubmit={handleSaveName} className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 border border-emerald-500 text-white font-bold text-base outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="p-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {user.name}
                  </h2>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 text-slate-400 hover:text-white transition-colors"
                    title="Edit Name"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Phone display */}
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xs text-slate-300 font-semibold">
                  {showMaskedPhone ? maskedPhone : fullPhone}
                </span>
                <button
                  onClick={() => setShowMaskedPhone(!showMaskedPhone)}
                  className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                  title={showMaskedPhone ? 'Show full phone' : 'Mask phone'}
                >
                  {showMaskedPhone ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </button>
                <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Verified
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={onLogout}
              className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {feedback && (
          <div className="mt-4 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>{feedback}</span>
          </div>
        )}
      </div>

      {/* SECTION 1: PERSONAL INFORMATION */}
      <div className="rounded-[28px] bg-slate-900/90 border border-slate-800 p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-800 text-emerald-400">
            <User className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">Personal Information</h3>
            <p className="text-xs text-slate-400">Your FINORA AI identity credentials</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Full Legal Name
            </span>
            <span className="text-sm font-extrabold text-white">{user.name}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Registered Mobile Number
            </span>
            <span className="text-sm font-extrabold text-white font-mono">{maskedPhone}</span>
          </div>
        </div>

        {/* Administrator Access Card (when user is admin) */}
        {(user.role === 'admin' || Boolean(sessionStorage.getItem('finora_admin_token'))) && onOpenAdmin && (
          <div className="mt-3 p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-black text-white block">Operator Privileges Active</span>
                <span className="text-[10px] text-emerald-400">Authenticated administrator access</span>
              </div>
            </div>
            <button
              onClick={onOpenAdmin}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
            >
              <span>Open Admin Console</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

        {/* SECTION 2: FINANCIAL ACCOUNTS */}
      <div className="rounded-[28px] bg-slate-900/90 border border-slate-800 p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800 text-teal-400">
              <Building className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Financial Accounts</h3>
              <p className="text-xs text-slate-400">Linked settlement banking accounts</p>
            </div>
          </div>

          <button
            onClick={onOpenBankModal}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
          >
            <span>+ Add Bank Account</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {(() => {
          const accounts = user.bankAccounts && user.bankAccounts.length > 0
            ? user.bankAccounts
            : user.bankDetails
            ? [user.bankDetails]
            : [];

          if (accounts.length === 0) {
            return (
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
                <p className="text-xs text-slate-400">No bank account currently linked.</p>
                <button
                  onClick={onOpenBankModal}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                >
                  Link Bank Account
                </button>
              </div>
            );
          }

          return (
            <div className="space-y-2.5">
              {accounts.map((acc) => (
                <div
                  key={acc.id || acc.accountNumberLast4}
                  className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 hover:border-emerald-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-white">{acc.bankName}</span>
                      {acc.isPrimary && (
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Primary
                        </span>
                      )}
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-slate-800 text-slate-300">
                        {acc.accountType || 'Savings'}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-slate-400">
                      ••••{acc.accountNumberLast4}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Available Balance
                    </span>
                    <span className="text-base font-black text-emerald-400 font-mono">
                      {formatCurrency(acc.balance ?? 0)}
                    </span>
                  </div>
                </div>
              ))}

              <button
                onClick={onOpenBankModal}
                className="w-full py-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-950 border border-dashed border-slate-700 hover:border-emerald-500 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 mt-1"
              >
                <span>+ Add Bank Account</span>
              </button>
            </div>
          );
        })()}
      </div>

      {/* SECTION 3: PREFERENCES */}
      <div className="rounded-[28px] bg-slate-900/90 border border-slate-800 p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-800 text-indigo-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">Preferences</h3>
            <p className="text-xs text-slate-400">App behavior and notifications</p>
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          {/* Currency */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Default Currency</span>
              <span className="text-[11px] text-slate-400">Indian Rupee (₹ - INR)</span>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
              ₹ INR
            </span>
          </div>

          {/* Notifications */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Budget Overspending Alerts</span>
              <span className="text-[11px] text-slate-400">Notify when categories exceed 80% cap</span>
            </div>
            <button
              onClick={handleToggleNotifications}
              className={`w-11 h-6 rounded-full transition-colors relative ${notifications ? 'bg-emerald-500' : 'bg-slate-800'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${notifications ? 'right-1' : 'left-1'}`} />
            </button>
          </div>

          {/* Theme */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Visual Theme</span>
              <span className="text-[11px] text-slate-400">Obsidian Dark (AMOLED Optimized)</span>
            </div>
            <span className="text-xs font-semibold text-slate-300">Dark Mode</span>
          </div>
        </div>
      </div>

      {/* SECTION 4: SECURITY & PASSCODE */}
      <div className="rounded-[28px] bg-slate-900/90 border border-slate-800 p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-800 text-purple-400">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">Security & Login</h3>
            <p className="text-xs text-slate-400">Authentication and session controls</p>
          </div>
        </div>

        {isChangingPasscode ? (
          <form onSubmit={handleSavePasscode} className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3">
            <label className="block text-xs font-bold text-slate-200">
              Enter New 4-6 Digit Security Passcode
            </label>
            <input
              type="password"
              value={newPasscode}
              onChange={(e) => setNewPasscode(e.target.value)}
              placeholder="••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-center tracking-widest outline-none focus:border-emerald-500"
              maxLength={6}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs"
              >
                Update Passcode
              </button>
              <button
                type="button"
                onClick={() => setIsChangingPasscode(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div>
              <span className="text-xs font-bold text-white block">Security Passcode</span>
              <span className="text-[11px] text-slate-400">256-bit client encrypted session</span>
            </div>
            <button
              onClick={() => setIsChangingPasscode(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors self-start sm:self-auto"
            >
              Change Passcode
            </button>
          </div>
        )}
      </div>

      {/* SECTION 5: DATA MANAGEMENT & BACKUP */}
      <div className="rounded-[28px] bg-slate-900/90 border border-slate-800 p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-800 text-rose-400">
            <Download className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">Data Management</h3>
            <p className="text-xs text-slate-400">Export records or reset test data</p>
          </div>
        </div>

        {/* Timeframe Filter Controls for PDF Report */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-emerald-400" />
              <span>Select Report Timeframe (Month, Date, Year)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {pdfTimeframeMode === 'all'
                ? 'All Ledger Records'
                : pdfTimeframeMode === 'month'
                ? `Month: ${pdfSelectedMonth}`
                : pdfTimeframeMode === 'year'
                ? `Year: ${pdfSelectedYear}`
                : `${pdfCustomStart} to ${pdfCustomEnd}`}
            </span>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'month', label: 'By Month' },
              { id: 'year', label: 'By Year' },
              { id: 'custom', label: 'Custom Date Range' },
              { id: 'all', label: 'Entire History' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPdfTimeframeMode(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  pdfTimeframeMode === tab.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filter Inputs according to selected mode */}
          <div className="pt-1">
            {pdfTimeframeMode === 'month' && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-xs text-slate-400 sm:w-28 flex-shrink-0">Select Month:</label>
                <input
                  type="month"
                  value={pdfSelectedMonth}
                  onChange={(e) => setPdfSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>
            )}

            {pdfTimeframeMode === 'year' && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-xs text-slate-400 sm:w-28 flex-shrink-0">Select Year:</label>
                <select
                  value={pdfSelectedYear}
                  onChange={(e) => setPdfSelectedYear(e.target.value)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl text-xs text-white focus:outline-none"
                >
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr} Financial Year
                    </option>
                  ))}
                </select>
              </div>
            )}

            {pdfTimeframeMode === 'custom' && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">From:</span>
                  <input
                    type="date"
                    value={pdfCustomStart}
                    onChange={(e) => setPdfCustomStart(e.target.value)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">To:</span>
                  <input
                    type="date"
                    value={pdfCustomEnd}
                    onChange={(e) => setPdfCustomEnd(e.target.value)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {pdfTimeframeMode === 'all' && (
              <p className="text-[11px] text-slate-400">
                All ledger records from your earliest recorded transaction to present day will be compiled into the report.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            onClick={handleDownloadPdfReport}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-emerald-950/60 to-slate-900 hover:from-emerald-950/60 hover:to-slate-800 border border-emerald-500/40 text-left transition-all flex items-center justify-between group sm:col-span-3 shadow-lg active:scale-[0.99]"
          >
            <div className="space-y-0.5">
              <span className="text-xs sm:text-sm font-extrabold text-emerald-300 block group-hover:text-emerald-200 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-emerald-400" />
                <span>Download Financial Health Report (PDF)</span>
              </span>
              <span className="text-[11px] text-slate-300 block">
                Includes category expense breakdown from Passbook & Ledger, actual spent amounts, bank balances, and full transaction history.
              </span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors flex-shrink-0 ml-2">
              <Download className="h-5 w-5" />
            </div>
          </button>

          <button
            onClick={onExportCsv}
            className="p-3.5 rounded-2xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800 text-left transition-colors flex items-center justify-between group"
          >
            <div>
              <span className="text-xs font-bold text-slate-200 block group-hover:text-white">
                Export Passbook (CSV)
              </span>
              <span className="text-[10px] text-slate-400">Spreadsheet format</span>
            </div>
            <Download className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </button>

          <button
            onClick={onExportJson}
            className="p-3.5 rounded-2xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800 text-left transition-colors flex items-center justify-between group"
          >
            <div>
              <span className="text-xs font-bold text-slate-200 block group-hover:text-white">
                Export Backup (JSON)
              </span>
              <span className="text-[10px] text-slate-400">Full encrypted archive</span>
            </div>
            <Download className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </button>
        </div>

        <div className="border-t border-white/5 pt-3 flex flex-wrap gap-2.5 justify-between">
          <button
            onClick={onResetData}
            className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Demo Data</span>
          </button>

          <button
            onClick={() => setIsConfirmDelete(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Account</span>
          </button>
        </div>

        {isConfirmDelete && (
          <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 space-y-2 mt-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
              <AlertTriangle className="h-4 w-4" />
              <span>Are you sure you want to delete your account?</span>
            </div>
            <p className="text-[11px] text-slate-300">
              All transactions, categories, budgets, and bank links will be permanently erased.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={onDeleteAccount}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Yes, Delete My Account
              </button>
              <button
                onClick={() => setIsConfirmDelete(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
