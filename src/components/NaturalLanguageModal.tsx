import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ArrowRight,
  Loader2,
  Check,
  Calendar,
  CreditCard,
  Tag,
  Building,
  Edit2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Category, Transaction } from '../types/finance';
import { formatCurrency, getPaymentMethodLabel } from '../utils/formatters';

interface NaturalLanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
}

export const NaturalLanguageModal: React.FC<NaturalLanguageModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddTransaction,
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedResult, setParsedResult] = useState<any | null>(null);
  const [isEditingParsed, setIsEditingParsed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  if (!isOpen) return null;

  // Prompts matching user specification
  const PRIMARY_PROMPTS = [
    "Spent ₹650 on dinner yesterday",
    "Paid ₹2,300 electricity bill",
    "Dad medicine ₹850",
    "SIP ₹5,000",
  ];

  const SECONDARY_PROMPTS = [
    "Swiggy ₹420 dinner order with UPI",
    "Received ₹25,000 freelance design fee in bank account",
    "Bought groceries for ₹1,850 at Blinkit",
    "Uber cab ₹380 to Indiranagar",
  ];

  const displayPrompts = showAllSuggestions
    ? [...PRIMARY_PROMPTS, ...SECONDARY_PROMPTS]
    : PRIMARY_PROMPTS;

  const handleParse = async (textToParse?: string) => {
    const text = textToParse || inputText;
    if (!text.trim()) return;

    setIsLoading(true);
    setError(null);
    setParsedResult(null);
    setIsEditingParsed(false);

    try {
      const response = await fetch('/api/ai/parse-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          categories: categories.map((c) => ({ id: c.id, name: c.name, type: c.type })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      setParsedResult(data);
    } catch (err: any) {
      console.warn('Parsing error, using deterministic client extraction:', err);
      // Client deterministic fallback
      const amountMatch = text.match(/(?:rs\.?|inr|₹)\s*(\d+(?:,\d+)*(?:\.\d+)?)/i) ||
                          text.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:rs\.?|inr|rupees)/i) ||
                          text.match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
      const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 500;
      const isIncome = /salary|received|credited|deposit|freelance|refund/i.test(text);

      setParsedResult({
        amount,
        merchant: 'Quick Entry',
        categoryId: categories[1]?.id || 'cat-groceries',
        date: new Date().toISOString().split('T')[0],
        type: isIncome ? 'income' : 'expense',
        paymentMethod: 'upi',
        description: text,
        tags: ['quick-add'],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!parsedResult) return;
    onAddTransaction({
      amount: parsedResult.amount,
      merchant: parsedResult.merchant || 'General Merchant',
      categoryId: parsedResult.categoryId || categories[1].id,
      date: parsedResult.date || new Date().toISOString().split('T')[0],
      type: parsedResult.type || 'expense',
      paymentMethod: parsedResult.paymentMethod || 'upi',
      description: parsedResult.description || parsedResult.notes,
      tags: parsedResult.tags || [],
    });
    onClose();
    setInputText('');
    setParsedResult(null);
  };

  const matchedCategory = categories.find((c) => c.id === parsedResult?.categoryId);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-t-[28px] sm:rounded-3xl bg-slate-900 border border-slate-800 p-4 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-2 pr-8">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex-shrink-0">
            <Sparkles className="h-4 sm:h-5 w-4 sm:w-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-white">
              AI Natural-Language Entry
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Type naturally. Automatically extracts amount in ₹, merchant, date & category.
            </p>
          </div>
        </div>

        {/* Input Bar */}
        <div className="mt-3.5">
          <textarea
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="e.g. Spent ₹650 on dinner yesterday"
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none resize-none transition-colors"
          />

          <div className="mt-2 flex justify-between items-center gap-2">
            <span className="text-[10px] sm:text-[11px] text-slate-500 truncate">
              Type or tap a suggestion below
            </span>
            <button
              onClick={() => handleParse()}
              disabled={isLoading || !inputText.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-purple-600/20 flex-shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Parsing ₹...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Parse</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sample Suggestions Section (Mobile Redesign) */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Try typing:
            </span>
            <button
              onClick={() => setShowAllSuggestions(!showAllSuggestions)}
              className="text-[10px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-0.5"
            >
              <span>{showAllSuggestions ? 'Fewer' : 'More'}</span>
              {showAllSuggestions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {displayPrompts.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputText(sample);
                  handleParse(sample);
                }}
                disabled={isLoading}
                className="text-left text-[11px] sm:text-xs px-3 py-2 rounded-xl bg-slate-950/70 hover:bg-slate-850 text-slate-300 border border-slate-800/80 hover:border-purple-500/40 transition-all flex items-center justify-between gap-1.5 active:scale-98"
              >
                <span className="break-words line-clamp-2">"{sample}"</span>
                <ArrowRight className="h-3 w-3 text-purple-400 flex-shrink-0 opacity-60" />
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Parsed Result Confirmation Card */}
        {parsedResult && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-purple-500/40 shadow-xl space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                Extracted {parsedResult.type === 'income' ? 'Income' : 'Expense'}
              </span>
              <span className={`text-base font-black font-mono ${
                parsedResult.type === 'income' ? 'text-emerald-400' : 'text-white'
              }`}>
                {parsedResult.type === 'income' ? '+' : '-'}{formatCurrency(parsedResult.amount)}
              </span>
            </div>

            {/* Editable or Display View */}
            {!isEditingParsed ? (
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-400">Merchant / Entity:</span>
                  <span className="font-bold text-white truncate max-w-[180px]">{parsedResult.merchant}</span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-400">Category:</span>
                  <span className="font-semibold text-emerald-400 truncate max-w-[180px]">
                    {matchedCategory?.name || parsedResult.categoryId}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-400">Date:</span>
                  <span className="font-mono text-slate-200">{parsedResult.date}</span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-400">Payment Method:</span>
                  <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    {getPaymentMethodLabel(parsedResult.paymentMethod || 'upi')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Merchant</label>
                  <input
                    type="text"
                    value={parsedResult.merchant}
                    onChange={(e) => setParsedResult({ ...parsedResult, merchant: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      value={parsedResult.amount}
                      onChange={(e) => setParsedResult({ ...parsedResult, amount: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Category</label>
                    <select
                      value={parsedResult.categoryId}
                      onChange={(e) => setParsedResult({ ...parsedResult, categoryId: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsEditingParsed(!isEditingParsed)}
                className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 transition-colors flex items-center gap-1 active:scale-95"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>{isEditingParsed ? 'Done' : 'Edit'}</span>
              </button>

              <button
                onClick={handleConfirm}
                className="flex-1 py-2 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                <Check className="h-4 w-4 stroke-[2.5]" />
                <span>Save to Ledger</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
