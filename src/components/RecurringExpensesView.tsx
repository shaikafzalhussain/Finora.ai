import React, { useState } from 'react';
import {
  Repeat,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  TrendingDown,
  Info,
  ShieldCheck,
  Ban,
  RefreshCw,
} from 'lucide-react';
import { Category, RecurringExpense, SubscriptionUtility } from '../types/finance';
import { formatCurrency, formatDate, getCategoryIcon } from '../utils/formatters';

interface RecurringExpensesViewProps {
  recurring: RecurringExpense[];
  categories: Category[];
  onAddRecurring: (item: Omit<RecurringExpense, 'id'>) => void;
  onDeleteRecurring: (id: string) => void;
  onUpdateStatus: (id: string, status: 'active' | 'flagged' | 'cancelled') => void;
  onUpdateUtility?: (id: string, utility: SubscriptionUtility) => void;
  onMarkAsPaid?: (id: string) => void;
}

export const RecurringExpensesView: React.FC<RecurringExpensesViewProps> = ({
  recurring,
  categories,
  onAddRecurring,
  onDeleteRecurring,
  onUpdateStatus,
  onUpdateUtility,
  onMarkAsPaid,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly' | 'quarterly'>('monthly');
  const [nextDueDate, setNextDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [utility, setUtility] = useState<SubscriptionUtility>('useful');
  const [description, setDescription] = useState('');

  const monthlyTotal = recurring
    .filter((r) => r.status !== 'cancelled')
    .reduce((sum, r) => {
      if (r.billingCycle === 'yearly') return sum + r.amount / 12;
      if (r.billingCycle === 'quarterly') return sum + r.amount / 3;
      return sum + r.amount;
    }, 0);

  const annualTotal = monthlyTotal * 12;

  const unnecessaryTotal = recurring
    .filter((r) => r.status !== 'cancelled' && (r.utility === 'unnecessary' || r.status === 'flagged'))
    .reduce((sum, r) => sum + (r.billingCycle === 'yearly' ? r.amount / 12 : r.amount), 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!name.trim() || isNaN(num) || num <= 0) return;

    onAddRecurring({
      name: name.trim(),
      amount: num,
      categoryId,
      billingCycle,
      nextDueDate,
      status: 'active',
      utility,
      description: description.trim() || undefined,
    });

    setIsAdding(false);
    setName('');
    setAmount('');
    setDescription('');
  };

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Monthly Recurring Outflow
          </span>
          <div className="text-2xl font-black text-white mt-2">
            {formatCurrency(monthlyTotal)}/mo
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Auto-debited rent, SIPs, utilities & subscriptions
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Annualized Recurring Total
          </span>
          <div className="text-2xl font-black text-indigo-400 mt-2">
            {formatCurrency(annualTotal)}/yr
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Total 12-month fixed cash commitment
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Avoidable / Flagged Waste
          </span>
          <div className={`text-2xl font-black mt-2 ${
            unnecessaryTotal > 0 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {formatCurrency(unnecessaryTotal)}/mo
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Marked as unnecessary or inactive subscriptions
          </p>
        </div>
      </div>

      {/* Main List */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Repeat className="h-4 w-4 text-purple-400" />
              <span>Active Subscriptions & Recurring Commitments</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Categorize subscriptions as Essential, Useful, or Unnecessary. We never cancel automatically.
            </p>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-3.5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Subscription</span>
          </button>
        </div>

        {/* Add Form Drawer */}
        {isAdding && (
          <form
            onSubmit={handleSave}
            className="mb-6 p-5 rounded-2xl bg-slate-950 border border-purple-500/40 space-y-3.5 text-xs animate-in fade-in"
          >
            <div className="font-bold text-slate-200">
              New Recurring Subscription / Bill
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Service / Bill Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Netflix 4K, Cult.fit, JioFiber"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Amount (₹ INR) *</label>
                <input
                  type="number"
                  step="1"
                  required
                  placeholder="649"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Billing Cycle</label>
                <select
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Next Due Date</label>
                <input
                  type="date"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Utility Classification</label>
                <select
                  value={utility}
                  onChange={(e) => setUtility(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none"
                >
                  <option value="essential">Essential (Need)</option>
                  <option value="useful">Useful (Value for money)</option>
                  <option value="unnecessary">Unnecessary (Candidate to pause)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Notes / Retention terms</label>
              <input
                type="text"
                placeholder="e.g. Pause if not used for 3 weeks"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
              >
                Save Subscription
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {recurring.length === 0 && !isAdding ? (
          <div className="p-8 rounded-3xl bg-slate-950/60 border border-white/5 text-center space-y-2">
            <RefreshCw className="h-10 w-10 text-indigo-400 mx-auto opacity-70" />
            <div className="text-sm font-bold text-white">No recurring payments or subscriptions tracked yet</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Add your monthly commitments (such as Electricity, Mobile Recharge, Rent, SIP, OTT subscriptions) to track renewal dates and spot unused commitments.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setIsAdding(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Add First Recurring Payment</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {recurring.map((item) => {
            const category = categoryMap.get(item.categoryId);
            const IconComp = getCategoryIcon(category?.icon || 'Tag');

            return (
              <div
                key={item.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-850/40 rounded-2xl px-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="p-2.5 rounded-2xl"
                    style={{
                      backgroundColor: `${category?.color || '#a855f7'}20`,
                      color: category?.color || '#a855f7',
                    }}
                  >
                    <IconComp className="h-5 w-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-100">
                        {item.name}
                      </span>
                      {item.utility === 'unnecessary' && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Unnecessary
                        </span>
                      )}
                      {item.utility === 'useful' && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Useful
                        </span>
                      )}
                      {item.utility === 'essential' && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Essential
                        </span>
                      )}
                      {item.status === 'flagged' && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Zombie Flag</span>
                        </span>
                      )}
                      {item.status === 'cancelled' && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-800 text-slate-400">
                          Cancelled
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                      <span>{category?.name || 'General'}</span>
                      <span>•</span>
                      <span className="capitalize">{item.billingCycle}</span>
                      <span>•</span>
                      <span>Next Due: {formatDate(item.nextDueDate)}</span>
                    </div>

                    {item.description && (
                      <p className="text-[11px] text-slate-400 italic mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <div className="text-base font-black text-white">
                      {formatCurrency(item.amount)}
                      <span className="text-xs font-normal text-slate-400 ml-0.5">
                        /{item.billingCycle === 'monthly' ? 'mo' : item.billingCycle === 'yearly' ? 'yr' : 'qtr'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {item.billingCycle === 'monthly'
                        ? `${formatCurrency(item.amount * 12)}/yr`
                        : `${formatCurrency(item.amount / 12)}/mo`}
                    </div>
                  </div>

                  {/* Manual Utility Classification buttons */}
                  <div className="flex items-center gap-1">
                    <select
                      value={item.utility}
                      onChange={(e) => onUpdateUtility?.(item.id, e.target.value as SubscriptionUtility)}
                      className="px-2 py-1 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 capitalize focus:outline-none"
                    >
                      <option value="essential">Essential</option>
                      <option value="useful">Useful</option>
                      <option value="unnecessary">Unnecessary</option>
                    </select>

                    {item.status === 'active' && (
                      <button
                        onClick={() => onMarkAsPaid?.(item.id)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 shadow-sm transition-colors"
                        title="Mark this payment as paid and advance next due date"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Mark Paid</span>
                      </button>
                    )}

                    <button
                      onClick={() => onUpdateStatus(item.id, item.status === 'active' ? 'cancelled' : 'active')}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                      {item.status === 'active' ? 'Mark Cancelled' : 'Activate'}
                    </button>

                    <button
                      onClick={() => onDeleteRecurring(item.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
};
