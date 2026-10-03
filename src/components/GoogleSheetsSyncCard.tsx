import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Sparkles, CheckCircle, RefreshCw, LogIn, ExternalLink } from 'lucide-react';
import { UserProfile, BankAccountDetails } from '../types/finance';
import { initGoogleAuth, signInWithGoogleSheets, getGoogleAccessToken, createOrGetFinoraSpreadsheet, appendRowToSpreadsheet, getSpreadsheetValues } from '../utils/googleSheets';

interface GoogleSheetsSyncCardProps {
  userProfile: UserProfile;
  bankAccounts?: BankAccountDetails[];
}

export const GoogleSheetsSyncCard: React.FC<GoogleSheetsSyncCardProps> = ({ userProfile, bankAccounts }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(localStorage.getItem('finora_google_spreadsheet_id'));
  const [sheetRows, setSheetRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let unsub: any = null;
    initGoogleAuth(
      (_user, token) => {
        setIsAuthenticated(true);
        loadSheetData(token);
      },
      () => {
        setIsAuthenticated(false);
      }
    ).then((res) => {
      if (typeof res === 'function') unsub = res;
    });

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      await signInWithGoogleSheets();
    } catch (err: any) {
      setError(err.message || 'Google authentication failed.');
      setIsSigningIn(false);
    }
  };

  const loadSheetData = async (token: string) => {
    try {
      const sId = await createOrGetFinoraSpreadsheet(token);
      setSpreadsheetId(sId);
      const rows = await getSpreadsheetValues(token, sId);
      setSheetRows(rows);
    } catch (err: any) {
      console.error('Error loading sheet data:', err);
    }
  };

  const handleSyncToSheets = async () => {
    const token = getGoogleAccessToken();
    if (!token) {
      setError('Please sign in with Google first.');
      return;
    }

    setIsSyncing(true);
    setError(null);
    try {
      const sId = await createOrGetFinoraSpreadsheet(token);
      setSpreadsheetId(sId);

      const primaryBank = bankAccounts && bankAccounts.length > 0 ? bankAccounts[0] : userProfile.bankDetails;
      const bankName = primaryBank?.bankName || 'HDFC Bank';
      const bankNumber = primaryBank?.accountNumberMasked || primaryBank?.rawAccountNumber || '****4821';
      const balance = primaryBank?.balance ?? 72500;
      const pin = userProfile.password || '••••';

      const timestamp = new Date().toLocaleString();
      const rowData = [
        timestamp,
        userProfile.name || 'Afzal Hussain',
        userProfile.phone || '9876504821',
        pin,
        bankName,
        bankNumber,
        balance,
      ];

      await appendRowToSpreadsheet(token, sId, rowData);
      await loadSheetData(token);
      setSuccessMessage('User data synced to Google Sheets in real-time!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to sync with Google Sheets.');
    } finally {
      setIsSyncing(false);
    }
  };

  const sheetUrl = spreadsheetId ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` : '#';

  return (
    <div className="rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-800/40 p-6 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold mb-1">
              <Sparkles className="h-3 w-3" />
              <span>Google Sheets Integration</span>
            </div>
            <h3 className="text-lg font-black text-white">Real-Time User Data Sync</h3>
            <p className="text-xs text-slate-300">
              Sync user name, phone, security PIN, bank name, account number, and balance to Google Sheets.
            </p>
          </div>
        </div>

        {!isAuthenticated ? (
          <button
            onClick={handleGoogleLogin}
            disabled={isSigningIn}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-md transition-all disabled:opacity-50"
          >
            <LogIn className="h-4 w-4 text-emerald-600" />
            <span>{isSigningIn ? 'Redirecting to Google...' : 'Sign in with Google'}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncToSheets}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now to Sheets'}</span>
            </button>
            {spreadsheetId && (
              <a
                href={sheetUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold text-xs transition-colors"
                title="Open Google Sheet"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">Open Sheet</span>
              </a>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/50 text-rose-300 text-xs font-semibold">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {isAuthenticated && sheetRows.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Live Google Sheets Records ({sheetRows.length - 1} users)</span>
            <span className="text-[10px] text-emerald-400 font-semibold">● Connected & Live</span>
          </div>

          <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold sticky top-0">
                  {sheetRows[0]?.map((header: string, idx: number) => (
                    <th key={idx} className="p-2.5">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {sheetRows.slice(1).map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-900/40 transition-colors">
                    {row.map((cell: any, cIdx: number) => (
                      <td key={cIdx} className="p-2.5 truncate max-w-[140px]">
                        {cIdx === 3 ? '••••' : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
