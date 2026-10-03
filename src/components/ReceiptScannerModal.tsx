import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Receipt,
  Check,
  Loader2,
  AlertCircle,
  FileText,
  DollarSign,
  Tag,
  Building,
} from 'lucide-react';
import { Category, Transaction } from '../types/finance';
import { formatCurrency } from '../utils/formatters';

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
}

// Generates clear SVG/dataURL for Indian sample bills & GST receipts
function createIndianSampleReceipt(merchant: string, items: Array<{ name: string; price: string }>, total: string, gstNo = '29AABCU9603R1ZM'): string {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="400" height="520" viewBox="0 0 400 520" style="background:#ffffff; font-family:monospace;">
    <rect width="400" height="520" fill="#f8fafc" />
    <text x="200" y="45" font-size="18" font-weight="bold" fill="#0f172a" text-anchor="middle">${merchant.toUpperCase()}</text>
    <text x="200" y="68" font-size="11" fill="#64748b" text-anchor="middle">TAX INVOICE / GSTIN: ${gstNo}</text>
    <text x="200" y="86" font-size="10" fill="#94a3b8" text-anchor="middle">Date: 2026-10-02 | Bengaluru, Karnataka</text>
    <line x1="30" y1="100" x2="370" y2="100" stroke="#cbd5e1" stroke-dasharray="4" />
    ${items.map((it, idx) => `
      <text x="35" y="${128 + idx * 26}" font-size="12" fill="#334155">${it.name}</text>
      <text x="365" y="${128 + idx * 26}" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="end">${it.price}</text>
    `).join('')}
    <line x1="30" y1="360" x2="370" y2="360" stroke="#cbd5e1" stroke-dasharray="4" />
    <text x="35" y="385" font-size="12" fill="#64748b">Subtotal</text>
    <text x="365" y="385" font-size="12" fill="#334155" text-anchor="end">₹${(parseFloat(total) * 0.95).toFixed(2)}</text>
    <text x="35" y="408" font-size="11" fill="#64748b">CGST (2.5%) + SGST (2.5%)</text>
    <text x="365" y="408" font-size="11" fill="#334155" text-anchor="end">₹${(parseFloat(total) * 0.05).toFixed(2)}</text>
    <line x1="30" y1="428" x2="370" y2="428" stroke="#0f172a" stroke-width="2" />
    <text x="35" y="458" font-size="15" font-weight="bold" fill="#0f172a">TOTAL DUE (INR)</text>
    <text x="365" y="458" font-size="18" font-weight="bold" fill="#0f172a" text-anchor="end">₹${total}</text>
    <text x="200" y="495" font-size="11" fill="#94a3b8" text-anchor="middle">Paid via UPI / PhonePe (Ref: 29019283)</text>
  </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddTransaction,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setScanResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sampleType: 'dining' | 'groceries' | 'pharmacy') => {
    let img = '';
    if (sampleType === 'dining') {
      img = createIndianSampleReceipt('Punjab Grill Restaurant', [
        { name: 'Murgh Makhani Butter Chicken', price: '₹540.00' },
        { name: 'Dal Makhani Special', price: '₹380.00' },
        { name: 'Butter Garlic Naan (3x)', price: '₹180.00' },
        { name: 'Jeera Pulao Rice', price: '₹220.00' },
        { name: 'Gulab Jamun (2 pcs)', price: '₹120.00' },
      ], '1440.00');
    } else if (sampleType === 'groceries') {
      img = createIndianSampleReceipt('Blinkit Commerce Instant', [
        { name: 'Aashirvaad Shudh Chakki Atta 5kg', price: '₹265.00' },
        { name: 'Fortune Sunlite Sunflower Oil 1L', price: '₹145.00' },
        { name: 'Amul Pasteurised Butter 500g', price: '₹285.00' },
        { name: 'Tata Tea Gold 500g', price: '₹310.00' },
        { name: 'Fresh Organic Onions 2kg', price: '₹75.00' },
      ], '1080.00');
    } else {
      img = createIndianSampleReceipt('Apollo Pharmacy Retail', [
        { name: 'Dolo 650 Strip (15 tabs)', price: '₹32.00' },
        { name: 'Becozinc Multivitamins 30s', price: '₹185.00' },
        { name: 'Hansaplast Washproof Plasters', price: '₹60.00' },
        { name: 'Vicks Vaporub 50g', price: '₹155.00' },
      ], '432.00');
    }

    setSelectedImage(img);
    setMimeType('image/svg+xml');
    setScanResult(null);
    setError(null);
  };

  const handleScan = async () => {
    if (!selectedImage) return;

    setIsScanning(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType,
          categories: categories.map((c) => ({ id: c.id, name: c.name })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      setScanResult(data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to scan receipt image. Please ensure invoice text and ₹ total are legible.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmAndAdd = () => {
    if (!scanResult) return;
    onAddTransaction({
      amount: scanResult.totalAmount,
      merchant: scanResult.merchant,
      categoryId: scanResult.categorySuggestion || categories[1].id,
      date: scanResult.date || new Date().toISOString().split('T')[0],
      type: 'expense',
      paymentMethod: (scanResult.paymentMethod as any) || 'upi',
      description: scanResult.notes || `Scanned bill with ${scanResult.lineItems?.length || 0} line items`,
      tags: ['receipt-ocr'],
    });
    onClose();
    setSelectedImage(null);
    setScanResult(null);
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
          <div className="p-2 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Camera className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              AI Smart Bill & Receipt OCR Scanner (INR ₹)
            </h3>
            <p className="text-xs text-slate-400">
              Upload GST tax invoice, Swiggy bill, or store slip. Gemini Vision extracts items, GST & total.
            </p>
          </div>
        </div>

        {/* Indian Sample Presets */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Quick Test with Sample:</span>
          <button
            onClick={() => handleSelectSample('dining')}
            className="px-2.5 py-1 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            🍽️ Restaurant Bill (₹1,440)
          </button>
          <button
            onClick={() => handleSelectSample('groceries')}
            className="px-2.5 py-1 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            🛒 Blinkit Slip (₹1,080)
          </button>
          <button
            onClick={() => handleSelectSample('pharmacy')}
            className="px-2.5 py-1 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            💊 Apollo Pharmacy (₹432)
          </button>
        </div>

        {/* Upload Dropzone */}
        <div className="mt-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />

          {!selectedImage ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-slate-950/40"
            >
              <Upload className="h-8 w-8 text-slate-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">
                Click to browse photo or drag & drop invoice image
              </p>
              <p className="text-xs text-slate-500 mt-1">
                PNG, JPG, WEBP, or test with Indian samples above
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Receipt className="h-3.5 w-3.5 text-blue-400" />
                  <span>Invoice Image Loaded</span>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                  >
                    Change
                  </button>
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setScanResult(null);
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="flex justify-center max-h-56 overflow-hidden rounded-xl bg-slate-900 border border-slate-800/80 p-2">
                <img
                  src={selectedImage}
                  alt="Bill Preview"
                  className="max-h-52 object-contain rounded-lg"
                />
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleScan}
                  disabled={isScanning}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 disabled:opacity-50"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Gemini OCR Scanning in ₹...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4" />
                      <span>Analyze & Extract Bill Items</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scan Result or Invalid Bill / Ambiguous State */}
        {scanResult && (
          <div className="mt-5 animate-in fade-in space-y-4">
            {/* 1. Invalid Bill or Receipt Screen (Requirement 20 & 21) */}
            {scanResult.isValidReceipt === false ? (
              <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h4 className="text-base font-extrabold text-white">
                  Invalid Bill or Receipt
                </h4>
                <p className="text-xs text-rose-200 max-w-md mx-auto leading-relaxed">
                  We couldn't identify a valid bill or receipt in this image.
                </p>
                <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                  Please upload a clear image of a bill, receipt, invoice, or payment document.
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setScanResult(null);
                      setSelectedImage(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
                  >
                    Try Another Image
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : scanResult.isAmbiguous || (typeof scanResult.confidence === 'number' && scanResult.confidence < 0.6) ? (
              /* 2. Low Confidence / Ambiguous Receipt Screen (Requirement 22) */
              <div className="p-6 rounded-2xl bg-amber-950/40 border border-amber-800/80 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h4 className="text-base font-extrabold text-white">
                  We couldn't confidently read this receipt.
                </h4>
                <div className="text-xs text-amber-200 max-w-md mx-auto leading-relaxed space-y-1">
                  <p>Please:</p>
                  <ul className="text-[11px] text-slate-300 list-disc list-inside space-y-0.5 text-left inline-block">
                    <li>Upload a clearer image</li>
                    <li>Retake the photo with better lighting</li>
                    <li>Ensure the complete receipt and total amount are visible</li>
                  </ul>
                </div>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setScanResult(null);
                      setSelectedImage(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
                  >
                    Try Another Image
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* 3. Valid Confirmed Receipt Extraction (Requirement 23) */
              <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/40 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      OCR Extracted Successfully
                    </span>
                    <h4 className="text-lg font-black text-white">
                      {scanResult.merchant || 'Store Bill'}
                    </h4>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Total Due</div>
                    <div className="text-xl font-black text-emerald-400 font-mono">
                      {formatCurrency(scanResult.totalAmount || 0)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Date</span>
                    <span className="font-semibold text-slate-200 font-mono">{scanResult.date}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Category</span>
                    <span className="font-semibold text-slate-200">
                      {categories.find((c) => c.id === scanResult.categorySuggestion)?.name || scanResult.categorySuggestion || 'General'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Tax (GST)</span>
                    <span className="font-semibold text-slate-200 font-mono">
                      {formatCurrency(scanResult.taxAmount || 0)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Payment Method</span>
                    <span className="font-semibold text-slate-200 uppercase">
                      {scanResult.paymentMethod || 'UPI'}
                    </span>
                  </div>
                </div>

                {/* Line items */}
                {scanResult.lineItems && scanResult.lineItems.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-slate-300 block mb-2">
                      Line Items ({scanResult.lineItems.length}):
                    </span>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                      {scanResult.lineItems.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-slate-900/70 border border-slate-800/80"
                        >
                          <span className="text-slate-300 truncate max-w-[280px]">
                            {item.name}
                          </span>
                          <span className="font-semibold text-slate-200 font-mono">
                            {formatCurrency(item.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {scanResult.notes && (
                  <p className="text-[11px] text-slate-400 italic">
                    Note: {scanResult.notes}
                  </p>
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={handleConfirmAndAdd}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    <Check className="h-4 w-4" />
                    <span>Confirm & Add to Passbook ({formatCurrency(scanResult.totalAmount || 0)})</span>
                  </button>
                  <button
                    onClick={() => {
                      setScanResult(null);
                      setSelectedImage(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
