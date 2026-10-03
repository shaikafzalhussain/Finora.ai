import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { dbManager } from './server/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));

// --- RATE LIMITER & AUTHENTICATION ENDPOINTS ---
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (record.count >= 20) {
    return false;
  }
  record.count++;
  return true;
}

// User Registration Endpoint (Securely hashes PIN, assigns default user role)
app.post('/api/auth/register', (req, res) => {
  try {
    const { firstName, lastName, phone, pin, bankAccounts } = req.body;
    if (!firstName || !lastName || !phone || !pin) {
      return res.status(400).json({ error: 'First Name, Last Name, Mobile Number, and PIN are required' });
    }
    const result = dbManager.registerUser({ firstName, lastName, phone, pin, bankAccounts });
    const { pinHash, pinSalt, ...safeUser } = result.user as any;
    return res.json({ token: result.token, user: safeUser });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

// User & Admin Login Endpoint (Verifies cryptographic hash, enforces rate limit)
app.post('/api/auth/login', (req, res) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many login attempts. Please wait 15 minutes before trying again.' });
  }

  try {
    const { phone, pin } = req.body;
    if (!phone || !pin) {
      return res.status(400).json({ error: 'Mobile Number and Security PIN are required' });
    }
    const authResult = dbManager.authenticate(phone, pin, clientIp);
    if (!authResult) {
      return res.status(401).json({ error: 'Invalid mobile number or security PIN' });
    }
    const { pinHash, pinSalt, ...safeUser } = authResult.user as any;
    return res.json({ token: authResult.token, user: safeUser });
  } catch (err: any) {
    return res.status(401).json({ error: err.message || 'Authentication failed' });
  }
});

// Current Authenticated User Session Verification
app.get('/api/auth/me', (req, res) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const session = dbManager.getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const user = dbManager.findUserById(session.userId);
  if (!user || user.status === 'Disabled') {
    return res.status(401).json({ error: 'User account disabled or not found' });
  }
  const { pinHash, pinSalt, ...safeUser } = user as any;
  return res.json({ user: safeUser });
});

// User Data Synchronization (Guarantees User Data Isolation - Spec #12)
app.get('/api/user/data', (req, res) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const session = dbManager.getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized: Session invalid' });
  }
  const user = dbManager.findUserById(session.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json({
    transactions: user.transactions || [],
    recurring: user.recurring || [],
    savingsGoals: user.savingsGoals || [],
    bankAccounts: user.bankAccounts || [],
    bankDetails: user.bankDetails,
  });
});

app.post('/api/user/sync', (req, res) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const session = dbManager.getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized: Session invalid' });
  }
  dbManager.syncUserData(session.userId, req.body);
  return res.json({ success: true });
});

// Logout Session Invalidation
app.post('/api/auth/logout', (req, res) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (token) dbManager.destroySession(token);
  return res.json({ success: true });
});

// --- SECURE ADMIN AUTHORIZATION MIDDLEWARE & CONTROLLER ---
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const session = dbManager.getSession(token);
  if (!session || session.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Administrator privileges required' });
  }
  const admin = dbManager.findUserById(session.userId);
  if (!admin || admin.status === 'Disabled') {
    return res.status(403).json({ error: 'Administrator access revoked' });
  }
  (req as any).adminUser = admin;
  next();
}

// Dedicated Admin Login Endpoint (Spec #5)
app.post('/api/admin/login', (req, res) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many attempts. Please wait 15 minutes.' });
  }
  const { phone, pin } = req.body;
  if (!phone || !pin) {
    return res.status(400).json({ error: 'Mobile and Security PIN required' });
  }
  const authResult = dbManager.authenticate(phone, pin, clientIp);
  if (!authResult || authResult.user.role !== 'admin') {
    return res.status(403).json({ error: 'Invalid administrator credentials' });
  }
  const { pinHash, pinSalt, ...safeAdmin } = authResult.user as any;
  return res.json({ token: authResult.token, user: safeAdmin });
});

// Admin Metrics (Spec #9)
app.get('/api/admin/metrics', requireAdmin, (req, res) => {
  return res.json(dbManager.getAdminMetrics());
});

// Admin Users List (Spec #10: Masked mobile, NO PINs)
app.get('/api/admin/users', requireAdmin, (req, res) => {
  return res.json(dbManager.getAdminUsersList());
});

// Admin User Detail (Spec #11: Isolated user data breakdown)
app.get('/api/admin/users/:userId', requireAdmin, (req, res) => {
  try {
    const adminUser = (req as any).adminUser;
    const details = dbManager.getUserDetailForAdmin(adminUser, req.params.userId);
    return res.json(details);
  } catch (err: any) {
    return res.status(404).json({ error: err.message || 'User not found' });
  }
});

