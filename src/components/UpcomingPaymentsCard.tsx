import React from 'react';
import {
  Calendar,
  Clock,
  Zap,
  PiggyBank,
  Smartphone,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { UpcomingPayment } from '../types/finance';
import { formatCurrency } from '../utils/formatters';

interface UpcomingPaymentsCardProps {
  payments: UpcomingPayment[];
  onToggleStatus: (id: string) => void;
  onViewAll?: () => void;
}

export const UpcomingPaymentsCard: React.FC<UpcomingPaymentsCardProps> = ({
  payments,
  onToggleStatus,
  onViewAll,
}) => {
  const getIcon = (item: UpcomingPayment) => {
    if (item.name.toLowerCase().includes('electricity') || item.name.toLowerCase().includes('bescom')) {
      return <Zap className="h-4 w-4 text-cyan-400" />;
    }
    if (item.name.toLowerCase().includes('sip') || item.name.toLowerCase().includes('fund')) {
      return <PiggyBank className="h-4 w-4 text-emerald-400" />;
    }
    if (item.isRecharge || item.name.toLowerCase().includes('recharge')) {
      return <Smartphone className="h-4 w-4 text-purple-400" />;
    }
    return <Clock className="h-4 w-4 text-indigo-400" />;
  };

  const formatDueText = (dueDate: string) => {
    try {
      const parts = dueDate.split('-');
      if (parts.length === 3) {
        const monthNum = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[monthNum - 1]} ${day}`;
      }
    } catch (e) {
      // fallback
    }
    return dueDate;
  };

  return (
    <div className="rounded-[28px] bg-slate-900/90 border border-slate-800 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
            <Calendar className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">
              Upcoming Payments
            </h3>
            <p className="text-xs text-slate-400">
              Scheduled auto-debits & bill renewals
            </p>
          </div>
        </div>

        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Payment Items List */}
      {payments.length === 0 ? (
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/5 text-center space-y-1.5">
          <p className="text-xs font-bold text-white">No upcoming payments</p>
          <p className="text-[11px] text-slate-400">
            Add your recurring payments to start tracking upcoming financial commitments.
          </p>
          {onViewAll && (
            <div className="pt-1">
              <button
                onClick={onViewAll}
                className="px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 font-bold text-xs inline-flex items-center gap-1"
              >
                <span>+ Add Recurring Payment</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {payments.slice(0, 4).map((p) => {
            const isDone = p.status === 'completed';

            return (
              <div
                key={p.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  isDone
                    ? 'bg-slate-950/40 border-slate-800/50 opacity-60'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-900 border border-white/5">
                    {getIcon(p)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                        {p.name}
                      </span>
                      {p.autoPayEnabled && (
                        <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                          Auto-Debit
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">
                      {formatCurrency(p.amount)} · Due {formatDueText(p.dueDate)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onToggleStatus(p.id)}
                  className={`p-1.5 rounded-xl transition-colors ${
                    isDone
                      ? 'text-emerald-400 hover:bg-emerald-500/10'
                      : 'text-slate-500 hover:text-white hover:bg-slate-800'
                  }`}
                  title={isDone ? 'Mark as pending' : 'Mark as paid'}
                >
                  <CheckCircle2 className={`h-5 w-5 ${isDone ? 'fill-emerald-400/20 text-emerald-400' : ''}`} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
