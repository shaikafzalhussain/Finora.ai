import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Building,
  TrendingUp,
  Lock,
  Search,
  ArrowRight,
  RefreshCw,
  LogOut,
  Eye,
  X,
  CheckCircle2,
  AlertTriangle,
  History,
  KeyRound,
  ChevronRight,
  Filter,
  DollarSign,
  Activity,
  Layers,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface AdminConsoleProps {
  onReturnToApp: () => void;
}

interface AdminUserRow {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  maskedPhone: string;
  createdAt: string;
  lastLogin: string;
  status: 'Active' | 'Disabled';
  role: string;
  accountCount: number;
  totalReportedBalance: number;
  transactionCount: number;
  authStatus: string;
}

interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersMonth: number;
  totalLinkedAccounts: number;
  totalReportedBalance: number;
  accountsByInstitution: Record<string, number>;
  totalAuditLogs: number;
}

interface AuditLog {
  id: string;
  adminUserId: string;
  adminPhone: string;
  action: string;
  targetUserId?: string;
  targetUserName?: string;
  details?: string;
  timestamp: string;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({ onReturnToApp }) => {
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return sessionStorage.getItem('finora_admin_token') || null;
  });

  // Admin Login States
  const [loginPhone, setLoginPhone] = useState('7702994407');
  const [loginPin, setLoginPin] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active Admin View
  const [adminTab, setAdminTab] = useState<'overview' | 'users' | 'audit' | 'settings'>('overview');

  // Admin Data
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Disabled'>('All');

  // Selected User Detail Modal
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState<any | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Change PIN State
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState<string | null>(null);
  const [pinChangeErr, setPinChangeErr] = useState<string | null>(null);
  const [isChangingPin, setIsChangingPin] = useState(false);

  // Handle Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginPhone, pin: loginPin }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Admin verification failed');
      }

      sessionStorage.setItem('finora_admin_token', data.token);
      setAdminToken(data.token);
      setLoginPin('');
    } catch (err: any) {
      setLoginError(err.message || 'Invalid administrator credentials');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = async () => {
    if (adminToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
        });
      } catch (e) {
        // silent
      }
    }
    sessionStorage.removeItem('finora_admin_token');
    setAdminToken(null);
  };

  // Fetch Admin Data
  const fetchDashboardData = async () => {
    if (!adminToken) return;
    setIsLoadingData(true);
    setApiError(null);

    try {
      const headers = { Authorization: `Bearer ${adminToken}` };

      const [metricsRes, usersRes, auditRes] = await Promise.all([
        fetch('/api/admin/metrics', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/audit-logs', { headers }),
      ]);

      if (metricsRes.status === 403 || usersRes.status === 403) {
        handleAdminLogout();
        throw new Error('Administrative session expired or unauthorized');
      }

      if (metricsRes.ok) {
        const m = await metricsRes.json();
        setMetrics(m);
      }
      if (usersRes.ok) {
        const u = await usersRes.json();
        setUsers(u);
      }
      if (auditRes.ok) {
        const a = await auditRes.json();
        setAuditLogs(a);
      }
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || 'Failed to load administrator data');
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchDashboardData();
    }
  }, [adminToken]);

  // Load User Details
  const handleOpenUserDetail = async (userId: string) => {
    if (!adminToken) return;
    setSelectedUserId(userId);
    setSelectedUserDetails(null);
    setIsLoadingDetail(true);

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error('Failed to retrieve user records');
      const data = await res.json();
      setSelectedUserDetails(data);
    } catch (err: any) {
      alert(err.message || 'Error loading user');
      setSelectedUserId(null);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Toggle User Status (Active / Disabled)
  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    if (!adminToken) return;
    const newStatus = currentStatus === 'Active' ? 'Disabled' : 'Active';

    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Status update rejected by server');

      // Update in state
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus as any } : u))
      );
      if (selectedUserDetails && selectedUserDetails.id === userId) {
        setSelectedUserDetails({ ...selectedUserDetails, status: newStatus });
      }
      // Refresh audit logs
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  // Change Admin PIN
  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeErr(null);
    setPinChangeMsg(null);

    if (newPin !== confirmPin) {
      setPinChangeErr('New PIN and confirmation do not match');
      return;
    }
    if (newPin.length < 4) {
      setPinChangeErr('New PIN must have at least 4 characters');
      return;
    }

    setIsChangingPin(true);
    try {
      const res = await fetch('/api/admin/change-pin', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ oldPin, newPin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update PIN');

      setPinChangeMsg('Admin Security PIN has been securely rotated.');
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (err: any) {
      setPinChangeErr(err.message || 'Failed to change admin PIN');
    } finally {
      setIsChangingPin(false);
    }
  };

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    if (statusFilter !== 'All' && u.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.name.toLowerCase().includes(q);
      const matchPhone = u.maskedPhone.includes(q);
      return matchName || matchPhone;
    }
    return true;
  });

  // --- 1. ADMIN LOGIN VIEW (If unauthenticated) ---
  if (!adminToken) {
    return (
      <div className="min-h-screen bg-[#06070a] text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-emerald-500 selection:text-white">
        <div className="w-full max-w-md rounded-3xl bg-slate-900/90 border border-emerald-500/20 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 p-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <ShieldAlert className="h-4 w-4" />
              <span>FINORA AI Operations Console</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Administrative Sign In
            </h1>
            <p className="text-xs text-slate-400">
              Server-enforced cryptographic authorization required.
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 text-rose-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Authorized Mobile Number
              </label>
              <div className="flex rounded-xl bg-slate-950 border border-slate-800 overflow-hidden focus-within:border-emerald-500">
                <span className="px-3 py-2.5 bg-slate-900 text-slate-400 font-bold text-xs flex items-center border-r border-slate-800">
                  +91
                </span>
                <input
                  type="tel"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  placeholder="10-digit mobile"
                  className="flex-1 px-3 py-2.5 bg-transparent text-white text-xs font-mono focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Security PIN / Passcode
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  placeholder="Enter admin Security PIN"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500 pl-9"
                  required
                />
                <Lock className="h-4 w-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In as Administrator</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
            <button
              onClick={onReturnToApp}
              className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to FINORA AI</span>
            </button>
            <span className="text-[10px] text-slate-500 font-mono">Protected by PBKDF2</span>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. AUTHENTICATED ADMIN DASHBOARD ---
  return (
    <div className="min-h-screen bg-[#07080c] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white antialiased">
      {/* Top Admin Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080a10]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-500 p-0.5 shadow-md flex items-center justify-center">
              <div className="h-full w-full bg-[#080a10] rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white">FINORA AI</span>
                <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Secure Admin Console
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Administrator: Shaik Afzal Hussain (+91 ******4407)
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={fetchDashboardData}
              disabled={isLoadingData}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingData ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            <button
              onClick={onReturnToApp}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-white/5 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>User App</span>
            </button>

            <button
              onClick={handleAdminLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 font-bold text-xs border border-rose-800/40 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Exit Admin</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 border-t border-white/5 py-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setAdminTab('overview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              adminTab === 'overview'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            System Overview
          </button>
          <button
            onClick={() => setAdminTab('users')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              adminTab === 'users'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span>User Management</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/40">
              {users.length}
            </span>
          </button>
          <button
            onClick={() => setAdminTab('audit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              adminTab === 'audit'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Security Audit Logs
          </button>
          <button
            onClick={() => setAdminTab('settings')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              adminTab === 'settings'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            PIN Rotation
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {apiError && (
          <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        {/* --- VIEW 1: OVERVIEW METRICS (Spec #9) --- */}
        {adminTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Metric Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Registered Users
                </span>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {metrics?.totalUsers ?? 0}
                </div>
                <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{metrics?.activeUsers ?? 0} Active Status</span>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  New Signups (30 Days)
                </span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                  +{metrics?.newUsersMonth ?? 0}
                </div>
                <span className="text-[11px] text-slate-400 block">Isolated user tenants</span>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Linked Bank Accounts
                </span>
                <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">
                  {metrics?.totalLinkedAccounts ?? 0}
                </div>
                <span className="text-[11px] text-slate-400 block">Masked identifiers</span>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Combined User Liquidity
                </span>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {formatCurrency(metrics?.totalReportedBalance ?? 0)}
                </div>
                <span className="text-[11px] text-slate-400 block">Reported in ₹ INR</span>
              </div>
            </div>

            {/* Distribution & Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Linked Accounts by Institution */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Building className="h-4 w-4 text-emerald-400" />
                    <span>Financial Institutions Breakdown</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    {metrics?.totalLinkedAccounts ?? 0} accounts
                  </span>
                </div>

                <div className="space-y-2.5">
                  {metrics && Object.keys(metrics.accountsByInstitution).length > 0 ? (
                    Object.entries(metrics.accountsByInstitution).map(([bank, count]) => (
                      <div
                        key={bank}
                        className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-slate-200">{bank}</span>
                        <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                          {count} account{count > 1 ? 's' : ''}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-6">
                      No linked financial accounts recorded yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Recent Security Audit Events */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <History className="h-4 w-4 text-indigo-400" />
                    <span>Recent Administrative Activity</span>
                  </h3>
                  <button
                    onClick={() => setAdminTab('audit')}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-2">
                  {auditLogs.slice(0, 5).map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-white block capitalize">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate max-w-xs">
                          {log.details || log.targetUserName || 'Admin operation'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW 2: USER MANAGEMENT (Spec #10) --- */}
        {adminTab === 'users' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Search and Filters Bar */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user by name or masked mobile..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">Filter:</span>
                {(['All', 'Active', 'Disabled'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      statusFilter === st
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Table */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">User</th>
                      <th className="px-5 py-3.5">Masked Mobile</th>
                      <th className="px-5 py-3.5">Created Date</th>
                      <th className="px-5 py-3.5">Last Login</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((u) => (
                        <tr
                          key={u.id}
                          className="hover:bg-slate-850/50 transition-colors"
                        >
                          <td className="px-5 py-3.5 font-bold text-white">
                            <div>
                              <span>{u.name || 'Unnamed User'}</span>
                              <span className="text-[10px] text-slate-400 block font-normal font-mono">
                                ID: {u.id.slice(0, 14)}...
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-slate-300">
                            {u.maskedPhone}
                          </td>
                          <td className="px-5 py-3.5 text-slate-400">
                            {new Date(u.createdAt).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-5 py-3.5 text-slate-400">
                            {new Date(u.lastLogin).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border ${
                                u.status === 'Active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right space-x-2">
                            <button
                              onClick={() => handleOpenUserDetail(u.id)}
                              className="px-3 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-bold text-xs transition-colors border border-emerald-500/30"
                            >
                              Inspect
                            </button>
                            <button
                              onClick={() => handleToggleStatus(u.id, u.status)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                                u.status === 'Active'
                                  ? 'bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300'
                                  : 'bg-slate-800 hover:bg-emerald-950/60 text-slate-300 hover:text-emerald-300'
                              }`}
                            >
                              {u.status === 'Active' ? 'Disable' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                          No users matching search query found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW 3: AUDIT LOGS (Spec #13) --- */}
        {adminTab === 'audit' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">System Security Audit Trail</h3>
                <p className="text-xs text-slate-400">
                  Chronological record of administrative access, queries, and credential adjustments.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl">
                {auditLogs.length} events logged
              </span>
            </div>

            <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Timestamp</th>
                      <th className="px-5 py-3.5">Action</th>
                      <th className="px-5 py-3.5">Administrator</th>
                      <th className="px-5 py-3.5">Target User</th>
                      <th className="px-5 py-3.5">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-850/40">
                        <td className="px-5 py-3 text-slate-400">
                          {new Date(log.timestamp).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-300">
                          +91 ******4407
                        </td>
                        <td className="px-5 py-3 text-slate-300">
                          {log.targetUserName || log.targetUserId || 'System'}
                        </td>
                        <td className="px-5 py-3 text-slate-400 max-w-sm truncate">
                          {log.details || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW 4: ADMIN PIN ROTATION (Spec #5) --- */}
        {adminTab === 'settings' && (
          <div className="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 animate-in fade-in duration-150">
            <div className="space-y-1 text-center">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 w-fit mx-auto mb-2">
                <KeyRound className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-white">Rotate Administrator Security PIN</h3>
              <p className="text-xs text-slate-400">
                Change your admin credentials. The new PIN will be hashed using PBKDF2 with SHA-512.
              </p>
            </div>

            {pinChangeMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>{pinChangeMsg}</span>
              </div>
            )}

            {pinChangeErr && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0" />
                <span>{pinChangeErr}</span>
              </div>
            )}

            <form onSubmit={handleChangePin} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Current Admin PIN *
                </label>
                <input
                  type="password"
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  placeholder="Enter current PIN"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  New Admin PIN *
                </label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Enter new 4+ character PIN"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Confirm New PIN *
                </label>
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Re-enter new PIN"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPin}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isChangingPin ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Updating Hash...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    <span>Rotate Admin PIN Now</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* --- USER DETAIL MODAL (Spec #11 & #8: Protected user data breakdown) --- */}
      {selectedUserId && (
        <div
          onClick={() => setSelectedUserId(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5"
          >
            <button
              onClick={() => setSelectedUserId(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {isLoadingDetail || !selectedUserDetails ? (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-400 mx-auto" />
                <p className="text-xs text-slate-400">Retrieving isolated user records...</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-white">{selectedUserDetails.name}</h2>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full border ${
                          selectedUserDetails.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {selectedUserDetails.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Masked Mobile: {selectedUserDetails.maskedPhone} · User ID: {selectedUserDetails.id}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(selectedUserDetails.id, selectedUserDetails.status)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        selectedUserDetails.status === 'Active'
                          ? 'bg-rose-600 hover:bg-rose-500 text-white'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      }`}
                    >
                      {selectedUserDetails.status === 'Active' ? 'Deactivate User' : 'Activate User'}
                    </button>
                  </div>
                </div>

                {/* Authentication Secret Protection Notice (Spec #8) */}
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 flex-shrink-0" />
                    <span>Security PIN Protection: <strong>•••••••• (Protected by Cryptographic Hash)</strong></span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Zero Plaintext Exposure</span>
                </div>

                {/* Financial Accounts Breakdown */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Linked Financial Accounts ({selectedUserDetails.financialAccounts?.length || 0})</span>
                  </h3>

                  {selectedUserDetails.financialAccounts?.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedUserDetails.financialAccounts.map((acc: any) => (
                        <div
                          key={acc.id}
                          className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-white">{acc.bankName}</span>
                            <span className="font-mono text-[10px] text-slate-400">{acc.accountType}</span>
                          </div>
                          <div className="text-xs text-slate-400 font-mono">
                            {acc.accountNumberMasked}
                          </div>
                          <div className="text-sm font-black text-emerald-400 font-mono pt-1">
                            {formatCurrency(acc.balance || 0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic p-3 rounded-xl bg-slate-950/40">
                      User has not configured bank accounts yet.
                    </p>
                  )}
                </div>

                {/* Financial Activity Summary */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-indigo-400" />
                    <span>User Financial Ledger History</span>
                  </h3>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Transactions</span>
                      <span className="text-base font-black text-white font-mono">
                        {selectedUserDetails.activitySummary?.transactionCount || 0}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Recurring Bills</span>
                      <span className="text-base font-black text-white font-mono">
                        {selectedUserDetails.activitySummary?.recurringCount || 0}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Savings Goals</span>
                      <span className="text-base font-black text-white font-mono">
                        {selectedUserDetails.activitySummary?.savingsGoalsCount || 0}
                      </span>
                    </div>
                  </div>

                  {selectedUserDetails.activitySummary?.recentTransactions?.length > 0 && (
                    <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-3 space-y-2 max-h-48 overflow-y-auto">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Recent Transactions
                      </span>
                      {selectedUserDetails.activitySummary.recentTransactions.map((tx: any) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0"
                        >
                          <div>
                            <span className="font-semibold text-white">{tx.merchant}</span>
                            <span className="text-[10px] text-slate-500 block">{tx.date}</span>
                          </div>
                          <span
                            className={`font-mono font-bold ${
                              tx.type === 'income' ? 'text-emerald-400' : 'text-slate-200'
                            }`}
                          >
                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
