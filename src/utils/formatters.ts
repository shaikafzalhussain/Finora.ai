import React from 'react';
import {
  Home,
  ShoppingCart,
  Utensils,
  Zap,
  Car,
  Film,
  ShoppingBag,
  Activity,
  Plane,
  Smile,
  Briefcase,
  Laptop,
  TrendingUp,
  Tag,
  CreditCard,
  Building,
  Smartphone,
  BookOpen,
  Coffee,
  HeartPulse,
  PiggyBank,
  Shield,
  HelpCircle,
} from 'lucide-react';

/**
 * Formats a number into Indian Rupee (INR) currency format: ₹1,25,000.00 or ₹1,25,000
 */
export function formatCurrency(amount: number, includeDecimals = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }

  const hasDecimals = includeDecimals || (amount % 1 !== 0);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Compact Indian currency formatting (e.g. ₹1.25L, ₹45K, ₹2.5Cr)
 */
export function formatCompactCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }

  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 10000000) {
    // Crores
    return `${sign}₹${(abs / 10000000).toFixed(2).replace(/\.00$/, '')}Cr`;
  }
  if (abs >= 100000) {
    // Lakhs
    return `${sign}₹${(abs / 100000).toFixed(2).replace(/\.00$/, '')}L`;
  }
  if (abs >= 1000) {
    // Thousands
    return `${sign}₹${(abs / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }

  return `${sign}₹${Math.round(abs)}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatShortDate(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Automatically formats and capitalizes names professionally (e.g. "afzal" -> "Afzal", "AFZAL" -> "Afzal")
 */
export function formatCapitalizedName(str: string): string {
  if (!str) return '';
  return str
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (!word) return '';
      return word
        .split('-')
        .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : ''))
        .join('-');
    })
    .join(' ');
}

export const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Home,
  ShoppingCart,
  Utensils,
  Zap,
  Car,
  Film,
  ShoppingBag,
  Activity,
  Plane,
  Smile,
  Briefcase,
  Laptop,
  TrendingUp,
  Tag,
  CreditCard,
  Building,
  Smartphone,
  BookOpen,
  Coffee,
  HeartPulse,
  PiggyBank,
  Shield,
};

export function getCategoryIcon(iconName: string): React.ElementType {
  return CATEGORY_ICONS[iconName] || Tag;
}

export function getPaymentMethodLabel(method: string): string {
  switch (method) {
    case 'upi':
      return 'UPI (GPay/PhonePe/Paytm)';
    case 'credit_card':
      return 'Credit Card';
    case 'debit_card':
      return 'Debit Card';
    case 'net_banking':
      return 'Net Banking / IMPS';
    case 'wallet':
      return 'Digital Wallet';
    case 'cash':
      return 'Cash';
    default:
      return method;
  }
}
