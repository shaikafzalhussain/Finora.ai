import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  ArrowRight,
  TrendingDown,
  DollarSign,
  HelpCircle,
  Lightbulb,
  ShieldCheck,
} from 'lucide-react';
import {
  Category,
  ChatMessage,
  RecurringExpense,
  SavingsGoal,
  Transaction,
  UpcomingPayment,
} from '../types/finance';
import { MonthlyStats } from '../utils/financeCalculations';
import { formatCurrency } from '../utils/formatters';
import { executeFinancialPipeline, FinancialPipelineContext } from '../utils/aiFinancialPipeline';

interface AIMoneyCoachViewProps {
  monthlyStats: MonthlyStats;
  categories: Category[];
  transactions: Transaction[];
  allTransactions?: Transaction[];
  recurring: RecurringExpense[];
  savingsGoals: SavingsGoal[];
  upcomingPayments?: UpcomingPayment[];
  currentMonthKey?: string;
  formattedMonthName: string;
  totalBalance?: number;
  userName?: string;
}

export const AIMoneyCoachView: React.FC<AIMoneyCoachViewProps> = ({
  monthlyStats,
  categories,
  transactions,
  allTransactions,
  recurring,
  savingsGoals,
  upcomingPayments = [],
  currentMonthKey = '2026-10',
  formattedMonthName,
  totalBalance = 0,
  userName = 'Friend',
}) => {
  const firstName = userName ? userName.trim().split(' ')[0] : 'Friend';
  const hasTransactions = transactions.length > 0;

  // Prompts for users with data vs fresh users (Requirement 13)
  const FRESH_SUGGESTIONS = [
    'Add an expense',
    'Add income',
    'Add investment',
    'Set a budget',
    'Add recurring payment',
  ];

  const ACTIVE_SUGGESTIONS = [
    'Where did I spend the most?',
    'How much did I spend on food?',
    'What are my biggest expenses?',
    'How much did I save this month?',
    'What are my upcoming payments?',
    'Show me my spending by category',
  ];

  const defaultSuggestions = hasTransactions ? ACTIVE_SUGGESTIONS : FRESH_SUGGESTIONS;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-msg',
      role: 'assistant',
      content: hasTransactions
        ? `Namaste, **${firstName}**! 🙏 I'm your **FINORA AI Financial Coach**.\n\nI have verified access to your personal financial records for **${formattedMonthName}**.\n\nCurrently, you've spent **${formatCurrency(
            monthlyStats.totalExpenses
          )}** against your total income of **${formatCurrency(
            monthlyStats.totalIncome
          )}**. What would you like to explore today?`
        : `Namaste, **${firstName}**! 🙏 I'm your **FINORA AI Financial Coach**.\n\n**I'm ready to analyze your finances.**\n\nAdd some transactions, income, investments, budgets, or recurring payments and I'll start identifying patterns and opportunities for you.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedPrompts: hasTransactions ? ACTIVE_SUGGESTIONS : FRESH_SUGGESTIONS,
    },
  ]);

  const [inputQuestion, setInputQuestion] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const q = textToSend || inputQuestion;
    if (!q.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsTyping(true);

    // 1. Build financial pipeline context from current authenticated user data
    const pipelineContext: FinancialPipelineContext = {
      monthKey: currentMonthKey,
      monthName: formattedMonthName,
      transactions,
      allTransactions,
      categories,
      upcomingPayments,
      recurring,
      savingsGoals,
      totalIncome: monthlyStats.totalIncome,
      totalExpenses: monthlyStats.totalExpenses,
      remainingBudget: monthlyStats.remainingBudget,
      savingsRate: Math.round(monthlyStats.savingsRate),
      totalBalance,
    };

    // 2. Execute deterministic financial calculation
    const pipelineResult = executeFinancialPipeline(q, pipelineContext);

    try {
      // 3. Request Gemini AI explanation with pre-calculated facts
      const response = await fetch('/api/ai/money-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          calculatedFact: pipelineResult.calculatedAnswer,
          structuredFacts: pipelineResult.structuredFacts,
          intent: pipelineResult.intent,
          suggestedPrompts: pipelineResult.suggestedPrompts,
          history: messages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
          financialContext: {
            userName: firstName,
            monthName: formattedMonthName,
            totalIncome: monthlyStats.totalIncome,
            totalExpenses: monthlyStats.totalExpenses,
            remainingBudget: monthlyStats.remainingBudget,
            savingsRate: Math.round(monthlyStats.savingsRate),
            upcomingCount: upcomingPayments.length,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply || pipelineResult.calculatedAnswer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedPrompts: data.suggestedPrompts || pipelineResult.suggestedPrompts || defaultSuggestions,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.warn('Using deterministic calculation fallback for Money Coach:', err);
      // Fallback directly to the deterministic calculated answer! Zero generic errors!
      const fallbackMsg: ChatMessage = {
        id: `ai-calc-${Date.now()}`,
        role: 'assistant',
        content: pipelineResult.calculatedAnswer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedPrompts: pipelineResult.suggestedPrompts || defaultSuggestions,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[750px] max-h-[85vh] rounded-[32px] bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden w-full">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-500 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Bot className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-white">FINORA AI — Money Coach</h3>
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                Grounded in your data
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Answers calculated directly from your authorized INR transactions
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Real-time records</span>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-emerald-400 border border-slate-700'
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-[85%] sm:max-w-[78%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-slate-950/90 text-slate-200 border border-slate-800 rounded-tl-none shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                </div>

                <span className="text-[10px] text-slate-500 px-1 block">
                  {msg.timestamp}
                </span>

                {/* Suggested Prompts Pills */}
                {!isUser && msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.suggestedPrompts.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(prompt)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all flex items-center gap-1 active:scale-95 text-left"
                      >
                        <Sparkles className="h-2.5 w-2.5 text-emerald-400 flex-shrink-0" />
                        <span>{prompt}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700 flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
              <span>Analyzing live records for {formattedMonthName}...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested quick chips bar above input */}
      <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/50 flex gap-2 overflow-x-auto scrollbar-none">
        {defaultSuggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(s)}
            className="px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-xl whitespace-nowrap transition-colors flex-shrink-0"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Sticky Mobile Input Area */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          placeholder={`Ask about your ${formattedMonthName} spends, SIP, food or savings...`}
          className="flex-1 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white text-xs sm:text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors placeholder:text-slate-500"
        />

        <button
          type="submit"
          disabled={!inputQuestion.trim() || isTyping}
          className="h-11 w-11 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 flex items-center justify-center transition-all shadow-md shadow-emerald-500/20 active:scale-95 flex-shrink-0"
          title="Send"
        >
          <Send className="h-4 w-4 stroke-[2.5]" />
        </button>
      </form>
    </div>
  );
};
