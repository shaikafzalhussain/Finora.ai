import React, { useState } from 'react';
import {
  Zap,
  Sliders,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Loader2,
  RefreshCw,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { Category, WhatIfScenarioResult } from '../types/finance';
import { formatCurrency } from '../utils/formatters';

interface WhatIfSimulatorProps {
  categories: Category[];
  totalMonthlyExpenses: number;
  totalMonthlyIncome: number;
  onApplyGoalSaving?: (amount: number) => void;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  categories,
  totalMonthlyExpenses,
  totalMonthlyIncome,
  onApplyGoalSaving,
}) => {
  const currentDining = categories.find((c) => c.id === 'cat-dining')?.monthlyBudget || 0;
  const currentShopping = categories.find((c) => c.id === 'cat-shopping')?.monthlyBudget || 0;
  const currentSubscriptions = 0;
  const currentTransport = categories.find((c) => c.id === 'cat-transport')?.monthlyBudget || 0;

  // Interactive sliders (derived strictly from actual user budget caps)
  const [diningCut, setDiningCut] = useState<number>(() => Math.min(1000, Math.round(currentDining * 0.2)));
  const [shoppingCut, setShoppingCut] = useState<number>(() => Math.min(1000, Math.round(currentShopping * 0.2)));
  const [subscriptionCut, setSubscriptionCut] = useState<number>(0);
  const [transportCut, setTransportCut] = useState<number>(() => Math.min(500, Math.round(currentTransport * 0.15)));

  // Custom AI scenario prompt
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [customResult, setCustomResult] = useState<WhatIfScenarioResult | null>(null);
  const [customError, setCustomError] = useState<string | null>(null);

  const totalMonthlySavings = diningCut + shoppingCut + subscriptionCut + transportCut;
  const totalYearlySavings = totalMonthlySavings * 12;

  const handleSimulateCustom = async (textToRun?: string) => {
    const query = textToRun || customPrompt;
    if (!query.trim()) return;

    setIsSimulating(true);
    setCustomError(null);
    setCustomResult(null);

    try {
      const response = await fetch('/api/ai/simulate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioText: query,
          currentFinances: {
            income: totalMonthlyIncome,
            expenses: totalMonthlyExpenses,
            categories: categories.map((c) => ({ name: c.name, budget: c.monthlyBudget })),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data: WhatIfScenarioResult = await response.json();
      setCustomResult(data);
    } catch (err: any) {
      console.error(err);
      setCustomError('Failed to simulate scenario. Please try again.');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-7 shadow-2xl space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Zap className="h-3.5 w-3.5" />
            <span>Interactive What-If Savings Engine</span>
          </div>
          <h3 className="text-xl font-black text-white">
            Simulate Budget Cuts & Instant Impact
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Slide the controls to see how everyday habit tweaks compound into substantial wealth
          </p>
        </div>

        {/* Big Impact Highlight */}
        <div className="p-4 rounded-2xl bg-gradient-to-tr from-emerald-950/60 to-slate-950 border border-emerald-500/30 text-right self-start sm:self-auto min-w-[200px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Annual Compound Savings
          </span>
          <div className="text-2xl font-black text-emerald-400 mt-0.5">
            +{formatCurrency(totalYearlySavings)}
          </div>
          <span className="text-[11px] font-semibold text-slate-300">
            +{formatCurrency(totalMonthlySavings)}/month
          </span>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Slider 1: Food Delivery */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
          <div className="flex justify-between items-baseline text-xs">
            <span className="font-bold text-slate-200">
              Food Delivery & Dining (Swiggy / Zomato)
            </span>
            <span className="font-black text-emerald-400 text-sm">
              Save {formatCurrency(diningCut)}/mo
            </span>
          </div>

          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Current: {formatCurrency(currentDining)}</span>
            <span>New Target: <strong className="text-white">{formatCurrency(Math.max(0, currentDining - diningCut))}</strong></span>
          </div>

          <input
            type="range"
            min="0"
            max="4000"
            step="200"
            value={diningCut}
            onChange={(e) => setDiningCut(parseInt(e.target.value, 10))}
            className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-900 rounded-lg"
          />
          <div className="flex justify-between text-[9px] text-slate-500">
            <span>₹0 (no change)</span>
            <span>Cut ₹2,000</span>
            <span>Cut ₹4,000</span>
          </div>
        </div>

        {/* Slider 2: Shopping */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
          <div className="flex justify-between items-baseline text-xs">
            <span className="font-bold text-slate-200">
              Discretionary Shopping (Amazon, Myntra)
            </span>
            <span className="font-black text-emerald-400 text-sm">
              Save {formatCurrency(shoppingCut)}/mo
            </span>
          </div>

          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Current: {formatCurrency(currentShopping)}</span>
            <span>New Target: <strong className="text-white">{formatCurrency(Math.max(0, currentShopping - shoppingCut))}</strong></span>
          </div>

          <input
            type="range"
            min="0"
            max="5000"
            step="250"
            value={shoppingCut}
            onChange={(e) => setShoppingCut(parseInt(e.target.value, 10))}
            className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-900 rounded-lg"
          />
          <div className="flex justify-between text-[9px] text-slate-500">
            <span>₹0 (no change)</span>
            <span>Cut ₹2,500</span>
            <span>Cut ₹5,000</span>
          </div>
        </div>

        {/* Slider 3: Subscriptions */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
          <div className="flex justify-between items-baseline text-xs">
            <span className="font-bold text-slate-200">
              Subscriptions & Digital Services
            </span>
            <span className="font-black text-emerald-400 text-sm">
              Save {formatCurrency(subscriptionCut)}/mo
            </span>
          </div>

          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Current: {formatCurrency(currentSubscriptions)}</span>
            <span>New Target: <strong className="text-white">{formatCurrency(Math.max(0, currentSubscriptions - subscriptionCut))}</strong></span>
          </div>

          <input
            type="range"
            min="0"
            max="1500"
            step="100"
            value={subscriptionCut}
            onChange={(e) => setSubscriptionCut(parseInt(e.target.value, 10))}
            className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-900 rounded-lg"
          />
          <div className="flex justify-between text-[9px] text-slate-500">
            <span>₹0</span>
            <span>Cut ₹700</span>
            <span>Cut ₹1,500</span>
          </div>
        </div>

        {/* Slider 4: Cab & Fuel */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
          <div className="flex justify-between items-baseline text-xs">
            <span className="font-bold text-slate-200">
              Cab Rides & Fuel (Metro instead of Cabs)
            </span>
            <span className="font-black text-emerald-400 text-sm">
              Save {formatCurrency(transportCut)}/mo
            </span>
          </div>

          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Current: {formatCurrency(currentTransport)}</span>
            <span>New Target: <strong className="text-white">{formatCurrency(Math.max(0, currentTransport - transportCut))}</strong></span>
          </div>

          <input
            type="range"
            min="0"
            max="2500"
            step="100"
            value={transportCut}
            onChange={(e) => setTransportCut(parseInt(e.target.value, 10))}
            className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-900 rounded-lg"
          />
          <div className="flex justify-between text-[9px] text-slate-500">
            <span>₹0</span>
            <span>Cut ₹1,200</span>
            <span>Cut ₹2,500</span>
          </div>
        </div>
      </div>

      {/* Custom Natural Question Simulator */}
      <div className="pt-2 border-t border-slate-800 space-y-3">
        <span className="text-xs font-bold text-slate-300 block">
          Or Ask a Complex Scenario to Gemini AI:
        </span>

        <div className="flex gap-2">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSimulateCustom()}
            placeholder="e.g. Can I afford a ₹15,000 Goa trip if I reduce food delivery by ₹2,000/mo?"
            className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={() => handleSimulateCustom()}
            disabled={isSimulating || !customPrompt.trim()}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSimulating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Simulate</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>

        {customError && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
            {customError}
          </div>
        )}

        {customResult && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/40 space-y-3 text-xs animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-purple-300">{customResult.scenario}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                {customResult.feasibilityRating}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-900">
                <span className="text-slate-400 text-[10px] block">Monthly Shift</span>
                <span className="text-sm font-black text-emerald-400">
                  {customResult.monthlyImpact >= 0 ? '+' : ''}{formatCurrency(customResult.monthlyImpact)}/mo
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900">
                <span className="text-slate-400 text-[10px] block">12-Month Cumulative</span>
                <span className="text-sm font-black text-emerald-400">
                  {customResult.annualImpact >= 0 ? '+' : ''}{formatCurrency(customResult.annualImpact)}/yr
                </span>
              </div>
            </div>
            <p className="text-slate-300 italic">{customResult.recommendation}</p>
          </div>
        )}
      </div>
    </div>
  );
};