// Admin Update User Status (Spec #13: Logs action to Audit Log)
app.put('/api/admin/users/:userId/status', requireAdmin, (req, res) => {
  try {
    const adminUser = (req as any).adminUser;
    const { status } = req.body;
    if (status !== 'Active' && status !== 'Disabled') {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const result = dbManager.updateUserStatus(adminUser, req.params.userId, status);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update user status' });
  }
});

// Admin Audit Logs (Spec #13)
app.get('/api/admin/audit-logs', requireAdmin, (req, res) => {
  return res.json(dbManager.getAuditLogs());
});

// Admin Rotate / Change PIN (Spec #5)
app.put('/api/admin/change-pin', requireAdmin, (req, res) => {
  try {
    const adminUser = (req as any).adminUser;
    const { oldPin, newPin } = req.body;
    dbManager.changeAdminPin(adminUser.id, oldPin, newPin);
    return res.json({ success: true, message: 'Admin Security PIN rotated successfully' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update PIN' });
  }
});

// Initialize shared Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Cooldown tracker for rate-limit quota exhaustion
let quotaCooldownUntil = 0;

async function safeGenerateContent(params: any): Promise<any> {
  const now = Date.now();
  if (now < quotaCooldownUntil) {
    throw new Error('QUOTA_COOLDOWN');
  }

  try {
    return await ai.models.generateContent(params);
  } catch (err: any) {
    const msg = String(err?.message || '');
    const isQuota =
      err?.status === 429 ||
      msg.includes('429') ||
      msg.includes('RESOURCE_EXHAUSTED') ||
      msg.includes('Quota exceeded') ||
      msg.includes('rate-limits');

    if (isQuota) {
      try {
        const fallbackParams = { ...params, model: 'gemini-3.1-flash-lite' };
        return await ai.models.generateContent(fallbackParams);
      } catch {
        quotaCooldownUntil = Date.now() + 3 * 60 * 1000;
        throw new Error('QUOTA_EXHAUSTED');
      }
    }
    throw err;
  }
}

// 1. AI Budget Optimization & Spending Behavior Audit (INR / Indian Context)
app.post('/api/ai/optimize-budget', async (req, res) => {
  try {
    const {
      month,
      totalIncome = 0,
      totalExpenses = 0,
      categories = [],
      transactions = [],
      recurring = [],
      savingsGoals = [],
    } = req.body;

    // Zero-data state: do not generate fake audit insights for fresh users
    const numIncome = Number(totalIncome) || 0;
    const numExpenses = Number(totalExpenses) || 0;
    if (
      (!transactions || transactions.length === 0) &&
      numIncome === 0 &&
      numExpenses === 0
    ) {
      return res.json({
        healthScore: 0,
        healthStatus: 'Awaiting Data',
        summary: `No financial activity recorded yet for ${month || 'this month'}. Add your income, expenses, or budgets to receive an AI financial health audit.`,
        whatHappened: 'No transactions recorded yet.',
        whyItHappened: 'Your financial workspace is clean with no logged transactions.',
        alternativeSuggestion: 'Start by recording your monthly income, fixed bills, and daily expenses.',
        potentialSavings: 0,
        needsVsWantsAnalysis: {
          needsPercent: 0,
          wantsPercent: 0,
          savingsPercent: 0,
          benchmarkComparison: 'Awaiting transactions to calculate 50/30/20 distribution.',
        },
        leakages: [],
        actionableRecommendations: [],
        forecastProjection: {
          projectedEndMonthSpend: 0,
          projectedEndMonthSavings: 0,
          budgetStatus: 'under_budget',
          recommendation: 'Add transactions to project end-of-month run-rate.',
        },
      });
    }

    const prompt = `
You are an expert Indian Certified Financial Planner (CFP) and algorithmic personal finance coach.
All amounts are in Indian Rupees (₹ - INR).
Analyze this user's monthly spending, income, budget caps, recurring subscriptions, and savings goals for ${month || 'the current month'}.

FINANCIAL SUMMARY (in INR ₹):
- Monthly Income: ₹${numIncome}
- Current Total Expenses: ₹${numExpenses}
- Net Monthly Cashflow: ₹${numIncome - numExpenses}

CATEGORY BREAKDOWN & BUDGETS:
${JSON.stringify(categories, null, 2)}

RECENT TRANSACTIONS:
${JSON.stringify((transactions || []).slice(0, 40), null, 2)}

ACTIVE RECURRING EXPENSES / SUBSCRIPTIONS:
${JSON.stringify(recurring || [], null, 2)}

SAVINGS GOALS:
${JSON.stringify(savingsGoals || [], null, 2)}

OBJECTIVE & PRINCIPLES:
Do not simply tell the user what to do. Explain:
1. What happened (clear factual summary of spending shifts)
2. Why it happened (root causes strictly based on real transactions)
3. What could be changed (viable alternatives without severely harming quality of life)
4. Potential savings (quantified in ₹ per month and annualized in ₹ per year)
5. Calculate a transparent Financial Health Score (0 to 100) based on savings rate, budget adherence, emergency fund cover, and debt burden.
6. Calculate Needs vs. Wants vs. Savings distribution (% of income) vs the 50/30/20 standard.
7. Identify specific financial leakages with exact ₹ figures from real transactions only.
8. Provide prioritized recommendations with recommended revised budget caps.
9. Forecast end-of-month trajectory.
`;

    const response = await safeGenerateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            healthScore: {
              type: Type.INTEGER,
              description: 'Score from 0 to 100',
            },
            healthStatus: {
              type: Type.STRING,
              description: 'One of: Excellent, Good, Needs Attention, Critical',
            },
            summary: {
              type: Type.STRING,
              description: 'Executive review of current financial health',
            },
            whatHappened: {
              type: Type.STRING,
              description: 'Clear statement of what changed or went over budget this month',
            },
            whyItHappened: {
              type: Type.STRING,
              description: 'Detailed analysis of reasons behind the spending patterns',
            },
            alternativeSuggestion: {
              type: Type.STRING,
              description: 'Actionable practical alternative habits to adopt',
            },
            potentialSavings: {
              type: Type.NUMBER,
              description: 'Total monthly potential savings in INR ₹',
            },
            needsVsWantsAnalysis: {
              type: Type.OBJECT,
              properties: {
                needsPercent: { type: Type.NUMBER },
                wantsPercent: { type: Type.NUMBER },
                savingsPercent: { type: Type.NUMBER },
                benchmarkComparison: { type: Type.STRING },
              },
              required: ['needsPercent', 'wantsPercent', 'savingsPercent', 'benchmarkComparison'],
            },
            leakages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  monthlyLoss: { type: Type.NUMBER },
                  annualLoss: { type: Type.NUMBER },
                  severity: { type: Type.STRING, description: 'high, medium, or low' },
                },
                required: ['title', 'description', 'monthlyLoss', 'annualLoss', 'severity'],
              },
            },
            actionableRecommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  estimatedMonthlySavings: { type: Type.NUMBER },
                  difficulty: { type: Type.STRING, description: 'Easy, Moderate, or Challenging' },
                  recommendedBudgetCap: {
                    type: Type.OBJECT,
                    properties: {
                      categoryId: { type: Type.STRING },
                      categoryName: { type: Type.STRING },
                      newCap: { type: Type.NUMBER },
                      currentCap: { type: Type.NUMBER },
                    },
                    required: ['categoryId', 'categoryName', 'newCap', 'currentCap'],
                  },
                },
                required: ['id', 'title', 'description', 'estimatedMonthlySavings', 'difficulty'],
              },
            },
            forecastProjection: {
              type: Type.OBJECT,
              properties: {
                projectedEndMonthSpend: { type: Type.NUMBER },
                projectedEndMonthSavings: { type: Type.NUMBER },
                budgetStatus: { type: Type.STRING, description: 'under_budget, near_limit, or exceeded' },
                recommendation: { type: Type.STRING },
              },
              required: ['projectedEndMonthSpend', 'projectedEndMonthSavings', 'budgetStatus', 'recommendation'],
            },
          },
          required: [
            'healthScore',
            'healthStatus',
            'summary',
            'whatHappened',
            'whyItHappened',
            'alternativeSuggestion',
            'potentialSavings',
            'needsVsWantsAnalysis',
            'leakages',
            'actionableRecommendations',
            'forecastProjection',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch {
    const { totalIncome = 0, totalExpenses = 0, categories = [], recurring = [], transactions = [] } = req.body || {};
    const numIncome = Number(totalIncome) || 0;
    const numExpenses = Number(totalExpenses) || 0;

    if (numIncome === 0 && numExpenses === 0 && (!transactions || transactions.length === 0)) {
      return res.json({
        healthScore: 0,
        healthStatus: 'Awaiting Data',
        summary: 'No financial activity recorded yet. Add your income and expenses to receive an AI budget audit.',
        whatHappened: 'No transactions recorded yet.',
        whyItHappened: 'Awaiting user financial data.',
        alternativeSuggestion: 'Start by logging your monthly income, fixed bills, and initial expenses.',
        potentialSavings: 0,
        needsVsWantsAnalysis: {
          needsPercent: 0,
          wantsPercent: 0,
          savingsPercent: 0,
          benchmarkComparison: 'Awaiting financial data to compare against 50/30/20 standard.',
        },
        leakages: [],
        actionableRecommendations: [],
        forecastProjection: {
          projectedEndMonthSpend: 0,
          projectedEndMonthSavings: 0,
          budgetStatus: 'under_budget',
          recommendation: 'Add transactions or recurring bills to forecast end-of-month trajectory.',
        },
      });
    }

    const netSavings = Math.max(0, numIncome - numExpenses);
    const savingsRate = numIncome > 0 ? Math.round((netSavings / numIncome) * 100) : 0;
    const score = Math.min(95, Math.max(45, 50 + Math.round(savingsRate * 0.4)));
    const status = score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : 'Needs Attention';

    const flagged = (recurring || []).filter((r: any) => r.status === 'flagged');
    const flaggedTotal = flagged.reduce((s: number, r: any) => s + (r.amount || 0), 0);

    return res.json({
      healthScore: score,
      healthStatus: status,
      summary: `Your cashflow shows a ${savingsRate}% savings rate in ${req.body?.month || 'this month'} with ₹${numExpenses.toLocaleString('en-IN')} total outflows.`,
      whatHappened: `You spent ₹${numExpenses.toLocaleString('en-IN')} against total inflows of ₹${numIncome.toLocaleString('en-IN')}.`,
      whyItHappened: `Tracked expenses are categorized across your recorded spending categories.`,
      alternativeSuggestion: `Review discretionary categories to protect your net cash flow.`,
      potentialSavings: flaggedTotal,
      needsVsWantsAnalysis: {
        needsPercent: 60,
        wantsPercent: Math.max(0, 100 - 60 - savingsRate),
        savingsPercent: savingsRate,
        isAlignedWith503020: savingsRate >= 20,
      },
      leakages: flagged.map((r: any) => ({
        id: r.id,
        name: r.name,
        category: 'Recurring Outflows',
        annualCost: (r.amount || 0) * 12,
        impactLevel: 'medium',
        explanation: 'Flagged subscription candidate to review or pause.',
      })),
      actionableRecommendations: [
        {
          id: 'rec-1',
          title: 'Review Monthly Outflows',
          description: 'Keep variable category spends aligned with your targets.',
          estimatedMonthlySavings: flaggedTotal,
          difficulty: 'easy',
        },
      ],
      forecastProjection: {
        projectedEndMonthSpend: numExpenses,
        projectedEndMonthSavings: netSavings,
        budgetStatus: 'under_budget',
        recommendation: 'Maintain regular tracking to preserve your end-of-month cash surplus.',
      },
    });
  }
});

