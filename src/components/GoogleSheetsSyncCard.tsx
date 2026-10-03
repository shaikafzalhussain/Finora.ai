Here is the complete, production-ready React component implementation with your current Google Sheet URL and document ID integrated:

tsx
import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Sparkles,
  CheckCircle,
  RefreshCw,
  LogIn,
  ExternalLink,
  Link2
} from 'lucide-react';
import { UserProfile, BankAccountDetails } from '../types/finance';
import {
  initGoogleAuth,
  signInWithGoogleSheets,
  getGoogleAccessToken,
  createOrGetFinoraSpreadsheet,
  appendRowToSpreadsheet,
  getSpreadsheetValues,
  extractSpreadsheetId
} from '../utils/googleSheets';
import { apiFetch } from '../utils/clientApiFallback';

// Active Google Spreadsheet URL & Document ID
const DEFAULT_SPREADSHEET_URL =
  'https://docs.google.com/spreadsheets/d/1q7ScyS4Zq4mDHw9026YDzPTyrX0zkklA6XYbElM6DcA/edit#gid=0';
const DEFAULT_SPREADSHEET_ID = '1q7ScyS4Zq4mDHw9026YDzPTyrX0zkklA6XYbElM6DcA';

interface GoogleSheetsSyncCardProps {
  userProfile: UserProfile;
  bankAccounts?: BankAccountDetails[];
  spreadsheetUrl?: string;
  spreadsheetId?: string;
}

export const GoogleSheetsSyncCard: React.FC<GoogleSheetsSyncCardProps> = ({
  userProfile,
  bankAccounts = [],
  spreadsheetUrl = DEFAULT_SPREADSHEET_URL,
  spreadsheetId = DEFAULT_SPREADSHEET_ID
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [currentSpreadsheetUrl, setCurrentSpreadsheetUrl] =
    useState<string>(spreadsheetUrl);
  const [currentSpreadsheetId, setCurrentSpreadsheetId] =
    useState<string>(spreadsheetId);

  // Initialize Google Auth on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await initGoogleAuth();
        const token = getGoogleAccessToken();
        if (token) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error initializing Google Auth:', error);
      }
    };

    initializeAuth();
  }, []);

  const handleSignIn = async () => {
    setIsLoading(true);
    setStatusMessage('');
    try {
      const success = await signInWithGoogleSheets();
      if (success) {
        setIsAuthenticated(true);
        setStatusMessage('Successfully connected to Google Sheets!');
      } else {
        setStatusMessage('Authentication was cancelled or failed.');
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      setStatusMessage('Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncData = async () => {
    if (!isAuthenticated) return;

    setIsSyncing(true);
    setStatusMessage('Syncing transactions to your spreadsheet...');

    try {
      // Ensure target sheet exists or connect to Finora sheet
      const targetId =
        currentSpreadsheetId ||
        extractSpreadsheetId(currentSpreadsheetUrl) ||
        DEFAULT_SPREADSHEET_ID;

      // Sync bank account data rows if available
      if (bankAccounts && bankAccounts.length > 0) {
        for (const account of bankAccounts) {
          const rowData = [
            new Date().toISOString(),
            account.accountName || 'Bank Account',
            account.accountType || 'N/A',
            account.balance ?? 0,
            account.currency || 'USD'
          ];
          await appendRowToSpreadsheet(targetId, 'Sheet1', rowData);
        }
      }

      setLastSynced(new Date().toLocaleTimeString());
      setStatusMessage('Spreadsheet successfully updated!');
    } catch (error) {
      console.error('Sync failed:', error);
      setStatusMessage('Sync encountered an error. Check console for details.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-lg">
                Google Sheets Sync
              </h3>
              <p className="text-sm text-slate-500">
                Sync your financial records to Finora.ai
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isAuthenticated
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {isAuthenticated ? 'Connected' : 'Not Connected'}
          </span>
        </div>

        {/* Spreadsheet Link Info */}
        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-slate-600 truncate mr-2">
            <Link2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate font-mono text-xs">
              {currentSpreadsheetUrl}
            </span>
          </div>
          <a
            href={currentSpreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs font-medium text-emerald-600 hover:text-emerald-700 shrink-0"
          >
            Open <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </a>
        </div>

        {/* Status / Message Display */}
        {statusMessage && (
          <p className="mt-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg">
            {statusMessage}
          </p>
        )}

        {lastSynced && (
          <p className="mt-2 text-xs text-slate-400 flex items-center">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mr-1" />
            Last synced at {lastSynced}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        {!isAuthenticated ? (
          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4 mr-2" />
            )}
            Connect Google Sheets
          </button>
        ) : (
          <button
            onClick={handleSyncData}
            disabled={isSyncing}
            className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-slate-200 text-sm font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`}
            />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        )}
      </div>
    </div>
  );
};

export default GoogleSheetsSyncCard;

