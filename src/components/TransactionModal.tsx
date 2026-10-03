import React, { useState, useEffect } from 'react';
import { X, Check, Calendar, Tag, CreditCard, Building, Repeat, Clock } from 'lucide-react';
import { Category, PaymentMethod, Transaction, TransactionType, BankAccountDetails } from '../types/finance';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  bankAccounts?: BankAccountDetails[];
  onSave: (transaction: Omit<Transaction, 'id'>, editId?: string) => void;
  editTransaction?: Transaction | null;
  defaultType?: TransactionType;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  categories,
  bankAccounts = [],
  onSave,
  editTransaction,
  defaultType = 'expense',
}) => {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [amount, setAmount] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>('08:42 PM');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [tagsInput, setTagsInput] = useState<string>('');

  const hasMultipleAccounts = bankAccounts.length > 1;

  // Initialize or reset form
  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type);
      setAmount(editTransaction.amount.toString());
      setMerchant(editTransaction.merchant);
      setCategoryId(editTransaction.categoryId);
      setDate(editTransaction.date);
      setTime(editTransaction.time || '08:42 PM');
      setPaymentMethod(editTransaction.paymentMethod);
      setSelectedAccountId(
        editTransaction.accountId || bankAccounts[0]?.id || bankAccounts[0]?.accountNumberLast4 || 'cash'
      );
      setDescription(editTransaction.description || '');
      setNotes(editTransaction.notes || '');
      setIsRecurring(!!editTransaction.isRecurring);
      setTagsInput((editTransaction.tags || []).join(', '));
    } else {
      setType(defaultType);
      setAmount('');
      setMerchant('');
      setDate(new Date().toISOString().split('T')[0]);
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setPaymentMethod('upi');
      setSelectedAccountId(bankAccounts[0]?.id || bankAccounts[0]?.accountNumberLast4 || 'cash');
      setDescription('');
      setNotes('');
      setIsRecurring(false);
      setTagsInput('');
      const defaultCat = categories.find((c) => c.type === defaultType);
      if (defaultCat) setCategoryId(defaultCat.id);
    }
  }, [editTransaction, isOpen, categories, bankAccounts, defaultType]);

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === type);

  // Quick Date Helpers (Specs #10 & #13)
  const setDateToday = () => {
    setDate(new Date().toISOString().split('T')[0]);
  };

  const setDateYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setDate(d.toISOString().split('T')[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    if (!merchant.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    // Resolve target account and accountName
    let targetAccId = selectedAccountId;
    let accountName = 'Cash';

    if (bankAccounts.length === 1 && !hasMultipleAccounts) {
      // Automatic single account binding (Spec #2: do NOT unnecessarily ask which bank)
      const single = bankAccounts[0];
      targetAccId = single.id || single.accountNumberLast4;
      accountName = `${single.bankName} ••••${single.accountNumberLast4}`;
    } else if (hasMultipleAccounts) {
      if (selectedAccountId === 'cash') {
        targetAccId = 'cash';
        accountName = 'Cash';
      } else {
        const found = bankAccounts.find(
          (a) => a.id === selectedAccountId || a.accountNumberLast4 === selectedAccountId
        );
        if (found) {
          targetAccId = found.id || found.accountNumberLast4;
          accountName = `${found.bankName} ••••${found.accountNumberLast4}`;
        }
      }
    } else if (bankAccounts.length === 0) {
      targetAccId = 'cash';
      accountName = 'Cash';
    }

    onSave(
      {
        amount: numAmount,
        merchant: merchant.trim(),
        categoryId: categoryId || filteredCategories[0]?.id || '',
        date,
        time,
        type,
        paymentMethod,
        accountId: targetAccId,
        accountName,
        description: description.trim() || undefined,
        notes: notes.trim() || description.trim() || undefined,
        isRecurring,
        tags,
      },
      editTransaction ? editTransaction.id : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-base sm:text-lg font-black text-white mb-3">
          {editTransaction
            ? 'Edit Transaction (₹)'
            : type === 'expense'
            ? 'Record Expense (₹)'
            : 'Record Income (₹)'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Type Toggle: Expense vs Income */}
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                const cat = categories.find((c) => c.type === 'expense');
                if (cat) setCategoryId(cat.id);
              }}
              className={`flex-1 py-2 rounded-lg font-bold text-xs transition-colors ${
                type === 'expense'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                const cat = categories.find((c) => c.type === 'income');
                if (cat) setCategoryId(cat.id);
              }}
              className={`flex-1 py-2 rounded-lg font-bold text-xs transition-colors ${
                type === 'income'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Income
            </button>
          </div>

          {/* Amount Field */}
          <div>
            <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">
              Amount (₹ INR) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold text-sm">₹</span>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm font-bold text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Merchant / Source */}
          <div>
            <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">
              {type === 'expense' ? 'Merchant / Vendor *' : 'Income Source / Client *'}
            </label>
            <input
              type="text"
              required
              placeholder={
                type === 'expense'
                  ? 'e.g. Swiggy, Blinkit, Uber, Apollo, Electricity'
                  : 'e.g. Primary Salary, TCS, Consulting, Dividend, Bonus'
              }
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-white text-xs focus:outline-none"
            />
          </div>

          {/* Editable Date and Time (Requirements 10, 12, 13) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] uppercase font-bold text-slate-400">
                  Date *
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={setDateToday}
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={setDateYesterday}
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Yesterday
                  </button>
                </div>
              </div>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-white text-xs focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">
                Time
              </label>
              <input
                type="text"
                placeholder="e.g. 08:30 PM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-white text-xs focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Account Selection — Displayed ONLY when user has multiple accounts (Spec #2) */}
          {hasMultipleAccounts && (
            <div>
              <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">
                {type === 'expense' ? 'Payment Account *' : 'Deposit Account *'}
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-white text-xs focus:outline-none"
              >
                {bankAccounts.map((acc) => (
                  <option
                    key={acc.id || acc.accountNumberLast4}
                    value={acc.id || acc.accountNumberLast4}
                  >
                    {acc.bankName} ••••{acc.accountNumberLast4}
                  </option>
                ))}
                <option value="cash">Cash</option>
              </select>
            </div>
          )}

          {/* Category & Payment Method */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-white text-xs focus:outline-none truncate"
              >
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-white text-xs focus:outline-none capitalize"
              >
                <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="net_banking">Net Banking / IMPS</option>
                <option value="cash">Cash</option>
                <option value="wallet">Digital Wallet</option>
              </select>
            </div>
          </div>

          {/* Description & Optional Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">
                Description
              </label>
              <input
                type="text"
                placeholder={
                  type === 'expense'
                    ? 'e.g. Dinner with team'
                    : 'e.g. Monthly salary'
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-white text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">
                Optional Notes
              </label>
              <input
                type="text"
                placeholder="e.g. UPI Ref #49281, split with friends"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-white text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Recurring Option (For bills / SIP / recurring income) */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <input
              type="checkbox"
              id="isRecurringTx"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-emerald-500 h-4 w-4"
            />
            <label
              htmlFor="isRecurringTx"
              className="text-slate-300 font-medium cursor-pointer flex items-center gap-1.5 text-xs"
            >
              <Repeat className="h-3.5 w-3.5 text-slate-400" />
              <span>
                {type === 'expense'
                  ? 'Auto-debit recurring subscription / bill'
                  : 'Recurring monthly income'}
              </span>
            </label>
          </div>

          {/* Submit */}
          <div className="pt-2 flex gap-2.5">
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20"
            >
              {editTransaction
                ? 'Save Changes'
                : type === 'expense'
                ? 'Save Expense'
                : 'Save Income'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