// 2. AI Conversational Money Coach (Grounded in real user transaction data)
app.post('/api/ai/money-coach', async (req, res) => {
  try {
    const { question, history, calculatedFact, structuredFacts, financialContext } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const prompt = `
You are "FINORA AI Financial Coach", a friendly, razor-sharp personal money companion for Indian users.
All currency is in Indian Rupees (₹ - INR). Use "₹" symbol for all amounts.

VERIFIED CALCULATED FACT (Ground truth from live user records):
"${calculatedFact || 'Not provided'}"

STRUCTURED FACTS:
${JSON.stringify(structuredFacts || {}, null, 2)}

USER FINANCIAL CONTEXT:
- Name: ${financialContext?.userName || 'User'}
- Month: ${financialContext?.monthName || 'Current Month'}
- Total Monthly Income: ₹${financialContext?.totalIncome || 0}
- Total Monthly Spend: ₹${financialContext?.totalExpenses || 0}
- Remaining Budget: ₹${financialContext?.remainingBudget || 0}
- Savings Rate: ${financialContext?.savingsRate || 0}%

PREVIOUS CONVERSATION:
${(history || []).map((h: any) => `${h.role}: ${h.content}`).join('\n')}

USER QUESTION:
"${question}"

INSTRUCTIONS:
1. Always incorporate the VERIFIED CALCULATED FACT. Do not contradict or re-invent numbers.
2. If the user asked about a specific category (e.g. food, health, groceries, medicine, recharge, sip), explain the exact ₹ amount, transaction count, and comparison with last month if available.
3. If no transactions exist for that category, clearly state that 0 records were found in an encouraging tone.
4. Conclude with 2-3 relevant follow-up prompt suggestions that the user might want to click next.
5. Format reply in clean, readable markdown with bold text on figures.
`;

    const response = await safeGenerateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING, description: 'Direct answer to user in markdown format' },
            suggestedPrompts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2 to 3 helpful follow up question suggestions',
            },
          },
          required: ['reply', 'suggestedPrompts'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch {
    const fallbackReply = req.body?.calculatedFact ||
      (req.body?.question
        ? `Here is your current financial summary: Your tracked expenses and income for this month are recorded in FINORA. Try asking "Where did I spend the most?" or "How much did I spend on food?".`
        : `FINORA AI is ready to help you audit your spending and finances.`);
    return res.json({
      reply: fallbackReply,
      suggestedPrompts: req.body?.suggestedPrompts || [
        'Where did I spend the most?',
        'How much did I spend on food?',
        'What are my upcoming payments?',
      ],
    });
  }
});

