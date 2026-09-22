import React, { useState } from 'react';
import { 
  Printer, 
  FileText, 
  Check, 
  Save, 
  ShieldCheck, 
  Building, 
  Calendar, 
  UserCheck, 
  ExternalLink,
  Edit3
} from 'lucide-react';

export default function ClientReportView({ audit, onSaveSummary }) {
  const [agencyName, setAgencyName] = useState('Apex Digital & SEO Advisory');
  const [clientName, setClientName] = useState('Acme Cloud Operations');
  const [executiveSummary, setExecutiveSummary] = useState(audit?.executive_summary || '');
  const [isSaved, setIsSaved] = useState(false);
  const [isEditingSummary, setIsEditingSummary] = useState(false);

  if (!audit) return null;

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/audits/${audit.id}/summary`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executive_summary: executiveSummary })
      });
      if (res.ok) {
        setIsSaved(true);
        setIsEditingSummary(false);
        if (onSaveSummary) onSaveSummary(executiveSummary);
        setTimeout(() => setIsSaved(false), 2500);
      }
    } catch (err) {
      console.error('Failed to save summary:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const findings = audit.findings || [];
  const topPriorities = findings.filter(f => f.severity === 'critical' || f.severity === 'high');

  return (
    <div className="space-y-6">

      {/* Control Action Bar (Hidden during Print) */}
      <div className="no-print bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Client Audit Deliverable &amp; PDF Report</span>
          </h2>
          <p className="text-xs text-slate-500">
            Customize branding, refine the executive summary, and generate a branded PDF report.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsEditingSummary(!isEditingSummary)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditingSummary ? 'View Formatted' : 'Edit Executive Summary'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-600/30 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Export PDF</span>
          </button>
        </div>
      </div>

      {/* Agency Branding Controls (Hidden during Print) */}
      <div className="no-print bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="font-bold text-slate-700 block mb-1">Agency / Consultancy Name:</label>
          <input
            type="text"
            value={agencyName}
            onChange={(e) => setAgencyName(e.target.value)}
            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
          />
        </div>
        <div>
          <label className="font-bold text-slate-700 block mb-1">Client Business Name:</label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
          />
        </div>
      </div>

      {/* Editable Summary Area (when editing) */}
      {isEditingSummary && (
        <div className="no-print bg-white rounded-2xl p-5 border border-blue-300 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Edit Executive Recommendations (Client View)
            </span>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-xs cursor-pointer"
            >
              {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaved ? 'Saved to Audit!' : 'Save Summary'}</span>
            </button>
          </div>
          <textarea
            rows={6}
            value={executiveSummary}
            onChange={(e) => setExecutiveSummary(e.target.value)}
            className="w-full p-3 text-xs sm:text-sm font-sans text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type executive notes and client action plan here..."
          />
        </div>
      )}

      {/* THE PRINTABLE REPORT DOCUMENT */}
      <div className="report-card bg-white rounded-2xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-8 print:p-0 print:border-none print:shadow-none">
        
        {/* Document Cover / Header */}
        <div className="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 block mb-1">
              {agencyName}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Website Health, SEO &amp; Performance Audit
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Prepared for: <strong className="text-slate-800">{clientName}</strong> ({audit.domain})
            </p>
          </div>

          <div className="text-xs text-slate-500 sm:text-right space-y-0.5">
            <div className="flex items-center sm:justify-end gap-1 font-medium text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{new Date(audit.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div>Audit Reference: <code className="font-mono text-[11px] text-slate-600">{audit.id}</code></div>
          </div>
        </div>

        {/* Executive Scorecard */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold uppercase text-slate-500 block mb-1">Quality &amp; UX</span>
            <span className="font-extrabold font-mono text-3xl text-slate-900">{audit.quality_score}/100</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold uppercase text-slate-500 block mb-1">Technical SEO</span>
            <span className="font-extrabold font-mono text-3xl text-slate-900">{audit.seo_score}/100</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold uppercase text-slate-500 block mb-1">Mobile Speed</span>
            <span className="font-extrabold font-mono text-3xl text-slate-900">{audit.performance_score}/100</span>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-3">
          <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider text-xs">
            Executive Summary &amp; Recommendations
          </h3>
          <div className="p-5 bg-slate-50/70 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {executiveSummary || audit.executive_summary || 'No executive summary provided.'}
          </div>
        </div>

        {/* High Priority Action Items Table */}
        <div className="space-y-3">
          <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider text-xs">
            Prioritized Remediation Queue ({topPriorities.length} High Impact Findings)
          </h3>

          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Observed Issue</th>
                  <th className="py-2.5 px-3">Business &amp; User Impact</th>
                  <th className="py-2.5 px-3">Est. Effort</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topPriorities.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-400">Zero critical blockers found. Website is in good health!</td>
                  </tr>
                ) : (
                  topPriorities.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 align-top font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                          item.severity === 'critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.severity}
                        </span>
                      </td>
                      <td className="py-3 px-3 align-top font-bold text-slate-900 max-w-[200px]">
                        {item.title}
                        <span className="block font-normal text-[11px] text-slate-500 mt-0.5">{item.description}</span>
                      </td>
                      <td className="py-3 px-3 align-top text-slate-600 max-w-[250px] leading-relaxed">
                        {item.why_it_matters}
                      </td>
                      <td className="py-3 px-3 align-top font-mono font-semibold text-slate-700 whitespace-nowrap">
                        {item.effort || '<15m'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
          <span>Report Generated by SiteScope AI Inspector</span>
          <span>Certified Passive &amp; Non-Destructive Audit</span>
        </div>

      </div>

    </div>
  );
}
