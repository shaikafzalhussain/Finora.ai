import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Upload,
  Check,
  Loader2,
  AlertCircle,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Category, Transaction } from '../types/finance';
import { formatCurrency } from '../utils/formatters';

interface ImportTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onImportBulk: (transactions: Omit<Transaction, 'id'>[]) => void;
}

const SAMPLE_BANK_STATEMENT = `Date,Description,Debit,Credit,RefNo
2026-10-01,UPI/SWIGGY/4291823/ORDER FOOD,420.00,,UPI10293
2026-10-01,TCS PAYROLL SALARY OCT 2026,,135000.00,SAL1001
2026-10-01,ACH DEBIT GROWW NIFTY 50 SIP,15000.00,,SIP0921
2026-10-02,POS BLINKIT COMMERCE GURGAON,1240.00,,POS9921
2026-10-02,UPI/UBER RIDES/BANGALORE,280.00,,UBER881
2026-10-02,NETFLIX INDIA SUBSCRIPTION,649.00,,REC8821`;

export const ImportTransactionsModal: React.FC<ImportTransactionsModalProps> = ({
  isOpen,
  onClose,
  categories,
  onImportBulk,
}) => {
  const [csvText, setCsvText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(reader.result as string);
    };
    reader.readAsText(file);
  };

  const handleParse = async () => {
    if (!csvText.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawCsvText: csvText,
          categories: categories.map((c) => ({ id: c.id, name: c.name })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      setParsedData(data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to parse bank statement CSV. Please verify statement rows.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (!parsedData || !parsedData.transactions) return;

    const formatted: Omit<Transaction, 'id'>[] = parsedData.transactions.map((t: any) => ({
      amount: t.amount,
      merchant: t.merchant,
      categoryId: t.categoryId || categories[0].id,
      date: t.date,
      type: t.type === 'income' ? 'income' : 'expense',
      paymentMethod: t.paymentMethod || 'net_banking',
      notes: t.notes || 'Imported from bank statement',
      tags: ['imported-statement'],
    }));

    onImportBulk(formatted);
    onClose();
    setCsvText('');
    setParsedData(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <FileSpreadsheet className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              AI Bank Statement & CSV Importer
            </h3>
            <p className="text-xs text-slate-400">
              Upload bank statement (HDFC, ICICI, SBI, Axis) or paste CSV. Gemini maps columns and auto-categorizes in ₹.
            </p>
          </div>
        </div>

        {/* Quick Sample Button */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Quick Test:</span>
          <button
            onClick={() => setCsvText(SAMPLE_BANK_STATEMENT)}
            className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            📋 Paste Sample Indian Bank Statement
          </button>
        </div>

        {/* Upload or Text Area */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer border border-slate-700 transition-colors flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              <span>Browse CSV File</span>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <span className="text-xs text-slate-500">or paste text directly below</span>
          </div>

          <textarea
            rows={5}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="Date,Description,Debit,Credit&#10;2026-10-01,SWIGGY BANGALORE,450.00,&#10;..."
            className="w-full font-mono text-xs px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-white placeholder-slate-600 focus:outline-none resize-none"
          />

          <div className="flex justify-end">
            <button
              onClick={handleParse}
              disabled={isLoading || !csvText.trim()}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-indigo-600/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>AI Parsing Statement...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Analyze & Map Transactions</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Parsed Preview Table */}
        {parsedData && (
          <div className="mt-5 p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-emerald-400">
                Found {parsedData.transactions?.length || 0} Transactions (Detected: {parsedData.detectedBank || 'Bank Statement'})
              </span>
              <span className="text-[11px] text-slate-400">Review before importing</span>
            </div>

            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {parsedData.transactions?.map((t: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800"
                >
                  <div>
                    <span className="font-bold text-slate-200 block truncate max-w-xs">{t.merchant}</span>
                    <span className="text-[10px] text-slate-400">{t.date} • {t.paymentMethod}</span>
                  </div>
                  <span className={`font-black ${
                    t.type === 'income' ? 'text-emerald-400' : 'text-slate-100'
                  }`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={handleConfirmImport}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <Check className="h-4 w-4" />
                <span>Import {parsedData.transactions?.length} Transactions</span>
              </button>
              <button
                onClick={() => setParsedData(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
              >
                Discard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
