import React, { useState, useEffect } from 'react';
import { TabType, StockMap } from '../types';
import { ShoppingCart, Factory, Banknote, Briefcase } from 'lucide-react';
import { Translation } from '../translations';

interface OperationsPanelProps {
  stock: StockMap;
  rawMaterials: string[];
  finishedGoods: string[];
  expenseCategories: string[];
  workers: string[];
  allMaterials: string[];
  onAddTransaction: (type: 'buy' | 'sell', data: any) => void;
  onAddProcessing: (data: any) => void;
  onAddExpense: (type: 'general' | 'salary', data: any) => void;
  t: Translation;
  themeColor: string;
}

export const OperationsPanel: React.FC<OperationsPanelProps> = ({ 
  stock, rawMaterials, finishedGoods, expenseCategories, workers, allMaterials,
  onAddTransaction, onAddProcessing, onAddExpense, t, themeColor 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(TabType.BUY);
  const [subExpTab, setSubExpTab] = useState<'general' | 'salary'>('general');

  // Form States
  const [buyForm, setBuyForm] = useState({ mat: '', client: '', qty: '', price: '' });
  const [procForm, setProcForm] = useState({ from: '', qtyIn: '', to: '', qtyOut: '' });
  const [sellForm, setSellForm] = useState({ mat: '', client: '', qty: '', price: '', method: 'cash' });
  const [expForm, setExpForm] = useState({ cat: '', amt: '', desc: '' });
  const [salForm, setSalForm] = useState({ worker: '', amt: '' });

  // Initialize or Validate Selections when lists change
  useEffect(() => {
    if (rawMaterials.length > 0 && (!buyForm.mat || !rawMaterials.includes(buyForm.mat))) {
        setBuyForm(prev => ({ ...prev, mat: rawMaterials[0] }));
    }
  }, [rawMaterials, buyForm.mat]);

  useEffect(() => {
    if (finishedGoods.length > 0 && (!sellForm.mat || !finishedGoods.includes(sellForm.mat))) {
        setSellForm(prev => ({ ...prev, mat: finishedGoods[0] }));
    }
  }, [finishedGoods, sellForm.mat]);

  useEffect(() => {
    if (allMaterials.length > 0) {
        setProcForm(prev => ({
            ...prev,
            from: (!prev.from || !allMaterials.includes(prev.from)) ? allMaterials[0] : prev.from,
            to: (!prev.to || !allMaterials.includes(prev.to)) ? allMaterials[0] : prev.to
        }));
    }
  }, [allMaterials, procForm.from, procForm.to]);

  useEffect(() => {
    if (expenseCategories.length > 0 && (!expForm.cat || !expenseCategories.includes(expForm.cat))) {
        setExpForm(prev => ({ ...prev, cat: expenseCategories[0] }));
    }
  }, [expenseCategories, expForm.cat]);


  const handleBuy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyForm.qty || !buyForm.price || !buyForm.mat) return;

    const qty = parseFloat(buyForm.qty);
    const price = parseFloat(buyForm.price);

    if (isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) {
      alert(t.alertPositive);
      return;
    }

    onAddTransaction('buy', buyForm);
    setBuyForm({ ...buyForm, qty: '', price: '', client: '' });
  };

  const handleProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!procForm.qtyIn || !procForm.qtyOut || !procForm.from || !procForm.to) return;
    
    const currentStock = stock[procForm.from] || 0;
    const qtyIn = parseFloat(procForm.qtyIn);
    
    if (qtyIn > currentStock) {
        alert(`${t.alertNoRaw}: ${procForm.from}.\n${t.alertReq}: ${qtyIn} кг\n${t.alertAvail}: ${currentStock.toFixed(2)} кг`);
        return;
    }
    onAddProcessing(procForm);
    setProcForm({ ...procForm, qtyIn: '', qtyOut: '' });
  };

  const handleSell = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellForm.qty || !sellForm.price || !sellForm.client || !sellForm.mat) return;
    
    const currentStock = stock[sellForm.mat] || 0;
    const qty = parseFloat(sellForm.qty);
    const price = parseFloat(sellForm.price);

    if (isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) {
        alert(t.alertPositive);
        return;
    }
    
    if (qty > currentStock) {
        alert(`${t.alertNoGood}: ${sellForm.mat}.\n${t.alertReq}: ${qty} кг\n${t.alertAvail}: ${currentStock.toFixed(2)} кг`);
        return;
    }
    onAddTransaction('sell', sellForm);
    setSellForm({ ...sellForm, qty: '', price: '', client: '' });
  };

  const handleExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (subExpTab === 'general') {
      if (!expForm.amt || !expForm.cat) return;
      const amount = parseFloat(expForm.amt);
      if (isNaN(amount) || amount <= 0) {
          alert(t.alertPositive);
          return;
      }
      onAddExpense('general', expForm);
      setExpForm({ ...expForm, amt: '', desc: '' });
    } else {
      if (!salForm.amt || !salForm.worker) return;
      const amount = parseFloat(salForm.amt);
      if (isNaN(amount) || amount <= 0) {
          alert(t.alertPositive);
          return;
      }
      onAddExpense('salary', salForm);
      setSalForm({ ...salForm, amt: '' });
    }
  };

  const tabClass = (tab: TabType) => 
    `flex-1 py-2 text-xs font-medium text-center transition-colors border-b-2 ${
      activeTab === tab 
        ? `border-${themeColor}-500 text-${themeColor}-600` 
        : `border-transparent text-slate-500 hover:text-${themeColor}-500 hover:bg-slate-50`
    }`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-3">
      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        <button onClick={() => setActiveTab(TabType.BUY)} className={tabClass(TabType.BUY)}>
            <div className="flex items-center justify-center gap-1.5"><ShoppingCart size={14} /> {t.tabBuy}</div>
        </button>
        <button onClick={() => setActiveTab(TabType.PROCESS)} className={tabClass(TabType.PROCESS)}>
             <div className="flex items-center justify-center gap-1.5"><Factory size={14} /> {t.tabProcess}</div>
        </button>
        <button onClick={() => setActiveTab(TabType.SELL)} className={tabClass(TabType.SELL)}>
             <div className="flex items-center justify-center gap-1.5"><Banknote size={14} /> {t.tabSell}</div>
        </button>
        <button onClick={() => setActiveTab(TabType.FINANCE)} className={tabClass(TabType.FINANCE)}>
             <div className="flex items-center justify-center gap-1.5"><Briefcase size={14} /> {t.tabFinance}</div>
        </button>
      </div>

      <div className="p-3">
        {/* BUY TAB */}
        {activeTab === TabType.BUY && (
          <form onSubmit={handleBuy} className="space-y-2">
            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">{t.lblMaterial}</label>
                <select 
                    className={`w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:border-${themeColor}-500 focus:ring-1 focus:ring-${themeColor}-500 outline-none`}
                    value={buyForm.mat} 
                    onChange={e => setBuyForm({...buyForm, mat: e.target.value})}
                    required
                    style={{ colorScheme: 'light' }}
                >
                    {rawMaterials.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>
            <div>
                 <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">{t.lblSupplier}</label>
                 <input 
                    type="text" 
                    placeholder={t.phSupplier} 
                    className={`w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm outline-none focus:border-${themeColor}-500 transition-colors`}
                    value={buyForm.client}
                    onChange={e => setBuyForm({...buyForm, client: e.target.value})}
                    style={{ colorScheme: 'light' }}
                />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                 <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">{t.lblWeight}</label>
                 <input 
                    type="number" step="0.01" 
                    placeholder="0.00" 
                    className={`w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm outline-none focus:border-${themeColor}-500 transition-colors`}
                    value={buyForm.qty}
                    onChange={e => setBuyForm({...buyForm, qty: e.target.value})}
                    required
                    style={{ colorScheme: 'light' }}
                />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">{t.lblPrice}</label>
                 <input 
                    type="number" step="0.01" 
                    placeholder="0.00" 
                    className={`w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm outline-none focus:border-${themeColor}-500 transition-colors`}
                    value={buyForm.price}
                    onChange={e => setBuyForm({...buyForm, price: e.target.value})}
                    required
                    style={{ colorScheme: 'light' }}
                />
              </div>
            </div>
            <button className={`w-full bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white font-medium py-2 rounded-lg shadow-sm transition-all active:scale-[0.98] text-sm mt-1`}>
              {t.btnBuy}
            </button>
          </form>
        )}

        {/* PROCESS TAB */}
        {activeTab === TabType.PROCESS && (
          <form onSubmit={handleProcess} className="space-y-2">
            <div className="p-2 bg-blue-50 text-blue-700 text-xs rounded-lg flex items-start gap-2">
                <Factory size={14} className="mt-0.5 shrink-0" />
                <p className="leading-tight">{t.procInfo}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">{t.lblFromRaw}</label>
                    <select 
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm outline-none"
                        value={procForm.from} 
                        onChange={e => setProcForm({...procForm, from: e.target.value})}
                        required
                        style={{ colorScheme: 'light' }}
                    >
                        {allMaterials.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">{t.lblWeightRaw}</label>
                    <input 
                        type="number" step="0.01" 
                        className={`w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm outline-none focus:border-${themeColor}-500`}
                        value={procForm.qtyIn}
                        onChange={e => setProcForm({...procForm, qtyIn: e.target.value})}
                        required
                        style={{ colorScheme: 'light' }}
                    />
                </div>
            </div>
            <div className="flex justify-center text-slate-300 -my-1">
                <Factory size={16} />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">{t.lblToProd}</label>
                    <select 
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm outline-none"
                        value={procForm.to} 
                        onChange={e => setProcForm({...procForm, to: e.target.value})}
                        required
                        style={{ colorScheme: 'light' }}
                    >
                        {allMaterials.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">{t.lblWeightProd}</label>
                    <input 
                        type="number" step="0.01" 
                        className={`w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm outline-none focus:border-${themeColor}-500`}
                        value={procForm.qtyOut}
                        onChange={e => setProcForm({...procForm, qtyOut: e.target.value})}
                        required
                        style={{ colorScheme: 'light' }}
                    />
                </div>
            </div>
            <button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 rounded-lg shadow-sm transition-all active:scale-[0.98] text-sm mt-1">
              {t.btnProcess}
            </button>
          </form>
        )}

        {/* SELL TAB */}
        {activeTab === TabType.SELL && (
           <form onSubmit={handleSell} className="space-y-2">
             <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">{t.lblMaterial}</label>
                <select 
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm outline-none"
                    value={sellForm.mat} 
                    onChange={e => setSellForm({...sellForm, mat: e.target.value})}
                    required
                    style={{ colorScheme: 'light' }}
                >
                    {finishedGoods.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>
            <div>
                 <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">{t.lblClient}</label>
                 <input 
                    type="text" 
                    placeholder={t.phClient} 
                    className={`w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm outline-none focus:border-${themeColor}-500 transition-colors`}
                    value={sellForm.client}
                    onChange={e => setSellForm({...sellForm, client: e.target.value})}
                    required
                    style={{ colorScheme: 'light' }}
                />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                 <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">{t.lblWeight}</label>
                 <input 
                    type="number" step="0.01" 
                    placeholder="0.00" 
                    className={`w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm outline-none focus:border-${themeColor}-500 transition-colors`}
                    value={sellForm.qty}
                    onChange={e => setSellForm({...sellForm, qty: e.target.value})}
                    required
                    style={{ colorScheme: 'light' }}
                />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">{t.lblPrice}</label>
                 <input 
                    type="number" step="0.01" 
                    placeholder="0.00" 
                    className={`w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm outline-none focus:border-${themeColor}-500 transition-colors`}
                    value={sellForm.price}
                    onChange={e => setSellForm({...sellForm, price: e.target.value})}
                    required
                    style={{ colorScheme: 'light' }}
                />
              </div>
            </div>
            <div>
                 <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">{t.lblPayMethod}</label>
                 <select 
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm outline-none"
                    value={sellForm.method} 
                    onChange={e => setSellForm({...sellForm, method: e.target.value})}
                    style={{ colorScheme: 'light' }}
                >
                    <option value="cash">{t.optCash}</option>
                    <option value="card">{t.optCard}</option>
                    <option value="debt">{t.optDebt}</option>
                </select>
            </div>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg shadow-sm transition-all active:scale-[0.98] text-sm mt-1">
              {t.btnSell}
            </button>
           </form>
        )}

        {/* FINANCE TAB */}
        {activeTab === TabType.FINANCE && (
          <div>
            <div className="flex bg-slate-100 p-0.5 rounded-lg mb-2">
                <button 
                    onClick={() => setSubExpTab('general')}
                    className={`flex-1 py-1 text-xs rounded-md transition-all ${subExpTab === 'general' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >{t.subGeneral}</button>
                <button 
                     onClick={() => setSubExpTab('salary')}
                     className={`flex-1 py-1 text-xs rounded-md transition-all ${subExpTab === 'salary' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >{t.subSalary}</button>
            </div>

            <form onSubmit={handleExpense} className="space-y-2">
                {subExpTab === 'general' ? (
                    <>
                        <select 
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm outline-none"
                            value={expForm.cat}
                            onChange={e => setExpForm({...expForm, cat: e.target.value})}
                            style={{ colorScheme: 'light' }}
                        >
                            {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input 
                            type="number" 
                            placeholder={t.phAmount}
                            className={`w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm outline-none focus:border-${themeColor}-500`}
                            value={expForm.amt}
                            onChange={e => setExpForm({...expForm, amt: e.target.value})}
                            required
                            style={{ colorScheme: 'light' }}
                        />
                        <input 
                            type="text" 
                            placeholder={t.phDesc}
                            className={`w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm outline-none focus:border-${themeColor}-500`}
                            value={expForm.desc}
                            onChange={e => setExpForm({...expForm, desc: e.target.value})}
                            style={{ colorScheme: 'light' }}
                        />
                    </>
                ) : (
                    <>
                         <select 
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm outline-none"
                            value={salForm.worker}
                            onChange={e => setSalForm({...salForm, worker: e.target.value})}
                            required
                            style={{ colorScheme: 'light' }}
                        >
                            <option value="">{t.phWorker}</option>
                            {workers.map(w => <option key={w} value={w}>{w}</option>)}
                        </select>
                        <input 
                            type="number" 
                            placeholder={t.phAmount}
                            className={`w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm outline-none focus:border-${themeColor}-500`}
                            value={salForm.amt}
                            onChange={e => setSalForm({...salForm, amt: e.target.value})}
                            required
                            style={{ colorScheme: 'light' }}
                        />
                    </>
                )}
                <button className="w-full bg-rose-500 hover:bg-rose-600 text-white font-medium py-2 rounded-lg shadow-sm transition-all active:scale-[0.98] text-sm mt-1">
                    {t.btnExpense}
                </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};