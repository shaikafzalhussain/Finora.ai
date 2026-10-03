import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  Trash2,
  Edit2,
  Copy,
  Download,
  Repeat,
  AlertTriangle,
  Building,
  Tag,
  Clock,
  MoreVertical,
} from 'lucide-react';
import { Category, Transaction, BankAccountDetails } from '../types/finance';
import { formatCurrency, formatDate, getCategoryIcon, getPaymentMethodLabel } from '../utils/formatters';

interface TransactionsTableProps {
  transactions: Transaction[];
  categories: Category[];
  bankAccounts?: BankAccountDetails[];
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDuplicateTransaction?: (transaction: Transaction) => void;
  onExportCsv: () => void;
  selectedCategoryId?: string | null;
  onClearCategoryFilter?: () => void;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  categories,
  bankAccounts = [],
  onDeleteTransaction,
  onEditTransaction,
  onDuplicateTransaction,
  onExportCsv,
  selectedCategoryId,
  onClearCategoryFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [filterAccountId, setFilterAccountId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [mobileActionOpenId, setMobileActionOpenId] = useState<string | null>(null);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (filterPayment !== 'all' && t.paymentMethod !== filterPayment) return false;
      if (filterAccountId !== 'all') {
        if (filterAccountId === 'cash' && (t.accountId && t.accountId !== 'cash')) return false;
        if (filterAccountId !== 'cash' && t.accountId !== filterAccountId) return false;
      }
      if (selectedCategoryId && t.categoryId !== selectedCategoryId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const cat = categoryMap.get(t.categoryId)?.name.toLowerCase() || '';
        const matchMerchant = t.merchant.toLowerCase().includes(q);
        const matchNotes = (t.notes || t.description || '').toLowerCase().includes(q);
        const matchTags = (t.tags || []).some((tag) => tag.toLowerCase().includes(q));
        const matchCategory = cat.includes(q);
        if (!matchMerchant && !matchNotes && !matchTags && !matchCategory) return false;
      }
      return true;
    });
  }, [transactions, filterType, filterPayment, filterAccountId, selectedCategoryId, searchQuery, categoryMap]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        const cmp = a.date.localeCompare(b.date);
        return sortOrder === 'desc' ? -cmp : cmp;
      } else {
        const cmp = a.amount - b.amount;
        return sortOrder === 'desc' ? -cmp : cmp;
      }
    });
  }, [filtered, sortBy, sortOrder]);

  const toggleSort = (field: 'date' | 'amount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Group transactions for Mobile into: Today, Yesterday, and Earlier
  const groupedMobileTransactions = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const groups: { [key: string]: Transaction[] } = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };

    for (const t of sorted) {
      if (t.date === todayStr) {
        groups.Today.push(t);
      } else if (t.date === yesterdayStr) {
        groups.Yesterday.push(t);
      } else {
        groups.Earlier.push(t);
      }
    }

    return groups;
  }, [sorted]);

  const activeCategory = selectedCategoryId ? categoryMap.get(selectedCategoryId) : null;

  return (
    <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex-1 flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="relative min-w-[200px] flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search Swiggy, Blinkit, Uber..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="expense">Expenses Only</option>
            <option value="income">Income Only</option>
          </select>

          {/* Payment Method Filter */}
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Payment Methods</option>
            <option value="upi">UPI (GPay/PhonePe/Paytm)</option>
            <option value="credit_card">Credit Card</option>
            <option value="debit_card">Debit Card</option>
            <option value="net_banking">Net Banking / IMPS</option>
            <option value="cash">Cash</option>
          </select>

          {/* Account Filter (Requirement 3) */}
          {bankAccounts && bankAccounts.length > 1 && (
            <select
              value={filterAccountId}
              onChange={(e) => setFilterAccountId(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Accounts</option>
              {bankAccounts.map((acc) => (
                <option key={acc.id || acc.accountNumberLast4} value={acc.id || acc.accountNumberLast4}>
                  {acc.bankName} ••••{acc.accountNumberLast4}
                </option>
              ))}
              <option value="cash">Cash</option>
            </select>
          )}

          {/* Category Filter pill */}
          {activeCategory && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span>Category: {activeCategory.name}</span>
              <button
                onClick={onClearCategoryFilter}
                className="hover:text-white ml-1 text-slate-400"
                title="Clear filter"
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportCsv}
            className="px-3.5 py-2 text-xs font-bold text-slate-300 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors flex items-center gap-1.5"
            title="Download CSV"
          >
            <Download className="h-3.5 w-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* MOBILE-FIRST VIEW: Responsive Grouped Cards (Visible on screens < 768px) */}
      <div className="block md:hidden space-y-4">
        {['Today', 'Yesterday', 'Earlier'].map((groupTitle) => {
          const items = (groupedMobileTransactions as any)[groupTitle] as Transaction[];
          if (!items || items.length === 0) return null;

          return (
            <div key={groupTitle} className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1 pt-1">
                <span>{groupTitle}</span>
                <span className="text-[10px] font-normal text-slate-500">
                  {items.length} transaction{items.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-2">
                {items.map((t) => {
                  const category = categoryMap.get(t.categoryId);
                  const IconComp = getCategoryIcon(category?.icon || 'Tag');
                  const isActionOpen = mobileActionOpenId === t.id;
                  const displayTime = t.time || '08:42 PM';

                  return (
                    <div
                      key={t.id}
                      className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800/80 shadow-sm relative transition-all hover:border-slate-700"
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        {/* Left: Icon & Details */}
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div
                            className="p-2 sm:p-2.5 rounded-xl flex-shrink-0 mt-0.5"
                            style={{
                              backgroundColor: `${category?.color || '#a855f7'}20`,
                              color: category?.color || '#a855f7',
                            }}
                          >
                            <IconComp className="h-4 w-4" />
                          </div>

                          <div className="min-w-0 flex-1 space-y-0.5">
                            {/* Merchant */}
                            <div className="flex items-center gap-1.5 min-w-0">
                              <h4 className="font-extrabold text-[13px] sm:text-sm text-slate-100 truncate">
                                {t.merchant}
                              </h4>
                              {t.isRecurring && (
                                <span
                                  className="p-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 flex-shrink-0"
                                  title="Auto-debit recurring subscription"
                                >
                                  <Repeat className="h-2.5 w-2.5" />
                                </span>
                              )}
                            </div>

                            {/* Category */}
                            <p className="text-[11px] text-slate-400 font-medium truncate">
                              {category?.name || 'General'}
                            </p>

                            {/* Description / Notes if available */}
                            {(t.description || t.notes) && (
                              <p className="text-[10px] text-slate-400 italic truncate max-w-[190px]">
                                {t.description || t.notes}
                              </p>
                            )}

                            {/* Account & Payment Method Badges */}
                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                              {t.accountName && (
                                <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded bg-slate-900 text-slate-300 border border-slate-800">
                                  {t.accountName}
                                </span>
                              )}
                              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-slate-900 text-slate-400 border border-slate-800">
                                {t.paymentMethod}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Amount, Date, Time & Action Button */}
                        <div className="flex flex-col items-end flex-shrink-0 pl-1">
                          <span
                            className={`font-black text-sm sm:text-base font-mono tracking-tight leading-tight ${
                              t.type === 'income' ? 'text-emerald-400' : 'text-slate-100'
                            }`}
                          >
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                          </span>

                          <span className="text-[11px] text-slate-300 font-medium font-mono mt-0.5">
                            {groupTitle === 'Today' ? 'Today' : groupTitle === 'Yesterday' ? 'Yesterday' : formatDate(t.date)}
                          </span>

                          <span className="text-[10px] text-slate-400 font-mono">
                            {displayTime}
                          </span>

                          <button
                            onClick={() => setMobileActionOpenId(isActionOpen ? null : t.id)}
                            className="mt-1 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-850 active:scale-95 transition-colors"
                            aria-label="Transaction options"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Action Sheet for Mobile */}
                      {isActionOpen && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-800 flex items-center justify-around gap-2 animate-in fade-in">
                          <button
                            onClick={() => {
                              onEditTransaction(t);
                              setMobileActionOpenId(null);
                            }}
                            className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-850 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 border border-slate-800 active:scale-95"
                          >
                            <Edit2 className="h-3 w-3 text-slate-400" />
                            <span>Edit</span>
                          </button>

                          {onDuplicateTransaction && (
                            <button
                              onClick={() => {
                                onDuplicateTransaction(t);
                                setMobileActionOpenId(null);
                              }}
                              className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-850 text-indigo-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 border border-slate-800 active:scale-95"
                            >
                              <Copy className="h-3 w-3 text-indigo-400" />
                              <span>Copy</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              onDeleteTransaction(t.id);
                              setMobileActionOpenId(null);
                            }}
                            className="flex-1 py-1.5 px-2 bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 border border-rose-900/50 active:scale-95"
                          >
                            <Trash2 className="h-3 w-3 text-rose-400" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs rounded-2xl bg-slate-950 border border-slate-850">
            No transactions match your current search or filter.
          </div>
        )}
      </div>

      {/* DESKTOP VIEW: Full Ledger Table (Visible on md and up) */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-800/80">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
            <tr>
              <th
                onClick={() => toggleSort('date')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Date</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-4">Merchant & Notes</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Payment</th>
              <th
                onClick={() => toggleSort('amount')}
                className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Amount (₹)</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850">
            {sorted.length > 0 ? (
              sorted.map((t) => {
                const category = categoryMap.get(t.categoryId);
                const IconComp = getCategoryIcon(category?.icon || 'Tag');

                return (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-850/50 transition-colors group"
                  >
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                      {formatDate(t.date)}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100">
                          {t.merchant}
                        </span>
                        {t.isRecurring && (
                          <span
                            className="p-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            title="Auto-debit recurring subscription"
                          >
                            <Repeat className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      {(t.description || t.notes) && (
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">
                          {t.description || t.notes}
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="p-1 rounded-md"
                          style={{
                            backgroundColor: `${category?.color || '#94a3b8'}20`,
                            color: category?.color || '#94a3b8',
                          }}
                        >
                          <IconComp className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-slate-300 font-medium">
                          {category?.name || 'Uncategorized'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                      {getPaymentMethodLabel(t.paymentMethod)}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span
                        className={`font-black text-sm ${
                          t.type === 'income'
                            ? 'text-emerald-400'
                            : 'text-slate-100'
                        }`}
                      >
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEditTransaction(t)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit transaction"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        {onDuplicateTransaction && (
                          <button
                            onClick={() => onDuplicateTransaction(t)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-950/30 rounded-lg transition-colors"
                            title="Duplicate transaction"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteTransaction(t.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No transactions match your current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <span>
          Showing {sorted.length} of {transactions.length} items
        </span>
        <span className="font-mono">
          Net:{' '}
          <strong className="text-slate-300">
            {formatCurrency(
              sorted.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0)
            )}
          </strong>
        </span>
      </div>
    </div>
  );
};
