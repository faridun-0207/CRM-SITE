
import React from 'react';
import { Transaction } from '../types';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Translation } from '../translations';
import { format, parseISO } from 'date-fns';

interface DebtListProps {
  transactions: Transaction[];
  onPayDebt: (id: number) => void;
  t: Translation;
  themeColor: string;
}

export const DebtList: React.FC<DebtListProps> = ({ transactions, onPayDebt, t, themeColor }) => {
  const debts = transactions.filter(t => t.method === 'debt' && !t.is_paid);

  if (debts.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-orange-100 mb-6 overflow-hidden">
      <div className="bg-orange-50 px-4 py-3 border-b border-orange-100 flex items-center gap-2">
        <AlertCircle size={18} className="text-orange-600" />
        <h3 className="font-semibold text-orange-900">{t.debtTitle}</h3>
      </div>
      <div className="divide-y divide-orange-50">
        {debts.map(tr => (
          <div key={tr.id} className="p-4 flex items-center justify-between hover:bg-orange-50/50 transition-colors">
            <div>
              <div className="font-bold text-slate-800">{tr.client}</div>
              <div className="text-sm text-slate-500">{tr.mat} • {tr.qty} кг • {format(parseISO(tr.date), 'dd.MM.yyyy')}</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="font-bold text-orange-600 text-lg">{tr.total.toLocaleString()} c.</span>
              <button 
                onClick={() => onPayDebt(tr.id)}
                className={`text-xs bg-white border border-${themeColor}-200 text-${themeColor}-600 hover:bg-${themeColor}-50 px-3 py-1 rounded-full flex items-center gap-1 transition-colors`}
              >
                <CheckCircle size={12} />
                {t.debtPaid}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};