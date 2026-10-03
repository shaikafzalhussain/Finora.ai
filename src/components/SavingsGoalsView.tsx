import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  PiggyBank,
  Plus,
  Trash2,
  Calendar,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Sparkles,
  Target,
} from 'lucide-react';
import { SavingsGoal } from '../types/finance';
import { formatCurrency, formatDate } from '../utils/formatters';

interface SavingsGoalsViewProps {
  goals: SavingsGoal[];
  onAddGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  onDeleteGoal: (id: string) => void;
  onContribute: (id: string, amount: number) => void;
}

export const SavingsGoalsView: React.FC<SavingsGoalsViewProps> = ({
  goals,
  onAddGoal,
  onDeleteGoal,
  onContribute,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('2027-03-31');
  const [category, setCategory] = useState('Emergency');
  const [emoji, setEmoji] = useState('🎯');

  const [contributingGoalId, setContributingGoalId] = useState<string | null>(null);
  const [contributionInput, setContributionInput] = useState('');

  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const overallPct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = parseFloat(targetAmount);
    const currentNum = parseFloat(currentAmount) || 0;
    if (!name.trim() || isNaN(targetNum) || targetNum <= 0) return;

    onAddGoal({
      name: name.trim(),
      targetAmount: targetNum,
      currentAmount: currentNum,
      targetDate,
      category,
      color: '#10b981',
      emoji: emoji || '🎯',
    });

    setIsAdding(false);
    setName('');
    setTargetAmount('');
    setCurrentAmount('0');
  };

  const handleDeposit = (goalId: string) => {
    const amt = parseFloat(contributionInput);
    if (!isNaN(amt) && amt > 0) {
      onContribute(goalId, amt);
      const goal = goals.find((g) => g.id === goalId);
      if (goal && goal.currentAmount + amt >= goal.targetAmount) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {}
      }
      setContributingGoalId(null);
      setContributionInput('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Accumulated Savings
          </span>
          <div className="text-2xl font-black text-white mt-2">
            {formatCurrency(totalSaved)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Across {goals.length} dedicated funding milestones
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Cumulative Target
          </span>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            {formatCurrency(totalTarget)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {formatCurrency(Math.max(0, totalTarget - totalSaved))} remaining to hit all targets
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Overall Completion
          </span>
          <div className="text-2xl font-black text-indigo-400 mt-2">
            {Math.round(overallPct)}%
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 mt-2 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${Math.min(100, overallPct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-emerald-400" />
              <span>Target Savings & Reserve Funds (INR ₹)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Direct monthly surplus cash into emergency reserves, gold, tech, and travel with milestone pacing
            </p>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-3.5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Savings Goal</span>
          </button>
        </div>

        {/* Add Goal Drawer */}
        {isAdding && (
          <form
            onSubmit={handleCreateGoal}
            className="mb-6 p-5 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-3.5 text-xs animate-in fade-in"
          >
            <div className="font-bold text-slate-200">
              Create New Savings Target (₹)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="text-slate-400 block mb-1">Goal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emergency Fund, Ladakh Roadtrip, MacBook Pro"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Target Amount (₹) *</label>
                <input
                  type="number"
                  step="1000"
                  required
                  placeholder="100000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Initial Saved (₹)</label>
                <input
                  type="number"
                  step="500"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Target Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Category</label>
                <input
                  type="text"
                  placeholder="Travel, Tech, Investment, Security"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Emoji Icon</label>
                <input
                  type="text"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
              >
                Create Goal
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

        {/* Goals Grid */}
        {goals.length === 0 && !isAdding ? (
          <div className="p-8 rounded-3xl bg-slate-950/60 border border-white/5 text-center space-y-2">
            <Target className="h-10 w-10 text-emerald-400 mx-auto opacity-70" />
            <div className="text-sm font-bold text-white">No savings goals created yet</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Set up targets for an emergency fund, travel, electronics, or wealth building to track your progress in real-time.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setIsAdding(true)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl inline-flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Create First Goal</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((goal) => {
            const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
            const isCompleted = goal.currentAmount >= goal.targetAmount;
            const isDepositing = contributingGoalId === goal.id;

            return (
              <div
                key={goal.id}
                className="p-5 rounded-3xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl p-2.5 rounded-2xl bg-slate-900 border border-slate-800">
                        {goal.emoji}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-100">
                          {goal.name}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          {goal.category} • Target by {formatDate(goal.targetDate)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteGoal(goal.id)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg transition-colors"
                      title="Delete goal"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Progress Numbers */}
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-slate-400">Saved: </span>
                      <strong className="text-base font-black text-white">
                        {formatCurrency(goal.currentAmount)}
                      </strong>
                    </div>
                    <span className="text-xs text-slate-400">
                      Target: {formatCurrency(goal.targetAmount)}
                    </span>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-slate-900 mt-2 overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted
                          ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1.5">
                    <span className="font-bold text-emerald-400">{pct}% Funded</span>
                    <span>
                      {isCompleted
                        ? '🎉 Goal Reached!'
                        : `${formatCurrency(remaining)} remaining`}
                    </span>
                  </div>
                </div>

                {/* Deposit Action */}
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  {isDepositing ? (
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1.5 text-xs text-slate-500">₹</span>
                        <input
                          type="number"
                          step="500"
                          placeholder="Amount in ₹"
                          value={contributionInput}
                          onChange={(e) => setContributionInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleDeposit(goal.id);
                            if (e.key === 'Escape') setContributingGoalId(null);
                          }}
                          autoFocus
                          className="w-full pl-6 pr-2 py-1.5 text-xs bg-slate-900 border border-emerald-500 rounded-xl text-white focus:outline-none font-bold"
                        />
                      </div>
                      <button
                        onClick={() => handleDeposit(goal.id)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors"
                      >
                        Deposit
                      </button>
                      <button
                        onClick={() => setContributingGoalId(null)}
                        className="px-2.5 py-1.5 bg-slate-800 text-slate-400 text-xs rounded-xl"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-slate-500">
                        {isCompleted ? 'Target achieved!' : 'Surplus cash available?'}
                      </span>
                      <button
                        onClick={() => {
                          setContributingGoalId(goal.id);
                          setContributionInput('');
                        }}
                        className="px-3 py-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-800/50 rounded-xl transition-colors flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Contribute ₹</span>
                      </button>
                    </div>
                  )}
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
