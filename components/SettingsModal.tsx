import React, { useState } from 'react';
import { X, Plus, Trash2, Settings, Palette } from 'lucide-react';
import { Translation } from '../translations';
import { THEME_COLORS, THEME_FONTS } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawMaterials: string[];
  finishedGoods: string[];
  expenseCategories: string[];
  workers: string[];
  onAdd: (type: 'raw' | 'product' | 'category' | 'worker', name: string) => void;
  onDelete: (type: 'raw' | 'product' | 'category' | 'worker', name: string) => void;
  t: Translation;
  themeColor: string;
  font: string;
  onThemeChange: (color: string) => void;
  onFontChange: (font: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, rawMaterials, finishedGoods, expenseCategories, workers, onAdd, onDelete, t, themeColor, font, onThemeChange, onFontChange
}) => {
  const [activeTab, setActiveTab] = useState<'materials' | 'appearance'>('materials');
  
  // Materials Inputs
  const [newRaw, setNewRaw] = useState('');
  const [newProduct, setNewProduct] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newWorker, setNewWorker] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent, type: 'raw' | 'product' | 'category' | 'worker', value: string, setter: (s: string) => void) => {
    e.preventDefault();
    if (value.trim()) {
      onAdd(type, value.trim());
      setter('');
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, type: 'raw' | 'product' | 'category' | 'worker', name: string) => {
    e.stopPropagation();
    onDelete(type, name);
  };

  const ListSection = ({ title, color, list, type, newVal, setVal }: { title: string, color: string, list: string[], type: 'raw' | 'product' | 'category' | 'worker', newVal: string, setVal: (s: string) => void }) => (
    <div className="flex flex-col h-full">
      <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full bg-${color}-500`}></span>
        {title}
      </h3>
      
      <ul className="flex-1 space-y-2 mb-4 overflow-y-auto max-h-60 custom-scrollbar pr-2">
        {list.map(m => (
          <li key={m} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group border border-transparent hover:border-slate-200 transition-all">
            <span className="text-slate-700">{m}</span>
            <button 
              type="button"
              onClick={(e) => handleDeleteClick(e, type, m)}
              className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-100"
              title={t.confirmDelMat}
            >
              <Trash2 size={18} />
            </button>
          </li>
        ))}
      </ul>
      
      <form onSubmit={(e) => handleAdd(e, type, newVal, setVal)} className="flex gap-2">
        <input 
          type="text" 
          value={newVal}
          onChange={(e) => setVal(e.target.value)}
          placeholder={t.phNewMat}
          className={`flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:border-${color}-500`}
          style={{ colorScheme: 'light' }}
        />
        <button type="submit" className={`bg-${color}-600 hover:bg-${color}-700 text-white p-2 rounded-lg transition-colors`}>
          <Plus size={20} />
        </button>
      </form>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800">
            <Settings className={`text-${themeColor}-600`} />
            <h2 className="text-xl font-bold">{t.navSettings}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 px-6">
            <button 
                onClick={() => setActiveTab('materials')}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'materials' ? `border-${themeColor}-600 text-${themeColor}-600` : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                {t.settingsTitle}
            </button>
            <button 
                onClick={() => setActiveTab('appearance')}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'appearance' ? `border-${themeColor}-600 text-${themeColor}-600` : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                {t.settingsAppearance}
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          
          {/* Materials Tab */}
          {activeTab === 'materials' && (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <ListSection 
                    title={t.secRawMat} 
                    color={themeColor} 
                    list={rawMaterials} 
                    type="raw" 
                    newVal={newRaw} 
                    setVal={setNewRaw} 
                    />
                    <ListSection 
                    title={t.secFinGoods} 
                    color="blue" 
                    list={finishedGoods} 
                    type="product" 
                    newVal={newProduct} 
                    setVal={setNewProduct} 
                    />
                </div>
                <div className="border-t border-slate-100 my-6"></div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">{t.settingsFinance}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <ListSection 
                    title={t.secExpCats} 
                    color="rose" 
                    list={expenseCategories} 
                    type="category" 
                    newVal={newCategory} 
                    setVal={setNewCategory} 
                    />
                    <ListSection 
                    title={t.secWorkers} 
                    color="purple" 
                    list={workers} 
                    type="worker" 
                    newVal={newWorker} 
                    setVal={setNewWorker} 
                    />
                </div>
            </>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
             <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Palette size={18} className={`text-${themeColor}-600`} />
                        {t.settingsAppearance}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-3">{t.lblThemeColor}</label>
                            <div className="flex flex-wrap gap-3">
                                {THEME_COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => onThemeChange(color)}
                                        className={`w-10 h-10 rounded-full bg-${color}-500 transition-all shadow-sm hover:scale-110 ${themeColor === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:ring-2 hover:ring-offset-1 hover:ring-slate-200'}`}
                                        title={color}
                                    />
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-3">{t.lblFont}</label>
                            <select 
                                value={font} 
                                onChange={(e) => onFontChange(e.target.value)}
                                className={`w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none text-slate-900 focus:border-${themeColor}-500 focus:ring-1 focus:ring-${themeColor}-500`}
                                style={{ fontFamily: font, colorScheme: 'light' }}
                            >
                                {THEME_FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};