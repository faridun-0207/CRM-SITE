import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Login } from './components/Login';
import { KPIStats } from './components/KPIStats';
import { OperationsPanel } from './components/OperationsPanel';
import { StockChart } from './components/StockChart';
import { TransactionTable } from './components/TransactionTable';
import { DebtList } from './components/DebtList';
import { StockBadges } from './components/StockBadges';
import { SettingsModal } from './components/SettingsModal';
import { AnalysisPanel } from './components/AnalysisPanel';
import { Transaction, Processing, Expense, Database, StockMap } from './types';
import { Download, LogOut, Calendar, Languages, Settings, Dices, LayoutList } from 'lucide-react';
import { DEFAULT_RAW_MATERIALS, DEFAULT_FINISHED_GOODS, EXPENSE_CATEGORIES, WORKERS, THEME_COLORS, THEME_FONTS } from './constants';
import { format } from 'date-fns';
import { translations, Lang } from './translations';

const STORAGE_KEY = 'ecorecycle_db_v1';
const AUTH_KEY = 'ecorecycle_auth';
const LANG_KEY = 'ecorecycle_lang';
const THEME_KEY = 'ecorecycle_theme';
const FONT_KEY = 'ecorecycle_font';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [lang, setLang] = useState<Lang>('ru');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [themeColor, setThemeColor] = useState('teal');
  const [font, setFont] = useState('Inter');
  
  // Database State
  const [db, setDb] = useState<Database>({
    transactions: [],
    processing: [],
    expenses: [],
    rawMaterials: DEFAULT_RAW_MATERIALS,
    finishedGoods: DEFAULT_FINISHED_GOODS,
    expenseCategories: EXPENSE_CATEGORIES,
    workers: WORKERS
  });

  // Ref to prevent overwrite on initial load
  const isInitialLoad = useRef(true);

  // Load Data
  useEffect(() => {
    const savedAuth = localStorage.getItem(AUTH_KEY);
    if (savedAuth === 'true') setIsAuthenticated(true);

    const savedLang = localStorage.getItem(LANG_KEY) as Lang;
    if (savedLang && (savedLang === 'ru' || savedLang === 'tj')) {
      setLang(savedLang);
    }

    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) setThemeColor(savedTheme);

    const savedFont = localStorage.getItem(FONT_KEY);
    if (savedFont) setFont(savedFont);

    loadLocalData();
  }, []);

  const loadLocalData = () => {
    const savedDb = localStorage.getItem(STORAGE_KEY);
    if (savedDb) {
      const parsed = JSON.parse(savedDb);
      // Migration: ensure lists exist
      if (!parsed.rawMaterials) parsed.rawMaterials = DEFAULT_RAW_MATERIALS;
      if (!parsed.finishedGoods) parsed.finishedGoods = DEFAULT_FINISHED_GOODS;
      if (!parsed.expenseCategories) parsed.expenseCategories = EXPENSE_CATEGORIES;
      if (!parsed.workers) parsed.workers = WORKERS;
      setDb(parsed);
    }
    isInitialLoad.current = false;
  };

  // Save Data (Local Only)
  useEffect(() => {
    if (isInitialLoad.current) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }, [db]);
  
  // Save Lang
  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  // Save Theme
  useEffect(() => {
    localStorage.setItem(THEME_KEY, themeColor);
    localStorage.setItem(FONT_KEY, font);
  }, [themeColor, font]);

  const t = translations[lang];

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem(AUTH_KEY, 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_KEY);
  };

  const handleRandomTheme = () => {
    const randomColor = THEME_COLORS[Math.floor(Math.random() * THEME_COLORS.length)];
    const randomFont = THEME_FONTS[Math.floor(Math.random() * THEME_FONTS.length)];
    setThemeColor(randomColor);
    setFont(randomFont);
  };

  // --- Logic Helpers ---

  const toggleViewMode = (mode: 'daily' | 'monthly') => {
    setViewMode(mode);
    // Adjust date format when switching
    if (mode === 'monthly') {
        // Switch to YYYY-MM
        setDate(date.substring(0, 7));
    } else {
        // Switch to YYYY-MM-DD, default to 1st of month if currently in month view
        if (date.length === 7) {
             setDate(date + '-01');
        }
    }
  };

  const addTransaction = (type: 'buy' | 'sell', data: any) => {
    const qty = parseFloat(data.qty);
    const price = parseFloat(data.price);
    
    // Default client logic: 'Поставщик' for buy if empty
    const client = (type === 'buy' && (!data.client || !data.client.trim())) 
      ? t.lblSupplier 
      : data.client;

    const newTrans: Transaction = {
      id: Date.now(),
      date: date.length === 7 ? format(new Date(), 'yyyy-MM-dd') : date, // Ensure transaction has full date
      time: format(new Date(), 'HH:mm'),
      type,
      mat: data.mat,
      qty,
      price,
      client,
      method: data.method || 'cash',
      total: qty * price,
      is_paid: data.method !== 'debt',
      date_repaid: undefined
    };
    setDb(prev => ({ ...prev, transactions: [...prev.transactions, newTrans] }));
  };

  const addProcessing = (data: any) => {
    const newProc: Processing = {
      id: Date.now(),
      date: date.length === 7 ? format(new Date(), 'yyyy-MM-dd') : date,
      time: format(new Date(), 'HH:mm'),
      from: data.from,
      qtyIn: parseFloat(data.qtyIn),
      to: data.to,
      qtyOut: parseFloat(data.qtyOut)
    };
    setDb(prev => ({ ...prev, processing: [...prev.processing, newProc] }));
  };

  const addExpense = (type: 'general' | 'salary', data: any) => {
    const newExp: Expense = {
      id: Date.now(),
      date: date.length === 7 ? format(new Date(), 'yyyy-MM-dd') : date,
      time: format(new Date(), 'HH:mm'),
      cat: type === 'salary' ? 'Salary' : data.cat,
      amt: parseFloat(data.amt),
      desc: type === 'salary' ? data.worker : data.desc
    };
    setDb(prev => ({ ...prev, expenses: [...prev.expenses, newExp] }));
  };

  const deleteItem = (type: 'trans' | 'proc' | 'exp', id: number) => {
    setDb(prev => {
      if (type === 'trans') return { ...prev, transactions: prev.transactions.filter(t => t.id !== id) };
      if (type === 'proc') return { ...prev, processing: prev.processing.filter(p => p.id !== id) };
      if (type === 'exp') return { ...prev, expenses: prev.expenses.filter(e => e.id !== id) };
      return prev;
    });
  };

  const payDebt = (id: number) => {
    if (!window.confirm(t.confirmPay)) return;
    setDb(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => 
        t.id === id ? { ...t, is_paid: true, date_repaid: date.length === 7 ? format(new Date(), 'yyyy-MM-dd') : date } : t
      )
    }));
  };

  // --- Reference Data Management ---

  const handleAddReference = (type: 'raw' | 'product' | 'category' | 'worker', name: string) => {
    setDb(prev => {
      if (type === 'raw') {
        if (prev.rawMaterials.includes(name)) return prev;
        return { ...prev, rawMaterials: [...prev.rawMaterials, name] };
      } 
      if (type === 'product') {
        if (prev.finishedGoods.includes(name)) return prev;
        return { ...prev, finishedGoods: [...prev.finishedGoods, name] };
      }
      if (type === 'category') {
        if (prev.expenseCategories.includes(name)) return prev;
        return { ...prev, expenseCategories: [...prev.expenseCategories, name] };
      }
      if (type === 'worker') {
        if (prev.workers.includes(name)) return prev;
        return { ...prev, workers: [...prev.workers, name] };
      }
      return prev;
    });
  };

  const handleDeleteReference = (type: 'raw' | 'product' | 'category' | 'worker', name: string) => {
    setDb(prev => {
      if (type === 'raw') return { ...prev, rawMaterials: prev.rawMaterials.filter(m => m !== name) };
      if (type === 'product') return { ...prev, finishedGoods: prev.finishedGoods.filter(m => m !== name) };
      if (type === 'category') return { ...prev, expenseCategories: prev.expenseCategories.filter(m => m !== name) };
      if (type === 'worker') return { ...prev, workers: prev.workers.filter(m => m !== name) };
      return prev;
    });
  };

  const downloadBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "ecorecycle_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // --- Calculations ---

  // Combined materials list for calculations
  const allMaterials = useMemo(() => {
    return [...db.rawMaterials, ...db.finishedGoods];
  }, [db.rawMaterials, db.finishedGoods]);

  const stock = useMemo(() => {
    const s: StockMap = {};
    // Initialize dynamic materials
    allMaterials.forEach(m => s[m] = 0);

    // Calculate from history
    db.transactions.forEach(t => {
      if (t.type === 'buy') s[t.mat] = (s[t.mat] || 0) + t.qty;
      if (t.type === 'sell') s[t.mat] = (s[t.mat] || 0) - t.qty;
    });

    db.processing.forEach(p => {
      if (s[p.from] !== undefined) s[p.from] -= p.qtyIn;
      if (s[p.to] !== undefined) s[p.to] += p.qtyOut;
    });

    return s;
  }, [db, allMaterials]);

  // Filter Lists based on View Mode
  const { filteredTransactions, filteredProcessing, filteredExpenses } = useMemo(() => {
      const checkDate = (itemDate: string) => {
          if (viewMode === 'daily') return itemDate === date;
          return itemDate.startsWith(date); // Check YYYY-MM
      };

      return {
          filteredTransactions: db.transactions.filter(t => checkDate(t.date)),
          filteredProcessing: db.processing.filter(p => checkDate(p.date)),
          filteredExpenses: db.expenses.filter(e => checkDate(e.date))
      };
  }, [db, date, viewMode]);

  const stats = useMemo(() => {
    // Income: Direct Sales (Cash/Card) + Debts Repaid in this period
    let income = filteredTransactions.filter(t => t.type === 'sell' && t.method !== 'debt').reduce((acc, t) => acc + t.total, 0);
    
    // Repayments in this period: Find transactions that were repaid ON a date falling in this period
    // Logic: iterate all transactions, check if repaid_date matches current filter
    const repayments = db.transactions.filter(t => {
        if (!t.is_paid || !t.date_repaid) return false;
        if (viewMode === 'daily') return t.date_repaid === date;
        return t.date_repaid.startsWith(date);
    }).reduce((acc, t) => acc + t.total, 0);
    
    income += repayments;

    // Expense: Buys in this period + Expenses in this period
    const buys = filteredTransactions.filter(t => t.type === 'buy').reduce((acc, t) => acc + t.total, 0);
    const ops = filteredExpenses.reduce((acc, e) => acc + e.amt, 0);
    const expense = buys + ops;

    return { income, expense, profit: income - expense };
  }, [filteredTransactions, filteredExpenses, db.transactions, date, viewMode]);


  if (!isAuthenticated) return <Login onLogin={handleLogin} t={t} lang={lang} setLang={setLang} themeColor={themeColor} />;

  return (
    <div className="min-h-screen pb-20 bg-slate-50/50" style={{ fontFamily: font }}>
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 px-2 py-2 shadow-sm flex items-center justify-between gap-2 overflow-hidden">
        <div className="flex items-center gap-1.5 shrink-0">
            <div className={`bg-${themeColor}-100 p-1 rounded-lg text-${themeColor}-600`}>
                <Calendar size={18} />
            </div>
            <h1 className="text-base font-bold text-slate-800 tracking-tight hidden sm:block">EcoRecycle <span className={`text-${themeColor}-600`}>Pro</span></h1>
            <h1 className="text-base font-bold text-slate-800 tracking-tight sm:hidden">Eco<span className={`text-${themeColor}-600`}>Recycle</span></h1>
        </div>
        
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0 no-scrollbar">
            {/* Date Picker Area */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 shrink-0">
                <input 
                    type={viewMode === 'daily' ? 'date' : 'month'}
                    value={date} 
                    onChange={e => setDate(e.target.value)}
                    className={`bg-transparent border-none text-slate-700 text-xs font-semibold focus:ring-0 block px-1 py-0.5 outline-none w-[110px]`}
                />
            </div>
            
            <button 
                 onClick={() => toggleViewMode(viewMode === 'daily' ? 'monthly' : 'daily')}
                 className={`p-1.5 rounded-lg text-xs font-medium transition-all shrink-0 bg-slate-100 text-slate-600`}
                 title={viewMode === 'daily' ? t.viewMonth : t.viewDay}
            >
                {viewMode === 'daily' ? <LayoutList size={16} /> : <Calendar size={16} />}
            </button>

            <div className="w-px h-5 bg-slate-200 mx-0.5 shrink-0"></div>

            <button 
                onClick={handleRandomTheme}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-1.5 rounded-lg transition-colors shrink-0"
            >
                <Dices size={16} />
            </button>

            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-1.5 rounded-lg transition-colors shrink-0"
            >
                <Settings size={16} />
            </button>

            <button 
              onClick={() => setLang(lang === 'ru' ? 'tj' : 'ru')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-1.5 rounded-lg transition-colors relative group shrink-0"
            >
              <Languages size={16} />
              <span className="absolute -bottom-8 right-0 text-xs bg-slate-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity uppercase pointer-events-none z-50">{lang}</span>
            </button>

            <button 
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors shrink-0"
            >
                <LogOut size={16} />
            </button>
        </div>
      </nav>

      <div className="container mx-auto p-3 max-w-7xl">
        <KPIStats {...stats} t={t} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Column: Management or Analysis */}
            <div className="lg:col-span-5 space-y-3">
                {viewMode === 'daily' ? (
                    <OperationsPanel 
                        stock={stock}
                        rawMaterials={db.rawMaterials}
                        finishedGoods={db.finishedGoods}
                        expenseCategories={db.expenseCategories}
                        workers={db.workers}
                        allMaterials={allMaterials}
                        onAddTransaction={addTransaction}
                        onAddProcessing={addProcessing}
                        onAddExpense={addExpense}
                        t={t}
                        themeColor={themeColor}
                    />
                ) : (
                    <AnalysisPanel 
                        transactions={filteredTransactions}
                        expenses={filteredExpenses}
                        stats={stats}
                        t={t}
                        themeColor={themeColor}
                    />
                )}
                <StockChart stock={stock} t={t} />
            </div>

            {/* Right Column: Data & Info */}
            <div className="lg:col-span-7 space-y-3">
                <StockBadges stock={stock} t={t} themeColor={themeColor} />
                <DebtList transactions={db.transactions} onPayDebt={payDebt} t={t} themeColor={themeColor} />
                <TransactionTable 
                    date={date}
                    transactions={filteredTransactions}
                    processing={filteredProcessing}
                    expenses={filteredExpenses}
                    allMaterials={allMaterials}
                    onDelete={deleteItem}
                    t={t}
                    themeColor={themeColor}
                    viewMode={viewMode}
                />
            </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button 
            onClick={downloadBackup}
            className="bg-slate-800 hover:bg-slate-900 text-white p-3 rounded-full shadow-xl transition-transform hover:scale-105 flex items-center justify-center"
            title="Download Backup"
        >
            <Download size={20} />
        </button>
      </div>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        rawMaterials={db.rawMaterials}
        finishedGoods={db.finishedGoods}
        expenseCategories={db.expenseCategories}
        workers={db.workers}
        onAdd={handleAddReference}
        onDelete={handleDeleteReference}
        t={t}
        themeColor={themeColor}
        font={font}
        onThemeChange={setThemeColor}
        onFontChange={setFont}
      />
    </div>
  );
};

export default App;