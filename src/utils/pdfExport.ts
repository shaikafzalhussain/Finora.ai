import jsPDF from 'jspdf';
import { Transaction, Category, UserProfile, BankAccountDetails, RecurringExpense, SavingsGoal } from '../types/finance';

export interface DateFilterRange {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  label?: string;      // e.g. "October 2026", "Last 3 Months", "Custom Date Range"
}

export interface ExportData {
  userProfile: UserProfile;
  transactions: Transaction[];
  categories: Category[];
  bankAccounts: BankAccountDetails[];
  recurring?: RecurringExpense[];
  savingsGoals?: SavingsGoal[];
  dateRange?: DateFilterRange;
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

  // Modern corporate color scheme
  const primaryColor = [15, 23, 42]; // Slate 900
  const emeraldColor = [5, 150, 105]; // Emerald 600
  const roseColor = [225, 29, 72]; // Rose 600
  const grayColor = [100, 116, 139]; // Slate 500
  const lightBg = [248, 250, 252]; // Slate 50
  const borderColor = [226, 232, 240]; // Slate 200

  // 1. Filter transactions according to selected date range
  let filteredTransactions = [...(data.transactions || [])];
  const { startDate, endDate, label } = data.dateRange || {};

  if (startDate) {
    filteredTransactions = filteredTransactions.filter((t) => t.date >= startDate);
  }
  if (endDate) {
    filteredTransactions = filteredTransactions.filter((t) => t.date <= endDate);
  }

  // Sort descending by date
  filteredTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 2. Accurately calculate financial totals from filtered transactions
  let totalIncome = 0;
  let totalExpense = 0;

  // Category spending breakdown map: categoryId -> { name, spent, count, budget }
  const categoryMap = new Map(data.categories.map((c) => [c.id, c]));
  const categorySpendMap: Record<string, { id: string; name: string; spent: number; count: number; budget: number }> = {};

  // Initialize for all active categories
  data.categories.forEach((cat) => {
    categorySpendMap[cat.id] = {
      id: cat.id,
      name: cat.name,
      spent: 0,
      count: 0,
      budget: cat.monthlyBudget || 0,
    };
  });

