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

const DUMMY_SAMITIS = [
  { id: 401, receiverName: 'Mohit Kumar', dailyAmount: 500, year: new Date().getFullYear(), month: new Date().getMonth() }
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

  const [incomes,     setIncomes]     = useState(() => JSON.parse(localStorage.getItem('fi_inc_v2')  || 'null') ?? DUMMY_INCOMES);
  const [expenses,    setExpenses]    = useState(() => JSON.parse(localStorage.getItem('fi_exp_v2')  || 'null') ?? DUMMY_EXPENSES);
  const [banks,       setBanks]       = useState(() => JSON.parse(localStorage.getItem('fi_bnk_v2')  || 'null') ?? DUMMY_BANKS);
  const [cash,        setCash]        = useState(() => parseFloat(localStorage.getItem('fi_csh_v2')  ?? DEFAULT_CASH));
  const [creditCards, setCreditCards] = useState(() => JSON.parse(localStorage.getItem('fi_crd_v2')  || 'null') ?? DUMMY_CARDS);
  const [borrowers,   setBorrowers]   = useState(() => JSON.parse(localStorage.getItem('fi_brw_v2')  || 'null') ?? DUMMY_BORROWERS);
  const [samitis,     setSamitis]     = useState(() => JSON.parse(localStorage.getItem('fi_sam_v2')  || 'null') ?? DUMMY_SAMITIS);

  // Persist
  useEffect(() => { localStorage.setItem('fi_inc_v2', JSON.stringify(incomes)); },     [incomes]);
  useEffect(() => { localStorage.setItem('fi_exp_v2', JSON.stringify(expenses)); },    [expenses]);
  useEffect(() => { localStorage.setItem('fi_bnk_v2', JSON.stringify(banks)); },       [banks]);
  useEffect(() => { localStorage.setItem('fi_csh_v2', cash.toString()); },             [cash]);
  useEffect(() => { localStorage.setItem('fi_crd_v2', JSON.stringify(creditCards)); }, [creditCards]);
  useEffect(() => { localStorage.setItem('fi_brw_v2', JSON.stringify(borrowers)); },   [borrowers]);
  useEffect(() => { localStorage.setItem('fi_sam_v2', JSON.stringify(samitis)); },     [samitis]);

  // Modal state
  const [modal,   setModal]   = useState({ open: false, title: '', type: '', item: null });
  const [quickType, setQuickType] = useState('expense');
  const [detail,  setDetail]  = useState({ open: false, item: null, type: '' });

  const openModal  = (title, type, item = null) => {
    if (type === 'quick-log') setQuickType('expense');
    setModal({ open: true, title, type, item });
  };
  const closeModal = () => setModal({ open: false, title: '', type: '', item: null });
  const openDetail = (item, type) => setDetail({ open: true, item, type });
  const closeDetail = () => setDetail({ open: false, item: null, type: '' });

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
  const trueNetWorth       = totalWealth + lentOut - ccDebt;

  const navItems = [
    { id: 'dashboard',    label: 'Dashboard' },
    { id: 'home',         label: 'Home' },
    { id: 'cashflow',     label: 'Cashflow' },
    { id: 'accounts',     label: 'Wealth' },
    { id: 'borrowers',    label: 'Lent' },
    { id: 'credit-cards', label: 'Cards' },
    { id: 'samiti',       label: 'Samiti' },
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
    labels: ['Banks & Cash', 'Lent Out', 'Credit Debt'],
    datasets: [{
      data: [totalWealth, lentOut, ccDebt],
      backgroundColor: ['#3B82F6', '#10B981', '#EF4444'],
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
  const deleteIncome  = (id) => { if (confirm('Delete this income record?'))  setIncomes (p => p.filter(x => x.id !== id)); };
  const deleteExpense = (id) => { if (confirm('Delete this expense record?')) setExpenses(p => p.filter(x => x.id !== id)); };

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
  return (
    <div className="app-container">

      {/* ═══ TOP NAVBAR ═══ */}
      <header className="top-navbar">
        <div className="brand">
          <span style={{ fontWeight: 900, letterSpacing: '-0.5px' }}>Finance Buddy</span>
        </div>

        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} color="var(--text-primary)"/> : <Menu size={24} color="var(--text-primary)"/>}
        </button>

        <nav className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
          {navItems.map(it => (
            <button
              key={it.id}
              className={`nav-item ${view === it.id ? 'active' : ''}`}
              onClick={() => { setView(it.id); setMobileMenuOpen(false); }}
            >
              <span>{it.label}</span>
            </button>
          ))}
        </nav>

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
                  <h1>Welcome, Shailesh</h1>
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
                    setIncomes(p => [{ id: Date.now(), date, amount: inc, category: 'Others' }, ...p]);
                  }
                  if (exp > 0) {
                    setExpenses(p => [{ id: Date.now() + 1, date, amount: exp, category: 'Others' }, ...p]);
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
              <div className="page-header">
                <div className="page-header-left">
                  <span className="eyebrow">Financial Overview</span>
                  <h1>Dashboard</h1>
                </div>
                <div className="page-header-right"><MonthSel/></div>
              </div>

              <div className="bento-grid" style={{ marginBottom: '1.75rem' }}>
                <div className="cred-card bento-col-3" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{fontSize: '1.2rem', animation: 'float 4s ease-in-out infinite'}}>🏦</span> Total Wealth
                  </div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--blue)' }}>{fmt(totalWealth)}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Net Liquid Assets</div>
                </div>
                <div className="cred-card bento-col-3" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{fontSize: '1.2rem', animation: 'float 3s ease-in-out infinite 0.2s'}}>💵</span> Cash on Hand
                  </div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--green)' }}>{fmt(cash)}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Physical Currency</div>
                </div>
                <div className="cred-card bento-col-3" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{fontSize: '1.2rem', animation: 'float 3.5s ease-in-out infinite 0.4s'}}>🏛️</span> Bank Balances
                  </div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-primary)' }}>{fmt(banks.reduce((s, b) => s + b.balance, 0))}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Across {banks.length} Accounts</div>
                </div>
                <div className="cred-card bento-col-3" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{fontSize: '1.2rem', animation: 'float 2.5s ease-in-out infinite 0.6s'}}>💳</span> Credit Debt
                  </div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--red)' }}>{fmt(ccDebt)}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Used out of {fmt(ccLimit)} Limit</div>
                </div>
              </div>

              {/* Charts Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.75rem' }}>
                <div className="cred-card" style={{ padding: 0 }}>
                  <div className="panel-header" style={{ background: 'transparent', borderBottom: '1px solid var(--border)' }}>
                    <TrendingUp size={16} style={{ color: 'var(--green)' }}/>
                    <h3>15-Day Cashflow Trend</h3>
                  </div>
                  <div className="panel-body" style={{ height: 260 }}>
                    <Line data={lineData} options={chartOpts}/>
                  </div>
                </div>
                <div className="cred-card" style={{ padding: 0 }}>
                  <div className="panel-header" style={{ background: 'transparent', borderBottom: '1px solid var(--border)' }}>
                    <BarChart2 size={16} style={{ color: 'var(--blue)' }}/>
                    <h3>Yearly Overview</h3>
                  </div>
                  <div className="panel-body" style={{ height: 260 }}>
                    <Bar data={yearlyBarData} options={chartOpts}/>
                  </div>
                </div>
              </div>

              {/* Lower Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Cash Bento */}
                <div className="cred-card" style={{ padding: 0 }}>
                  <div className="panel-header" style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => setCashCollapsed(!cashCollapsed)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Wallet size={16} style={{ color: 'var(--green)' }}/>
                      <h3>Cash on Hand</h3>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{cashCollapsed ? '▼ Expand' : '▲ Collapse'}</span>
                  </div>
                  {!cashCollapsed && (
                    <div className="panel-body" style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--green-bg)', borderRadius: 'var(--r-md)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--green)' }}>Physical Currency</span>
                        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--green)' }}>{fmt(cash)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bank Accounts Bento */}
                <div className="cred-card" style={{ padding: 0 }}>
                  <div className="panel-header" style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => setBanksCollapsed(!banksCollapsed)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Building size={16} style={{ color: 'var(--blue)' }}/>
                      <h3>Bank Accounts ({banks.length})</h3>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{banksCollapsed ? '▼ Expand' : '▲ Collapse'}</span>
                  </div>
                  {!banksCollapsed && (
                    <div className="panel-body" style={{ padding: '1.25rem' }}>
                      {banks.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                          {banks.map(acc => (
                            <div key={acc.id} style={{ padding: '12px', background: 'var(--blue-bg)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--blue)' }}>{acc.bankName}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{acc.type} • ****{acc.accountNumber.slice(-4)}</div>
                              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', marginTop: 4 }}>{fmt(acc.balance)}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="empty-state">No bank accounts added.</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Credit Cards Bento */}
                <div className="cred-card" style={{ padding: 0 }}>
                  <div className="panel-header" style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => setCardsCollapsed(!cardsCollapsed)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CreditCard size={16} style={{ color: 'var(--red)' }}/>
                      <h3>Credit Cards ({creditCards.length})</h3>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{cardsCollapsed ? '▼ Expand' : '▲ Collapse'}</span>
                  </div>
                  {!cardsCollapsed && (
                    <div className="panel-body" style={{ padding: '1.25rem' }}>
                      {creditCards.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                          {creditCards.map(cc => (
                            <div key={cc.id} style={{ padding: '12px', background: 'var(--red-bg)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--red)' }}>{cc.bankName} CC</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Limit: {fmt(cc.limit)}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Used: {fmt(cc.outstanding)}</div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 2 }}>
                                <div style={{ fontWeight: 850, fontSize: '1rem', color: 'var(--red)' }}>Avail: {fmt(cc.limit - cc.outstanding)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="empty-state">No credit cards added.</div>
                      )}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
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
            </div>
          )}

          {/* ══ MY WEALTH ══ */}
          {view === 'accounts' && (
            <div className="fade-in-view">
              <div className="page-header">
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

              {/* Hero */}
              <div className="cred-card" style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{fontSize: '1.2rem', animation: 'float 4s ease-in-out infinite'}}>💎</span> Total Wealth
                  </span>
                  <span style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--blue)', letterSpacing: '-1px' }}>{fmt(totalWealth)}</span>
                  <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>Physical Cash & Bank Accounts combined</span>
                </div>
                <Building size={64} style={{ color: 'var(--blue)', opacity: 0.15 }}/>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {/* Cash Card */}
                <div className="cred-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.7)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <div style={{ background: 'var(--green-bg)', padding: 6, borderRadius: 8 }}><Wallet size={16} color="var(--green)"/></div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 1 }}>Cash on Hand</span>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--green)', letterSpacing: -1 }}>{fmt(cash)}</div>
                  </div>
                  <form onSubmit={e => { e.preventDefault(); const v = e.target.c.value; if (v) { setCash(parseFloat(v)); e.target.reset(); }}} style={{ display: 'flex', gap: 8, marginTop: '2rem' }}>
                    <input name="c" type="number" placeholder="Update cash amount" min="0" className="cred-input" style={{ flex: 1, background: 'rgba(255,255,255,0.9)' }}/>
                    <button type="submit" className="btn btn-primary" style={{ padding: '0 24px', fontWeight: 700 }}>Update</button>
                  </form>
                </div>

                {/* Bank Cards */}
                {banks.map((acc, idx) => (
                  <div key={acc.id} className="cred-card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.7)' }}>
                    <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, display: 'flex', gap: 6 }}>
                      <button className="btn-icon" style={{ background: 'rgba(255,255,255,0.8)' }} onClick={() => openModal('Edit Bank Account', 'bank', acc)}>
                        <Edit3 size={13} color="var(--text-primary)"/>
                      </button>
                      <button className="btn-icon danger" onClick={() => { if (confirm(`Remove ${acc.bankName} account?`)) setBanks(p => p.filter(b => b.id !== acc.id)); }}>
                        <Trash2 size={13}/>
                      </button>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <div style={{ background: 'var(--blue-bg)', padding: 10, borderRadius: 10 }}><Building size={20} color="var(--blue)"/></div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{acc.bankName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{acc.type} Account</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '1.1rem', letterSpacing: '3px', color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: 12 }}>**** **** **** {acc.accountNumber.slice(-4)}</div>
                    </div>
                    <div style={{ background: 'var(--blue-bg)', borderRadius: 'var(--r-md)', padding: '12px 16px', marginTop: 16, border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--blue)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Available Balance</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--blue)' }}>{fmt(acc.balance)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ CREDIT CARDS ══ */}
          {view === 'credit-cards' && (
            <div className="fade-in-view">
              <div className="page-header">
                <div className="page-header-left">
                  <span className="eyebrow">Liabilities</span>
                  <h1>Credit Cards</h1>
                </div>
                <div className="page-header-right">
                  <button className="btn btn-danger" onClick={() => openModal('Add Credit Card', 'card')}>
                    <Plus size={15}/> Add Card
                  </button>
                </div>
              </div>

              <div className="stat-grid" style={{ marginBottom: '1.75rem', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                <StatCard icon={<CreditCard size={18}/>}   color="purple" label="Total Cards"       value={String(creditCards.length)}/>
                <StatCard icon={<CheckCircle size={18}/>}  color="blue"   label="Total Limit"       value={fmt(ccLimit)}/>
                <StatCard icon={<AlertTriangle size={18}/>} color="red"   label="Total Outstanding" value={fmt(ccDebt)} valueColor="red" sub={`${ccUtil}% utilized`}/>
                <StatCard icon={<CheckCircle size={18}/>}  color="green"  label="Available Credit"  value={fmt(ccLimit - ccDebt)} valueColor="green"/>
              </div>

              <div className="item-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {creditCards.map((card, idx) => {
                  const util = card.limit > 0 ? ((card.outstanding / card.limit) * 100).toFixed(0) : 0;
                  
                  let healthLabel = "Excellent";
                  let healthColor = "var(--green)";
                  let healthBg = "var(--green-bg)";
                  if (util >= 30 && util <= 50) {
                    healthLabel = "Moderate";
                    healthColor = "var(--amber)";
                    healthBg = "var(--amber-bg)";
                  } else if (util > 50) {
                    healthLabel = "High Utilization";
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
                    <div key={card.id} className="cred-card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', borderRadius: 'var(--r-lg)', padding: '1.25rem', overflow: 'hidden', gap: '1rem' }}>
                      
                      {/* Floating Action Buttons */}
                      <div style={{ position: 'absolute', top: 28, right: 28, zIndex: 10, display: 'flex', gap: 6 }}>
                        <button className="btn-icon" style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)' }} onClick={() => openModal('Edit Credit Card', 'card', card)}>
                          <Edit3 size={13} color="white"/>
                        </button>
                        <button className="btn-icon danger" style={{ background: 'rgba(239,68,68,0.25)', backdropFilter: 'blur(4px)', border: '1px solid rgba(239,68,68,0.2)' }} onClick={() => { if (confirm(`Remove ${card.bankName} - ${card.cardName}?`)) setCreditCards(p => p.filter(c => c.id !== card.id)); }}>
                          <Trash2 size={13} color="white"/>
                        </button>
                      </div>

                      {/* Realistic Credit Card Graphic */}
                      <div style={{
                        background: idx % 3 === 0 
                          ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4f46e5 100%)' 
                          : idx % 3 === 1 
                            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)' 
                            : 'linear-gradient(135deg, #3b0764 0%, #1e1b4b 60%, #6366f1 100%)',
                        borderRadius: '16px',
                        padding: '1.25rem',
                        color: 'white',
                        position: 'relative',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        height: '165px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        border: '1px solid rgba(255,255,255,0.08)'
                      }}>
                        {/* Card Gloss Layer */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%)', borderRadius: '16px', pointerEvents: 'none' }}/>

                        {/* Top Bank Details */}
                        <div style={{ zIndex: 1 }}>
                          <div style={{ fontWeight: 900, fontSize: '1.2rem', letterSpacing: '-0.3px', textTransform: 'uppercase', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>{card.bankName}</div>
                          <div style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 500, letterSpacing: '0.5px' }}>{card.cardName}</div>
                        </div>

                        {/* EMV Chip & Contactless */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
                          <div style={{ width: 36, height: 26, background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', borderRadius: '6px', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: 4, bottom: 4, left: 10, right: 10, borderLeft: '1px solid rgba(0,0,0,0.15)', borderRight: '1px solid rgba(0,0,0,0.15)' }}/>
                            <div style={{ position: 'absolute', left: 4, right: 4, top: 8, bottom: 8, borderTop: '1px solid rgba(0,0,0,0.15)', borderBottom: '1px solid rgba(0,0,0,0.15)' }}/>
                          </div>
                          <div style={{ opacity: 0.6 }}>
                            <ArrowRightLeft size={16} style={{ transform: 'rotate(-45deg)' }}/>
                          </div>
                        </div>

                        {/* Card Number */}
                        <div style={{ fontSize: '1.15rem', letterSpacing: '3px', fontFamily: 'monospace', textShadow: '0 2px 4px rgba(0,0,0,0.4)', fontWeight: 600, zIndex: 1 }}>
                          ••••  ••••  ••••  {card.cardNumber}
                        </div>
                      </div>

                      {/* Card Info Details */}
                      <div>
                        {/* Health Badge & Util Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)' }}>CARD HEALTH</span>
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: healthColor, background: healthBg, padding: '4px 10px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {healthLabel}
                          </span>
                        </div>

                        {/* Utilization Bar */}
                        <div style={{ background: 'var(--bg-hover)', borderRadius: 'var(--r-md)', padding: '12px', border: '1px solid var(--border)', marginBottom: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Utilized: {util}%</span>
                            <span style={{ color: 'var(--text-primary)' }}>Available: {fmt(card.limit - card.outstanding)}</span>
                          </div>
                          <div className="progress-bar-wrap" style={{ height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 99, marginBottom: 10, overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: healthColor, width: `${Math.min(util, 100)}%` }}/>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: 0.5 }}>LIMIT</div>
                              <div style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{fmt(card.limit)}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: 0.5 }}>OUTSTANDING</div>
                              <div style={{ color: healthColor, fontWeight: 900 }}>{fmt(card.outstanding)}</div>
                            </div>
                          </div>
                        </div>

                        {/* Statement / Due Dates */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, borderTop: '1px dashed var(--border)', paddingTop: 12, marginBottom: 12 }}>
                          <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700 }}>STATEMENT DATE</div>
                            <div style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 700 }}>{statementOrdinal} of month</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700 }}>DUE DATE</div>
                            <div style={{ color: 'var(--red)', fontSize: '0.85rem', fontWeight: 800 }}>{dueOrdinal} of month</div>
                          </div>
                        </div>

                        {/* Pay Warning Banner */}
                        {card.dueDate && (
                          <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(244, 63, 94, 0.15)', borderRadius: 'var(--r-sm)', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 900, color: 'var(--red)', letterSpacing: 0.2, textAlign: 'center', textTransform: 'uppercase' }}>
                              ⚠️ MUST PAY BY {dueOrdinal} AT ALL COSTS!
                            </span>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
                                if (a && parseFloat(a) > 0) setBorrowers(p => p.map(b => b.id === bw.id ? { ...b, repaid: b.repaid + parseFloat(a) } : b));
                              }}>
                              Receive
                            </button>
                            <button className="btn btn-ghost" style={{ height: '40px', padding: '0 16px', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', fontWeight: 600 }}
                              onClick={() => { if (confirm(`Settle full ₹${rem} for ${bw.name}?`)) setBorrowers(p => p.map(b => b.id === bw.id ? { ...b, repaid: b.principal } : b)); }}>
                              Settle All
                            </button>
                          </>
                        ) : (
                          <button className="btn btn-danger" style={{ height: '40px', padding: '0 16px' }}
                            onClick={() => { if (confirm(`Delete borrower record for ${bw.name}?`)) setBorrowers(p => p.filter(b => b.id !== bw.id)); }}>
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
          {view === 'samiti' && (() => {
            const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
            const active = samitis.filter(s => s.year === month.getFullYear() && s.month === month.getMonth());
            const total  = active.reduce((s, x) => s + x.dailyAmount * days, 0);
            return (
              <div className="fade-in-view">
                <div className="page-header">
                  <div className="page-header-left">
                    <span className="eyebrow">Chit Fund Ledger</span>
                    <h1>Samiti Tracker</h1>
                  </div>
                  <div className="page-header-right">
                    <MonthSel/>
                    <button className="btn btn-primary" onClick={() => openModal('Add Samiti', 'samiti')}>
                      <Plus size={15}/> Add Samiti
                    </button>
                  </div>
                </div>

                <div className="bento-grid" style={{ marginBottom: '1.75rem' }}>
                  <div className="cred-card bento-col-4" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{fontSize: '1.2rem', animation: 'float 4s ease-in-out infinite'}}>💰</span> Monthly Commitment
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--purple)' }}>{fmt(total)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total deposits this month</div>
                  </div>
                  <div className="cred-card bento-col-4" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{fontSize: '1.2rem', animation: 'float 3s ease-in-out infinite 0.2s'}}>👥</span> Active Samitis
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-primary)' }}>{active.length}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Currently tracking for {days} days</div>
                  </div>
                  <div className="cred-card bento-col-4" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{fontSize: '1.2rem', animation: 'float 3.5s ease-in-out infinite 0.4s'}}>📈</span> Avg Daily Deposit
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--blue)' }}>
                      {fmt(active.length > 0 ? (active.reduce((s, x) => s + x.dailyAmount, 0) / active.length) : 0)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average per active samiti</div>
                  </div>
                </div>

                <div>
                  {active.map(s => (
                    <div key={s.id} className="khata-card" style={{ borderLeft: '6px solid var(--purple)' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                          <div className="khata-name">{s.receiverName}</div>
                          <span className="khata-badge" style={{ background: 'rgba(124, 58, 237, 0.1)', color: 'var(--purple)' }}>Active</span>
                        </div>
                        <div className="khata-desc">Daily Deposit: {fmt(s.dailyAmount)}</div>
                      </div>
                      
                      <div style={{ textAlign: 'right', marginRight: '1.5rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>Monthly Total</div>
                        <div className="khata-amount" style={{ color: 'var(--purple)' }}>{fmt(s.dailyAmount * days)}</div>
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-ghost" style={{ height: '40px', padding: '0 16px', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' }}
                          onClick={() => openModal('Edit Samiti', 'samiti', s)}>
                          <Edit3 size={16}/>
                        </button>
                        <button className="btn btn-danger" style={{ height: '40px', padding: '0 16px' }}
                          onClick={() => { if (confirm(`Delete Samiti for ${s.receiverName}?`)) setSamitis(p => p.filter(x => x.id !== s.id)); }}>
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </div>
                  ))}
                  {active.length === 0 && (
                    <div className="empty-state">No active Samitis for this month.</div>
                  )}
                </div>
              </div>
            );
          })()}

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
                  if (type === 'income') {
                    setIncomes(p => [...p, { id: Date.now(), date, amount, category }]);
                  } else {
                    setExpenses(p => [...p, { id: Date.now(), date, amount, category }]);
                  }
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
                  const isInc = modal.type === 'income';
                  const setter = isInc ? setIncomes : setExpenses;
                  if (modal.item) {
                    setter(p => p.map(x => x.id === modal.item.id ? { ...x, date, amount, category } : x));
                  } else {
                    setter(p => [...p, { id: Date.now(), date, amount, category }]);
                  }
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
                    if (modal.item) {
                      setBanks(p => p.map(b => b.id === modal.item.id ? { ...b, bankName, type, accountNumber, balance } : b));
                    } else {
                      setBanks(p => [...p, { id: Date.now(), bankName, type, accountNumber, balance }]);
                    }
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
                    if (modal.item) {
                      setCreditCards(p => p.map(c => c.id === modal.item.id ? { ...c, bankName, cardName, cardNumber, limit, outstanding, statementDate, dueDate } : c));
                    } else {
                      setCreditCards(p => [...p, { id: Date.now(), bankName, cardName, cardNumber, limit, outstanding, statementDate, dueDate }]);
                    }
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
                    if (modal.item) {
                      setBorrowers(p => p.map(b => b.id === modal.item.id ? { ...b, name, principal: amount, date } : b));
                    } else {
                      setBorrowers(p => [...p, { id: Date.now(), name, principal: amount, repaid: 0, date }]);
                    }
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

              {/* Samiti */}
              {modal.type === 'samiti' && (
                <form className="form-grid" onSubmit={e => {
                  e.preventDefault();
                  const f = e.target;
                  const name = f.name.value, amt = parseFloat(f.amt.value) || 0;
                  if (name && amt > 0) {
                    if (modal.item) {
                      setSamitis(p => p.map(s => s.id === modal.item.id ? { ...s, receiverName: name, dailyAmount: amt } : s));
                    } else {
                      setSamitis(p => [...p, { id: Date.now(), receiverName: name, dailyAmount: amt, year: month.getFullYear(), month: month.getMonth() }]);
                    }
                    closeModal();
                  }
                }}>
                  <div className="form-group">
                    <label>Receiver Name</label>
                    <input name="name" type="text" required placeholder="e.g. Rajesh Bhai" defaultValue={modal.item?.receiverName || ''}/>
                  </div>
                  <div className="form-group">
                    <label>Daily Deposit (₹)</label>
                    <input name="amt" type="number" required placeholder="e.g. 500" min="1" defaultValue={modal.item?.dailyAmount || ''}/>
                  </div>
                  <button type="submit" className="btn btn-primary">{modal.item ? 'Update Samiti' : 'Add Samiti'}</button>
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
                      (detail.type === 'income' ? setIncomes : setExpenses)(p => p.filter(x => x.id !== detail.item.id));
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

    </div>
  );
}
