import React, { useState, useEffect } from 'react';
import { 
  GitCompare, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  Zap, 
  ChevronRight,
  TrendingUp,
  FileText
} from 'lucide-react';

export default function AuditComparison({ allAudits = [], onSelectAudit }) {
  const [auditId1, setAuditId1] = useState('');
  const [auditId2, setAuditId2] = useState('');
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('resolved'); // 'resolved', 'persistent', 'new'

  // Default selection to the two seeded audits if available
  useEffect(() => {
    if (allAudits.length >= 2) {
      // Find before and after demo audits or pick the top two
      const v1 = allAudits.find(a => a.id.includes('before') || a.url.includes('demo-site')) || allAudits[1];
      const v2 = allAudits.find(a => a.id.includes('after') || a.url.includes('demo-site-fixed')) || allAudits[0];

      if (v1 && v2) {
        setAuditId1(v1.id);
        setAuditId2(v2.id);
        runComparison(v1.id, v2.id);
      }
    }
  }, [allAudits]);

  const runComparison = async (id1, id2) => {
    if (!id1 || !id2) return;
    setLoading(true);
    try {
      const res = await fetch('/api/audits/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditId1: id1, auditId2: id2 })
      });
      if (res.ok) {
        const data = await res.json();
        setComparisonData(data);
      }
    } catch (err) {
      console.error('Comparison error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRun = () => {
    runComparison(auditId1, auditId2);
  };

  const loadSeededDemoComparison = () => {
    const v1 = allAudits.find(a => a.id === 'audit-demo-before-001');
    const v2 = allAudits.find(a => a.id === 'audit-demo-after-002');
    if (v1 && v2) {
      setAuditId1(v1.id);
      setAuditId2(v2.id);
      runComparison(v1.id, v2.id);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header Selector Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-blue-600" />
              <span>Before &amp; After Audit Comparison</span>
            </h2>
            <p className="text-xs text-slate-500">
              Measure improvement across two inspection runs to verify client fix remediation
            </p>
          </div>

          <button
            onClick={loadSeededDemoComparison}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition shadow-xs self-start cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Demo Comparison (Before vs After)</span>
          </button>
        </div>

        {/* Audit Pickers */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          <div className="md:col-span-5 space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500 block">
              1. Baseline Audit (Before Fixes)
            </label>
            <select
              value={auditId1}
              onChange={(e) => setAuditId1(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">Select baseline audit...</option>
              {allAudits.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.domain} ({new Date(a.created_at).toLocaleDateString()}) — Q:{a.quality_score} S:{a.seo_score} P:{a.performance_score}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 flex justify-center pt-4">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div className="md:col-span-5 space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500 block">
              2. Follow-Up Audit (After Fixes)
            </label>
            <select
              value={auditId2}
              onChange={(e) => setAuditId2(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">Select follow-up audit...</option>
              {allAudits.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.domain} ({new Date(a.created_at).toLocaleDateString()}) — Q:{a.quality_score} S:{a.seo_score} P:{a.performance_score}
                </option>
              ))}
            </select>
          </div>

        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={handleRun}
            disabled={!auditId1 || !auditId2 || loading}
            className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Analyzing Differences...' : 'Run Comparison'}
          </button>
        </div>
      </div>

      {/* Comparison Results */}
      {comparisonData && (
        <div className="space-y-6">

          {/* Score Deltas Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Quality Delta */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Website Quality Delta
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold font-mono text-slate-900">
                    {comparisonData.audit1.quality_score} → {comparisonData.audit2.quality_score}
                  </span>
                </div>
              </div>
              <div className={`flex items-center gap-1 font-mono font-bold text-sm px-2.5 py-1 rounded-xl ${
                comparisonData.scoreDeltas.quality > 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {comparisonData.scoreDeltas.quality > 0 ? (
                  <>
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    <span>+{comparisonData.scoreDeltas.quality}</span>
                  </>
                ) : (
                  <span>{comparisonData.scoreDeltas.quality}</span>
                )}
              </div>
            </div>

            {/* SEO Delta */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Technical SEO Delta
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold font-mono text-slate-900">
                    {comparisonData.audit1.seo_score} → {comparisonData.audit2.seo_score}
                  </span>
                </div>
              </div>
              <div className={`flex items-center gap-1 font-mono font-bold text-sm px-2.5 py-1 rounded-xl ${
                comparisonData.scoreDeltas.seo > 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {comparisonData.scoreDeltas.seo > 0 ? (
                  <>
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    <span>+{comparisonData.scoreDeltas.seo}</span>
                  </>
                ) : (
                  <span>{comparisonData.scoreDeltas.seo}</span>
                )}
              </div>
            </div>

            {/* Performance Delta */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Mobile Speed Delta
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold font-mono text-slate-900">
                    {comparisonData.audit1.performance_score} → {comparisonData.audit2.performance_score}
                  </span>
                </div>
              </div>
              <div className={`flex items-center gap-1 font-mono font-bold text-sm px-2.5 py-1 rounded-xl ${
                comparisonData.scoreDeltas.performance > 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {comparisonData.scoreDeltas.performance > 0 ? (
                  <>
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    <span>+{comparisonData.scoreDeltas.performance}</span>
                  </>
                ) : (
                  <span>{comparisonData.scoreDeltas.performance}</span>
                )}
              </div>
            </div>

          </div>

          {/* Issue Resolution Diff Tabs */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            
            {/* Filter Tabs */}
            <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterType('resolved')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    filterType === 'resolved'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Resolved Issues ({comparisonData.resolvedIssues.length})</span>
                </button>

                <button
                  onClick={() => setFilterType('persistent')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    filterType === 'persistent'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Persistent Issues ({comparisonData.persistentIssues.length})</span>
                </button>

                <button
                  onClick={() => setFilterType('new')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    filterType === 'new'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <span>New Regressions ({comparisonData.newIssues.length})</span>
                </button>
              </div>

              <span className="text-xs text-slate-400 font-medium">
                Comparing {comparisonData.audit1.id} vs {comparisonData.audit2.id}
              </span>
            </div>

            {/* List of issues */}
            <div className="divide-y divide-slate-100">
              {filterType === 'resolved' && (
                comparisonData.resolvedIssues.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No resolved issues identified between these runs.</p>
                ) : (
                  comparisonData.resolvedIssues.map(issue => (
                    <div key={issue.id} className="py-4 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Fixed &amp; Verified
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {issue.title}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {issue.description}
                        </p>
                      </div>
                      <span className="text-xs text-emerald-600 font-bold shrink-0">
                        Resolved in Run #2
                      </span>
                    </div>
                  ))
                )
              )}

              {filterType === 'persistent' && (
                comparisonData.persistentIssues.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">All previous issues have been resolved!</p>
                ) : (
                  comparisonData.persistentIssues.map(issue => (
                    <div key={issue.id} className="py-4 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Still Open
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {issue.title}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {issue.description}
                        </p>
                      </div>
                      <span className="text-xs text-amber-700 font-semibold shrink-0">
                        Pending Fix
                      </span>
                    </div>
                  ))
                )
              )}

              {filterType === 'new' && (
                comparisonData.newIssues.length === 0 ? (
                  <p className="text-xs text-emerald-600 py-6 text-center font-medium">Zero new regressions introduced! High-quality code rollout.</p>
                ) : (
                  comparisonData.newIssues.map(issue => (
                    <div key={issue.id} className="py-4 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            Regression
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {issue.title}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {issue.description}
                        </p>
                      </div>
                      <span className="text-xs text-rose-600 font-bold shrink-0">
                        Introduced in Run #2
                      </span>
                    </div>
                  ))
                )
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