  filteredTransactions.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'income') {
      totalIncome += amt;
    } else if (tx.type === 'expense') {
      totalExpense += amt;
      const catId = tx.categoryId || 'cat-general';
      if (!categorySpendMap[catId]) {
        const cat = categoryMap.get(catId);
        categorySpendMap[catId] = {
          id: catId,
          name: cat?.name || tx.merchant || 'General Expense',
          spent: 0,
          count: 0,
          budget: cat?.monthlyBudget || 0,
        };
      }
      categorySpendMap[catId].spent += amt;
      categorySpendMap[catId].count += 1;
    }
  });

  const netSavings = totalIncome - totalExpense;

  // Header Banner Background
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Title & Tagline
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('FINORA AI - Financial Health & Ledger Report', 14, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // Slate 300
  const timeFrameText = label || (startDate && endDate ? `${startDate} to ${endDate}` : 'All Recorded Transactions');
  doc.text(`Timeframe: ${timeFrameText}`, 14, 32);

  const generatedDateStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  doc.text(`Generated on: ${generatedDateStr}`, pageWidth - 14, 32, { align: 'right' });

  yPos = 52;

  // Account & User Overview Section
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('1. Account Holder & Report Scope', 14, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  const userName = data.userProfile.name || 'Valued User';
  const phoneText = data.userProfile.phone ? `+91 ${data.userProfile.phone}` : 'Unlinked';
  doc.text(`Account Holder: ${userName}  |  Primary Contact: ${phoneText}`, 14, yPos);
  doc.text(`Filtered Activity: ${filteredTransactions.length} transaction(s)`, pageWidth - 14, yPos, { align: 'right' });
  yPos += 14;

  // Summary Metrics Box
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.roundedRect(14, yPos, pageWidth - 28, 26, 3, 3, 'FD');

  const colWidth = (pageWidth - 28) / 3;

  // Col 1: Total Inflow
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text('TOTAL INFLOW (INCOME)', 14 + colWidth * 0.5, yPos + 8, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
  doc.text(`+Rs. ${totalIncome.toLocaleString('en-IN')}`, 14 + colWidth * 0.5, yPos + 18, { align: 'center' });

  // Col 2: Total Outflow
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text('TOTAL OUTFLOW (EXPENSES)', 14 + colWidth * 1.5, yPos + 8, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(roseColor[0], roseColor[1], roseColor[2]);
  doc.text(`-Rs. ${totalExpense.toLocaleString('en-IN')}`, 14 + colWidth * 1.5, yPos + 18, { align: 'center' });

  // Col 3: Net Cashflow / Savings
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text('NET PERIOD CASHFLOW', 14 + colWidth * 2.5, yPos + 8, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  if (netSavings >= 0) {
    doc.setTextColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
    doc.text(`+Rs. ${netSavings.toLocaleString('en-IN')}`, 14 + colWidth * 2.5, yPos + 18, { align: 'center' });
  } else {
    doc.setTextColor(roseColor[0], roseColor[1], roseColor[2]);
    doc.text(`-Rs. ${Math.abs(netSavings).toLocaleString('en-IN')}`, 14 + colWidth * 2.5, yPos + 18, { align: 'center' });
  }

  yPos += 36;

  // Bank Balances Snapshot
  if (data.bankAccounts && data.bankAccounts.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('2. Linked Bank Balances', 14, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    data.bankAccounts.forEach((acc) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
      }
      const accNum = acc.accountNumberLast4 || acc.rawAccountNumber?.slice(-4) || '0000';
      const bal = acc.balance ?? 0;
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text(`• ${acc.bankName} (${acc.accountType || 'Savings'}) - ****${accNum}`, 18, yPos);
      
      if (bal < 0) {
        doc.setTextColor(roseColor[0], roseColor[1], roseColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(`-Rs. ${Math.abs(bal).toLocaleString('en-IN')} (Overdraft)`, pageWidth - 14, yPos, { align: 'right' });
      } else {
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(`Rs. ${bal.toLocaleString('en-IN')}`, pageWidth - 14, yPos, { align: 'right' });
      }
      doc.setFont('helvetica', 'normal');
      yPos += 6;
    });
    yPos += 8;
  }

  // 3. Category Spending Breakdown with Correct Actual Ledger Numbers
  const categoryList = Object.values(categorySpendMap)
    .filter((cat) => cat.spent > 0 || cat.budget > 0)
    .sort((a, b) => b.spent - a.spent);

  if (categoryList.length > 0) {
    if (yPos > pageHeight - 65) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('3. Category Spending & Budget Analysis (Actual Passbook Data)', 14, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text('Calculated strictly from your recorded passbook transactions in this selected timeframe:', 14, yPos);
    yPos += 6;

    // Table Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(14, yPos, pageWidth - 28, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('Category', 18, yPos + 5);
    doc.text('Tx Count', 75, yPos + 5);
    doc.text('Total Spent (Rs.)', 115, yPos + 5);
    doc.text('Budget Cap (Rs.)', 150, yPos + 5);
    doc.text('% Share', pageWidth - 18, yPos + 5, { align: 'right' });
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    categoryList.forEach((cat, index) => {
      if (yPos > pageHeight - 25) {
        doc.addPage();
        yPos = 20;
      }

      // Zebra striping
      if (index % 2 === 0) {
        doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
        doc.rect(14, yPos - 1, pageWidth - 28, 7, 'F');
      }

      const percent = totalExpense > 0 ? ((cat.spent / totalExpense) * 100).toFixed(1) : '0.0';
      const isOverBudget = cat.budget > 0 && cat.spent > cat.budget;

      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(cat.name, 18, yPos + 4);

      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text(`${cat.count} txs`, 75, yPos + 4);

      // Total spent column
      if (cat.spent > 0) {
        doc.setTextColor(isOverBudget ? roseColor[0] : primaryColor[0], isOverBudget ? roseColor[1] : primaryColor[1], isOverBudget ? roseColor[2] : primaryColor[2]);
        doc.setFont('helvetica', isOverBudget ? 'bold' : 'normal');
        doc.text(`Rs. ${cat.spent.toLocaleString('en-IN')}`, 115, yPos + 4);
      } else {
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text('Rs. 0', 115, yPos + 4);
      }
      doc.setFont('helvetica', 'normal');

      // Budget cap column
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text(cat.budget > 0 ? `Rs. ${cat.budget.toLocaleString('en-IN')}` : 'No cap set', 150, yPos + 4);

      // Percentage share column
      doc.setTextColor(isOverBudget ? roseColor[0] : primaryColor[0], isOverBudget ? roseColor[1] : primaryColor[1], isOverBudget ? roseColor[2] : primaryColor[2]);
      doc.text(`${percent}%`, pageWidth - 18, yPos + 4, { align: 'right' });

      yPos += 7;
    });

    yPos += 10;
  }

  // 4. Complete Ledger / Passbook Transactions List for Selected Timeframe
  if (filteredTransactions.length > 0) {
    if (yPos > pageHeight - 65) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`4. Detailed Transaction Ledger (${filteredTransactions.length} Record${filteredTransactions.length > 1 ? 's' : ''})`, 14, yPos);
    yPos += 6;

    // Table Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(14, yPos, pageWidth - 28, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('Date', 18, yPos + 5);
    doc.text('Description / Merchant', 45, yPos + 5);
    doc.text('Category', 115, yPos + 5);
    doc.text('Method', 150, yPos + 5);
    doc.text('Amount (Rs.)', pageWidth - 18, yPos + 5, { align: 'right' });
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);

    filteredTransactions.forEach((tx, idx) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 20;

        // Repeat table header on next page
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(14, yPos, pageWidth - 28, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(255, 255, 255);
        doc.text('Date', 18, yPos + 5);
        doc.text('Description / Merchant', 45, yPos + 5);
        doc.text('Category', 115, yPos + 5);
        doc.text('Method', 150, yPos + 5);
        doc.text('Amount (Rs.)', pageWidth - 18, yPos + 5, { align: 'right' });
        yPos += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
      }

      // Zebra striping
      if (idx % 2 === 0) {
        doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
        doc.rect(14, yPos - 1, pageWidth - 28, 6.5, 'F');
      }

      // Date
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text(tx.date, 18, yPos + 4);

      // Merchant / Description truncated safely
      const descText = tx.merchant || tx.description || 'Transaction';
      const safeDesc = descText.length > 34 ? descText.substring(0, 31) + '...' : descText;
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(safeDesc, 45, yPos + 4);

      // Category Name
      const catName = categoryMap.get(tx.categoryId)?.name || tx.categoryId || 'General';
      const safeCat = catName.length > 18 ? catName.substring(0, 16) + '..' : catName;
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text(safeCat, 115, yPos + 4);

      // Payment method
      doc.text(tx.paymentMethod ? tx.paymentMethod.toUpperCase() : 'UPI', 150, yPos + 4);

      // Amount with color indicator (+ Green / - Red)
      const isIncome = tx.type === 'income';
      doc.setTextColor(
        isIncome ? emeraldColor[0] : roseColor[0],
        isIncome ? emeraldColor[1] : roseColor[1],
        isIncome ? emeraldColor[2] : roseColor[2]
      );
      doc.setFont('helvetica', 'bold');
      const amtStr = `${isIncome ? '+' : '-'}Rs. ${(tx.amount || 0).toLocaleString('en-IN')}`;
      doc.text(amtStr, pageWidth - 18, yPos + 4, { align: 'right' });
      doc.setFont('helvetica', 'normal');

      yPos += 6.5;
    });
  } else {
    // If no transactions in selected range
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text('No transactions recorded for the selected timeframe.', 14, yPos);
    yPos += 10;
  }

  // Footer on all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text('Finora AI - Intelligent Personal Money Companion & Financial Ledger', 14, pageHeight - 8);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  }

  const safeUserName = (data.userProfile.name || 'User').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Finora_Report_${safeUserName}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