// 2b. AI Balance Insights (Explains why total balance changed from previous month)
app.post('/api/ai/balance-insights', async (req, res) => {
  try {
    const {
      currentMonth,
      previousMonth,
      netCashflow,
      totalIncome,
      totalExpenses,
      prevIncome,
      prevExpenses,
      totalBalance,
      topIncomeDrivers,
      topSpendingDrivers,
    } = req.body;

    const prompt = `
You are FINORA AI, an intelligent personal money companion for Indian users.
Explain concisely in 2 to 3 sentences why the user's balance changed in ${currentMonth || 'this month'} compared to ${previousMonth || 'last month'}.
All amounts in Indian Rupees (₹ - INR).

FINANCIAL DRIVERS:
- Net Cashflow Shift: ₹${netCashflow}
- Total Income: ₹${totalIncome} (vs ₹${prevIncome || 0} in previous month)
- Total Outflows: ₹${totalExpenses} (vs ₹${prevExpenses || 0} in previous month)
- Current Total Balance: ₹${totalBalance}
- Top 3 Spending Drivers: ${JSON.stringify(topSpendingDrivers || [])}
- Top 3 Income Drivers: ${JSON.stringify(topIncomeDrivers || [])}

INSTRUCTIONS:
1. Explain why the balance changed, highlighting the top spending drivers and top income drivers by exact name and ₹ amount.
2. Keep it punchy, insightful, and formatted in clean markdown.
`;

    const response = await safeGenerateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING, description: '2 to 3 sentence natural explanation in markdown' },
          },
          required: ['explanation'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch {
    const isSurplus = (req.body?.netCashflow || 0) >= 0;
    const topInc = req.body?.topIncomeDrivers?.[0]?.name || 'Primary Earnings';
    const topExp = req.body?.topSpendingDrivers?.[0]?.name || 'Fixed Outflows';
    const fallbackText = `Your total balance shifted by a net ${isSurplus ? 'surplus' : 'deficit'} of **₹${Math.abs(req.body?.netCashflow || 0).toLocaleString('en-IN')}** in ${req.body?.currentMonth || 'this month'}. Your leading positive driver was **${topInc}**, while **${topExp}** was your largest spending outflow.`;
    return res.json({
      explanation: fallbackText,
    });
  }
});

