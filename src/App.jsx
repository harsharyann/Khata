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


  // Persist
  useEffect(() => { localStorage.setItem('fi_inc_v2', JSON.stringify(incomes)); },     [incomes]);
  useEffect(() => { localStorage.setItem('fi_exp_v2', JSON.stringify(expenses)); },    [expenses]);
  useEffect(() => { localStorage.setItem('fi_bnk_v2', JSON.stringify(banks)); },       [banks]);
  useEffect(() => { localStorage.setItem('fi_csh_v2', cash.toString()); },             [cash]);
  useEffect(() => { localStorage.setItem('fi_crd_v2', JSON.stringify(creditCards)); }, [creditCards]);
  useEffect(() => { localStorage.setItem('fi_brw_v2', JSON.stringify(borrowers)); },   [borrowers]);


  // Modal state
  const [modal,   setModal]   = useState({ open: false, title: '', type: '', item: null });
  const [quickType, setQuickType] = useState('expense');
  const [detail,  setDetail]  = useState({ open: false, item: null, type: '' });
  const [selectedCardId, setSelectedCardId] = useState(null);


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
            <div className="fade-in-view" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: '1.5rem' }}>
              <div style={{ fontSize: '4rem' }}>🚧</div>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Coming Soon</h1>
                <p style={{ fontSize: '1rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: 500 }}>Dashboard is being rebuilt from scratch.</p>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', background: 'var(--bg-hover)', padding: '6px 16px', borderRadius: 99, border: '1px solid var(--border)' }}>Work in progress</span>
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
          {view === 'credit-cards' && (() => {
            const activeCardId = selectedCardId || creditCards[0]?.id;
            const activeCard = creditCards.find(c => c.id === activeCardId) || creditCards[0];

            return (
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

                <div className="stat-grid" style={{ marginBottom: '1.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                  <StatCard icon={<CreditCard size={18}/>}   color="purple" label="Total Cards"       value={String(creditCards.length)}/>
                  <StatCard icon={<CheckCircle size={18}/>}  color="blue"   label="Total Limit"       value={fmt(ccLimit)}/>
                  <StatCard icon={<AlertTriangle size={18}/>} color="red"   label="Total Outstanding" value={fmt(ccDebt)} valueColor="red" sub={`${ccUtil}% utilized`}/>
                  <StatCard icon={<CheckCircle size={18}/>}  color="green"  label="Available Credit"  value={fmt(ccLimit - ccDebt)} valueColor="green"/>
                </div>

                {creditCards.length > 0 ? (
                  <div className="cc-split-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '2rem', alignItems: 'start' }}>
                    
                    {/* Left side: Card List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: -4 }}>Your Cards</div>
                      {creditCards.map((card, idx) => {
                        const isSelected = card.id === activeCard?.id;
                        const util = card.limit > 0 ? ((card.outstanding / card.limit) * 100).toFixed(0) : 0;
                        
                        let barColor = 'var(--green)';
                        if (util >= 30 && util <= 50) barColor = 'var(--amber)';
                        if (util > 50) barColor = 'var(--red)';

                        return (
                          <div 
                            key={card.id} 
                            onClick={() => setSelectedCardId(card.id)}
                            style={{ 
                              background: isSelected ? 'var(--bg-card)' : 'rgba(255, 255, 255, 0.4)',
                              border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                              borderRadius: 'var(--r-lg)',
                              padding: '1.25rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-xs)',
                              transform: isSelected ? 'translateY(-2px)' : 'none',
                              transition: 'all 0.2s var(--ease)',
                              position: 'relative'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <div style={{ 
                                width: 44, 
                                height: 30, 
                                borderRadius: '6px', 
                                background: idx % 3 === 0 ? 'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 100%)' : idx % 3 === 1 ? 'linear-gradient(135deg, #0f172a 0%, #334155 100%)' : 'linear-gradient(135deg, #3b0764 0%, #6366f1 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '0.6rem',
                                fontWeight: 800
                              }}>
                                **** {card.cardNumber}
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{card.bankName}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{card.cardName}</div>
                              </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: parseFloat(card.outstanding) > 0 ? 'var(--red)' : 'var(--text-primary)' }}>{fmt(card.outstanding)}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: barColor }}/> {util}% Utilized
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Right side: Detailed Glassmorphic Viewer */}
                    {activeCard && (() => {
                      const util = activeCard.limit > 0 ? ((activeCard.outstanding / activeCard.limit) * 100).toFixed(0) : 0;
                      let healthLabel = "Excellent";
                      let healthColor = "var(--green)";
                      let healthBg = "var(--green-bg)";
                      if (util >= 30 && util <= 50) {
                        healthLabel = "Moderate";
                        healthColor = "var(--amber)";
                        healthBg = "var(--amber-bg)";
                      } else if (util > 50) {
                        healthLabel = "High Util";
                        healthColor = "var(--red)";
                        healthBg = "var(--red-bg)";
                      }

                      const getOrdinal = (n) => {
                        const s = ["th", "st", "nd", "rd"],
                              v = n % 100;
                        return n + (s[(v - 20) % 10] || s[v] || s[0]);
                      };

                      const dueOrdinal = activeCard.dueDate ? getOrdinal(parseInt(activeCard.dueDate)) : "N/A";
                      const statementOrdinal = activeCard.statementDate ? getOrdinal(parseInt(activeCard.statementDate)) : "N/A";

                      return (
                        <div className="cred-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', borderRadius: 'var(--r-xl)', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                          
                          {/* Card Preview Graphic */}
                          <div style={{
                            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
                            borderRadius: '16px',
                            padding: '1.5rem',
                            color: 'white',
                            position: 'relative',
                            boxShadow: '0 12px 36px rgba(15,23,42,0.25)',
                            height: '180px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            border: '1px solid rgba(255,255,255,0.08)',
                            overflow: 'hidden'
                          }}>
                            {/* Reflective shine */}
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 60%)', pointerEvents: 'none' }}/>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
                              <div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>{activeCard.bankName}</div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: 600 }}>{activeCard.cardName}</div>
                              </div>
                              <div style={{ width: 44, height: 32, background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', borderRadius: '6px', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)', position: 'relative' }}>
                                <div style={{ position: 'absolute', top: 4, bottom: 4, left: 12, right: 12, borderLeft: '1px solid rgba(0,0,0,0.15)', borderRight: '1px solid rgba(0,0,0,0.15)' }}/>
                                <div style={{ position: 'absolute', left: 4, right: 4, top: 10, bottom: 10, borderTop: '1px solid rgba(0,0,0,0.15)', borderBottom: '1px solid rgba(0,0,0,0.15)' }}/>
                              </div>
                            </div>

                            <div style={{ fontSize: '1.2rem', letterSpacing: '4px', fontFamily: 'monospace', textShadow: '0 2px 4px rgba(0,0,0,0.5)', fontWeight: 600, zIndex: 1 }}>
                              ••••  ••••  ••••  {activeCard.cardNumber}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 1 }}>
                              <div>
                                <div style={{ fontSize: '0.6rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Card Member</div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: 0.2 }}>Active User</div>
                              </div>
                              <div style={{ fontSize: '0.75rem', fontWeight: 900, opacity: 0.9, fontStyle: 'italic' }}>VISA</div>
                            </div>
                          </div>

                          {/* Quick Stats Grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '12px 16px' }}>
                              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Outstanding</span>
                              <span style={{ fontSize: '1.35rem', fontWeight: 900, color: parseFloat(activeCard.outstanding) > 0 ? 'var(--red)' : 'var(--text-primary)' }}>{fmt(activeCard.outstanding)}</span>
                            </div>
                            <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '12px 16px' }}>
                              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Available Limit</span>
                              <span style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--green)' }}>{fmt(activeCard.limit - activeCard.outstanding)}</span>
                            </div>
                          </div>

                          {/* Utilization & Progress */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: 700, marginBottom: 8 }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Limit Utilization: {util}%</span>
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: healthColor, background: healthBg, padding: '3px 8px', borderRadius: 99, textTransform: 'uppercase' }}>{healthLabel}</span>
                            </div>
                            <div className="progress-bar-wrap" style={{ height: 8, background: 'rgba(0,0,0,0.06)', borderRadius: 99, marginBottom: 12 }}>
                              <div style={{ height: '100%', background: healthColor, width: `${Math.min(util, 100)}%`, borderRadius: 99 }}/>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                              <span>Total Credit Limit: {fmt(activeCard.limit)}</span>
                            </div>
                          </div>

                          {/* Due & Statement Details */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                            <div>
                              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Statement Date</span>
                              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>{statementOrdinal} of month</span>
                            </div>
                            <div>
                              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Due Date</span>
                              <span style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--red)' }}>{dueOrdinal} of month</span>
                            </div>
                          </div>

                          {/* Payoff Inline Option */}
                          {parseFloat(activeCard.outstanding) > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: 'var(--r-md)', padding: '12px 16px' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--red)' }}>Outstanding Balance</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Make payments to free up limit</div>
                              </div>
                              <button 
                                className="btn btn-danger"
                                style={{ height: '36px', padding: '0 16px', fontSize: '0.8rem', fontWeight: 700 }}
                                onClick={() => {
                                  const amt = prompt(`Enter repayment amount (Outstanding: ${fmt(activeCard.outstanding)}):`);
                                  if (amt && parseFloat(amt) > 0) {
                                    setCreditCards(p => p.map(c => c.id === activeCard.id ? { ...c, outstanding: Math.max(0, c.outstanding - parseFloat(amt)) } : c));
                                  }
                                }}
                              >
                                Record Pay
                              </button>
                            </div>
                          )}

                          {/* Quick Actions (Edit / Delete) */}
                          <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                            <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => openModal('Edit Credit Card', 'card', activeCard)}>
                              <Edit3 size={15}/> Edit Details
                            </button>
                            <button className="btn" style={{ flex: 1, justifyContent: 'center', color: 'var(--red)', background: 'var(--red-bg)', border: '1px solid transparent' }} onClick={() => { if (confirm(`Remove ${activeCard.bankName} CC?`)) setCreditCards(p => p.filter(c => c.id !== activeCard.id)); }}>
                              <Trash2 size={15}/> Remove Card
                            </button>
                          </div>

                        </div>
                      );
                    })()}

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
