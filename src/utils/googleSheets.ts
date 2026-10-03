import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithRedirect, getRedirectResult, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let cachedAccessToken: string | null = null;

export const initGoogleAuth = async (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        cachedAccessToken = credential.accessToken;
        if (onAuthSuccess) onAuthSuccess(result.user, cachedAccessToken);
        return;
      }
    }
  } catch (err) {
    console.error('Error handling redirect result:', err);
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGoogleSheets = async () => {
  await signInWithRedirect(auth, provider);
};

export const getGoogleAccessToken = () => cachedAccessToken;

export const signOutGoogleSheets = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// Google Sheets API Helpers
export async function createOrGetFinoraSpreadsheet(accessToken: string, sheetTitle = 'Finora AI - Live User Accounts'): Promise<string> {
  const storedId = localStorage.getItem('finora_google_spreadsheet_id');
  if (storedId) {
    return storedId;
  }

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title: sheetTitle },
      sheets: [{ properties: { title: 'Users & Balances' } }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to create Google Sheet: ${res.statusText}`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  localStorage.setItem('finora_google_spreadsheet_id', spreadsheetId);

  await appendRowToSpreadsheet(accessToken, spreadsheetId, [
    'Timestamp',
    'User Name',
    'Phone Number',
    'Security PIN',
    'Bank Name',
    'Bank Account Number',
    'Current Balance (₹)',
  ]);

  return spreadsheetId;
}

export async function appendRowToSpreadsheet(accessToken: string, spreadsheetId: string, rowData: (string | number)[]) {
  const range = 'Users & Balances!A:G';
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowData],
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to append row to Google Sheet: ${res.statusText}`);
  }
  return await res.json();
}

export async function getSpreadsheetValues(accessToken: string, spreadsheetId: string): Promise<any[]> {
  const range = 'Users & Balances!A:G';
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Google Sheet values: ${res.statusText}`);
  }

  const data = await res.json();
  return data.values || [];
}