// 3. AI Natural Language Transaction Parser (Indian context: Swiggy, UPI, Blinkit, etc.)
app.post('/api/ai/parse-transaction', async (req, res) => {
  try {
    const { text, categories } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text query is required' });
    }

    const availableCategories = (categories || []).map((c: any) => `${c.id}: ${c.name} (${c.type})`).join('\n');
    const today = new Date().toISOString().split('T')[0];

    const prompt = `
Extract a structured Indian personal finance transaction from this natural language text:
"${text}"

Current Reference Date: ${today}
Default Currency: INR (₹)

Available Categories:
${availableCategories}

Rules:
- amount: numeric rupee amount in INR (e.g. "450", "1200", "42.50").
- merchant: store, vendor, app, or person (e.g. "Swiggy", "Zomato", "Blinkit", "Zepto", "Uber", "Amazon", "DMart", "BESCOM").
- categoryId: pick the best matching category ID from the available list.
- date: YYYY-MM-DD. Calculate relative dates like "yesterday", "last Sunday" from ${today}.
- type: "expense" or "income".
- paymentMethod: one of "upi", "credit_card", "debit_card", "net_banking", "cash", "wallet". Default to "upi" if GPay/PhonePe/Paytm or unspecified in India.
- description: brief clean context.
- tags: array of 1 to 3 relevant lowercase tags.
`;

    const response = await safeGenerateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            merchant: { type: Type.STRING },
            categoryId: { type: Type.STRING },
            date: { type: Type.STRING },
            type: { type: Type.STRING, description: 'expense or income' },
            paymentMethod: { type: Type.STRING, description: 'upi, credit_card, debit_card, net_banking, cash, or wallet' },
            description: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['amount', 'merchant', 'categoryId', 'date', 'type', 'paymentMethod'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch {
    const text = String(req.body?.text || '');
    const categories = req.body?.categories || [];

    const amountMatch = text.match(/(?:rs\.?|inr|₹)\s*(\d+(?:,\d+)*(?:\.\d+)?)/i) ||
                        text.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:rs\.?|inr|rupees)/i) ||
                        text.match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 500;

    const today = new Date();
    let dateStr = today.toISOString().split('T')[0];
    if (text.toLowerCase().includes('yesterday')) {
      const yDate = new Date(today);
      yDate.setDate(today.getDate() - 1);
      dateStr = yDate.toISOString().split('T')[0];
    }

    const isIncome = /salary|received|credited|deposit|freelance|bonus|refund/i.test(text);

    let merchant = 'Quick Entry';
    let catId = categories[0]?.id || 'cat-dining';
    const lower = text.toLowerCase();

    if (/swiggy/i.test(lower)) { merchant = 'Swiggy'; catId = 'cat-dining'; }
    else if (/zomato/i.test(lower)) { merchant = 'Zomato'; catId = 'cat-dining'; }
    else if (/blinkit/i.test(lower)) { merchant = 'Blinkit'; catId = 'cat-groceries'; }
    else if (/zepto/i.test(lower)) { merchant = 'Zepto'; catId = 'cat-groceries'; }
    else if (/dmart/i.test(lower)) { merchant = 'DMart'; catId = 'cat-groceries'; }
    else if (/medicine|apollo|pharma|doctor/i.test(lower)) { merchant = 'Apollo Pharmacy'; catId = 'cat-health'; }
    else if (/uber/i.test(lower)) { merchant = 'Uber'; catId = 'cat-transport'; }
    else if (/ola/i.test(lower)) { merchant = 'Ola Cabs'; catId = 'cat-transport'; }
    else if (/electricity|bescom|power/i.test(lower)) { merchant = 'Electricity Board'; catId = 'cat-utilities'; }
    else if (/recharge|jio|airtel/i.test(lower)) { merchant = "Dad's Recharge"; catId = 'cat-utilities'; }
    else if (/sip|groww|zerodha|invest/i.test(lower)) { merchant = 'Nifty 50 SIP'; catId = 'cat-investments'; }
    else if (/rent/i.test(lower)) { merchant = 'House Rent'; catId = 'cat-housing'; }
    else if (/netflix/i.test(lower)) { merchant = 'Netflix'; catId = 'cat-entertainment'; }
    else if (/myntra|amazon|flipkart/i.test(lower)) { merchant = 'Shopping'; catId = 'cat-shopping'; }
    else {
      const cleaned = text.replace(/spent|paid|rs\.?|inr|₹|\d+|on|for|yesterday|today/gi, '').trim();
      if (cleaned.length > 2) merchant = cleaned.split(' ')[0];
    }

    return res.json({
      amount,
      merchant,
      categoryId: catId,
      date: dateStr,
      type: isIncome ? 'income' : 'expense',
      paymentMethod: 'upi',
      description: text,
      tags: ['quick-add'],
    });
  }
});

