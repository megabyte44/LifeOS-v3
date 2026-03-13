
'use client';

import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTransactions } from '@/hooks/api';
import type { Transaction } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { format, parseISO, formatISO, startOfMonth, subDays } from 'date-fns';
import { Label } from '@/components/ui/label';
import { PiggyBank, Loader2, TrendingUp, TrendingDown, Save, PlusCircle, Trash2, Plane, Shirt, UtensilsCrossed, ShoppingBag, Bolt, HeartPulse, Ticket, Salad, Users, Edit3, Car, Home, GraduationCap, BookOpen, CreditCard, Gift, Briefcase, Building, Smartphone, Plus, Eye, Calendar, Search } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const EXPENSE_CATEGORIES = [
  { id: 'Food', label: 'Food & Dining', icon: UtensilsCrossed, color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-300' },
  { id: 'Transportation', label: 'Transportation', icon: Car, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' },
  { id: 'Housing', label: 'Housing', icon: Home, color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
  { id: 'Shopping', label: 'Shopping', icon: ShoppingBag, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' },
  { id: 'Healthcare', label: 'Healthcare', icon: HeartPulse, color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' },
  { id: 'Entertainment', label: 'Entertainment', icon: Ticket, color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300' },
  { id: 'Education', label: 'Education', icon: GraduationCap, color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300' },
  { id: 'Bills', label: 'Bills & Utilities', icon: Bolt, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' },
  { id: 'Other', label: 'Other', icon: Plus, color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' }
];

const INCOME_CATEGORIES = [
  { id: 'Salary', label: 'Salary', icon: Briefcase, color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
  { id: 'Investment', label: 'Investment', icon: TrendingUp, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' },
  { id: 'Gift', label: 'Gift', icon: Gift, color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300' },
  { id: 'Freelance', label: 'Freelance', icon: BookOpen, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' },
  { id: 'Other', label: 'Other', icon: Plus, color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' }
];

const FEE_CATEGORIES = [
  { id: 'BankFees', label: 'Bank Fees', icon: Building, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' },
  { id: 'CardFees', label: 'Card Fees', icon: CreditCard, color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' },
  { id: 'ServiceFees', label: 'Service Fees', icon: Smartphone, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' },
  { id: 'Other', label: 'Other', icon: Plus, color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' }
];

// Legacy categories mapping for existing transactions
const categoryDetails: Record<string, { icon: React.ElementType, color: string }> = {
    'Travel': { icon: Plane, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' },
    'Clothing': { icon: Shirt, color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300' },
    'Food': { icon: UtensilsCrossed, color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-300' },
    'Shopping': { icon: ShoppingBag, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' },
    'Utilities': { icon: Bolt, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' },
    'Health': { icon: HeartPulse, color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' },
    'Entertainment': { icon: Ticket, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' },
    'Income': { icon: TrendingUp, color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
    'Groceries': { icon: Salad, color: 'bg-lime-100 text-lime-800 dark:bg-lime-900/20 dark:text-lime-300' },
    'Social': { icon: Users, color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-300' },
    'Transportation': { icon: Car, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' },
    'Housing': { icon: Home, color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
    'Healthcare': { icon: HeartPulse, color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' },
    'Education': { icon: GraduationCap, color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300' },
    'Bills': { icon: Bolt, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' },
    'Salary': { icon: Briefcase, color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
    'Investment': { icon: TrendingUp, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' },
    'Gift': { icon: Gift, color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300' },
    'Freelance': { icon: BookOpen, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' },
    'BankFees': { icon: Building, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' },
    'CardFees': { icon: CreditCard, color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' },
    'ServiceFees': { icon: Smartphone, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' },
    'Other': { icon: Plus, color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' }
};
const formatCurrency = (amountInCents: number) => `${(amountInCents / 100).toFixed(2)}`;

// Note: These helpers are replaced by useSafeFirestore hook in the component
// Keeping them for potential non-component usage, but component should use safeSetDoc directly

export default function ExpensesPage() {
  const { user } = useAuth();
  const {
    transactions: apiTransactions,
    monthlyBudget: apiBudget,
    isLoading,
    addTransaction: addTransactionApi,
    deleteTransaction: deleteTransactionApi,
    updateBudget: updateBudgetApi,
  } = useTransactions();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState(5000000);
  useEffect(() => { setTransactions(apiTransactions); }, [apiTransactions]);
  useEffect(() => { if (apiBudget > 0) setMonthlyBudget(apiBudget); }, [apiBudget]);
  const [budgetInput, setBudgetInput] = useState('');
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [autoResetEnabled, setAutoResetEnabled] = useState(false);
  const [lastResetDate, setLastResetDate] = useState<string>('');

  // Load auto-reset settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lifeos-auto-reset');
      if (saved) {
        const { enabled, lastDate } = JSON.parse(saved) as { enabled: boolean; lastDate: string };
        setAutoResetEnabled(enabled ?? false);
        setLastResetDate(lastDate ?? '');
      }
    } catch (e) {
      console.error('Failed to load auto-reset settings:', e);
    }
  }, []);

  // Auto-reset logic: check if we're in a new month and auto-reset is enabled
  useEffect(() => {
    if (!user || !autoResetEnabled || !lastResetDate) return;
    
    const now = new Date();
    const currentMonthKey = format(startOfMonth(now), 'yyyy-MM');
    const lastResetMonthKey = lastResetDate ? format(startOfMonth(parseISO(lastResetDate)), 'yyyy-MM') : '';
    
    if (currentMonthKey !== lastResetMonthKey) {
      // New month detected, carry over remaining balance and reset
      carryOverBalanceAndReset();
    }
  }, [user, autoResetEnabled, lastResetDate]);

  const { totalIncome, totalExpenses, remainingBudget, budgetProgress, monthlyExpenses } = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const startOfCurrentMonth = startOfMonth(new Date());
    const currentMonthExpenses = transactions.filter(t => t.type === 'expense' && parseISO(t.date) >= startOfCurrentMonth).reduce((sum, t) => sum + t.amount, 0);
    const remaining = income - expenses; // Changed: totalIncome - totalExpenses
    const progress = monthlyBudget > 0 ? Math.max(0, Math.min(100, (currentMonthExpenses / monthlyBudget) * 100)) : 0;
    return { totalIncome: income, totalExpenses: expenses, remainingBudget: remaining, budgetProgress: progress, monthlyExpenses: currentMonthExpenses };
  }, [transactions, monthlyBudget]);
  
   const { filteredTransactionsByType } = useMemo(() => {
    // Filter to last 7 days for recent transactions
    const sevenDaysAgo = subDays(new Date(), 7);
    const recentTransactions = transactions.filter(txn => parseISO(txn.date) >= sevenDaysAgo);
    
    // Group recent transactions by date
    const grouped = [...recentTransactions].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
      .reduce((acc, txn) => {
        const dateKey = format(parseISO(txn.date), 'yyyy-MM-dd');
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(txn);
        return acc;
      }, {} as Record<string, Transaction[]>);

    // Create filtered groups by transaction type
    const filteredByType = {
      income: recentTransactions.filter(t => t.type === 'income'),
      expense: recentTransactions.filter(t => t.type === 'expense'),
      fee: recentTransactions.filter(t => t.type === 'fee'),
      all: recentTransactions
    };

    return { 
      filteredTransactionsByType: filteredByType 
    };
  }, [transactions]);

  const handleSetBudget = async () => {
    if (!user) return;
    const budgetValue = parseFloat(budgetInput);
    if (isNaN(budgetValue) || budgetValue < 0) return;
    const budgetInCents = Math.round(budgetValue * 100);
    setMonthlyBudget(budgetInCents);
    setIsEditingBudget(false);
    try { await updateBudgetApi(budgetInCents); } catch (e) { console.error(e); }
  };

  const handleEditBudget = () => {
    setIsEditingBudget(true);
    setBudgetInput((monthlyBudget / 100).toFixed(2));
  };
  
  const handleDeleteTransaction = async (id: string) => {
    // Optimistic delete with rollback on failure
    const snapshot = transactions.find(t => t.id === id);
    setTransactions(prev => prev.filter(t => t.id !== id));
    try {
      await deleteTransactionApi(id);
    } catch (e) {
      console.error('Failed to delete transaction — rolling back:', e);
      if (snapshot) {
        setTransactions(prev =>
          [...prev, snapshot].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
        );
      }
    }
  };
  
  const handleAddTransaction = async (newTxn: Transaction) => {
    const { id, ...payload } = newTxn;
    try {
      const saved = await addTransactionApi(payload as Omit<Transaction, 'id'>);
      setTransactions(prev => [saved, ...prev]);
    } catch (e) { console.error(e); }
  };

  const carryOverBalanceAndReset = async () => {
    // Calculate remaining balance from last month
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const remainingBalance = income - expenses;

    // Delete all non-fee transactions from the backend
    const toDelete = transactions.filter(t => t.type !== 'fee');
    await Promise.all(toDelete.map(t => deleteTransactionApi(t.id).catch(e => console.error('Delete failed for', t.id, e))));

    // Keep only fees in local state, then optionally add carry-over
    const feeTransactions = transactions.filter(t => t.type === 'fee');

    if (remainingBalance > 0) {
      // Persist carry-over income to backend
      try {
        const saved = await addTransactionApi({
          date: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
          description: 'Carried over from previous month',
          category: 'Other',
          type: 'income',
          amount: remainingBalance,
        } as Omit<Transaction, 'id'>);
        feeTransactions.unshift(saved);
      } catch (e) {
        console.error('Failed to save carry-over transaction:', e);
      }
    }

    setTransactions(feeTransactions);

    const resetDate = format(new Date(), 'yyyy-MM-dd');
    setLastResetDate(resetDate);
    localStorage.setItem('lifeos-auto-reset', JSON.stringify({ enabled: autoResetEnabled, lastDate: resetDate }));
  };

  const handleResetFinancials = async (isAutoReset = false) => {
    // For manual reset, don't carry over balance — delete all non-fee transactions from backend
    const toDelete = transactions.filter(t => t.type !== 'fee');
    await Promise.all(toDelete.map(t => deleteTransactionApi(t.id).catch(e => console.error('Delete failed for', t.id, e))));

    setTransactions(transactions.filter(t => t.type === 'fee'));

    const resetDate = format(new Date(), 'yyyy-MM-dd');
    setLastResetDate(resetDate);
    localStorage.setItem('lifeos-auto-reset', JSON.stringify({ enabled: autoResetEnabled, lastDate: resetDate }));

    if (!isAutoReset) {
      setIsResetDialogOpen(false);
    }
  };

  const handleAutoResetToggle = () => {
    const newValue = !autoResetEnabled;
    setAutoResetEnabled(newValue);
    localStorage.setItem('lifeos-auto-reset', JSON.stringify({ enabled: newValue, lastDate: lastResetDate }));
  };

  const renderTransactionsList = (transactionList: Transaction[]) => {
    if (transactionList.length === 0) {
      return <div className="text-center text-muted-foreground py-8">No transactions to display.</div>;
    }

    const groupedByDate = [...transactionList].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
      .reduce((acc, txn) => {
        const dateKey = format(parseISO(txn.date), 'yyyy-MM-dd');
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(txn);
        return acc;
      }, {} as Record<string, Transaction[]>);

    return (
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {Object.entries(groupedByDate).map(([date, txns]) => {
          const dailyExpenses = txns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
          const dailyIncome = txns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
          const dailyFees = txns.filter(t => t.type === 'fee').reduce((sum, t) => sum + t.amount, 0);

          return (
            <div key={date}>
              <div className="flex justify-between items-center text-sm font-medium text-muted-foreground px-2 py-1.5 border-b bg-muted/50 rounded-t-md">
                <span>{format(parseISO(date), 'dd MMM yyyy, EEEE')}</span>
                <div className="flex gap-3 text-xs">
                  {dailyIncome > 0 && <span className="text-green-600">+{formatCurrency(dailyIncome)}</span>}
                  {dailyExpenses > 0 && <span className="text-red-600">-{formatCurrency(dailyExpenses)}</span>}
                  {dailyFees > 0 && <span className="text-orange-600">Fees: {formatCurrency(dailyFees)}</span>}
                </div>
              </div>
              <ul className="divide-y border-x border-b rounded-b-md">
                {txns.map((txn) => {
                  const { icon: Icon, color } = categoryDetails[txn.category] || categoryDetails['Other'];
                  return (
                    <li key={txn.id} className="flex items-center justify-between p-2 hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="font-semibold">{txn.description}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`font-bold text-base ${
                          txn.type === 'income' ? 'text-green-600' :
                          txn.type === 'expense' ? 'text-red-600' :
                          'text-orange-600'
                        }`}>
                          {txn.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(txn.amount))}
                        </span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteTransaction(txn.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <AppLayout>
      {isLoading ? (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Loading financial data...</p>
        </div>
      ) : (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <StatCard title="Total Income" amount={totalIncome} icon={TrendingUp} variant="income" />
            <StatCard title="Total Spent" amount={totalExpenses} icon={TrendingDown} variant="expense" />
            <StatCard title="Monthly Budget" amount={monthlyBudget} icon={PiggyBank} />
            <StatCard title="Remaining" amount={remainingBudget} variant={remainingBudget >= 0 ? 'income' : 'expense'} />
        </div>

        <Card>
            <CardHeader className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Budget Progress</CardTitle>
                        <CardDescription>You&apos;ve spent {formatCurrency(monthlyExpenses)} of your {formatCurrency(monthlyBudget)} budget.</CardDescription>
                    </div>
                    {!isEditingBudget && (
                        <Button variant="ghost" size="sm" onClick={handleEditBudget} className="h-8 w-8 p-0">
                            <Edit3 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pt-0 sm:pt-0 pb-2 px-3 sm:px-4">
                <div className="relative">
                    <div className="w-full bg-muted/70 dark:bg-muted/30 rounded-full h-4 overflow-hidden shadow-inner">
                        <div 
                            className={`h-full transition-all duration-500 ease-out rounded-full shadow-sm ${
                                budgetProgress <= 60 ? 'bg-gradient-to-r from-green-500 to-green-600 dark:from-green-400 dark:to-green-500' :
                                budgetProgress <= 85 ? 'bg-gradient-to-r from-yellow-500 to-orange-500 dark:from-yellow-400 dark:to-orange-400' :
                                'bg-gradient-to-r from-red-500 to-red-600 dark:from-red-400 dark:to-red-500'
                            } ${budgetProgress > 100 ? 'animate-pulse' : ''}`}
                            style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                        />
                        {budgetProgress > 100 && (
                            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 dark:from-red-500 dark:to-red-600 opacity-20 animate-pulse rounded-full" />
                        )}
                    </div>
                </div>
                <p className="text-right text-sm text-muted-foreground mt-2">{budgetProgress.toFixed(0)}%</p>
            </CardContent>
            {isEditingBudget && (
                <CardFooter className="pt-0 sm:pt-0 p-3 sm:p-4">
                    <div className="w-full space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="monthly-budget-input" className="text-sm font-medium">Set Your Monthly Budget:</label>
                            <div className="flex gap-2">
                                <Input 
                                    id="monthly-budget-input" 
                                    type="number" 
                                    placeholder="e.g., 50000.00" 
                                    value={budgetInput} 
                                    onChange={(e) => setBudgetInput(e.target.value)} 
                                />
                                <Button onClick={handleSetBudget}>
                                    <Save className="mr-2 h-4 w-4" />
                                    Set Budget
                                </Button>
                                <Button variant="outline" onClick={() => setIsEditingBudget(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </div>

                        {/* Financial Reset Options - Only visible when editing budget */}
                        <div className="pt-4 border-t space-y-3">
                            <Label className="text-sm font-medium text-muted-foreground">Reset Options</Label>
                            
                            {/* Manual Reset Button */}
                            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="w-full">
                                        Reset Income & Expenses
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Reset Financial Data?</DialogTitle>
                                        <DialogDescription>
                                            This will permanently remove all income and expense transactions. Fee transactions will be preserved. Note: Manual reset will NOT carry over remaining balance. This action cannot be undone.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>Cancel</Button>
                                        <Button variant="destructive" onClick={() => handleResetFinancials(false)}>Reset All</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            {/* Auto-Reset Toggle */}
                            <div className="flex items-center justify-between p-2 rounded-lg border bg-muted/30">
                                <div className="space-y-0.5">
                                    <p className="text-xs font-medium">Auto-Reset Monthly</p>
                                    <p className="text-[10px] text-muted-foreground">Auto-clear on 1st of month + carry over balance</p>
                                </div>
                                <Button
                                    variant={autoResetEnabled ? "default" : "outline"}
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={handleAutoResetToggle}
                                >
                                    {autoResetEnabled ? "ON" : "OFF"}
                                </Button>
                            </div>
                            {lastResetDate && (
                                <p className="text-[10px] text-muted-foreground text-center">
                                    Last reset: {format(parseISO(lastResetDate), 'MMM dd, yyyy')}
                                </p>
                            )}
                        </div>
                    </div>
                </CardFooter>
            )}
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4">
                <div>
                    <CardTitle className="text-lg">Recent Transactions</CardTitle>
                    <ViewAllTransactionsDialog 
                        transactions={transactions} 
                        onDeleteTransaction={handleDeleteTransaction}
                    >
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs text-foreground hover:text-foreground">
                            <Eye className="mr-1 h-3 w-3" />
                            View All Transactions
                        </Button>
                    </ViewAllTransactionsDialog>
                </div>
                <TransactionDialog onSave={handleAddTransaction}>
                    <Button><PlusCircle className="mr-2 h-4 w-4" />Add</Button>
                </TransactionDialog>
            </CardHeader>
            <CardContent className="pt-0 sm:pt-0 p-0 sm:p-2">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="px-3 sm:px-4 pb-3">
                        <TabsList className="grid w-full grid-cols-4 h-9">
                            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                            <TabsTrigger value="income" className="text-xs">Income</TabsTrigger>
                            <TabsTrigger value="expense" className="text-xs">Expenses</TabsTrigger>
                            <TabsTrigger value="fee" className="text-xs">Fees</TabsTrigger>
                        </TabsList>
                    </div>
                    
                    <TabsContent value="all" className="mt-0">
                        {renderTransactionsList(filteredTransactionsByType.all)}
                    </TabsContent>
                    
                    <TabsContent value="income" className="mt-0">
                        {renderTransactionsList(filteredTransactionsByType.income)}
                    </TabsContent>
                    
                    <TabsContent value="expense" className="mt-0">
                        {renderTransactionsList(filteredTransactionsByType.expense)}
                    </TabsContent>
                    
                    <TabsContent value="fee" className="mt-0">
                        {renderTransactionsList(filteredTransactionsByType.fee)}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
      </div>
      )}
    </AppLayout>
  );
}

function StatCard({ title, amount, icon: Icon, variant }: { title: string, amount: number, icon?: React.ElementType, variant?: 'income' | 'expense' }) {
    const amountColor = variant === 'income' ? 'text-green-600 dark:text-green-400' : 
                       variant === 'expense' ? 'text-red-600 dark:text-red-400' : 
                       'text-foreground';
    return (
        <Card className="transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2 sm:p-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                {Icon && <Icon className="h-4 w-4 text-muted-foreground/70" />}
            </CardHeader>
            <CardContent className="pt-0 px-3 sm:px-4">
                <div className={`text-2xl font-bold ${amountColor}`}>
                    {formatCurrency(Math.abs(amount))}
                </div>
            </CardContent>
        </Card>
    )
}

function TransactionDialog({ children, onSave }: { children: React.ReactNode, onSave: (transaction: Transaction) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [category, setCategory] = useState('Food');
    const [type, setType] = useState<'income' | 'expense' | 'fee'>('expense');
    const [notes, setNotes] = useState('');

    const getCurrentCategories = () => {
        switch (type) {
            case 'income': return INCOME_CATEGORIES;
            case 'fee': return FEE_CATEGORIES;
            default: return EXPENSE_CATEGORIES;
        }
    };

    const handleTypeChange = (newType: 'income' | 'expense' | 'fee') => {
        setType(newType);
        // Reset category when type changes
        const categories = newType === 'income' ? INCOME_CATEGORIES : 
                          newType === 'fee' ? FEE_CATEGORIES : EXPENSE_CATEGORIES;
        setCategory(categories[0].id);
    };

    const handleSave = () => {
        if (!description.trim() || !amount.trim() || !category) return;
        const amountInCents = Math.round(parseFloat(amount) * 100);
        if (isNaN(amountInCents) || amountInCents <= 0) return;
        
        const newTransaction: Transaction = { 
            id: `txn-${Date.now()}`, 
            date: formatISO(new Date(date)), 
            description: description.trim(), 
            category, 
            type, 
            amount: Math.abs(amountInCents) 
        };
        onSave(newTransaction);
        
        // Reset form
        setDescription(''); 
        setAmount(''); 
        setDate(format(new Date(), 'yyyy-MM-dd')); 
        setCategory('Food'); 
        setType('expense'); 
        setNotes('');
        setIsOpen(false);
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="p-4 max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Transaction</DialogTitle>
                    <DialogDescription>Choose type, amount, and category for your transaction.</DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    {/* Transaction Type Selection */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Transaction Type</Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={type === 'expense' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleTypeChange('expense')}
                                className={`flex-1 ${type === 'expense' ? 'bg-red-500 hover:bg-red-600 text-white' : 'hover:bg-red-50 hover:border-red-200'}`}
                            >
                                Expense
                            </Button>
                            <Button
                                type="button"
                                variant={type === 'income' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleTypeChange('income')}
                                className={`flex-1 ${type === 'income' ? 'bg-green-500 hover:bg-green-600 text-white' : 'hover:bg-green-50 hover:border-green-200'}`}
                            >
                                Income
                            </Button>
                            <Button
                                type="button"
                                variant={type === 'fee' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleTypeChange('fee')}
                                className={`flex-1 ${type === 'fee' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'hover:bg-orange-50 hover:border-orange-200'}`}
                            >
                                Fee
                            </Button>
                        </div>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-2">
                        <Label htmlFor="amount" className="text-sm font-medium">Amount</Label>
                        <div className="relative">
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">Rs</span>
                            <Input 
                                id="amount" 
                                type="number" 
                                value={amount} 
                                onChange={e => setAmount(e.target.value)} 
                                placeholder="0.00"
                                className="pl-8 text-lg font-semibold h-12"
                                step="0.01"
                                min="0"
                            />
                        </div>
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Category</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {getCurrentCategories().map((cat) => {
                                const Icon = cat.icon;
                                return (
                                    <Button
                                        key={cat.id}
                                        type="button"
                                        variant={category === cat.id ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setCategory(cat.id)}
                                        className={`h-auto p-3 flex flex-col gap-1 ${
                                            category === cat.id ? '' : 'hover:bg-accent'
                                        }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span className="text-xs text-center leading-tight">{cat.label}</span>
                                    </Button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                        <Input 
                            id="description" 
                            value={description} 
                            onChange={e => setDescription(e.target.value)} 
                            placeholder="e.g., Coffee at Starbucks" 
                        />
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                        <Label htmlFor="date" className="text-sm font-medium">Date</Label>
                        <Input 
                            id="date" 
                            type="date" 
                            value={date} 
                            onChange={e => setDate(e.target.value)} 
                        />
                    </div>

                    {/* Optional Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</Label>
                        <Textarea 
                            id="notes"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Additional notes or details..."
                            rows={2}
                        />
                    </div>
                </div>
                
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!description.trim() || !amount.trim()}>
                        Save Transaction
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function ViewAllTransactionsDialog({ children, transactions, onDeleteTransaction }: { 
    children: React.ReactNode, 
    transactions: Transaction[], 
    onDeleteTransaction: (id: string) => void 
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [filterType, setFilterType] = useState<'all' | 'date' | 'search'>('all');
    const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTransactions = useMemo(() => {
        if (filterType === 'all') {
            return transactions; // Show ALL transactions by default
        } else if (filterType === 'date') {
            const start = parseISO(startDate);
            const end = parseISO(endDate);
            return transactions.filter(txn => {
                const txnDate = parseISO(txn.date);
                return txnDate >= start && txnDate <= end;
            });
        } else {
            const query = searchQuery.toLowerCase().trim();
            if (!query) return transactions;
            
            return transactions.filter(txn => 
                txn.description.toLowerCase().includes(query) ||
                txn.category.toLowerCase().includes(query) ||
                txn.amount.toString().includes(query.replace(/[^\d]/g, ''))
            );
        }
    }, [transactions, filterType, startDate, endDate, searchQuery]);

    const totalStats = useMemo(() => {
        const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const fees = filteredTransactions.filter(t => t.type === 'fee').reduce((sum, t) => sum + t.amount, 0);
        return { income, expenses, fees, total: income - expenses - fees };
    }, [filteredTransactions]);

    const renderTransactionsList = (transactionList: Transaction[]) => {
        if (transactionList.length === 0) {
            return <div className="text-center text-muted-foreground py-8">No transactions found for the selected criteria.</div>;
        }

        const groupedByDate = [...transactionList].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
            .reduce((acc, txn) => {
                const dateKey = format(parseISO(txn.date), 'yyyy-MM-dd');
                if (!acc[dateKey]) acc[dateKey] = [];
                acc[dateKey].push(txn);
                return acc;
            }, {} as Record<string, Transaction[]>);

        return (
            <div className="space-y-4 max-h-96 overflow-y-auto">
                {Object.entries(groupedByDate).map(([date, txns]) => {
                    const dailyExpenses = txns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                    const dailyIncome = txns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
                    const dailyFees = txns.filter(t => t.type === 'fee').reduce((sum, t) => sum + t.amount, 0);
                    
                    return (
                        <div key={date}>
                            <div className="flex justify-between items-center text-sm font-medium text-muted-foreground px-2 py-1.5 border-b bg-muted/50 rounded-t-md">
                                <span>{format(parseISO(date), 'dd MMM yyyy, EEEE')}</span>
                                <div className="flex gap-3 text-xs">
                                    {dailyIncome > 0 && <span className="text-green-600">+{formatCurrency(dailyIncome)}</span>}
                                    {dailyExpenses > 0 && <span className="text-red-600">-{formatCurrency(dailyExpenses)}</span>}
                                    {dailyFees > 0 && <span className="text-orange-600">Fees: {formatCurrency(dailyFees)}</span>}
                                </div>
                            </div>
                            <ul className="divide-y border-x border-b rounded-b-md">
                                {txns.map((txn) => {
                                    const { icon: Icon, color } = categoryDetails[txn.category] || categoryDetails['Other'];
                                    return (
                                        <li key={txn.id} className="flex items-center justify-between p-2 hover:bg-muted/50">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${color}`}>
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <p className="font-medium text-sm">{txn.description}</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className={`font-bold text-sm ${
                                                    txn.type === 'income' ? 'text-green-600' : 
                                                    txn.type === 'expense' ? 'text-red-600' : 
                                                    'text-orange-600'
                                                }`}>
                                                    {txn.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(txn.amount))}
                                                </span>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-6 w-6 text-destructive" 
                                                    onClick={() => onDeleteTransaction(txn.id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>All Transactions</DialogTitle>
                    <DialogDescription>
                        View and filter all your transaction history
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 space-y-4 overflow-hidden">
                    {/* Filter Type Selection */}
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant={filterType === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterType('all')}
                            className="flex items-center gap-2"
                        >
                            <Eye className="h-4 w-4" />
                            All
                        </Button>
                        <Button
                            type="button"
                            variant={filterType === 'date' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterType('date')}
                            className="flex items-center gap-2"
                        >
                            <Calendar className="h-4 w-4" />
                            Date Range
                        </Button>
                        <Button
                            type="button"
                            variant={filterType === 'search' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterType('search')}
                            className="flex items-center gap-2"
                        >
                            <Search className="h-4 w-4" />
                            Search
                        </Button>
                    </div>

                    {/* Filter Options */}
                    {filterType === 'date' ? (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="start-date" className="text-sm">From</Label>
                                <Input
                                    id="start-date"
                                    type="date"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end-date" className="text-sm">To</Label>
                                <Input
                                    id="end-date"
                                    type="date"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                    ) : filterType === 'search' ? (
                        <div className="space-y-2">
                            <Label htmlFor="search" className="text-sm">Search transactions</Label>
                            <Input
                                id="search"
                                type="text"
                                placeholder="Search by description, category, or amount..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full"
                            />
                        </div>
                    ) : null}

                    {/* Summary Stats */}
                    <div className="grid grid-cols-4 gap-2 p-3 bg-muted/50 rounded-lg">
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground">Income</p>
                            <p className="text-sm font-semibold text-green-600">+{formatCurrency(totalStats.income)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground">Expenses</p>
                            <p className="text-sm font-semibold text-red-600">-{formatCurrency(totalStats.expenses)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground">Fees</p>
                            <p className="text-sm font-semibold text-orange-600">-{formatCurrency(totalStats.fees)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground">Net</p>
                            <p className={`text-sm font-semibold ${totalStats.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {totalStats.total >= 0 ? '+' : ''}{formatCurrency(totalStats.total)}
                            </p>
                        </div>
                    </div>

                    {/* Transactions List */}
                    <div className="flex-1 overflow-hidden">
                        {renderTransactionsList(filteredTransactions)}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
