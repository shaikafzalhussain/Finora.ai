import jsPDF from 'jspdf';
import { Transaction, Category, UserProfile, BankAccountDetails, RecurringExpense, SavingsGoal } from '../types/finance';

interface ExportData {
  userProfile: UserProfile;
  transactions: Transaction[];
  categories: Category[];
  bankAccounts: BankAccountDetails[];
  recurring?: RecurringExpense[];
  savingsGoals?: SavingsGoal[];
  monthlyStats?: {
    totalIncome: number;
    totalExpense?: number;
    totalExpenses?: number;
    netSavings: number;
  };
}

export function exportFinancialReportPDF(data: ExportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  const primaryColor = [15, 23, 42]; // Slate 900
  const grayColor = [100, 116, 139]; // Slate 500

  // Header Background
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('FINORA AI - Financial Report', 14, 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Generated on: ${dateStr}`, pageWidth - 14, 25, { align: 'right' });

  yPos = 50;

  // User Profile Section
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Account Overview', 14, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text(`Account Holder: ${data.userProfile.name || 'Valued User'}`, 14, yPos);
  doc.text(`Phone: +91 ${data.userProfile.phone || ''}`, pageWidth - 14, yPos, { align: 'right' });
  yPos += 16;

  // Summary Metrics Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, yPos, pageWidth - 28, 24, 3, 3, 'F');

  const income = data.monthlyStats?.totalIncome || 0;
  const expense = data.monthlyStats?.totalExpense || data.monthlyStats?.totalExpenses || 0;
  const savings = data.monthlyStats?.netSavings || (income - expense);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);

  const colWidth = (pageWidth - 28) / 3;
  doc.text(`Total Income: ₹${income.toLocaleString('en-IN')}`, 14 + colWidth * 0.5, yPos + 15, { align: 'center' });
  doc.text(`Total Expense: ₹${expense.toLocaleString('en-IN')}`, 14 + colWidth * 1.5, yPos + 15, { align: 'center' });
  doc.text(`Net Savings: ₹${savings.toLocaleString('en-IN')}`, 14 + colWidth * 2.5, yPos + 15, { align: 'center' });

  yPos += 36;

  // Bank Accounts Section
  if (data.bankAccounts && data.bankAccounts.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Linked Bank Accounts & Balances', 14, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    data.bankAccounts.forEach((acc) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
      }
      const accNum = acc.accountNumberLast4 || acc.rawAccountNumber?.slice(-4) || '0000';
      doc.text(`• ${acc.bankName} (${acc.accountType || 'Savings'}) - A/C: ****${accNum}`, 18, yPos);
      doc.text(`₹${(acc.balance || 0).toLocaleString('en-IN')}`, pageWidth - 14, yPos, { align: 'right' });
      yPos += 7;
    });
    yPos += 10;
  }

  // Categories / Budgets Summary
  if (data.categories && data.categories.length > 0) {
    if (yPos > pageHeight - 50) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Budget Categories & Monthly Allocation', 14, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text('Category', 14, yPos);
    doc.text('Monthly Budget', 100, yPos);
    yPos += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

    data.categories.forEach((cat) => {
      if (yPos > pageHeight - 25) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(cat.name, 14, yPos);
      doc.text(`₹${(cat.monthlyBudget || 0).toLocaleString('en-IN')}`, 100, yPos);
      yPos += 6;
    });
    yPos += 10;
  }

  // Recent Transactions Section
  if (data.transactions && data.transactions.length > 0) {
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Recent Transactions', 14, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text('Date & Description / Merchant', 14, yPos);
    doc.text('Category ID', 100, yPos);
    doc.text('Amount', pageWidth - 14, yPos, { align: 'right' });
    yPos += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

    const recentTx = [...data.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 25);

    recentTx.forEach((tx) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }
      const descText = tx.description || tx.merchant || 'Transaction';
      const desc = descText.length > 35 ? descText.substring(0, 32) + '...' : descText;
      doc.text(`${tx.date} - ${desc}`, 14, yPos);
      doc.text(tx.categoryId, 100, yPos);
      const amtStr = `${tx.type === 'income' ? '+' : '-'}₹${(tx.amount || 0).toLocaleString('en-IN')}`;
      doc.setTextColor(tx.type === 'income' ? 22 : 220, tx.type === 'income' ? 101 : 38, tx.type === 'income' ? 52 : 38);
      doc.text(amtStr, pageWidth - 14, yPos, { align: 'right' });
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      yPos += 6;
    });
  }

  // Footer on all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text('Finora AI - Intelligent Financial Management & Analytics', 14, pageHeight - 10);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
  }

  const filename = `Finora_AI_Report_${data.userProfile.name?.replace(/\s+/g, '_') || 'User'}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