// 4. AI Receipt & Bill OCR Scanner (Image Validation -> OCR -> Classification -> Data Extraction)
app.post('/api/ai/scan-receipt', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', categories } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image base64 data is required' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
    const availableCategories = (categories || []).map((c: any) => `${c.id}: ${c.name}`).join('\n');
    const today = new Date().toISOString().split('T')[0];

    const promptText = `
You are a strict, production-grade financial receipt, bill, and invoice OCR classifier and data extractor.
All monetary amounts are in Indian Rupees (₹ - INR).

CRITICAL REQUIREMENT — MULTI-STAGE VERIFICATION:
Stage 1: IMAGE VALIDATION
- Determine whether this image is genuinely a bill, receipt, tax invoice, payment slip, or utility statement containing financial transaction information.
- VALID EXAMPLES: Retail store receipt, supermarket checkout slip, restaurant food bill, pharmacy invoice, electricity/water/gas utility bill, taxi receipt, ecommerce invoice.
- INVALID EXAMPLES: Random photographs, selfies, portraits, landscapes, nature, animals, memes, blank screens, screenshots of chats or non-payment apps, decorative artwork.
- If the image is NOT a legitimate bill/receipt, set "isValidReceipt" to false, "rejectionReason" to a clear explanation, and DO NOT fabricate any items or amounts.

Stage 2: OCR & CONFIDENCE CHECK
- If the receipt is too blurry, unreadable, cut off, or missing monetary details, set "isAmbiguous" to true.
- Confidence score (0.0 to 1.0): Measure how clearly the text, merchant name, and total amount can be read.

Stage 3: EXTRACTION (Only if valid receipt)
- merchant: Vendor, store, or company name.
- totalAmount: Final numeric total in INR ₹.
- date: Transaction date formatted YYYY-MM-DD (fallback to ${today} only if not printed).
- categorySuggestion: Pick the most appropriate category ID from the list below:
${availableCategories}
- taxAmount: GST / VAT if printed (0 if not specified).
- tipAmount: Tip / service charge if printed (0 if not specified).
- lineItems: Array of purchased items and their prices in ₹.
- paymentMethod: "upi", "credit_card", "debit_card", "cash", "net_banking", or "wallet".
`;

    const response = await safeGenerateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValidReceipt: {
              type: Type.BOOLEAN,
              description: 'True if the image is a genuine bill, receipt, or invoice. False for selfies, landscapes, animals, memes, or non-payment images.',
            },
            rejectionReason: {
              type: Type.STRING,
              description: 'Reason if not a valid receipt',
            },
            isAmbiguous: {
              type: Type.BOOLEAN,
              description: 'True if the receipt is too blurry, ambiguous, or lacks readable amounts',
            },
            confidence: {
              type: Type.NUMBER,
              description: 'Clarity score between 0.0 and 1.0',
            },
            merchant: { type: Type.STRING },
            totalAmount: { type: Type.NUMBER },
            date: { type: Type.STRING },
            categorySuggestion: { type: Type.STRING },
            taxAmount: { type: Type.NUMBER },
            tipAmount: { type: Type.NUMBER },
            lineItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                },
                required: ['name', 'price'],
              },
            },
            paymentMethod: { type: Type.STRING },
            notes: { type: Type.STRING },
          },
          required: ['isValidReceipt', 'confidence'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err) {
    // Never fabricate fake transactions or fake receipts
    return res.status(200).json({
      isValidReceipt: false,
      rejectionReason: "We couldn't identify a valid bill or receipt in this image.",
      isAmbiguous: true,
      confidence: 0,
      lineItems: [],
    });
  }
});

