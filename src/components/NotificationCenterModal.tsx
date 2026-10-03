import React from 'react';
import { X, Bell, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { RecurringExpense } from '../types/finance';
import { formatCurrency } from '../utils/formatters';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurringExpenses: RecurringExpense[];
  onNavigateToSubscriptions: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  recurringExpenses,
  onNavigateToSubscriptions,
}) => {
  if (!isOpen) return null;

  const activeRecurring = recurringExpenses.filter((r) => r.status === 'active');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reminders = activeRecurring.map((item) => {
    const dueDate = new Date(item.nextDueDate || new Date());
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    let urgencyLabel = '';
    let isUrgent = false;
    if (diffDays === 0) {
      urgencyLabel = 'Due today';
      isUrgent = true;
    } else if (diffDays === 1) {
      urgencyLabel = 'Due tomorrow';
      isUrgent = true;
    } else if (diffDays < 0) {
      urgencyLabel = `Overdue by ${Math.abs(diffDays)} days`;
      isUrgent = true;
    } else {
      urgencyLabel = `Due in ${diffDays} days`;
      if (diffDays <= 3) isUrgent = true;
    }

    return {
      ...item,
      diffDays,
      urgencyLabel,
      isUrgent,
    };
  }).sort((a, b) => a.diffDays - b.diffDays);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-end p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm sm:max-w-md rounded-[28px] bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden mt-12 sm:mt-16 animate-in slide-in-from-top-4 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Payment Reminders</h3>
              <p className="text-[10px] text-slate-400">Upcoming bills & recurring commitments</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[65vh] overflow-y-auto space-y-3">
          {reminders.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400 w-fit mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h4 className="text-xs font-bold text-white">You're all caught up.</h4>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                No upcoming payment reminders or recurring commitments found for this cycle.
              </p>
            </div>
          ) : (
            reminders.map((rem) => (
              <div
                key={rem.id}
                className={`p-3.5 rounded-2xl border transition-all space-y-2 ${
                  rem.isUrgent
                    ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${rem.isUrgent ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-white block">{rem.name || rem.merchant}</span>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {rem.billingCycle} billing • Due {rem.nextDueDate}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-black text-xs text-white">
                    {formatCurrency(rem.amount)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className={`text-[10px] font-bold ${rem.isUrgent ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {rem.urgencyLabel}
                  </span>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToSubscriptions();
                    }}
                    className="flex items-center gap-1 text-[11px] font-extrabold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <span>View</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">
            {reminders.length} active subscription(s)
          </span>
          <button
            onClick={() => {
              onClose();
              onNavigateToSubscriptions();
            }}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
          >
            <span>Manage All Commitments</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
