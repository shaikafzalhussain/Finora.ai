# 🌟 Finora AI — Intelligent Personal Money Companion & Financial Intelligence Platform

Finora AI is a production-grade, full-stack personal finance management and AI advisory platform tailored for Indian and global users. It features real-time bank account syncing, AI-powered budget optimization, security PIN protection, automated PDF financial reports, Google Sheets real-time synchronization, and Google Search grounding.

---

## 🚀 Key Features

- **💼 Multi-Account & Cash Flow Management**: Track income, expenses, savings goals, and multiple linked bank accounts (HDFC, SBI, ICICI, etc.) with real-time balance tracking in Indian Rupees (₹ - INR).
- **🤖 AI Money Coach & Budget Auditor**: Powered by Gemini (`gemini-3.5-flash` & `gemini-3.5-flash-lite`) with **Google Search grounding** for up-to-date economic insights, spending audits, and personalized financial recommendations.
- **📊 Google Sheets Live Sync (Admin Console)**: Securely connect Google Drive and Google Sheets to sync and monitor all registered user records (Name, Phone Number, Security PIN, Bank Account, and Current Balance) in real-time.
- **📄 Professional PDF Report Generator**: Export formatted financial statements, expense distributions, and monthly summaries instantly using `jsPDF`.
- **🔐 Secure Admin Console**: Dedicated administrator dashboard protected by PBKDF2-SHA512 password hashing, rate limiting, and security audit logs.
- **📱 PWA & Mobile Home Screen Ready**: Fully responsive mobile-first UI with custom Web App Manifest and SVG app icon for seamless home screen installation on iOS and Android.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, jsPDF.
- **Backend**: Node.js, Express, TypeScript, Vite middleware.
- **AI Integration**: `@google/genai` SDK with Google Search grounding tools.
- **Storage**: SQLite / Persistent backend session management with Firebase Auth & Firestore support.

---

## ⚙️ Getting Started & Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/finora-ai.git
   cd finora-ai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file based on `.env.example`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3000
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

---

## 📄 License

MIT License. Built with Google AI Studio & Gemini.
