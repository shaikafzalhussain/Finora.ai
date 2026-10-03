import React from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Bell,
  Clock,
  Sparkles,
  CheckCircle2,
  X,
  ChevronRight,
} from 'lucide-react';
import { SmartAlert } from '../types/finance';

interface SmartAlertsBannerProps {
  alerts: SmartAlert[];
  onDismissAlert: (id: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const SmartAlertsBanner: React.FC<SmartAlertsBannerProps> = ({
  alerts,
  onDismissAlert,
  onNavigateToTab,
}) => {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {alerts.slice(0, 3).map((alert) => {
        let borderClass = 'border-amber-500/30 bg-amber-950/30 text-amber-200';
        let icon = <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />;

        if (alert.type === 'danger') {
          borderClass = 'border-rose-500/30 bg-rose-950/30 text-rose-200';
          icon = <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />;
        } else if (alert.type === 'success') {
          borderClass = 'border-emerald-500/30 bg-emerald-950/30 text-emerald-200';
          icon = <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />;
        } else if (alert.type === 'info') {
          borderClass = 'border-indigo-500/30 bg-indigo-950/30 text-indigo-200';
          icon = <Bell className="h-4 w-4 text-indigo-400 flex-shrink-0" />;
        }

        return (
          <div
            key={alert.id}
            className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl border backdrop-blur-md shadow-sm transition-all text-xs ${borderClass}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {icon}
              <div className="min-w-0">
                <span className="font-bold mr-1.5">{alert.title}:</span>
                <span className="opacity-90">{alert.message}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {alert.actionText && (
                <button
                  onClick={() => alert.actionLink && onNavigateToTab?.(alert.actionLink)}
                  className="font-bold underline hover:opacity-80 flex items-center gap-0.5 text-[11px] whitespace-nowrap"
                >
                  <span>{alert.actionText}</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              )}
              <button
                onClick={() => onDismissAlert(alert.id)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                title="Dismiss alert"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
