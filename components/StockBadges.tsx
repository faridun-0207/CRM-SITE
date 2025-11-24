

import React, { useState } from 'react';
import { StockMap } from '../types';
import { Package, FileText, FileDown } from 'lucide-react';
import { Translation } from '../translations';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, HeadingLevel } from 'docx';
import FileSaver from 'file-saver';
import { format } from 'date-fns';

interface StockBadgesProps {
  stock: StockMap;
  t: Translation;
  themeColor: string;
}

export const StockBadges: React.FC<StockBadgesProps> = ({ stock, t, themeColor }) => {
  const [isExporting, setIsExporting] = useState(false);
  // Fix: Cast v to number
  const hasStock = Object.values(stock).some(v => (v as number) > 0);
  const stockItems = Object.entries(stock)
    .filter(([, v]) => (v as number) > 0)
    .map(([k, v]) => ({ name: k, qty: v as number }));

  const exportPDF = async () => {
    setIsExporting(true);
    try {
        const doc = new jsPDF();
        
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
        doc.text(t.stockTitle, 14, 20);
        doc.setFontSize(10);
        doc.text(`Date: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, 14, 26);

        const rows = stockItems.map(i => [i.name, `${i.qty.toFixed(2)} kg`]);

        autoTable(doc, {
            head: [[t.lblMaterial, t.lblWeight]],
            body: rows,
            startY: 30,
            styles: { font: 'Roboto' },
            headStyles: { fillColor: [71, 85, 105] }
        });

        doc.save(`EcoRecycle_Stock_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (e) {
        console.error(e);
        alert("Export Error");
    } finally {
        setIsExporting(false);
    }
  };

  const exportDOCX = () => {
    setIsExporting(true);
    try {
        const rows = stockItems.map(i => new TableRow({
             children: [
                new TableCell({ children: [new Paragraph(i.name)], width: { size: 70, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph(`${i.qty.toFixed(2)} kg`)], width: { size: 30, type: WidthType.PERCENTAGE } })
             ]
        }));

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({ text: t.stockTitle, heading: HeadingLevel.HEADING_1 }),
                    new Paragraph({ text: `Date: ${format(new Date(), 'dd.MM.yyyy HH:mm')}` }),
                    new Paragraph({ text: "" }),
                    new Table({
                        rows: rows,
                        width: { size: 100, type: WidthType.PERCENTAGE }
                    })
                ]
            }]
        });

        Packer.toBlob(doc).then(blob => {
            FileSaver.saveAs(blob, `EcoRecycle_Stock_${format(new Date(), 'yyyy-MM-dd')}.docx`);
            setIsExporting(false);
        });
    } catch (e) {
        console.error(e);
    } finally {
        setIsExporting(false);
    }
  };


  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <Package size={18} className={`text-${themeColor}-600`} />
            <h3>{t.stockTitle}</h3>
        </div>
        {hasStock && (
            <div className="flex gap-1">
                <button 
                    onClick={exportPDF}
                    disabled={isExporting}
                    className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded transition-colors" 
                    title={t.exportPdf}
                >
                    <FileText size={14} />
                </button>
                <button 
                    onClick={exportDOCX}
                    disabled={isExporting}
                    className="p-1.5 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded transition-colors" 
                    title={t.exportDocx}
                >
                    <FileDown size={14} />
                </button>
            </div>
        )}
      </div>
      
      {!hasStock ? (
        <p className="text-sm text-slate-400">{t.stockEmpty}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {stockItems.map((item) => (
              <div key={item.name} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 flex flex-col min-w-[100px]">
                <span className="text-xs text-slate-500 uppercase font-semibold truncate max-w-[120px]" title={item.name}>{item.name}</span>
                <span className="text-lg font-bold text-slate-800">{item.qty.toFixed(1)} <span className="text-xs font-normal text-slate-400">кг</span></span>
              </div>
          ))}
        </div>
      )}
    </div>
  );
};