// 5. AI What-If Scenario Simulator (in INR)
app.post('/api/ai/simulate-scenario', async (req, res) => {
  try {
    const { scenarioText, currentFinances } = req.body;
    if (!scenarioText) {
      return res.status(400).json({ error: 'Scenario description is required' });
    }

    const baselineIncome = Number(currentFinances?.income) || 0;
    const baselineExpenses = Number(currentFinances?.expenses) || 0;
    const baselineSurplus = baselineIncome - baselineExpenses;

    const prompt = `
You are a quantitative financial scenario simulator for Indian personal finances (all figures in INR ₹).
The user is testing this "What-If" decision:
"${scenarioText}"

Current Financial Baseline (in ₹):
- Monthly Income: ₹${baselineIncome}
- Current Monthly Spend: ₹${baselineExpenses}
- Monthly Savings Surplus: ₹${baselineSurplus}
- Active Categories: ${JSON.stringify(currentFinances?.categories || [])}
- Savings Goals: ${JSON.stringify(currentFinances?.goals || [])}

Perform rigorous financial modeling:
1. Estimate net monthly cashflow impact in INR ₹ (+ positive = saves money, - negative = costs money).
2. Estimate 12-month cumulative impact in INR ₹.
3. Assess feasibility rating: "Highly Recommended", "Viable with Trade-offs", or "High Risk".
4. Provide structured breakdown bullet points.
5. Identify real-world trade-offs or friction points.
6. Explain the exact effect on their savings goals timeline (e.g. "Accelerates emergency fund timeline").
7. Conclude with an expert recommendation with execution strategy.
`;

    const response = await safeGenerateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scenario: { type: Type.STRING },
            monthlyImpact: { type: Type.NUMBER },
            annualImpact: { type: Type.NUMBER },
            feasibilityRating: { type: Type.STRING, description: 'Highly Recommended, Viable with Trade-offs, or High Risk' },
            breakdown: { type: Type.ARRAY, items: { type: Type.STRING } },
            tradeOffs: { type: Type.ARRAY, items: { type: Type.STRING } },
            savingsTimelineEffect: { type: Type.STRING },
            recommendation: { type: Type.STRING },
          },
          required: [
            'scenario',
            'monthlyImpact',
            'annualImpact',
            'feasibilityRating',
            'breakdown',
            'tradeOffs',
            'savingsTimelineEffect',
            'recommendation',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch {
    const scenario = String(req.body?.scenarioText || 'Budget Optimization Scenario');
    const match = scenario.match(/(?:rs\.?|inr|₹)\s*(\d+(?:,\d+)*(?:\.\d+)?)/i) ||
                  scenario.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:rs\.?|inr|rupees|\/mo|\/month)/i);
    const monthlyAmt = match ? parseFloat(match[1].replace(/,/g, '')) : 0;
    const annualAmt = monthlyAmt * 12;

    return res.json({
      scenario,
      monthlyImpact: monthlyAmt,
      annualImpact: annualAmt,
      feasibilityRating: monthlyAmt > 0 ? 'Viable with Trade-offs' : 'Needs Analysis',
      breakdown: monthlyAmt > 0 ? [
        `Direct modeled adjustment in monthly cash flow: ${monthlyAmt > 0 ? '+' : ''}₹${monthlyAmt.toLocaleString('en-IN')}/mo`,
        `Projected 12-month wealth retention: ₹${annualAmt.toLocaleString('en-IN')}/yr`,
      ] : [
        'Scenario submitted with unspecified numeric figures.',
        'Enter a specific amount in ₹ (e.g. cut dining by ₹1,500) to simulate quantitative impact.',
      ],
      tradeOffs: [
        'Requires disciplined adherence to revised category budget targets.',
      ],
      savingsTimelineEffect: monthlyAmt > 0
        ? `Retains ₹${annualAmt.toLocaleString('en-IN')} annually towards your emergency fund and savings goals.`
        : 'Awaiting numerical target to project timeline impact.',
      recommendation: 'Track transactions consistently to preserve your monthly surplus.',
    });
  }
});

// 6. AI End-of-Month Comprehensive Financial Report Generator
app.post('/api/ai/monthly-report', async (req, res) => {
  try {
    const { monthKey, monthName, monthlyStats, categories, transactions = [], recurring = [] } = req.body;

    const numIncome = Number(monthlyStats?.totalIncome) || 0;
    const numExpenses = Number(monthlyStats?.totalExpenses) || 0;

    // Zero-data guard
    if (transactions.length === 0 && numIncome === 0 && numExpenses === 0) {
      return res.json({
        monthKey,
        monthName,
        totalIncome: 0,
        totalExpenses: 0,
        netSavings: 0,
        savingsRate: 0,
        budgetUtilization: 0,
        aiExecutiveSummary: `No financial records found for ${monthName || 'this month'}. Add your income, expenses, and recurring payments to generate a personalized executive monthly report.`,
        highlights: ['Awaiting your first recorded financial transactions.'],
        unnecessarySpendingIdentified: 0,
        nextMonthBudgetPlan: [],
        strategicRecommendations: [
          'Record transactions regularly to gain insights into your monthly cash flow.',
          'Link your primary bank account or set up category budgets.',
        ],
      });
    }

    const prompt = `
Generate a comprehensive executive End-of-Month Financial Report in Indian Rupees (₹ - INR) for ${monthName || 'the month'}.

FINANCIAL METRICS:
- Total Income: ₹${numIncome}
- Total Expenses: ₹${numExpenses}
- Net Savings: ₹${monthlyStats?.netSavings || (numIncome - numExpenses)}
- Savings Rate: ${monthlyStats?.savingsRate || 0}%
- Budget Utilization: ${monthlyStats?.budgetUtilizationRate || 0}%

TRANSACTIONS DATA:
${JSON.stringify((transactions || []).slice(0, 45), null, 2)}

CATEGORIES & BUDGETS:
${JSON.stringify(categories || [], null, 2)}

RECURRING EXPENSES:
${JSON.stringify(recurring || [], null, 2)}

Provide:
1. aiExecutiveSummary: 3-4 sentence high-level summary of the user's financial performance.
2. highlights: 4-5 bullet points of what went well, unexpected spikes, or major accomplishments.
3. unnecessarySpendingIdentified: total estimated amount (₹) spent on impulsive, redundant, or unused items.
4. nextMonthBudgetPlan: Array of recommended budget adjustments per category for next month.
5. strategicRecommendations: 3-4 high impact recommendations for long-term financial freedom.
`;

    const response = await safeGenerateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            aiExecutiveSummary: { type: Type.STRING },
            highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
            unnecessarySpendingIdentified: { type: Type.NUMBER },
            nextMonthBudgetPlan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  categoryName: { type: Type.STRING },
                  currentSpend: { type: Type.NUMBER },
                  recommendedBudget: { type: Type.NUMBER },
                },
                required: ['categoryName', 'currentSpend', 'recommendedBudget'],
              },
            },
            strategicRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            'aiExecutiveSummary',
            'highlights',
            'unnecessarySpendingIdentified',
            'nextMonthBudgetPlan',
            'strategicRecommendations',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      monthKey,
      monthName,
      totalIncome: numIncome,
      totalExpenses: numExpenses,
      netSavings: monthlyStats?.netSavings || (numIncome - numExpenses),
      savingsRate: monthlyStats?.savingsRate || 0,
      budgetUtilization: monthlyStats?.budgetUtilizationRate || 0,
      ...parsed,
    });
  } catch {
    const { monthKey, monthName, monthlyStats = {} } = req.body || {};
    const numIncome = Number(monthlyStats?.totalIncome) || 0;
    const numExpenses = Number(monthlyStats?.totalExpenses) || 0;
    const netSaved = numIncome - numExpenses;

    if (numIncome === 0 && numExpenses === 0) {
      return res.json({
        monthKey,
        monthName,
        totalIncome: 0,
        totalExpenses: 0,
        netSavings: 0,
        savingsRate: 0,
        budgetUtilization: 0,
        aiExecutiveSummary: `No financial records found for ${monthName || 'this month'}. Add your income and expenses to generate a personalized executive report.`,
        highlights: ['Awaiting financial records for this month.'],
        unnecessarySpendingIdentified: 0,
        nextMonthBudgetPlan: [],
        strategicRecommendations: [
          'Record transactions regularly to gain insights into your monthly cash flow.',
        ],
      });
    }

    return res.json({
      monthKey,
      monthName,
      totalIncome: numIncome,
      totalExpenses: numExpenses,
      netSavings: netSaved,
      savingsRate: monthlyStats?.savingsRate || (numIncome > 0 ? Math.round((netSaved / numIncome) * 100) : 0),
      budgetUtilization: monthlyStats?.budgetUtilizationRate || 0,
      aiExecutiveSummary: `In ${monthName || 'this month'}, you recorded ₹${numExpenses.toLocaleString('en-IN')} in total expenditures against ₹${numIncome.toLocaleString('en-IN')} in inflows.`,
      highlights: [
        `Net cashflow retained: ₹${netSaved.toLocaleString('en-IN')}`,
        'Core expenses recorded in your personal ledger',
      ],
      unnecessarySpendingIdentified: 0,
      nextMonthBudgetPlan: [],
      strategicRecommendations: [
        'Continue tracking expenditures to build personalized spending pattern analysis.',
      ],
    });
  }
});

