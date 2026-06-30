import React, { useState, useEffect } from 'react';
import {
  Home, PieChart, TrendingUp, TrendingDown, IndianRupee,
  Users, CreditCard, Target, Calendar, Plus, Trash2,
  Edit3, Eye, CalendarCheck, ArrowRightLeft, X, Wallet,
  Building, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight,
  BarChart2, ArrowUpRight, ArrowDownRight, Menu, Loader
} from 'lucide-react';

import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement,
  Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { supabase } from './supabaseClient';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

// ─────────────────────────────────────────────
//   SEED DATA
// ─────────────────────────────────────────────
const DEFAULT_CASH = 5000;

const INCOME_CATEGORIES = ['Salary', 'Business', 'Investment', 'Gifts', 'Others'];
const EXPENSE_CATEGORIES = ['Food', 'Rent', 'Utilities', 'Entertainment', 'Shopping', 'Travel', 'Others'];

const DUMMY_INCOMES = [
  { id: 1, date: new Date().toISOString().split('T')[0], amount: 50000, category: 'Salary' },
  { id: 2, date: new Date().toISOString().split('T')[0], amount: 5000, category: 'Investment' }
];

const DUMMY_EXPENSES = [
  { id: 3, date: new Date().toISOString().split('T')[0], amount: 12000, category: 'Rent' },
  { id: 4, date: new Date().toISOString().split('T')[0], amount: 2500, category: 'Food' },
  { id: 5, date: new Date().toISOString().split('T')[0], amount: 1500, category: 'Travel' }
];

const DUMMY_BANKS = [
  { id: 101, bankName: 'SBI', type: 'Savings', accountNumber: '1234', balance: 45000 },
  { id: 102, bankName: 'HDFC', type: 'Salary', accountNumber: '5678', balance: 85000 }
];

const DUMMY_CARDS = [
  { id: 201, bankName: 'ICICI', cardName: 'Amazon Pay', cardNumber: '9876', limit: 150000, outstanding: 24000, statementDate: '15', dueDate: '5' }
];

const DUMMY_BORROWERS = [
  { id: 301, name: 'Rohan Sharma', principal: 10000, repaid: 2000, date: new Date().toISOString().split('T')[0] }
];



// ─────────────────────────────────────────────
//   HELPERS
// ─────────────────────────────────────────────
const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN');
const fmtDate = (s) => new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

