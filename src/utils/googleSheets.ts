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

export function extractSpreadsheetId(urlOrId: string): string {
  if (!urlOrId) return '';
  const match = urlOrId.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return urlOrId.trim();
}

// Google Sheets API Helpers
export async function createOrGetFinoraSpreadsheet(accessToken: string, sheetTitle = 'Finora AI - Live User Accounts'): Promise<string> {
  const storedInput = localStorage.getItem('finora_google_spreadsheet_id');
  if (storedInput) {
    const sId = extractSpreadsheetId(storedInput);
    if (sId) {
      // Auto-initialize headers if custom sheet is empty
      try {
        const values = await getSpreadsheetValues(accessToken, sId);
        if (!values || values.length === 0) {
          await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${sId}/values/A1:G1?valueInputOption=USER_ENTERED`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                values: [[
                  'Timestamp',
                  'User Name',
                  'Phone Number',
                  'Security PIN',
                  'Bank Name',
                  'Bank Account Number',
                  'Current Balance (₹)',
                ]],
              }),
            }
          );
        }
      } catch (e) {
        console.error('Error auto-initializing headers on custom sheet:', e);
      }
      return sId;
    }
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

  try {
    await appendRowToSpreadsheet(accessToken, spreadsheetId, [
      'Timestamp',
      'User Name',
      'Phone Number',
      'Security PIN',
      'Bank Name',
      'Bank Account Number',
      'Current Balance (₹)',
    ]);
  } catch (e) {
    console.error('Error initializing headers:', e);
  }

  return spreadsheetId;
}

export async function appendRowToSpreadsheet(accessToken: string, spreadsheetIdRaw: string, rowData: (string | number)[]) {
  const spreadsheetId = extractSpreadsheetId(spreadsheetIdRaw);

  // Ensure header exists
  try {
    const values = await getSpreadsheetValues(accessToken, spreadsheetId);
    if (!values || values.length === 0) {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:G1?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: [[
              'Timestamp',
              'User Name',
              'Phone Number',
              'Security PIN',
              'Bank Name',
              'Bank Account Number',
              'Current Balance (₹)',
            ]],
          }),
        }
      );
    }
  } catch (e) {
    console.error('Header auto-setup error:', e);
  }

  const range = 'A:G';
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
    const errBody = await res.text();
    throw new Error(`Failed to append row to Google Sheet (${res.status}): ${errBody}`);
  }
  return await res.json();
}

export async function getSpreadsheetValues(accessToken: string, spreadsheetIdRaw: string): Promise<any[]> {
  const spreadsheetId = extractSpreadsheetId(spreadsheetIdRaw);
  const range = 'A:G';
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Failed to fetch Google Sheet values (${res.status}): ${errBody}`);
  }

  const data = await res.json();
  return data.values || [];
}
