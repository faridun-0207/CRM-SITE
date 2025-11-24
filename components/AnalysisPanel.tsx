

import React, { useMemo, useState } from 'react';
import { Transaction, Expense } from '../types';
import { Translation } from '../translations';
import { TrendingUp, TrendingDown, FileText, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, HeadingLevel, AlignmentType } from 'docx';
import FileSaver from 'file-saver';
import { format } from 'date-fns';

interface AnalysisPanelProps {
  transactions: Transaction[];
  expenses: Expense[];
  stats: { income: number; expense: number; profit: number };
  t: Translation;
  themeColor: string;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ transactions, expenses, stats, t, themeColor }) => {
  const [isExporting, setIsExporting] = useState(false);

  // Stats Logic
  const salesByMat = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter(t => t.type === 'sell').forEach(t => {
      map[t.mat] = (map[t.mat] || 0) + t.total;
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const expensesByCat = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => {
      map[e.cat] = (map[e.cat] || 0) + e.amt;
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const maxSale = salesByMat.length > 0 ? salesByMat[0].value : 0;
  const maxExp = expensesByCat.length > 0 ? expensesByCat[0].value : 0;

  // --- Export Logic ---

  const prepareExportData = () => {
    return {
        kpi: [
            [t.kpiIncome, `${stats.income.toLocaleString()} c.`],
            [t.kpiExpense, `${stats.expense.toLocaleString()} c.`],
            [t.kpiProfit, `${stats.profit.toLocaleString()} c.`]
        ],
        sales: salesByMat.map(s => [s.name, `${s.value.toLocaleString()} c.`]),
        expenses: expensesByCat.map(e => [e.name, `${e.value.toLocaleString()} c.`])
    };
  };

  const exportPDF = async () => {
    setIsExporting(true);
    try {
        const doc = new jsPDF();
        const data = prepareExportData();
        
        // Font loading logic
        const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
        const fontBytes = await fetch(fontUrl).then(res => res.arrayBuffer());
        const fontUint8Array = new Uint8Array(fontBytes);
        let fontBinaryString = "";
        for (let i = 0; i < fontUint8Array.length; i++) {
            fontBinaryString += String.fromCharCode(fontUint8Array[i]);
        }
        
        doc.addFileToVFS('Roboto-Regular.ttf', fontBinaryString);
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
        doc.setFont('Roboto');

        doc.setFontSize(18);
        doc.text(t.monthlyStats, 14, 20);
        doc.setFontSize(10);
        doc.text(`Generated: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, 14, 26);

        // KPI Table
        autoTable(doc, {
            head: [['KPI', t.lblAmount]],
            body: data.kpi,
            startY: 30,
            styles: { font: 'Roboto' },
            headStyles: { fillColor: [66, 66, 66] }
        });

        // Sales Table
        autoTable(doc, {
            head: [[t.topSales, t.lblAmount]],
            body: data.sales,
            // @ts-ignore
            startY: doc.lastAutoTable.finalY + 10,
            styles: { font: 'Roboto' },
            headStyles: { fillColor: [16, 185, 129] } // emerald
        });

        // Expenses Table
        autoTable(doc, {
            head: [[t.topExpenses, t.lblAmount]],
            body: data.expenses,
            // @ts-ignore
            startY: doc.lastAutoTable.finalY + 10,
            styles: { font: 'Roboto' },
            headStyles: { fillColor: [244, 63, 94] } // rose
        });

        doc.save(`EcoRecycle_Report_${format(new Date(), 'yyyy-MM')}.pdf`);
    } catch (e) {
        console.error(e);
        alert("Error exporting PDF");
    } finally {
        setIsExporting(false);
    }
  };

  const exportDOCX = () => {
    setIsExporting(true);
    try {
        const data = prepareExportData();

        const createTable = (title: string, rows: string[][]) => [
            new Paragraph({ text: title, heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } }),
            new Table({
                rows: rows.map(r => new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph(r[0])], width: { size: 70, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph(r[1])], width: { size: 30, type: WidthType.PERCENTAGE } })
                    ]
                })),
                width: { size: 100, type: WidthType.PERCENTAGE }
            })
        ];

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({ text: t.monthlyStats, heading: HeadingLevel.HEADING_1 }),
                    new Paragraph({ text: `Generated: ${format(new Date(), 'dd.MM.yyyy HH:mm')}` }),
                    ...createTable('Financial Overview', data.kpi),
                    ...createTable(t.topSales, data.sales),
                    ...createTable(t.topExpenses, data.expenses),
                ]
            }]
        });

        Packer.toBlob(doc).then(blob => {
            FileSaver.saveAs(blob, `EcoRecycle_Report_${format(new Date(), 'yyyy-MM')}.docx`);
            setIsExporting(false);
        });
    } catch (e) {
        console.error(e);
    } finally {
        setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 mb-6">
      <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">{t.monthlyStats}</h2>
          <div className="flex gap-2">
            <button 
                onClick={exportPDF} 
                disabled={isExporting}
                className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-rose-600 rounded-lg transition-colors shadow-sm"
                title={t.exportPdf}
            >
                <FileText size={18} />
            </button>
            <button 
                onClick={exportDOCX} 
                disabled={isExporting}
                className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 rounded-lg transition-colors shadow-sm"
                title={t.exportDocx}
            >
                <FileDown size={18} />
            </button>
          </div>
      </div>

      {/* Sales Analysis */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-emerald-500" />
          {t.topSales}
        </h3>
        <div className="space-y-3">
          {salesByMat.length === 0 ? <p className="text-slate-400 text-sm">{t.tableNoData}</p> : 
           salesByMat.map(item => (
             <div key={item.name} className="relative">
               <div className="flex justify-between text-sm mb-1">
                 <span className="font-medium text-slate-700">{item.name}</span>
                 <span className="font-bold text-slate-900">{item.value.toLocaleString()} c.</span>
               </div>
               <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                 <div 
                   className={`h-full bg-${themeColor}-500 rounded-full`} 
                   style={{ width: `${(item.value / maxSale) * 100}%` }}
                 ></div>
               </div>
             </div>
           ))}
        </div>
      </div>

      {/* Expense Analysis */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingDown size={20} className="text-rose-500" />
          {t.topExpenses}
        </h3>
        <div className="space-y-3">
          {expensesByCat.length === 0 ? <p className="text-slate-400 text-sm">{t.tableNoData}</p> : 
           expensesByCat.map(item => (
             <div key={item.name} className="relative">
               <div className="flex justify-between text-sm mb-1">
                 <span className="font-medium text-slate-700">{item.name}</span>
                 <span className="font-bold text-slate-900">{item.value.toLocaleString()} c.</span>
               </div>
               <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-rose-400 rounded-full" 
                   style={{ width: `${(item.value / maxExp) * 100}%` }}
                 ></div>
               </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};