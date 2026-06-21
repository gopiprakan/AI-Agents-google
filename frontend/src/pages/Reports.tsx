import React, { useState } from 'react';
import { FileDown, Download, CheckCircle, AlertTriangle } from 'lucide-react';

interface ReportsProps {
  telemetry: any[];
}

export const Reports: React.FC<ReportsProps> = ({ telemetry }) => {
  const [selectedJunctionId, setSelectedJunctionId] = useState<string>('ALL');
  const [reportType, setReportType] = useState<string>('csv');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportComplete, setExportComplete] = useState<boolean>(false);

  const handleDownload = () => {
    setIsExporting(true);
    setExportComplete(false);

    // Call API download endpoint
    const jFilter = selectedJunctionId !== 'ALL' ? `&junction_id=${selectedJunctionId}` : '';
    const downloadUrl = `/api/reports/download?report_type=${reportType}${jFilter}`;
    
    // Simulate short loader delay for UI feel
    setTimeout(() => {
      try {
        // Attempt to redirect to API stream
        window.open(downloadUrl, '_blank');
        setExportComplete(true);
      } catch (err) {
        // If window trigger fails, execute local fallback download
        fallbackClientDownload();
      } finally {
        setIsExporting(false);
      }
    }, 1200);
  };

  const fallbackClientDownload = () => {
    // Client-side CSV backup generator
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Junction,Location,Congestion Score,Status\n";
    telemetry.forEach(t => {
      csvContent += `"${t.name}","${t.lat}, ${t.lng}",${t.congestion_score},"${t.status}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ISCTS_Local_Fallback_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportComplete(true);
  };

  return (
    <div className="space-y-6">
      {/* Parameters panel */}
      <div className="glass-panel p-6 rounded-2xl max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-cardBorder">
          <div className="p-3 bg-cyanGlow/10 rounded-2xl border border-cyanGlow/20 text-cyanGlow">
            <FileDown className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Reports Query Builder</h3>
            <p className="text-xs text-slate-400">Generate logs database audit dumps in multiple structural extensions.</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Format selection */}
          <div>
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-3">Export File Format</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'csv', label: 'CSV Database Log', desc: 'Flat text spreadsheet file' },
                { id: 'excel', label: 'Excel Worksheet', desc: 'Binary format spreadsheet' },
                { id: 'pdf', label: 'PDF Analytical Report', desc: 'Styled visual publication log' }
              ].map((format) => (
                <button
                  key={format.id}
                  onClick={() => setReportType(format.id)}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all duration-200 ${
                    reportType === format.id 
                      ? 'bg-cyanGlow/10 border-cyanGlow text-cyanGlow' 
                      : 'bg-white/5 border-cardBorder text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <span className="text-sm font-bold block">{format.label}</span>
                  <span className="text-[10px] text-slate-400 mt-2 block">{format.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filtering */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-2">Target Junction</label>
              <select
                value={selectedJunctionId}
                onChange={(e) => setSelectedJunctionId(e.target.value)}
                className="w-full bg-slate-900 border border-cardBorder rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyanGlow transition-colors"
              >
                <option value="ALL">All City Junctions Combined</option>
                {telemetry.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-2">Audit Range Window</label>
              <select
                className="w-full bg-slate-900 border border-cardBorder rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyanGlow transition-colors"
                disabled
              >
                <option>Past 24 Hours Telemetry (Standard)</option>
                <option>Past 7 Days Logs Archive</option>
                <option>Historical Record Log Dump</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-6 border-t border-cardBorder flex items-center justify-between gap-4">
            <div className="flex-1">
              {isExporting && (
                <div className="flex items-center gap-2 text-xs text-cyanGlow animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-cyanGlow animate-ping" />
                  <span>Compiling database models...</span>
                </div>
              )}
              {exportComplete && (
                <div className="flex items-center gap-2 text-xs text-emeraldSuccess">
                  <CheckCircle className="w-4 h-4" />
                  <span>Report exported successfully! Check downloads.</span>
                </div>
              )}
            </div>

            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyanGlow text-slate-950 font-bold hover:bg-cyanGlow/80 transition-all text-sm uppercase tracking-wider disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Generate Export</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