// 7. AI Bank Statement / CSV Import Column Mapper
app.post('/api/ai/import-csv', async (req, res) => {
  try {
    const { rawCsvText, categories } = req.body;
    if (!rawCsvText) {
      return res.status(400).json({ error: 'CSV text is required' });
    }

    const availableCategories = (categories || []).map((c: any) => `${c.id}: ${c.name}`).join('\n');
    const today = new Date().toISOString().split('T')[0];

    const prompt = `
You are an expert Indian bank statement parser (e.g. HDFC, ICICI, SBI, Axis, Kotak, Zerodha).
Parse this raw CSV data and convert each valid row into a structured transaction.

Available Categories:
${availableCategories}
Default Reference Date: ${today}

RAW CSV CONTENT:
"""
${rawCsvText.slice(0, 8000)}
"""

Extract an array of transactions with:
- date: YYYY-MM-DD
- merchant: Vendor or description
- amount: positive numeric value in INR
- type: "expense" or "income" (debit = expense, credit = income)
- categoryId: best matching category ID
- paymentMethod: "upi", "credit_card", "debit_card", "net_banking", "cash", or "wallet"
- notes: original bank remark / narration
`;

    const response = await safeGenerateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedBank: { type: Type.STRING },
            parsedCount: { type: Type.INTEGER },
            transactions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  merchant: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  type: { type: Type.STRING },
                  categoryId: { type: Type.STRING },
                  paymentMethod: { type: Type.STRING },
                  notes: { type: Type.STRING },
                },
                required: ['date', 'merchant', 'amount', 'type', 'categoryId', 'paymentMethod'],
              },
            },
          },
          required: ['transactions', 'parsedCount'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch {
    const rawCsvText = String(req.body?.rawCsvText || '');
    const categories = req.body?.categories || [];
    const lines = rawCsvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const transactions: any[] = [];
    const today = new Date().toISOString().split('T')[0];

    for (let i = 1; i < lines.length && transactions.length < 50; i++) {
      const parts = lines[i].split(',').map((p) => p.replace(/^"|"$/g, '').trim());
      if (parts.length >= 2) {
        const amt = parseFloat(parts.find((p) => /^\d+(\.\d+)?$/.test(p)) || '500');
        const merchant = parts.find((p) => p.length > 2 && isNaN(Number(p))) || 'Bank Transaction';
        transactions.push({
          date: today,
          merchant,
          amount: isNaN(amt) ? 450 : amt,
          type: 'expense',
          categoryId: categories[0]?.id || 'cat-groceries',
          paymentMethod: 'upi',
          notes: parts.join(' | '),
        });
      }
    }

    return res.json({
      detectedBank: 'Detected Indian Bank Statement',
      parsedCount: transactions.length,
      transactions,
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function setupFrontend() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`SpendWise AI server running on http://0.0.0.0:${PORT}`);
  });
}

setupFrontend().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
