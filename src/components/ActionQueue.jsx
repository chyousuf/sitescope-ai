import React, { useState } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Copy, 
  Check, 
  Search, 
  SlidersHorizontal, 
  Sparkles, 
  ExternalLink, 
  Maximize2, 
  X,
  FileCode,
  ShieldAlert,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

export default function ActionQueue({ findings = [], pages = [], onOpenMetaGenerator }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEffort, setSelectedEffort] = useState('all');
  const [expandedId, setExpandedId] = useState(findings[0]?.id || null);
  const [copiedId, setCopiedId] = useState(null);
  const [zoomScreenshot, setZoomScreenshot] = useState(null);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredFindings = findings.filter(f => {
    if (selectedSeverity !== 'all' && f.severity !== selectedSeverity) return false;
    if (selectedCategory !== 'all' && f.category !== selectedCategory) return false;
    if (selectedEffort !== 'all' && !f.effort?.includes(selectedEffort)) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchTitle = f.title?.toLowerCase().includes(q);
      const matchDesc = f.description?.toLowerCase().includes(q);
      const matchEvidence = f.evidence?.toLowerCase().includes(q);
      const matchUrl = f.page_url?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchEvidence && !matchUrl) return false;
    }
    return true;
  });

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'critical':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">Critical Priority</span>;
      case 'high':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">High Priority</span>;
      case 'medium':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">Medium</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">Low / Polish</span>;
    }
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'quality':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">Quality & UX</span>;
      case 'seo':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Technical SEO</span>;
      case 'speed':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Page Speed</span>;
      default:
        return null;
    }
  };

  // Find page screenshot associated with finding
  const getFindingScreenshot = (pageUrl) => {
    const page = pages.find(p => p.url === pageUrl);
    return page?.mobile_screenshot || page?.desktop_screenshot || null;
  };

  return (
    <div className="space-y-5">
      
      {/* Search and Filters Header */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search findings by issue, selector, code, or URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="quality">Quality & Layout</option>
              <option value="seo">Technical SEO</option>
              <option value="speed">Page Speed</option>
            </select>

            {/* Severity Filter */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical Only</option>
              <option value="high">High Only</option>
              <option value="medium">Medium Only</option>
              <option value="low">Low Only</option>
            </select>

            {/* Effort Filter */}
            <select
              value={selectedEffort}
              onChange={(e) => setSelectedEffort(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Effort Levels</option>
              <option value="Quick Fix">Quick Fix (&lt;15m)</option>
              <option value="Moderate">Moderate (1–2h)</option>
              <option value="Complex">Complex (4h+)</option>
            </select>
          </div>

        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>Showing {filteredFindings.length} of {findings.length} prioritized recommendations</span>
          <span className="text-[11px] text-slate-400">Sorted by Severity &amp; Affected Reach</span>
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-3">
        {filteredFindings.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="font-bold text-slate-800 text-sm">No Matching Issues Found</h4>
            <p className="text-xs text-slate-400 mt-1">Try clearing your search query or selecting a different filter.</p>
          </div>
        ) : (
          filteredFindings.map((finding) => {
            const isExpanded = expandedId === finding.id;
            const screenshotUrl = getFindingScreenshot(finding.page_url);

            return (
              <div 
                key={finding.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isExpanded ? 'border-blue-500 shadow-md ring-1 ring-blue-500/20' : 'border-slate-200 shadow-xs hover:border-slate-300'
                }`}
              >
                {/* Card Summary Header */}
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : finding.id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer bg-white hover:bg-slate-50/50 transition select-none"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getSeverityBadge(finding.severity)}
                      {getCategoryBadge(finding.category)}
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Est. {finding.effort || '<15m'}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base leading-snug">
                      {finding.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-1">
                      {finding.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span className="text-xs text-blue-600 font-semibold hidden sm:inline">
                      {isExpanded ? 'Hide Details' : 'Inspect Fix & Evidence'}
                    </span>
                    <div className="p-1 rounded-lg bg-slate-100 text-slate-500">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/40 p-5 sm:p-6 space-y-5 animate-in fade-in duration-150">
                    
                    {/* 1. Why it Matters (Business Impact) */}
                    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900 mb-1">
                        <ShieldAlert className="w-4 h-4 text-amber-600" />
                        <span>Why This Matters to Your Business &amp; Clients:</span>
                      </div>
                      <p className="text-xs sm:text-sm text-amber-900 leading-relaxed font-medium">
                        {finding.why_it_matters}
                      </p>
                    </div>

                    {/* 2. Technical Evidence & Screenshots */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <FileCode className="w-4 h-4 text-slate-500" />
                          Observed Evidence &amp; Affected Page
                        </span>
                        <a 
                          href={finding.page_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                        >
                          <span className="max-w-[200px] truncate">{finding.page_url}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {/* Evidence Text / Code Block */}
                      <div className="bg-slate-950 text-slate-200 rounded-lg p-3 font-mono text-xs overflow-x-auto border border-slate-800">
                        {finding.evidence || 'No specific snippet recorded.'}
                      </div>

                      {/* Screenshot Thumbnail Preview if available */}
                      {screenshotUrl && (
                        <div className="pt-2">
                          <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                            Captured Viewport Evidence (Click to enlarge):
                          </span>
                          <div 
                            onClick={() => setZoomScreenshot(screenshotUrl)}
                            className="relative group cursor-pointer w-48 h-32 rounded-lg overflow-hidden border border-slate-300 shadow-xs hover:border-blue-500 transition"
                          >
                            <img 
                              src={screenshotUrl} 
                              alt="Audit screenshot" 
                              className="w-full h-full object-cover object-top"
                            />
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                              <Maximize2 className="w-5 h-5" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 3. Suggested Fix & Code Snippet */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Recommended Action &amp; Implementation Fix
                        </span>
                        {finding.suggested_fix && (
                          <button
                            onClick={() => handleCopy(finding.suggested_fix, finding.id)}
                            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer"
                          >
                            {copiedId === finding.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Fix</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-xs sm:text-sm text-slate-800 font-mono whitespace-pre-wrap leading-relaxed">
                        {finding.suggested_fix}
                      </div>

                      {/* AI Meta Tag Generator shortcut for Title/Meta issues */}
                      {(finding.dedupe_key === 'missing-page-title' || finding.dedupe_key === 'missing-meta-description') && (
                        <div className="pt-2 flex items-center justify-between">
                          <span className="text-xs text-slate-500">Need optimized title or description copy?</span>
                          <button
                            onClick={() => onOpenMetaGenerator && onOpenMetaGenerator(finding.page_url)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition shadow-xs cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Generate Grounded SEO Copy</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 4. Verification Steps */}
                    {finding.verification_steps && (
                      <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3.5 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        <div className="text-xs text-slate-700 leading-relaxed">
                          <span className="font-bold text-slate-900 block mb-0.5">How to Verify Remediations:</span>
                          {finding.verification_steps}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Screenshot Zoom Modal */}
      {zoomScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col">
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-xs font-bold">Screenshot Evidence Inspector</span>
              <button 
                onClick={() => setZoomScreenshot(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 overflow-auto max-h-[80vh] bg-slate-100 flex items-center justify-center">
              <img src={zoomScreenshot} alt="Zoomed screenshot" className="max-w-full h-auto rounded shadow" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
