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
} from 'lucide-react';
import { UserProfile, BankAccountDetails } from '../types/finance';
import { formatCurrency } from '../utils/formatters';

interface ProfileViewProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onOpenBankModal: () => void;
  onLogout: () => void;
  onExportCsv: () => void;
  onExportJson: () => void;
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            onClick={onExportCsv}
            className="p-3.5 rounded-2xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800 text-left transition-colors flex items-center justify-between group"
          >
            <div>
              <span className="text-xs font-bold text-slate-200 block group-hover:text-white">
                Export Passbook (CSV)
              </span>
              <span className="text-[10px] text-slate-400">Spreadsheet compatible format</span>
            </div>
            <Download className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </button>

          <button
            onClick={onExportJson}
            className="p-3.5 rounded-2xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800 text-left transition-colors flex items-center justify-between group"
          >
            <div>
              <span className="text-xs font-bold text-slate-200 block group-hover:text-white">
                Export Full Backup (JSON)
              </span>
              <span className="text-[10px] text-slate-400">Complete encrypted profile archive</span>
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
