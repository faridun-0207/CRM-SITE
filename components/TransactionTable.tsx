

import React, { useState, useMemo } from 'react';
import { Transaction, Processing, Expense } from '../types';
import { ArrowDown, ArrowUp, Factory, Trash2, Filter, ArrowUpDown, ChevronUp, ChevronDown, Search, Download, FileText, FileDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Translation } from '../translations';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, BorderStyle, AlignmentType, HeadingLevel, ShadingType } from 'docx';
import FileSaver from 'file-saver';

interface TransactionTableProps {
  date: string;
  transactions: Transaction[];
  processing: Processing[];
  expenses: Expense[];
  allMaterials: string[];
  onDelete: (type: 'trans' | 'proc' | 'exp', id: number) => void;
  t: Translation;
  themeColor: string;
  viewMode: 'daily' | 'monthly';
}

type SortKey = 'date' | 'time' | 'type' | 'details' | 'value';
type SortDirection = 'asc' | 'desc';

export const TransactionTable: React.FC<TransactionTableProps> = ({ 
  date, transactions, processing, expenses, allMaterials, onDelete, t, themeColor, viewMode 
}) => {
  // State for Filtering
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [matFilter, setMatFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  // State for Sorting
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: viewMode === 'monthly' ? 'date' : 'time',
    direction: 'desc'
  });

  // Merge and Process Data
  const processedData = useMemo(() => {
    // 1. Merge
    let allItems = [
      ...transactions.map(t => ({ ...t, kind: 'trans' as const })),
      ...processing.map(p => ({ ...p, kind: 'proc' as const })),
      ...expenses.map(e => ({ ...e, kind: 'exp' as const }))
    ];

    // 2. Filter
    allItems = allItems.filter(item => {
      // Type Filter
      if (typeFilter !== 'all') {
        if (typeFilter === 'buy' && (item.kind !== 'trans' || (item as Transaction).type !== 'buy')) return false;
        if (typeFilter === 'sell' && (item.kind !== 'trans' || (item as Transaction).type !== 'sell')) return false;
        if (typeFilter === 'proc' && item.kind !== 'proc') return false;
        if (typeFilter === 'exp' && item.kind !== 'exp') return false;
      }

      // Material Filter
      if (matFilter !== 'all') {
        if (item.kind === 'trans') {
          if ((item as Transaction).mat !== matFilter) return false;
        } else if (item.kind === 'proc') {
          const p = item as Processing;
          if (p.from !== matFilter && p.to !== matFilter) return false;
        } else {
          // Hide expenses when specific material is selected
          return false;
        }
      }

      return true;
    });

    // 3. Sort
    return allItems.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      switch (sortConfig.key) {
        case 'date':
        case 'time':
          // Sort by full timestamp
          valA = `${a.date}T${a.time}`;
          valB = `${b.date}T${b.time}`;
          break;
        case 'type':
          // Custom sort order for types
          const getTypeStr = (i: typeof a) => 
            i.kind === 'proc' ? 'B' : i.kind === 'exp' ? 'D' : (i as Transaction).type === 'buy' ? 'A' : 'C';
          valA = getTypeStr(a);
          valB = getTypeStr(b);
          break;
        case 'details':
          if (a.kind === 'trans') valA = (a as Transaction).mat;
          else if (a.kind === 'proc') valA = (a as Processing).from;
          else valA = (a as Expense).cat;
          
          if (b.kind === 'trans') valB = (b as Transaction).mat;
          else if (b.kind === 'proc') valB = (b as Processing).from;
          else valB = (b as Expense).cat;
          break;
        case 'value':
          // Calculate numeric value for sorting (Expenses are negative, Buys negative, Sales positive)
          const getNumVal = (i: typeof a) => {
            if (i.kind === 'exp') return -(i as Expense).amt;
            if (i.kind === 'trans') {
              const t = i as Transaction;
              return t.type === 'buy' ? -t.total : t.total;
            }
            return 0; // Processing has no monetary value in this table
          };
          valA = getNumVal(a);
          valB = getNumVal(b);
          break;
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [transactions, processing, expenses, typeFilter, matFilter, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortConfig.key !== column) return <ArrowUpDown size={14} className="text-slate-300 opacity-0 group-hover:opacity-50" />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp size={14} className={`text-${themeColor}-600`} />
      : <ChevronDown size={14} className={`text-${themeColor}-600`} />;
  };

  const formatDateTitle = () => {
     if (viewMode === 'monthly') {
         try {
            return format(parseISO(date + '-01'), 'MMMM yyyy');
         } catch (e) {
             return date;
         }
     }
     return format(parseISO(date), 'dd.MM.yyyy');
  }

  // Helper to extract clean text data for export
  const getItemData = (item: any) => {
    let dateStr = item.time;
    if (viewMode === 'monthly') {
        try {
            dateStr = format(parseISO(item.date), 'dd.MM') + ' ' + item.time;
        } catch (e) { dateStr = item.date + ' ' + item.time }
    }
  
    let typeStr = '';
    let detailsStr = '';
    let sumStr = '';
    let rawSum = 0;
  
    if (item.kind === 'proc') {
        typeStr = t.filterProc;
        detailsStr = `${item.from} -> ${item.to} (${item.qtyIn}kg -> ${item.qtyOut}kg)`;
        sumStr = '-';
    } else if (item.kind === 'exp') {
        typeStr = t.filterExp;
        detailsStr = `${item.cat} (${item.desc})`;
        sumStr = `-${item.amt.toLocaleString()} c.`;
        rawSum = -item.amt;
    } else {
        const isBuy = item.type === 'buy';
        typeStr = isBuy ? t.filterBuy : t.filterSell;
        if (item.method === 'debt') typeStr += ` (${t.optDebt.replace('⚠️ ', '')})`;
        detailsStr = `${item.mat} - ${item.client}`;
        sumStr = `${isBuy ? '-' : '+'}${item.total.toLocaleString()} c.`;
        rawSum = isBuy ? -item.total : item.total;
    }
    
    return { date: dateStr, type: typeStr, details: detailsStr, sum: sumStr, rawSum };
  }

  const calculateReportTotals = () => {
      let income = 0;
      let expense = 0;
      
      processedData.forEach(item => {
          if (item.kind === 'trans') {
              const t = item as Transaction;
              if (t.type === 'sell') income += t.total;
              else if (t.type === 'buy') expense += t.total;
          } else if (item.kind === 'exp') {
              expense += (item as Expense).amt;
          }
      });

      return { income, expense, profit: income - expense };
  };

  const exportPDF = async () => {
    setIsExporting(true);
    try {
        const doc = new jsPDF();
        const totals = calculateReportTotals();
        
        // --- 1. Load Font (Cyrillic Support) ---
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

        // --- 2. Header & Branding ---
        // Header Background
        doc.setFillColor(31, 41, 55); // Slate 800
        doc.rect(0, 0, 210, 40, 'F');
        
        // Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.text("EcoRecycle PRO", 14, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(156, 163, 175); // Slate 400
        doc.text(t.tableTitle.toUpperCase(), 14, 30);

        // Date Info (Right side)
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.text(formatDateTitle(), 196, 20, { align: 'right' });
        doc.setFontSize(9);
        doc.setTextColor(156, 163, 175);
        doc.text(`${t.repGenerated}: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, 196, 30, { align: 'right' });

        // --- 3. Summary Dashboard (Cards) ---
        const startY = 50;
        
        // Card 1: Income (Green)
        doc.setFillColor(236, 253, 245); // Emerald 50
        doc.setDrawColor(16, 185, 129); // Emerald 500
        doc.roundedRect(14, startY, 58, 24, 2, 2, 'FD');
        doc.setFontSize(9);
        doc.setTextColor(6, 95, 70);
        doc.text(t.kpiIncome.toUpperCase(), 18, startY + 8);
        doc.setFontSize(14);
        doc.setTextColor(4, 120, 87);
        doc.text(`+${totals.income.toLocaleString()} c.`, 18, startY + 18);

        // Card 2: Expense (Red)
        doc.setFillColor(255, 241, 242); // Rose 50
        doc.setDrawColor(244, 63, 94); // Rose 500
        doc.roundedRect(76, startY, 58, 24, 2, 2, 'FD');
        doc.setFontSize(9);
        doc.setTextColor(159, 18, 57);
        doc.text(t.kpiExpense.toUpperCase(), 80, startY + 8);
        doc.setFontSize(14);
        doc.setTextColor(190, 18, 60);
        doc.text(`-${totals.expense.toLocaleString()} c.`, 80, startY + 18);

        // Card 3: Profit (Blue)
        doc.setFillColor(239, 246, 255); // Blue 50
        doc.setDrawColor(59, 130, 246); // Blue 500
        doc.roundedRect(138, startY, 58, 24, 2, 2, 'FD');
        doc.setFontSize(9);
        doc.setTextColor(30, 58, 138);
        doc.text(t.kpiProfit.toUpperCase(), 142, startY + 8);
        doc.setFontSize(14);
        doc.setTextColor(29, 78, 216);
        doc.text(`${totals.profit.toLocaleString()} c.`, 142, startY + 18);


        // --- 4. Data Table ---
        const tableColumn = [
            viewMode === 'monthly' ? t.colDate : t.colTime,
            t.colType,
            t.colDetails,
            t.colSum
        ];

        const tableRows = processedData.map(item => {
            const data = getItemData(item);
            return [data.date, data.type, data.details, data.sum];
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: startY + 35,
            styles: { 
                font: 'Roboto', 
                fontStyle: 'normal',
                fontSize: 9,
                cellPadding: 3
            },
            headStyles: { 
                fillColor: [55, 65, 81], // Slate 700
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [249, 250, 251] // Gray 50
            },
            columnStyles: {
                3: { halign: 'right', fontStyle: 'bold' }
            },
            // --- 5. "Hologram" / Watermark Effect ---
            didDrawPage: (data) => {
                // Draw Watermark on every page
                doc.saveGraphicsState();
                // Fix: Cast doc to any to access GState constructor
                doc.setGState(new (doc as any).GState({ opacity: 0.04 }));
                
                // Draw a large circle seal
                const cx = doc.internal.pageSize.width / 2;
                const cy = doc.internal.pageSize.height / 2;
                
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(2);
                doc.circle(cx, cy, 60, 'S');
                doc.circle(cx, cy, 55, 'S');
                
                doc.setFontSize(20);
                doc.setTextColor(0, 0, 0);
                
                // Rotate text
                const text = "EcoRecycle PRO";
                const angle = 45;
                const rad = angle * (Math.PI / 180);
                
                doc.text(text, cx, cy, { align: 'center', angle: 45 });
                doc.text("OFFICIAL REPORT", cx, cy + 20, { align: 'center', angle: 45 });
                
                doc.restoreGraphicsState();

                // Footer
                // Fix: Use doc.getNumberOfPages() instead of doc.internal.getNumberOfPages()
                const pageCount = doc.getNumberOfPages();
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`Page ${pageCount}`, 196, doc.internal.pageSize.height - 10, { align: 'right' });
                doc.text(`EcoRecycle CRM`, 14, doc.internal.pageSize.height - 10);
            }
        });

        doc.save(`EcoRecycle_Report_${date}.pdf`);
    } catch (error) {
        console.error("Export PDF Error:", error);
        alert("Error generating PDF. Please check your internet connection for font loading.");
    } finally {
        setIsExporting(false);
    }
  };

  const exportDocx = () => {
    setIsExporting(true);
    try {
        const totals = calculateReportTotals();

        // 1. Summary Table (Invisible borders, just layout)
        const summaryTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [
                                // Fix: Use TextRun for styling instead of Paragraph properties
                                new Paragraph({ children: [new TextRun({ text: t.kpiIncome, color: "047857" })] }),
                                new Paragraph({ children: [new TextRun({ text: `+${totals.income.toLocaleString()} c.`, bold: true, size: 28, color: "047857" })] })
                            ],
                            shading: { fill: "ECFDF5", type: ShadingType.CLEAR, color: "auto" }, // Emerald 50
                            width: { size: 33, type: WidthType.PERCENTAGE },
                            margins: { top: 200, bottom: 200, left: 200, right: 200 }
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({ children: [new TextRun({ text: t.kpiExpense, color: "BE123C" })] }),
                                new Paragraph({ children: [new TextRun({ text: `-${totals.expense.toLocaleString()} c.`, bold: true, size: 28, color: "BE123C" })] })
                            ],
                            shading: { fill: "FFF1F2", type: ShadingType.CLEAR, color: "auto" }, // Rose 50
                            width: { size: 33, type: WidthType.PERCENTAGE },
                             margins: { top: 200, bottom: 200, left: 200, right: 200 }
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({ children: [new TextRun({ text: t.kpiProfit, color: "1D4ED8" })] }),
                                new Paragraph({ children: [new TextRun({ text: `${totals.profit.toLocaleString()} c.`, bold: true, size: 28, color: "1D4ED8" })] })
                            ],
                            shading: { fill: "EFF6FF", type: ShadingType.CLEAR, color: "auto" }, // Blue 50
                            width: { size: 33, type: WidthType.PERCENTAGE },
                             margins: { top: 200, bottom: 200, left: 200, right: 200 }
                        }),
                    ]
                })
            ]
        });

        // 2. Data Table
        const tableRows = processedData.map(item => {
            const data = getItemData(item);
            return new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph(data.date)], width: { size: 15, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph(data.type)], width: { size: 15, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph(data.details)], width: { size: 50, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: data.sum, alignment: AlignmentType.RIGHT })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                ]
            });
        });

        const headerRow = new TableRow({
            children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: viewMode === 'monthly' ? t.colDate : t.colTime, bold: true, color: "FFFFFF" })] })], shading: { fill: "374151" } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.colType, bold: true, color: "FFFFFF" })] })], shading: { fill: "374151" } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.colDetails, bold: true, color: "FFFFFF" })] })], shading: { fill: "374151" } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.colSum, bold: true, color: "FFFFFF" })], alignment: AlignmentType.RIGHT })], shading: { fill: "374151" } }),
            ],
            tableHeader: true
        });

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({ text: "EcoRecycle PRO", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
                    new Paragraph({ text: t.tableTitle, heading: HeadingLevel.HEADING_2, alignment: AlignmentType.CENTER }),
                    new Paragraph({ text: `Date: ${formatDateTitle()}`, alignment: AlignmentType.CENTER }),
                    new Paragraph({ text: "" }), // spacing
                    summaryTable,
                    new Paragraph({ text: "" }), // spacing
                    new Table({
                        rows: [headerRow, ...tableRows],
                        width: { size: 100, type: WidthType.PERCENTAGE },
                    })
                ]
            }]
        });

        Packer.toBlob(doc).then(blob => {
            FileSaver.saveAs(blob, `EcoRecycle_Report_${date}.docx`);
            setIsExporting(false);
        });
    } catch (error) {
        console.error("Export DOCX Error:", error);
        setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col max-h-[600px]">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="font-semibold text-slate-700 flex items-center gap-2">
           {t.tableTitle} <span className="text-slate-400 font-normal text-sm">({formatDateTitle()})</span>
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <div className="relative">
            <Filter size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={`pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 outline-none focus:border-${themeColor}-500`}
              style={{ colorScheme: 'light' }}
            >
              <option value="all">{t.filterAllTypes}</option>
              <option value="buy">{t.filterBuy}</option>
              <option value="sell">{t.filterSell}</option>
              <option value="proc">{t.filterProc}</option>
              <option value="exp">{t.filterExp}</option>
            </select>
          </div>

          <div className="relative max-w-[150px]">
             <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
             <select 
                value={matFilter}
                onChange={(e) => setMatFilter(e.target.value)}
                className={`pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 outline-none focus:border-${themeColor}-500 w-full truncate`}
                style={{ colorScheme: 'light' }}
              >
                <option value="all">{t.filterAllMats}</option>
                {allMaterials.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
          </div>

          <div className="flex items-center gap-1 ml-auto sm:ml-2 pl-0 sm:pl-2 border-l-0 sm:border-l border-slate-200">
            <button 
                onClick={exportPDF} 
                disabled={isExporting}
                className="px-2 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 rounded transition-colors flex items-center gap-1" 
                title={t.exportPdf}
            >
                <FileText size={14} />
                PDF
            </button>
            <button 
                onClick={exportDocx} 
                disabled={isExporting}
                className="px-2 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors flex items-center gap-1" 
                title={t.exportDocx}
            >
                <FileDown size={14} />
                DOCX
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto custom-scrollbar flex-1">
        {processedData.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            {t.tableNoData}
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-10">
              <tr>
                {viewMode === 'monthly' && (
                    <th 
                    className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                    onClick={() => handleSort('date')}
                    >
                    <div className="flex items-center gap-1">{t.colDate} <SortIcon column="date" /></div>
                    </th>
                )}
                <th 
                  className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                  onClick={() => handleSort('time')}
                >
                  <div className="flex items-center gap-1">{t.colTime} <SortIcon column="time" /></div>
                </th>
                <th 
                  className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                  onClick={() => handleSort('type')}
                >
                   <div className="flex items-center gap-1">{t.colType} <SortIcon column="type" /></div>
                </th>
                <th 
                  className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                  onClick={() => handleSort('details')}
                >
                   <div className="flex items-center gap-1">{t.colDetails} <SortIcon column="details" /></div>
                </th>
                <th 
                  className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                  onClick={() => handleSort('value')}
                >
                   <div className="flex items-center justify-end gap-1">{t.colSum} <SortIcon column="value" /></div>
                </th>
                <th className="px-4 py-3 text-right w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processedData.map((item) => {
                // Render Logic
                let icon, badgeClass, details, valueClass, valueText, badgeText;
                
                if (item.kind === 'proc') {
                  const p = item as Processing & { kind: 'proc' };
                  icon = <Factory size={16} />;
                  badgeClass = 'bg-amber-100 text-amber-700';
                  badgeText = t.filterProc;
                  details = (
                    <div>
                      <span className="font-medium text-slate-700">{p.from}</span>
                      <span className="text-slate-400 mx-1">→</span>
                      <span className={`font-medium text-${themeColor}-600`}>{p.to}</span>
                      <div className="text-xs text-slate-400">{p.qtyIn}кг → {p.qtyOut}кг</div>
                    </div>
                  );
                  valueClass = 'text-slate-400';
                  valueText = '-';
                } else if (item.kind === 'exp') {
                  const e = item as Expense & { kind: 'exp' };
                  icon = <ArrowDown size={16} />;
                  badgeClass = 'bg-rose-100 text-rose-700';
                  badgeText = t.filterExp;
                  details = (
                    <div>
                      <div className="font-medium text-slate-700">{e.cat}</div>
                      <div className="text-xs text-slate-400">{e.desc}</div>
                    </div>
                  );
                  valueClass = 'text-rose-600 font-semibold';
                  valueText = `-${e.amt.toLocaleString()}`;
                } else {
                  const tr = item as Transaction & { kind: 'trans' };
                  const isBuy = tr.type === 'buy';
                  icon = isBuy ? <ArrowDown size={16} /> : <ArrowUp size={16} />;
                  badgeClass = isBuy ? `bg-${themeColor}-100 text-${themeColor}-700` : 'bg-blue-100 text-blue-700';
                  badgeText = isBuy ? t.filterBuy : t.filterSell;
                  if (tr.method === 'debt') {
                     badgeClass = 'bg-orange-100 text-orange-700';
                     badgeText = t.optDebt.replace('⚠️ ', '');
                  }

                  details = (
                    <div>
                      <div className="font-medium text-slate-700">{tr.mat}</div>
                      <div className="text-xs text-slate-500">{tr.client} {tr.method === 'debt' && '(Не оплачено)'}</div>
                    </div>
                  );
                  valueClass = isBuy ? `text-${themeColor}-600 font-semibold` : 'text-blue-600 font-semibold';
                  valueText = `${isBuy ? '-' : '+'}${tr.total.toLocaleString()}`;
                }

                return (
                  <tr key={`${item.kind}-${item.id}`} className="hover:bg-slate-50 transition-colors">
                    {viewMode === 'monthly' && (
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap font-mono text-xs">{format(parseISO(item.date), 'dd.MM')}</td>
                    )}
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap font-mono text-xs">{item.time}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
                        {icon}
                        {badgeText}
                      </span>
                    </td>
                    <td className="px-4 py-3">{details}</td>
                    <td className={`px-4 py-3 text-right ${valueClass}`}>{valueText}</td>
                    <td className="px-4 py-3 text-right">
                      <button 
                          onClick={() => onDelete(item.kind, item.id)}
                          className="text-slate-300 hover:text-rose-500 transition-colors"
                          title={t.confirmDel}
                      >
                          <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
