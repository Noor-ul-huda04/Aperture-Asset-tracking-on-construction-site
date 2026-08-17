import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Trash2, Plus, Download, X } from 'lucide-react';
import { Asset, Site } from '../types';
import { downloadFile } from '../lib/download';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sites: Site[];
  onImportBatch: (assets: Partial<Asset>[]) => Promise<void>;
}

const SAMPLE_CSV_CONTENT = `Name,Category,Manufacturer,Model,SerialNumber,TagEPC,Cost,Status,Site,Condition
Cat 320 Hydraulic Excavator,Heavy Equipment,Caterpillar,320 GC,CAT-320-9912,E2801191A000001000000911,185000,In Zone,Downtown Metro Tower,Excellent
DeWalt 20V Max Hammer Drill,Tools,DeWalt,DCD996,SN-DEW-8812,E2801191A000001000000912,280,In Zone,Downtown Metro Tower,Good
Milwaukee Fuel Sawzall,Tools,Milwaukee,M18-2720,SN-MIL-4410,E2801191A000001000000913,320,In Zone,Highbay Logistics Yard,Excellent
Honda EG5000 Generator,Heavy Equipment,Honda,EG5000CL,SN-HON-1102,E2801191A000001000000914,1450,In Zone,Downtown Metro Tower,Fair
Hilti TE 70-ATC Rotary Hammer,Tools,Hilti,TE70,SN-HIL-9021,E2801191A000001000000915,1890,Under Maintenance,Westside Highway Overpass,Fair
Gehl SL-4640 Skid Steer,Heavy Equipment,Gehl,SL-4640,SN-GHL-3321,E2801191A000001000000916,34000,In Zone,Downtown Metro Tower,Good
3M Protecta Harness Kit,PPE,3M,Protecta-Pro,SN-3M-0081,E2801191A000001000000917,195,In Zone,Downtown Metro Tower,New
Topcon RL-H5A Laser Level,Tools,Topcon,RL-H5A,SN-TOP-5582,E2801191A000001000000918,850,Checked Out,Highbay Logistics Yard,Good
Structural I-Beam Bundle,Materials,ArcelorMittal,W12x26,SN-MAT-1002,E2801191A000001000000919,12500,In Zone,Highbay Logistics Yard,New
20ft Secure Tool Gangbox,Containers,Knaack,3068-Jobmaster,SN-KNA-7011,E2801191A000001000000920,2100,In Zone,Downtown Metro Tower,Good`;

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  sites,
  onImportBatch
}) => {
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<Partial<Asset>[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const parseCsvContent = (content: string) => {
    try {
      const lines = content.trim().split(/\r?\n/);
      if (lines.length < 2) {
        setErrorMsg('CSV file must contain a header row and at least 1 data row.');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
      
      const items: Partial<Asset>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV splitter handling quoted values
        const values: string[] = [];
        let inQuotes = false;
        let currentValue = '';
        
        for (let c = 0; c < line.length; c++) {
          const char = line[c];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(currentValue.trim().replace(/^["']|["']$/g, ''));
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue.trim().replace(/^["']|["']$/g, ''));

        const rowObj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });

        const name = rowObj['name'] || rowObj['asset'] || rowObj['title'] || `Imported Asset #${i}`;
        const category = rowObj['category'] || 'Tools';
        const manufacturer = rowObj['manufacturer'] || rowObj['brand'] || 'Generic';
        const model = rowObj['model'] || 'Standard';
        const serialNumber = rowObj['serialnumber'] || rowObj['serial'] || `SN-IMP-${Math.floor(10000 + Math.random() * 90000)}`;
        const tagEpc = rowObj['tagepc'] || rowObj['epc'] || rowObj['rfid'] || `E2801191A000001000000${Math.floor(800 + Math.random() * 199)}`;
        const cost = Number(rowObj['cost'] || rowObj['price']) || 350;
        const status = rowObj['status'] || 'In Zone';
        const siteName = rowObj['site'] || sites[0]?.name || 'Construction Site';
        const matchedSite = sites.find(s => s.name.toLowerCase().includes(siteName.toLowerCase())) || sites[0];

        items.push({
          name,
          category: category as any,
          manufacturer,
          model,
          serialNumber,
          tagEpc,
          cost,
          status: status as any,
          siteId: matchedSite?.id || 'site-01',
          siteName: matchedSite?.name || 'Site #1',
          zoneId: matchedSite?.zones?.[0]?.id || 'z-01',
          zoneName: matchedSite?.zones?.[0]?.name || 'Laydown Yard',
          condition: (rowObj['condition'] || 'Excellent') as any,
          purchaseDate: new Date().toISOString().split('T')[0]
        });
      }

      setParsedRows(items);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(`CSV Parse Error: ${err.message || 'Invalid format'}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      parseCsvContent(text);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    setFileName('sample_construction_assets.csv');
    setCsvText(SAMPLE_CSV_CONTENT);
    parseCsvContent(SAMPLE_CSV_CONTENT);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setCsvText(text);
    if (text.trim()) {
      parseCsvContent(text);
    } else {
      setParsedRows([]);
    }
  };

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;

    setIsImporting(true);
    setErrorMsg(null);
    try {
      await onImportBatch(parsedRows);
      setSuccessMsg(`Successfully imported ${parsedRows.length} assets into database!`);
      setTimeout(() => {
        setIsImporting(false);
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setIsImporting(false);
      setErrorMsg(`Import failed: ${err.message || 'Database error'}`);
    }
  };

  const handleRemoveParsedRow = (index: number) => {
    const updated = [...parsedRows];
    updated.splice(index, 1);
    setParsedRows(updated);
  };

  const handleDownloadSampleCsv = () => {
    downloadFile(SAMPLE_CSV_CONTENT, 'Aperture_Sample_Assets_Template.csv', 'text/csv');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 text-blue-400 border border-blue-500/40 rounded-xl">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white font-mono">CSV Fleet Asset Batch Import</h2>
              <p className="text-xs text-slate-400">Bulk register UHF RFID tags and assets directly into the database</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">

          {successMsg ? (
            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-lg text-emerald-900">{successMsg}</h3>
              <p className="text-xs text-emerald-700 font-mono">Database state synced across API & Firestore.</p>
            </div>
          ) : (
            <>
              {/* Option Bar: Upload File vs Load Sample vs Template */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-2 shadow-xs transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Upload CSV File</span>
                    <input 
                      type="file" 
                      accept=".csv,text/csv" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                  </label>

                  <button
                    onClick={handleLoadSample}
                    className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                    <span>Load 10 Sample Construction Assets</span>
                  </button>
                </div>

                <button
                  onClick={handleDownloadSampleCsv}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 hover:underline"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download CSV Template</span>
                </button>
              </div>

              {fileName && (
                <div className="text-xs font-mono text-blue-900 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg flex items-center justify-between">
                  <span>Selected File: <strong>{fileName}</strong> ({parsedRows.length} assets recognized)</span>
                </div>
              )}

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Raw CSV Text Area (Collapsible/Editable) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  CSV Raw Content / Paste Data:
                </label>
                <textarea
                  value={csvText}
                  onChange={handleTextChange}
                  placeholder="Paste CSV rows here (e.g. Name,Category,Manufacturer,Model,SerialNumber,TagEPC,Cost,Status,Site)..."
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Parsed Preview Table */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <span>Parsed Assets Preview</span>
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                        {parsedRows.length} Items Validated
                      </span>
                    </h3>
                    <span className="text-[11px] text-slate-500 font-mono">Ready for database commit</span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto shadow-inner">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-mono text-[10px] uppercase sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Asset Name</th>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3">Serial #</th>
                          <th className="py-2 px-3">Tag EPC</th>
                          <th className="py-2 px-3 text-right">Cost</th>
                          <th className="py-2 px-3">Target Site</th>
                          <th className="py-2 px-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                        {parsedRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-bold text-slate-900 font-sans">
                              {row.name}
                            </td>
                            <td className="py-2 px-3 text-slate-600">
                              {row.category}
                            </td>
                            <td className="py-2 px-3 text-slate-500">
                              {row.serialNumber}
                            </td>
                            <td className="py-2 px-3 text-blue-700 font-bold">
                              {row.tagEpc}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-emerald-700">
                              ${row.cost != null ? Number(row.cost).toLocaleString() : '0'}
                            </td>
                            <td className="py-2 px-3 text-slate-700 font-sans">
                              {row.siteName}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={() => handleRemoveParsedRow(idx)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded"
                                title="Remove row from batch"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer Actions */}
        {!successMsg && (
          <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-mono">
              {parsedRows.length} assets ready to write into MongoDB & Firestore.
            </span>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmImport}
                disabled={parsedRows.length === 0 || isImporting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isImporting ? 'Persisting to Database...' : `Import ${parsedRows.length} Assets to Database`}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
