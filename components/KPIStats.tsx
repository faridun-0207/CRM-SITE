import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { Translation } from '../translations';

interface KPIStatsProps {
  income: number;
  expense: number;
  profit: number;
  t: Translation;
}

export const KPIStats: React.FC<KPIStatsProps> = ({ income, expense, profit, t }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
      <div className="bg-gradient-to-br from-teal-500 to-emerald-400 p-3 rounded-xl shadow-md text-white relative overflow-hidden group">
        <div className="relative z-10">
          <p className="text-teal-50 text-xs font-medium mb-0">{t.kpiIncome}</p>
          <h3 className="text-xl font-bold">{income.toLocaleString()} c.</h3>
        </div>
        <ArrowUpRight className="absolute bottom-1 right-1 text-white opacity-20 transform scale-125 group-hover:scale-110 transition-transform duration-500" size={32} />
      </div>

      <div className="bg-gradient-to-br from-rose-500 to-pink-500 p-3 rounded-xl shadow-md text-white relative overflow-hidden group">
        <div className="relative z-10">
          <p className="text-rose-50 text-xs font-medium mb-0">{t.kpiExpense}</p>
          <h3 className="text-xl font-bold">{expense.toLocaleString()} c.</h3>
        </div>
        <ArrowDownRight className="absolute bottom-1 right-1 text-white opacity-20 transform scale-125 group-hover:scale-110 transition-transform duration-500" size={32} />
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-indigo-500 p-3 rounded-xl shadow-md text-white relative overflow-hidden group">
        <div className="relative z-10">
          <p className="text-blue-50 text-xs font-medium mb-0">{t.kpiProfit}</p>
          <h3 className="text-xl font-bold">{profit.toLocaleString()} c.</h3>
        </div>
        <Wallet className="absolute bottom-1 right-1 text-white opacity-20 transform scale-125 group-hover:scale-110 transition-transform duration-500" size={32} />
      </div>
    </div>
  );
};