// ─────────────────────────────────────────────
//   APP
// ─────────────────────────────────────────────
export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [view, setView]         = useState('home');
  const [month, setMonth]       = useState(new Date());
  const [cashCollapsed, setCashCollapsed] = useState(false);
  const [banksCollapsed, setBanksCollapsed] = useState(false);
  const [cardsCollapsed, setCardsCollapsed] = useState(false);

  // Supabase Auth and Loader state
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState('');

  const [incomes,     setIncomes]     = useState([]);
  const [expenses,    setExpenses]    = useState([]);
  const [banks,       setBanks]       = useState([]);
  const [cash,        setCash]        = useState(DEFAULT_CASH);
  const [creditCards, setCreditCards] = useState([]);
  const [borrowers,   setBorrowers]   = useState([]);

  // Auth Lifecycle Hook
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch data hook
  useEffect(() => {
    if (!supabase || !session) {
      setIncomes([]);
      setExpenses([]);
      setBanks([]);
      setCash(DEFAULT_CASH);
      setCreditCards([]);
      setBorrowers([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch profiles (for cash)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('cash')
          .single();
        if (profileData) {
          setCash(Number(profileData.cash));
        } else {
          // If no profile yet, insert one
          await supabase.from('profiles').insert([{ id: session.user.id, cash: DEFAULT_CASH }]);
          setCash(DEFAULT_CASH);
        }

        // Fetch incomes
        const { data: incData } = await supabase.from('incomes').select('*').order('date', { ascending: false });
        if (incData) setIncomes(incData);

        // Fetch expenses
        const { data: expData } = await supabase.from('expenses').select('*').order('date', { ascending: false });
        if (expData) setExpenses(expData);

        // Fetch banks
        const { data: bankData } = await supabase.from('banks').select('*');
        if (bankData) setBanks(bankData);

        // Fetch credit cards
        const { data: cardData } = await supabase.from('credit_cards').select('*');
        if (cardData) setCreditCards(cardData);

        // Fetch borrowers
        const { data: borrowerData } = await supabase.from('borrowers').select('*');
        if (borrowerData) setBorrowers(borrowerData);

      } catch (err) {
        console.error('Error fetching Supabase data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        alert('Verification email sent or signed up successfully!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Modal state
  const [modal,   setModal]   = useState({ open: false, title: '', type: '', item: null });
  const [quickType, setQuickType] = useState('expense');
  const [detail,  setDetail]  = useState({ open: false, item: null, type: '' });
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [payoffAmount, setPayoffAmount] = useState('');

  const openModal  = (title, type, item = null) => {
    if (type === 'quick-log') setQuickType('expense');
    setModal({ open: true, title, type, item });
  };
  const closeModal = () => setModal({ open: false, title: '', type: '', item: null });
  const openDetail = (item, type) => setDetail({ open: true, item, type });
  const closeDetail = () => setDetail({ open: false, item: null, type: '' });

  // Database helper wrappers
  const saveQuickLog = async (date, amount, type, category) => {
    setLoading(true);
    const table = type === 'income' ? 'incomes' : 'expenses';
    const { data, error } = await supabase
      .from(table)
      .insert([{ date, amount, category, user_id: session.user.id }])
      .select();
    if (error) {
      alert('Error saving transaction: ' + error.message);
    } else if (data) {
      const setter = type === 'income' ? setIncomes : setExpenses;
      setter(p => [data[0], ...p]);
    }
    setLoading(false);
  };

  const saveIncomeExpense = async (id, date, amount, category, type) => {
    setLoading(true);
    const table = type === 'income' ? 'incomes' : 'expenses';
    const setter = type === 'income' ? setIncomes : setExpenses;

    if (id) {
      const { data, error } = await supabase
        .from(table)
        .update({ date, amount, category })
        .eq('id', id)
        .select();
      if (error) {
        alert('Error updating record: ' + error.message);
      } else if (data) {
        setter(p => p.map(x => x.id === id ? data[0] : x));
      }
    } else {
      const { data, error } = await supabase
        .from(table)
        .insert([{ date, amount, category, user_id: session.user.id }])
        .select();
      if (error) {
        alert('Error inserting record: ' + error.message);
      } else if (data) {
        setter(p => [data[0], ...p]);
      }
    }
    setLoading(false);
  };

  const deleteIncomeExpense = async (id, type) => {
    setLoading(true);
    const table = type === 'income' ? 'incomes' : 'expenses';
    const setter = type === 'income' ? setIncomes : setExpenses;

    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      alert('Error deleting: ' + error.message);
    } else {
      setter(p => p.filter(x => x.id !== id));
    }
    setLoading(false);
  };

  const saveBank = async (id, bankName, type, accountNumber, balance) => {
    setLoading(true);
    if (id) {
      const { data, error } = await supabase
        .from('banks')
        .update({ bankName, type, accountNumber, balance })
        .eq('id', id)
        .select();
      if (error) {
        alert('Error updating bank: ' + error.message);
      } else if (data) {
        setBanks(p => p.map(x => x.id === id ? data[0] : x));
      }
    } else {
      const { data, error } = await supabase
        .from('banks')
        .insert([{ bankName, type, accountNumber, balance, user_id: session.user.id }])
        .select();
      if (error) {
        alert('Error adding bank: ' + error.message);
      } else if (data) {
        setBanks(p => [...p, data[0]]);
      }
    }
    setLoading(false);
  };

  const deleteBank = async (id) => {
    setLoading(true);
    const { error } = await supabase.from('banks').delete().eq('id', id);
    if (error) {
      alert('Error deleting bank: ' + error.message);
    } else {
      setBanks(p => p.filter(x => x.id !== id));
    }
    setLoading(false);
  };

  const updateCash = async (amount) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .update({ cash: amount })
      .eq('id', session.user.id)
      .select();
    if (error) {
      alert('Error updating cash: ' + error.message);
    } else {
      setCash(amount);
    }
    setLoading(false);
  };

  const saveCreditCard = async (id, bankName, cardName, cardNumber, limit, outstanding, statementDate, dueDate) => {
    setLoading(true);
    if (id) {
      const { data, error } = await supabase
        .from('credit_cards')
        .update({ bankName, cardName, cardNumber, limit, outstanding, statementDate, dueDate })
        .eq('id', id)
        .select();
      if (error) {
        alert('Error updating card: ' + error.message);
      } else if (data) {
        setCreditCards(p => p.map(x => x.id === id ? data[0] : x));
      }
    } else {
      const { data, error } = await supabase
        .from('credit_cards')
        .insert([{ bankName, cardName, cardNumber, limit, outstanding, statementDate, dueDate, user_id: session.user.id }])
        .select();
      if (error) {
        alert('Error adding card: ' + error.message);
      } else if (data) {
        setCreditCards(p => [...p, data[0]]);
      }
    }
    setLoading(false);
  };

  const deleteCreditCard = async (id) => {
    setLoading(true);
    const { error } = await supabase.from('credit_cards').delete().eq('id', id);
    if (error) {
      alert('Error deleting card: ' + error.message);
    } else {
      setCreditCards(p => p.filter(x => x.id !== id));
    }
    setLoading(false);
  };

  const payCreditCard = async (id, amount) => {
    setLoading(true);
    const card = creditCards.find(c => c.id === id);
    if (!card) return;
    const newOutstanding = Math.max(0, card.outstanding - amount);
    const { data, error } = await supabase
      .from('credit_cards')
      .update({ outstanding: newOutstanding })
      .eq('id', id)
      .select();
    if (error) {
      alert('Error paying card: ' + error.message);
    } else if (data) {
      setCreditCards(p => p.map(x => x.id === id ? data[0] : x));
    }
    setLoading(false);
  };

  const saveBorrower = async (id, name, principal, date) => {
    setLoading(true);
    if (id) {
      const { data, error } = await supabase
        .from('borrowers')
        .update({ name, principal, date })
        .eq('id', id)
        .select();
      if (error) {
        alert('Error updating borrower: ' + error.message);
      } else if (data) {
        setBorrowers(p => p.map(x => x.id === id ? data[0] : x));
      }
    } else {
      const { data, error } = await supabase
        .from('borrowers')
        .insert([{ name, principal, repaid: 0, date, user_id: session.user.id }])
        .select();
      if (error) {
        alert('Error adding borrower: ' + error.message);
      } else if (data) {
        setBorrowers(p => [...p, data[0]]);
      }
    }
    setLoading(false);
  };

  const deleteBorrower = async (id) => {
    setLoading(true);
    const { error } = await supabase.from('borrowers').delete().eq('id', id);
    if (error) {
      alert('Error deleting borrower: ' + error.message);
    } else {
      setBorrowers(p => p.filter(x => x.id !== id));
    }
    setLoading(false);
  };

  const receiveRepayment = async (id, amount) => {
    setLoading(true);
    const b = borrowers.find(x => x.id === id);
    if (!b) return;
    const newRepaid = b.repaid + amount;
    const { data, error } = await supabase
      .from('borrowers')
      .update({ repaid: newRepaid })
      .eq('id', id)
      .select();
    if (error) {
      alert('Error recording repayment: ' + error.message);
    } else if (data) {
      setBorrowers(p => p.map(x => x.id === id ? data[0] : x));
    }
    setLoading(false);
  };

  const settleBorrower = async (id) => {
    setLoading(true);
    const b = borrowers.find(x => x.id === id);
    if (!b) return;
    const { data, error } = await supabase
      .from('borrowers')
      .update({ repaid: b.principal })
      .eq('id', id)
      .select();
    if (error) {
      alert('Error settling record: ' + error.message);
    } else if (data) {
      setBorrowers(p => p.map(x => x.id === id ? data[0] : x));
    }
    setLoading(false);
  };

  // Month helpers
  const changeMonth = (d) => { const n = new Date(month); n.setMonth(n.getMonth() + d); setMonth(n); };
  const monthStr = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const byMonth = (arr) => arr.filter(it => {
    const d = new Date(it.date);
    return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth();
  });

  // Calculations
  const curInc  = byMonth(incomes);
  const curExp  = byMonth(expenses);
  const totInc  = curInc.reduce((s, i) => s + i.amount, 0);
  const totExp  = curExp.reduce((s, i) => s + i.amount, 0);
  const net     = totInc - totExp;

  const today = new Date();
  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(today.getDate() - 14); // inclusive of today = 15 days
  fifteenDaysAgo.setHours(0,0,0,0);
  const last15Inc = incomes.filter(i => new Date(i.date) >= fifteenDaysAgo && new Date(i.date) <= today);
  const last15Exp = expenses.filter(e => new Date(e.date) >= fifteenDaysAgo && new Date(e.date) <= today);
  const tot15Inc = last15Inc.reduce((s, i) => s + i.amount, 0);
  const tot15Exp = last15Exp.reduce((s, i) => s + i.amount, 0);

  const yearInc = incomes.filter(i => new Date(i.date).getFullYear() === month.getFullYear());
  const yearExp = expenses.filter(e => new Date(e.date).getFullYear() === month.getFullYear());
  const totYearInc = yearInc.reduce((s, i) => s + i.amount, 0);
  const totYearExp = yearExp.reduce((s, i) => s + i.amount, 0);

  const totalWealth        = cash + banks.reduce((s, b) => s + b.balance, 0);
  const lentOut            = borrowers.reduce((s, b) => s + (b.principal - b.repaid), 0);
  const ccDebt             = creditCards.reduce((s, c) => s + c.outstanding, 0);
  const ccLimit            = creditCards.reduce((s, c) => s + c.limit, 0);
  const ccUtil             = ccLimit > 0 ? ((ccDebt / ccLimit) * 100).toFixed(1) : 0;


  const navItems = [
    { id: 'home',         label: 'Home',      short: 'Home',   icon: <Home size={18}/> },
    { id: 'cashflow',     label: 'Cashflow',  short: 'Flow',   icon: <ArrowRightLeft size={18}/> },
    { id: 'accounts',     label: 'Wealth',    short: 'Wealth', icon: <TrendingUp size={18}/> },
    { id: 'borrowers',    label: 'Lent',      short: 'Lent',   icon: <Users size={18}/> },
    { id: 'credit-cards', label: 'Cards',     short: 'Cards',  icon: <CreditCard size={18}/> },
    { id: 'samiti',       label: 'Samiti',    short: 'Samiti', icon: <Target size={18}/> },
    { id: 'dashboard',    label: 'Dashboard', short: 'Stats',  icon: <BarChart2 size={18}/> },
  ];

  // Chart Data Configurations
  const days15Labels = Array.from({length: 15}, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 14 + i);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const lineData = {
    labels: days15Labels,
    datasets: [
      {
        label: 'Income',
        data: Array.from({length: 15}, (_, i) => {
          const d = new Date(today); d.setDate(today.getDate() - 14 + i);
          return last15Inc.filter(x => new Date(x.date).toDateString() === d.toDateString()).reduce((s, x) => s + x.amount, 0);
        }),
        borderColor: '#00B386', backgroundColor: 'rgba(0, 179, 134, 0.1)', fill: true, tension: 0.4
      },
      {
        label: 'Expense',
        data: Array.from({length: 15}, (_, i) => {
          const d = new Date(today); d.setDate(today.getDate() - 14 + i);
          return last15Exp.filter(x => new Date(x.date).toDateString() === d.toDateString()).reduce((s, x) => s + x.amount, 0);
        }),
        borderColor: '#FF4F5E', backgroundColor: 'rgba(255, 79, 94, 0.1)', fill: true, tension: 0.4
      }
    ]
  };

  const monthLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const yearlyBarData = {
    labels: monthLabels,
    datasets: [
      {
        label: 'Income',
        data: monthLabels.map((_, i) => yearInc.filter(x => new Date(x.date).getMonth() === i).reduce((s, x) => s + x.amount, 0)),
        backgroundColor: '#00B386', borderRadius: 4
      },
      {
        label: 'Expense',
        data: monthLabels.map((_, i) => yearExp.filter(x => new Date(x.date).getMonth() === i).reduce((s, x) => s + x.amount, 0)),
        backgroundColor: '#FF4F5E', borderRadius: 4
      }
    ]
  };

  const doughnutData = {
    labels: ['Banks & Cash', 'Lent Out'],
    datasets: [{
      data: [totalWealth, lentOut],
      backgroundColor: ['#3B82F6', '#10B981'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const expenseCatBreakdown = EXPENSE_CATEGORIES.map(cat => 
    curExp.filter(x => (x.category || 'Others') === cat).reduce((s, x) => s + x.amount, 0)
  );

  const expenseCatDoughnutData = {
    labels: EXPENSE_CATEGORIES,
    datasets: [{
      data: expenseCatBreakdown,
      backgroundColor: ['#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#9CA3AF'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#4B5563', font: { family: 'Inter', size: 11, weight: '600' } } },
      tooltip: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderWidth: 1, titleColor: '#111827', bodyColor: '#4B5563', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }
    },
    scales: {
      x: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#4B5563', font: { size: 10 } } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#4B5563', font: { size: 10 } } },
    },
  };
  const doughnutOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { color: '#4B5563', font: { family: 'Inter', size: 11, weight: '600' } } },
      tooltip: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderWidth: 1, titleColor: '#111827', bodyColor: '#4B5563', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }
    }
  };


  // ─── Income/Expense delete helpers ───────────────
  const deleteIncome  = (id) => { if (confirm('Delete this income record?'))  deleteIncomeExpense(id, 'income'); };
  const deleteExpense = (id) => { if (confirm('Delete this expense record?')) deleteIncomeExpense(id, 'expenses'); };

  // ─── MonthSelector sub-component ─────────────────
  const MonthSel = () => (
    <div className="month-selector">
      <button className="month-icon-btn" onClick={() => changeMonth(-1)}><ChevronLeft size={14}/></button>
      <span className="month-text"><Calendar size={13}/>{monthStr}</span>
      <button className="month-icon-btn" onClick={() => changeMonth(1)}><ChevronRight size={14}/></button>
    </div>
  );

  // ─── StatCard sub-component ───────────────────────
  const StatCard = ({ icon, color, label, value, valueColor, sub }) => (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div className="stat-body">
        <span className="stat-label">{label}</span>
        <span className={`stat-value ${valueColor || ''}`}>{value}</span>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────
  //   RENDER
  // ─────────────────────────────────────────────────
  if (!supabase) {
    return (
      <div className="loader-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={{ color: 'var(--red)', fontWeight: 800, fontSize: '1.5rem' }}>Configuration Required</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0.75rem auto 1.5rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
          Supabase credentials are missing. If you have deployed to Vercel, please go to your <strong>Vercel Project Settings &rarr; Environment Variables</strong> and add:
        </p>
        <div style={{ background: 'var(--bg-hover)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', display: 'inline-block', textAlign: 'left', fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
          <div>VITE_SUPABASE_URL</div>
          <div style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>https://otnxfohecczaberldjuy.supabase.co</div>
          <div>VITE_SUPABASE_ANON_KEY</div>
          <div style={{ color: 'var(--text-muted)' }}>your-supabase-anon-key</div>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>After adding the variables, redeploy your project on Vercel.</p>
      </div>
    );
  }

  if (loading && incomes.length === 0 && banks.length === 0) {
    return (
      <div className="loader-container">
        <div className="pulsing-orb">
          <IndianRupee size={36} />
        </div>
        <span className="loader-text">Syncing with Supabase...</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="auth-container">
        {/* Animated Background Bubbles */}
        <ul className="auth-bg-bubbles">
          <li></li><li></li><li></li><li></li><li></li>
          <li></li><li></li><li></li><li></li><li></li>
        </ul>

        <div className="auth-card">
          <div className="auth-header" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 0 10px rgba(79, 70, 229, 0.4))' }}>💼</span>
            </div>
            <h2 style={{ fontSize: '1.45rem', background: 'linear-gradient(135deg, #fff 30%, var(--text-muted) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>
              Finance Buddy
            </h2>
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem', marginBottom: '0.25rem' }}>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--green)', letterSpacing: '0.3px' }}>
                Welcome, Shailesh Kumar Nirala
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '3px' }}>
                आपका स्वागत है, शैलेश कुमार निराला
              </div>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {isSignUp ? 'Create your cloud account' : 'Sign in to sync your data'}
            </p>
          </div>
          <form className="auth-form" onSubmit={handleAuth}>
            <div className="form-group full">
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</label>
              <input 
                type="email" 
                required 
                placeholder="your@email.com" 
                value={authEmail} 
                onChange={e => setAuthEmail(e.target.value)} 
                className="cred-input"
                style={{ background: 'rgba(255,255,255,0.04)', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.85rem' }}
              />
            </div>
            <div className="form-group full">
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
              <input 
                type="password" 
                required 
                placeholder="••••••••" 
                value={authPassword} 
                onChange={e => setAuthPassword(e.target.value)} 
                className="cred-input"
                style={{ background: 'rgba(255,255,255,0.04)', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.85rem' }}
              />
            </div>
            {authError && <div style={{ color: 'var(--red)', fontSize: '0.8rem', fontWeight: 700, textAlign: 'center' }}>{authError}</div>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: 42, justifyContent: 'center', fontWeight: 800, borderRadius: '8px', fontSize: '0.88rem' }}>
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>
          <div className="auth-toggle" onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <strong>{isSignUp ? 'Sign In' : 'Sign Up'}</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">

      {/* ═══ TOP NAVBAR ═══ */}
      <header className="top-navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div className="brand">
            <span style={{ fontWeight: 900, letterSpacing: '-0.5px' }}>Finance Buddy</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <nav className="nav-menu">
            {navItems.map(it => (
              <button
                key={it.id}
                className={`nav-item ${view === it.id ? 'active' : ''}`}
                onClick={() => setView(it.id)}
              >
                {it.icon}
                <span>{it.label}</span>
              </button>
            ))}
          </nav>

          <div className="nav-profile">
            <div className="profile-avatar">SK</div>
            <span className="profile-name">Shailesh</span>
            <button 
              className="btn" 
              style={{ background: 'var(--red-bg)', color: 'var(--red)', height: '28px', padding: '0 10px', fontSize: '0.72rem', fontWeight: 800, border: '1px solid transparent', borderRadius: '6px', marginLeft: '5px' }}
              onClick={() => supabase.auth.signOut()}
            >
              Logout
            </button>
          </div>
        </div>

      </header>

      {/* ═══ MAIN ═══ */}
      <main className="main-content">
        <div className="scroll-area">

          {/* ══ HOME ══ */}
          {view === 'home' && (
            <div className="fade-in-view">
              <div className="page-header">
                <div className="page-header-left">
                  <span className="eyebrow">{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <h1>Welcome, {session.user.email.split('@')[0]}</h1>
                </div>
                <div className="page-header-right">
                  <MonthSel/>
                  <button className="btn btn-primary" onClick={() => openModal('Log Cashflow', 'quick-log')}>
                    <Plus size={15}/> Log Transaction
                  </button>
                </div>
              </div>

              <div className="bento-grid">
                <div className="cred-card bento-col-4" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '2rem', boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{fontSize: '1.2rem', animation: 'float 3s ease-in-out infinite'}}>📈</span> Total Income</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--green)' }}>{fmt(totInc)}</div>
                </div>
                <div className="cred-card bento-col-4" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '2rem', boxShadow: '0 8px 32px rgba(239, 68, 68, 0.15)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{fontSize: '1.2rem', animation: 'float 3s ease-in-out infinite 0.5s'}}>📉</span> Total Expenses</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--red)' }}>{fmt(totExp)}</div>
                </div>
                <div className="cred-card bento-col-4" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '2rem', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15)' }}>
                  <div style={{ position: 'absolute', right: -20, top: -20, fontSize: '8rem', opacity: 0.1, animation: 'float 6s ease-in-out infinite' }}>💰</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8, zIndex: 1 }}><span style={{fontSize: '1.2rem'}}>💎</span> Net Savings</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: net >= 0 ? 'var(--blue)' : 'var(--red)', zIndex: 1 }}>{(net >= 0 ? '+' : '') + fmt(net)}</div>
                </div>
              </div>

              {/* Quick Add Form */}
              <div className="cred-card" style={{ marginBottom: '2.5rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                  <Plus size={18} style={{ color: 'var(--blue)' }}/>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--blue)', letterSpacing: 0.5, textTransform: 'uppercase' }}>Quick Entry</h3>
                </div>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const f = e.target;
                  const date = f.date.value;
                  const inc = parseFloat(f.income.value) || 0;
                  const exp = parseFloat(f.expense.value) || 0;
                  if (!date || (inc === 0 && exp === 0)) { alert('Enter a date and at least one amount.'); return; }
                  
                  if (inc > 0) {
                    saveIncomeExpense(null, date, inc, 'Others', 'income');
                  }
                  if (exp > 0) {
                    saveIncomeExpense(null, date, exp, 'Others', 'expenses');
                  }
                  f.reset();
                  f.date.value = new Date().toISOString().split('T')[0];
                }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.25rem', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Transaction Date</label>
                    <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="cred-input"/>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--green)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Income (₹)</label>
                    <input type="number" name="income" placeholder="0" min="0" step="0.01" className="cred-input" style={{ color: 'var(--green)', fontWeight: 800 }}/>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--red)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Expense (₹)</label>
                    <input type="number" name="expense" placeholder="0" min="0" step="0.01" className="cred-input" style={{ color: 'var(--red)', fontWeight: 800 }}/>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ height: '48px', padding: '0 24px', fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: 1 }}>Save Entry</button>
                </form>
              </div>

              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Daily Cashflow Summary</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Statement for {monthStr}</p>
                </div>
              </div>

              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Daily Income (₹)</th>
                      <th>Daily Expense (₹)</th>
                      <th>Net Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const map = {};
                      [...curInc, ...curExp].forEach(item => {
                        const d = item.date;
                        if (!map[d]) map[d] = { date: d, inc: 0, exp: 0 };
                        if (incomes.some(i => i.id === item.id)) map[d].inc += item.amount;
                        else map[d].exp += item.amount;
                      });
                      const daily = Object.values(map).sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 12);
                      
                      if (daily.length === 0) return <tr><td colSpan="4" className="empty-state">No records for this month</td></tr>;
                      
                      return daily.map(item => {
                        const net = item.inc - item.exp;
                        return (
                          <tr key={item.date}>
                            <td style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{fmtDate(item.date)}</td>
                            <td style={{ fontWeight: 700, color: 'var(--green)' }}>{item.inc > 0 ? '+' + fmt(item.inc) : '—'}</td>
                            <td style={{ fontWeight: 700, color: 'var(--red)' }}>{item.exp > 0 ? '-' + fmt(item.exp) : '—'}</td>
                            <td>
                              <span className={`badge ${net >= 0 ? 'green' : 'red'}`}>
                                {net > 0 ? '+' : ''}{fmt(net)}
                              </span>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}


          {/* ══ DASHBOARD ══ */}
          {view === 'dashboard' && (
            <div className="fade-in-view">
              <div className="page-header" style={{ marginBottom: '2rem' }}>
                <div className="page-header-left">
                  <span className="eyebrow">Overview</span>
                  <h1>Dashboard</h1>
                </div>
                <div className="page-header-right">
                  <MonthSel />
                </div>
              </div>

              {/* Main 2-Column Dashboard Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.1fr', gap: '1.75rem', alignItems: 'start' }} className="dashboard-grid">
                
                {/* Left Column: Metrics & Charts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                  
                  {/* Hero Metric: Net Wealth */}
                  <div className="panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-hover) 100%)', borderLeft: '6px solid var(--accent)' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        💎 Total Net Worth (Cash + Bank)
                      </span>
                      <span style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1.5px', lineHeight: 1.1 }}>{fmt(totalWealth)}</span>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 8, fontWeight: 500 }}>Your total physical cash and bank balances combined.</p>
                    </div>
                    <div style={{ background: 'var(--accent-mid)', padding: '20px', borderRadius: '50%', color: 'var(--accent)' }}>
                      <Wallet size={40} />
                    </div>
                  </div>

                  {/* Monthly Stats Row */}
                  <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                    <StatCard icon={<TrendingUp size={18}/>} color="green" label="Monthly Income" value={fmt(totInc)} valueColor="green" sub="This Month" />
                    <StatCard icon={<TrendingDown size={18}/>} color="red" label="Monthly Expenses" value={fmt(totExp)} valueColor="red" sub="This Month" />
                    <StatCard icon={<IndianRupee size={18}/>} color="blue" label="Net Savings" value={fmt(net)} valueColor={net >= 0 ? "green" : "red"} sub="Income - Expenses" />
                  </div>

                  {/* 15-Day Cashflow Chart */}
                  <div className="panel" style={{ padding: '1.5rem' }}>
                    <div className="panel-header" style={{ background: 'transparent', borderBottom: '1px solid rgba(0,0,0,0.05)', padding: '0 0 1rem 0', marginBottom: '1.5rem' }}>
                      <TrendingUp size={18} style={{ color: 'var(--accent)' }}/>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Cashflow Trend (Last 15 Days)</h3>
                    </div>
                    <div style={{ height: '260px', position: 'relative' }}>
                      <Line data={lineData} options={chartOpts} />
                    </div>
                  </div>

                </div>

                {/* Right Column: Summaries & Alerts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

                  {/* Bank Accounts Quick List */}
                  <div className="panel" style={{ padding: '1.5rem' }}>
                    <div className="panel-header" style={{ background: 'transparent', borderBottom: '1px solid rgba(0,0,0,0.05)', padding: '0 0 1rem 0', marginBottom: '1rem' }}>
                      <Building size={16} style={{ color: 'var(--blue)' }}/>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Bank Accounts & Cash</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-hover)', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Cash on Hand</span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--green)' }}>{fmt(cash)}</span>
                      </div>
                      {banks.map(b => (
                        <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-hover)', borderRadius: '8px' }}>
                          <div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block' }}>{b.bankName}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>•••• {b.accountNumber.slice(-4)}</span>
                          </div>
                          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--blue)' }}>{fmt(b.balance)}</span>
                        </div>
                      ))}
                      {banks.length === 0 && <div className="empty-state" style={{ padding: '10px 0' }}>No bank accounts.</div>}
                    </div>
                  </div>

                  {/* Credit Card Dues Alert */}
                  {creditCards.length > 0 && (
                    <div className="panel" style={{ padding: '1.5rem' }}>
                      <div className="panel-header" style={{ background: 'transparent', borderBottom: '1px solid rgba(0,0,0,0.05)', padding: '0 0 1rem 0', marginBottom: '1rem' }}>
                        <CreditCard size={16} style={{ color: 'var(--purple)' }}/>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Outstanding Cards</h3>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {creditCards.map(c => {
                          if (parseFloat(c.outstanding) === 0) return null;
                          return (
                            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(244, 63, 94, 0.04)', border: '1px solid rgba(244, 63, 94, 0.1)', borderRadius: '8px' }}>
                              <div>
                                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block' }}>{c.bankName} CC</span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--red)', fontWeight: 700 }}>Due: {c.dueDate || 'N/A'}{c.dueDate ? 'th' : ''}</span>
                              </div>
                              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--red)' }}>{fmt(c.outstanding)}</span>
                            </div>
                          );
                        })}
                        {creditCards.every(c => parseFloat(c.outstanding) === 0) && (
                          <div className="empty-state" style={{ padding: '10px 0', color: 'var(--green)' }}>✓ All credit card bills paid!</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Borrower Alerts */}
                  {borrowers.length > 0 && borrowers.some(b => b.principal - b.repaid > 0) && (
                    <div className="panel" style={{ padding: '1.5rem' }}>
                      <div className="panel-header" style={{ background: 'transparent', borderBottom: '1px solid rgba(0,0,0,0.05)', padding: '0 0 1rem 0', marginBottom: '1rem' }}>
                        <Users size={16} style={{ color: 'var(--amber)' }}/>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Pending Borrowers (Khata)</h3>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {borrowers.map(b => {
                          const rem = b.principal - b.repaid;
                          if (rem <= 0) return null;
                          return (
                            <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(245, 158, 11, 0.04)', border: '1px solid rgba(245, 158, 11, 0.1)', borderRadius: '8px' }}>
                              <div>
                                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block' }}>{b.name}</span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Given: {fmtDate(b.date)}</span>
                              </div>
                              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--amber)' }}>{fmt(rem)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>

              </div>
            </div>
          )}

          {/* ══ CASHFLOW ══ */}
          {view === 'cashflow' && (
            <div className="fade-in-view">
              <div className="page-header">
                <div className="page-header-left">
                  <span className="eyebrow">Transactions</span>
                  <h1>Cashflow</h1>
                </div>
                <div className="page-header-right" style={{ display: 'flex', gap: '8px' }}>
                  <MonthSel/>
                  <button className="btn btn-primary" onClick={() => openModal('Add Income', 'income')}>
                    <Plus size={15}/> Add Income
                  </button>
                  <button className="btn" style={{ background: 'var(--red-bg)', color: 'var(--red)' }} onClick={() => openModal('Add Expense', 'expenses')}>
                    <Plus size={15}/> Add Expense
                  </button>
                </div>
              </div>

              <div className="stat-grid">
                <StatCard icon={<IndianRupee size={18}/>} color="green" label="Total Income (Month)" value={fmt(totInc)} valueColor="green" />
                <StatCard icon={<IndianRupee size={18}/>} color="red" label="Total Expenses (Month)" value={fmt(totExp)} valueColor="red" />
                <StatCard icon={<TrendingUp size={18}/>} color="blue" label="Net Cashflow" value={fmt(totInc - totExp)} valueColor={totInc - totExp >= 0 ? "blue" : "red"} />
              </div>

              <div className="cashflow-split-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                {/* INCOMES TABLE */}
                <div className="data-table-wrap" style={{ marginTop: 0 }}>
                  <div className="panel-header" style={{ background: 'transparent', borderBottom: '1px solid rgba(0,0,0,0.05)', padding: '1rem 1.25rem' }}>
                    <h3 style={{ color: 'var(--green)' }}>Recent Income</h3>
                  </div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Amount (₹)</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {curInc.sort((a,b) => new Date(b.date) - new Date(a.date)).map(item => (
                        <tr key={item.id}>
                          <td style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{fmtDate(item.date)}</td>
                          <td><span className="badge" style={{ background: 'var(--green-bg)', color: 'var(--green)', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>{item.category || 'Others'}</span></td>
                          <td style={{ fontWeight: 700, color: 'var(--green)' }}>+{fmt(item.amount)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="action-btns" style={{ justifyContent: 'flex-end' }}>
                              <button className="btn-icon" title="Edit" onClick={() => openModal('Edit Income', 'income', item)}>
                                <Edit3 size={13}/>
                              </button>
                              <button className="btn-icon danger" title="Delete" onClick={() => {
                                if(!window.confirm('Delete this income?')) return;
                                setIncomes(p => p.filter(x => x.id !== item.id));
                              }}>
                                <Trash2 size={13}/>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {curInc.length === 0 && <tr><td colSpan="4" className="empty-state">No income this month</td></tr>}
                    </tbody>
                  </table>
                </div>

                {/* EXPENSES TABLE */}
                <div className="data-table-wrap" style={{ marginTop: 0 }}>
                  <div className="panel-header" style={{ background: 'transparent', borderBottom: '1px solid rgba(0,0,0,0.05)', padding: '1rem 1.25rem' }}>
                    <h3 style={{ color: 'var(--red)' }}>Recent Expenses</h3>
                  </div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Amount (₹)</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {curExp.sort((a,b) => new Date(b.date) - new Date(a.date)).map(item => (
                        <tr key={item.id}>
                          <td style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{fmtDate(item.date)}</td>
                          <td><span className="badge" style={{ background: 'var(--red-bg)', color: 'var(--red)', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>{item.category || 'Others'}</span></td>
                          <td style={{ fontWeight: 700, color: 'var(--red)' }}>-{fmt(item.amount)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="action-btns" style={{ justifyContent: 'flex-end' }}>
                              <button className="btn-icon" title="Edit" onClick={() => openModal('Edit Expense', 'expenses', item)}>
                                <Edit3 size={13}/>
                              </button>
                              <button className="btn-icon danger" title="Delete" onClick={() => {
                                if(!window.confirm('Delete this expense?')) return;
                                setExpenses(p => p.filter(x => x.id !== item.id));
                              }}>
                                <Trash2 size={13}/>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {curExp.length === 0 && <tr><td colSpan="4" className="empty-state">No expenses this month</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ══ YEARLY SUMMARY OVERVIEW ══ */}
              <div className="panel" style={{ marginTop: '2rem', padding: '1.5rem' }}>
                <div className="panel-header" style={{ background: 'transparent', borderBottom: '1px solid rgba(0,0,0,0.05)', padding: '0 0 1rem 0', marginBottom: '1.5rem' }}>
                  <CalendarCheck size={18} style={{ color: 'var(--blue)' }}/>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Yearly Cashflow Overview ({month.getFullYear()})</h3>
                </div>

                {/* Yearly Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '12px 16px' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Yearly Income</span>
                    <span style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--green)' }}>{fmt(totYearInc)}</span>
                  </div>
                  <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '12px 16px' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Yearly Expenses</span>
                    <span style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--red)' }}>{fmt(totYearExp)}</span>
                  </div>
                  <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '12px 16px' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Net Savings</span>
                    <span style={{ fontSize: '1.35rem', fontWeight: 900, color: (totYearInc - totYearExp) >= 0 ? 'var(--blue)' : 'var(--red)' }}>{fmt(totYearInc - totYearExp)}</span>
                  </div>
                </div>

                {/* Yearly Chart Visualization */}
                <div style={{ height: '220px', position: 'relative' }}>
                  <Bar data={yearlyBarData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false }
                    },
                    scales: {
                      x: { grid: { display: false } },
                      y: { grid: { color: 'rgba(0,0,0,0.03)' } }
                    }
                  }}/>
                </div>
              </div>

            </div>
          )}

          {/* ══ MY WEALTH ══ */}
          {view === 'accounts' && (() => {
            const bankTotal = banks.reduce((s, b) => s + b.balance, 0);
            const cashPct = totalWealth > 0 ? ((cash / totalWealth) * 100).toFixed(0) : 0;
            const bankPct = totalWealth > 0 ? ((bankTotal / totalWealth) * 100).toFixed(0) : 0;

            return (
              <div className="fade-in-view">
                <div className="page-header" style={{ marginBottom: '2rem' }}>
                  <div className="page-header-left">
                    <span className="eyebrow">Assets</span>
                    <h1>My Wealth</h1>
                  </div>
                  <div className="page-header-right">
                    <button className="btn btn-primary" onClick={() => openModal('Add Bank Account', 'bank')}>
                      <Plus size={15}/> Add Account
                    </button>
                  </div>
                </div>

                {/* Elegant Total Wealth Header Card */}
                <div className="panel" style={{ padding: '2rem', marginBottom: '2rem', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'center' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      💎 Total Net Wealth
                    </span>
                    <span style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--accent)', letterSpacing: '-1.5px', lineHeight: 1.1 }}>{fmt(totalWealth)}</span>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 8, fontWeight: 500 }}>Combined valuation of physical cash and active bank deposits.</p>
                  </div>
                  
                  {/* Visual ratio bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: '1px solid var(--border)', paddingLeft: '2rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Asset Distribution</div>
                    <div style={{ display: 'flex', height: 8, borderRadius: 99, overflow: 'hidden', background: 'var(--border)' }}>
                      <div style={{ width: `${cashPct}%`, background: 'var(--green)' }} title={`Cash: ${cashPct}%`}/>
                      <div style={{ width: `${bankPct}%`, background: 'var(--blue)' }} title={`Banks: ${bankPct}%`}/>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700 }}>
                      <span style={{ color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }}/> Cash ({cashPct}%)
                      </span>
                      <span style={{ color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)' }}/> Banks ({bankPct}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.5rem' }}>
                  {/* Cash Card */}
                  <div className="panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.5rem', borderTop: '4px solid var(--green)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Wallet size={16} color="var(--green)"/>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Cash on Hand</span>
                      </div>
                      <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--green)', letterSpacing: -1 }}>{fmt(cash)}</div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Physical liquidity (in hand)</span>
                    </div>
                    
                    <form 
                      onSubmit={e => { e.preventDefault(); const v = e.target.c.value; if (v) { updateCash(parseFloat(v)); e.target.reset(); }}} 
                      style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: '1rem' }}
                    >
                      <div style={{ position: 'relative', flex: 1 }}>
                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem' }}>₹</span>
                        <input 
                          name="c" 
                          type="number" 
                          placeholder="New amount" 
                          min="0" 
                          required
                          style={{
                            width: '100%',
                            padding: '8px 10px 8px 20px',
                            background: 'var(--bg-base)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: 700
                          }}
                        />
                      </div>
                      <button type="submit" className="btn btn-primary" style={{ padding: '0 16px', borderRadius: '6px', fontSize: '0.8rem', height: '34px' }}>Update</button>
                    </form>
                  </div>

                  {/* Bank Cards */}
                  {banks.map((acc) => (
                    <div 
                      key={acc.id} 
                      className="panel" 
                      style={{ 
                        padding: '1.5rem', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between', 
                        gap: '1.25rem', 
                        borderTop: '4px solid var(--blue)' 
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{acc.bankName}</h3>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{acc.type} Account</span>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', background: 'var(--border)', padding: '3px 8px', borderRadius: '4px', fontWeight: 750, fontFamily: 'monospace' }}>
                            {acc.accountNumber.slice(-4)}
                          </span>
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-base)', borderRadius: '8px', padding: '10px 14px', border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Balance</span>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--blue)' }}>{fmt(acc.balance)}</div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                        <button 
                          onClick={() => openModal('Edit Bank Account', 'bank', acc)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)', cursor: 'pointer' }}
                        >
                          <Edit3 size={13}/> Edit Account
                        </button>
                        <button 
                          onClick={() => { if (confirm(`Remove ${acc.bankName} account?`)) deleteBank(acc.id); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', fontWeight: 800, color: 'var(--red)', cursor: 'pointer' }}
                        >
                          <Trash2 size={13}/> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}


          {/* ══ CREDIT CARDS ══ */}
          {view === 'credit-cards' && (() => {
            return (
              <div className="fade-in-view">
                {/* Section Header */}
                <div className="page-header" style={{ marginBottom: '2rem' }}>
                  <div className="page-header-left">
                    <span className="eyebrow">Liabilities</span>
                    <h1>Credit Cards</h1>
                  </div>
                  <div className="page-header-right">
                    <button className="btn btn-primary" onClick={() => openModal('Add Credit Card', 'card')}>
                      <Plus size={15}/> Add Card
                    </button>
                  </div>
                </div>

                <div className="stat-grid" style={{ marginBottom: '1.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                  <StatCard icon={<CreditCard size={18}/>}   color="purple" label="Total Cards"       value={String(creditCards.length)}/>
                  <StatCard icon={<CheckCircle size={18}/>}  color="blue"   label="Total Limit"       value={fmt(ccLimit)}/>
                  <StatCard icon={<AlertTriangle size={18}/>} color="red"   label="Total Outstanding" value={fmt(ccDebt)} valueColor="red" sub={`${ccUtil}% utilized`}/>
                  <StatCard icon={<CheckCircle size={18}/>}  color="green"  label="Available Credit"  value={fmt(ccLimit - ccDebt)} valueColor="green"/>
                </div>

                {creditCards.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {creditCards.map((card, idx) => {
                      const util = card.limit > 0 ? ((card.outstanding / card.limit) * 100).toFixed(0) : 0;
                      
                      let healthColor = "var(--green)";
                      let healthBg = "var(--green-bg)";
                      if (util >= 30 && util <= 50) {
                        healthColor = "var(--amber)";
                        healthBg = "var(--amber-bg)";
                      } else if (util > 50) {
                        healthColor = "var(--red)";
                        healthBg = "var(--red-bg)";
                      }

                      const getOrdinal = (n) => {
                        const s = ["th", "st", "nd", "rd"],
                              v = n % 100;
                        return n + (s[(v - 20) % 10] || s[v] || s[0]);
                      };

                      const dueOrdinal = card.dueDate ? getOrdinal(parseInt(card.dueDate)) : "N/A";
                      const statementOrdinal = card.statementDate ? getOrdinal(parseInt(card.statementDate)) : "N/A";

                      return (
                        <div 
                          key={card.id} 
                          className="panel" 
                          style={{ 
                            padding: '1.5rem', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '1.25rem',
                            borderTop: `4px solid ${healthColor}`
                          }}
                        >
                          {/* Card Header Info */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{card.bankName}</h3>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{card.cardName} ({card.cardNumber.slice(-4)})</span>
                            </div>
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: healthColor, background: healthBg, padding: '3px 8px', borderRadius: '99px', textTransform: 'uppercase' }}>
                              {util}% Utilized
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="progress-bar-wrap" style={{ height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 99 }}>
                            <div style={{ height: '100%', background: healthColor, width: `${Math.min(util, 100)}%`, borderRadius: 99 }}/>
                          </div>

                          {/* Status Details */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: 'var(--bg-base)', padding: '10px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                            <div>
                              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Limit</span>
                              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>{fmt(card.limit)}</span>
                            </div>
                            <div>
                              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Outstanding</span>
                              <span style={{ fontSize: '0.85rem', fontWeight: 805, color: parseFloat(card.outstanding) > 0 ? 'var(--red)' : 'var(--text-primary)' }}>{fmt(card.outstanding)}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Available</span>
                              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--green)' }}>{fmt(card.limit - card.outstanding)}</span>
                            </div>
                          </div>

                          {/* Due Dates */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            <div>Statement: <strong style={{ color: 'var(--text-primary)' }}>{statementOrdinal}</strong></div>
                            <div style={{ textAlign: 'right' }}>Pay Due: <strong style={{ color: 'var(--red)' }}>{dueOrdinal}</strong></div>
                          </div>

                          {/* Inline payment handler */}
                          {parseFloat(card.outstanding) > 0 && (
                            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                              <div style={{ position: 'relative', flex: 1 }}>
                                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.8rem' }}>₹</span>
                                <input 
                                  type="number" 
                                  placeholder="Repay amount"
                                  id={`pay-input-${card.id}`}
                                  style={{
                                    width: '100%',
                                    padding: '8px 10px 8px 20px',
                                    background: 'var(--bg-base)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '6px',
                                    fontSize: '0.85rem',
                                    fontWeight: 700
                                  }}
                                />
                              </div>
                              <button
                                className="btn btn-primary"
                                style={{ height: '34px', padding: '0 12px', borderRadius: '6px', fontSize: '0.8rem' }}
                                onClick={() => {
                                  const input = document.getElementById(`pay-input-${card.id}`);
                                  const val = parseFloat(input?.value);
                                  if (val > 0) {
                                    payCreditCard(card.id, val);
                                    if (input) input.value = '';
                                  } else {
                                    alert('Enter payment amount.');
                                  }
                                }}
                              >
                                Pay
                              </button>
                            </div>
                          )}

                          {/* Actions */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: parseFloat(card.outstanding) > 0 ? 'none' : '1px solid var(--border)', paddingTop: parseFloat(card.outstanding) > 0 ? '0' : '1rem' }}>
                            <button 
                              onClick={() => openModal('Edit Credit Card', 'card', card)}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)', cursor: 'pointer' }}
                            >
                              <Edit3 size={13}/> Edit Card
                            </button>
                            <button 
                              onClick={() => { if (confirm(`Remove ${card.bankName} CC?`)) deleteCreditCard(card.id); }}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', fontWeight: 800, color: 'var(--red)', cursor: 'pointer' }}
                            >
                              <Trash2 size={13}/> Delete
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state">No credit cards added.</div>
                )}
              </div>
            );
          })()}




          {/* ══ BORROWERS ══ */}
          {view === 'borrowers' && (
            <div className="fade-in-view">
              <div className="page-header">
                <div className="page-header-left">
                  <span className="eyebrow">Digital Khata Book</span>
                  <h1>Khata (Borrowers)</h1>
                </div>
                <div className="page-header-right">
                  <button className="btn btn-primary" onClick={() => openModal('Lend Money', 'borrower')}>
                    <Plus size={15}/> New Entry
                  </button>
                </div>
              </div>

              <div className="stat-grid" style={{ marginBottom: '1.75rem' }}>
                <StatCard icon={<TrendingUp size={18}/>}   color="blue"  label="Total Lent Out"   value={fmt(borrowers.reduce((s, b) => s + b.principal, 0))}/>
                <StatCard icon={<CheckCircle size={18}/>}  color="green" label="Total Recovered"  value={fmt(borrowers.reduce((s, b) => s + b.repaid, 0))} valueColor="green"/>
                <StatCard icon={<AlertTriangle size={18}/>} color="red" label="Outstanding Debt" value={fmt(lentOut)} valueColor="red"/>
              </div>

              <div>
                {borrowers.map(bw => {
                  const rem = bw.principal - bw.repaid;
                  const settled = rem <= 0;
                  return (
                    <div key={bw.id} className="khata-card" style={{ borderLeft: settled ? '6px solid var(--green)' : '6px solid var(--red)' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                          <div className="khata-name">{bw.name}</div>
                          {settled && <span className="khata-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--green)' }}>Settled</span>}
                          {!settled && <span className="khata-badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--red)' }}>Owes You</span>}
                        </div>
                        <div className="khata-desc">Given: {fmtDate(bw.date)} &bull; Original: {fmt(bw.principal)}</div>
                      </div>
                      
                      <div style={{ textAlign: 'right', marginRight: '1.5rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>{settled ? 'Balance' : 'Remaining'}</div>
                        <div className="khata-amount" style={{ color: settled ? 'var(--green)' : 'var(--red)' }}>{fmt(rem)}</div>
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-ghost" style={{ height: '40px', padding: '0 16px', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' }} onClick={() => openModal('Edit Borrower', 'borrower', bw)}>
                          <Edit3 size={16}/>
                        </button>
                        {!settled ? (
                          <>
                            <button className="btn btn-primary" style={{ height: '40px', padding: '0 20px', fontWeight: 700 }}
                              onClick={() => {
                                const a = prompt(`Enter repayment amount (Remaining: ${fmt(rem)}):`);
                                if (a && parseFloat(a) > 0) receiveRepayment(bw.id, parseFloat(a));
                              }}>
                              Receive
                            </button>
                            <button className="btn btn-ghost" style={{ height: '40px', padding: '0 16px', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', fontWeight: 600 }}
                              onClick={() => { if (confirm(`Settle full ₹${rem} for ${bw.name}?`)) settleBorrower(bw.id); }}>
                              Settle All
                            </button>
                          </>
                        ) : (
                          <button className="btn btn-danger" style={{ height: '40px', padding: '0 16px' }}
                            onClick={() => { if (confirm(`Delete borrower record for ${bw.name}?`)) deleteBorrower(bw.id); }}>
                            <Trash2 size={16}/>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {borrowers.length === 0 && <div className="empty-state">No borrowers in your Khata.</div>}
              </div>
            </div>
          )}

          {/* ══ SAMITI ══ */}
          {view === 'samiti' && (
            <div className="fade-in-view" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: '1.5rem' }}>
              <div style={{ fontSize: '4rem' }}>🚧</div>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Coming Soon</h1>
                <p style={{ fontSize: '1rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: 500 }}>Samiti is being rebuilt from scratch.</p>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', background: 'var(--bg-hover)', padding: '6px 16px', borderRadius: 99, border: '1px solid var(--border)' }}>Work in progress</span>
            </div>
          )}

        </div>
      </main>

      {/* ═══ ADD / EDIT MODAL ═══ */}
      {modal.open && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal-box">
            <div className="modal-header">
              <h3>{modal.title}</h3>
              <button className="modal-close" onClick={closeModal}><X size={14}/></button>
            </div>
            <div className="modal-body">

              {/* Quick Log */}
              {modal.type === 'quick-log' && (
                <form className="form-grid" onSubmit={e => {
                  e.preventDefault();
                  const f = e.target;
                  const date = f.date.value, amount = parseFloat(f.amount.value) || 0, type = f.type.value, category = f.category.value;
                  if (!date || amount <= 0) { alert('Enter a date and amount.'); return; }
                  saveQuickLog(date, amount, type, category);
                  closeModal();
                }}>
                  <div className="form-group full">
                    <label>Date</label>
                    <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]}/>
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select name="type" onChange={e => {
                      setQuickType(e.target.value);
                      const input = e.target.form.amount;
                      input.style.color = e.target.value === 'income' ? 'var(--green)' : 'var(--red)';
                    }}>
                      <option value="expense">Expense OUT</option>
                      <option value="income">Income IN</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select name="category">
                      {(quickType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                        <option key={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group full">
                    <label>Amount (₹)</label>
                    <input name="amount" type="number" placeholder="0" min="1" required style={{ color: 'var(--red)', fontWeight: 'bold' }}/>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ gridColumn: '1 / -1' }}>Save Log</button>
                </form>
              )}

              {/* Income / Expense */}
              {(modal.type === 'income' || modal.type === 'expenses') && (
                <form className="form-grid" onSubmit={e => {
                  e.preventDefault();
                  const f = e.target;
                  const date = f.date.value, amount = parseFloat(f.amount.value) || 0, category = f.category.value;
                  if (!date || amount <= 0) return;
                  const type = modal.type === 'income' ? 'income' : 'expenses';
                  saveIncomeExpense(modal.item?.id, date, amount, category, type);
                  closeModal();
                  closeDetail();
                }}>
                  <div className="form-group">
                    <label>Date</label>
                    <input name="date" type="date" required defaultValue={modal.item?.date ?? new Date().toISOString().split('T')[0]}/>
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select name="category" defaultValue={modal.item?.category || 'Others'}>
                      {(modal.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                        <option key={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group full">
                    <label>Amount (₹)</label>
                    <input name="amount" type="number" required placeholder="0" min="1" defaultValue={modal.item?.amount ?? ''} style={{ color: modal.type === 'income' ? 'var(--green)' : 'var(--red)', fontWeight: 'bold' }}/>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ gridColumn: '1 / -1' }}>{modal.item ? 'Update Record' : 'Save Record'}</button>
                </form>
              )}

              {/* Bank Account */}
              {modal.type === 'bank' && (
                <form className="form-grid" onSubmit={e => {
                  e.preventDefault();
                  const f = e.target;
                  const bankName = f.bankName.value, type = f.type.value, accountNumber = f.accountNumber.value, balance = parseFloat(f.balance.value) || 0;
                  if (bankName && accountNumber && balance >= 0) {
                    saveBank(modal.item?.id, bankName, type, accountNumber, balance);
                    closeModal();
                  }
                }}>
                  <div className="form-group">
                    <label>Bank Name</label>
                    <input name="bankName" type="text" required placeholder="e.g. HDFC Bank" defaultValue={modal.item?.bankName || ''}/>
                  </div>
                  <div className="form-group">
                    <label>Account Type</label>
                    <select name="type" defaultValue={modal.item?.type || 'Savings'}>
                      <option>Savings</option>
                      <option>Salary</option>
                      <option>Current</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Last 4 Digits</label>
                    <input name="accountNumber" type="text" maxLength="4" required placeholder="e.g. 5678" defaultValue={modal.item?.accountNumber || ''}/>
                  </div>
                  <div className="form-group">
                    <label>Current Balance (₹)</label>
                    <input name="balance" type="number" required placeholder="0" min="0" defaultValue={modal.item?.balance || ''}/>
                  </div>
                  <button type="submit" className="btn btn-primary">Add Account</button>
                </form>
              )}

              {/* Credit Card */}
              {modal.type === 'card' && (
                <form className="form-grid" onSubmit={e => {
                  e.preventDefault();
                  const f = e.target;
                  const bankName = f.bank.value, cardName = f.cardName.value, cardNumber = f.num.value, 
                        limit = parseFloat(f.limit.value) || 0, outstanding = parseFloat(f.outstanding.value) || 0,
                        statementDate = f.statementDate.value, dueDate = f.dueDate.value;
                  if (bankName && cardName && cardNumber && limit > 0) {
                    saveCreditCard(modal.item?.id, bankName, cardName, cardNumber, limit, outstanding, statementDate, dueDate);
                    closeModal();
                  }
                }}>
                  <div className="form-group">
                    <label>Bank / Issuer</label>
                    <input name="bank" type="text" required placeholder="e.g. Axis Bank" defaultValue={modal.item?.bankName || ''}/>
                  </div>
                  <div className="form-group">
                    <label>Card Name</label>
                    <input name="cardName" type="text" required placeholder="e.g. Flipkart Visa" defaultValue={modal.item?.cardName || ''}/>
                  </div>
                  <div className="form-group">
                    <label>Last 4 Digits</label>
                    <input name="num" type="text" maxLength="4" required placeholder="e.g. 1234" defaultValue={modal.item?.cardNumber || ''}/>
                  </div>
                  <div className="form-group">
                    <label>Credit Limit (₹)</label>
                    <input name="limit" type="number" required placeholder="0" min="1" defaultValue={modal.item?.limit || ''}/>
                  </div>
                  <div className="form-group">
                    <label>Statement Day (1-31)</label>
                    <input name="statementDate" type="number" min="1" max="31" required placeholder="e.g. 15" defaultValue={modal.item?.statementDate || ''}/>
                  </div>
                  <div className="form-group">
                    <label>Due Day (1-31)</label>
                    <input name="dueDate" type="number" min="1" max="31" required placeholder="e.g. 5" defaultValue={modal.item?.dueDate || ''}/>
                  </div>
                  <div className="form-group full">
                    <label>Outstanding Balance (₹)</label>
                    <input name="outstanding" type="number" placeholder="0" min="0" defaultValue={modal.item?.outstanding || ''}/>
                  </div>
                  <button type="submit" className="btn btn-danger">Save Credit Card</button>
                </form>
              )}

              {/* Borrower */}
              {modal.type === 'borrower' && (
                <form className="form-grid" onSubmit={e => {
                  e.preventDefault();
                  const f = e.target;
                  const name = f.name.value, amount = parseFloat(f.amount.value) || 0, date = f.date.value;
                  if (name && amount > 0 && date) {
                    saveBorrower(modal.item?.id, name, amount, date);
                    closeModal();
                  }
                }}>
                  <div className="form-group">
                    <label>Borrower Name</label>
                    <input name="name" type="text" required placeholder="e.g. Rahul Kumar" defaultValue={modal.item?.name || ''}/>
                  </div>
                  <div className="form-group">
                    <label>Amount Lent (₹)</label>
                    <input name="amount" type="number" required placeholder="0" min="1" defaultValue={modal.item?.principal || ''}/>
                  </div>
                  <div className="form-group full">
                    <label>Date Lent</label>
                    <input name="date" type="date" required defaultValue={modal.item?.date || new Date().toISOString().split('T')[0]}/>
                  </div>
                  <button type="submit" className="btn btn-primary">Log Borrower</button>
                </form>
              )}



            </div>
          </div>
        </div>
      )}

      {/* ═══ VIEW DETAIL MODAL ═══ */}
      {detail.open && detail.item && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeDetail()}>
          <div className="modal-box">
            <div className="modal-header">
              <h3>{detail.type === 'income' ? 'Income Details' : 'Expense Details'}</h3>
              <button className="modal-close" onClick={closeDetail}><X size={14}/></button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <span className={`badge ${detail.type === 'income' ? 'green' : 'red'}`} style={{ fontSize: '0.82rem', padding: '5px 14px' }}>
                  {detail.type === 'income' ? <ArrowUpRight size={13}/> : <ArrowDownRight size={13}/>}
                  {detail.type === 'income' ? 'Income' : 'Expenditure'}
                </span>
              </div>
              <span className={`detail-amount ${detail.type === 'income' ? 'text-green' : 'text-red'}`}>
                {fmt(detail.item.amount)}
              </span>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                {detail.type === 'income' ? 'Income' : 'Expense'} recorded on {fmtDate(detail.item.date)}
              </div>

              <div className="detail-grid">
                <div className="detail-cell">
                  <span className="lbl">Date</span>
                  <span className="val">{fmtDate(detail.item.date)}</span>
                </div>
                <div className="detail-cell">
                  <span className="lbl">Record ID</span>
                  <span className="val font-mono">#{detail.item.id}</span>
                </div>
              </div>

              <div className="detail-action-row">
                <button className="btn btn-primary" onClick={() => openModal(detail.type === 'income' ? 'Edit Income' : 'Edit Expense', detail.type, detail.item)}>
                  <Edit3 size={14}/> Edit
                </button>
                <button className="btn" style={{ flex: 1, justifyContent: 'center', height: 42, borderRadius: 'var(--r-md)', background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid transparent' }}
                  onClick={() => {
                    if (confirm('Delete this record?')) {
                      deleteIncomeExpense(detail.item.id, detail.type === 'income' ? 'income' : 'expenses');
                      closeDetail();
                    }
                  }}>
                  <Trash2 size={14}/> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ BOTTOM NAV (Mobile only) ═══ */}
      <nav className="bottom-nav">
        {navItems.map(it => (
          <button
            key={it.id}
            className={`bottom-nav-item ${view === it.id ? 'active' : ''}`}
            onClick={() => setView(it.id)}
          >
            {it.icon}
            <span>{it.short}</span>
          </button>
        ))}
      </nav>

    </div>
  );
}
