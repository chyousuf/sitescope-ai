import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Zap, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Layers, 
  ExternalLink 
} from 'lucide-react';

function ScoreCard({ title, score, category, subtitle, issuesCount, colorClass, ringColor }) {
  const getScoreColor = (val) => {
    if (val >= 90) return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', stroke: '#10b981' };
    if (val >= 65) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', stroke: '#f59e0b' };
    return { text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', stroke: '#f43f5e' };
  };

  const style = getScoreColor(score);
  const circumference = 2 * Math.PI * 38;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
            {title}
          </span>
          <span className="text-xs text-slate-400 font-medium">{subtitle}</span>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text} border ${style.border}`}>
          {score >= 90 ? 'Healthy' : score >= 65 ? 'Needs Work' : 'Poor'}
        </span>
      </div>

      <div className="flex items-center gap-4 my-4">
        {/* SVG Circular Score Ring */}
        <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
          <svg className="w-20 h-20 -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="38"
              stroke="#f1f5f9"
              strokeWidth="9"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="38"
              stroke={style.stroke}
              strokeWidth="9"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <span className={`absolute font-extrabold text-2xl font-mono tracking-tight ${style.text}`}>
            {score}
          </span>
        </div>

        <div className="text-xs text-slate-600 space-y-1">
          <div className="font-semibold text-slate-800">{issuesCount} Identified Issues</div>
          <p className="text-slate-500 leading-tight">
            {category === 'quality' && 'Broken links, mobile overflow & accessibility'}
            {category === 'seo' && 'Titles, headings, canonicals & robots directives'}
            {category === 'speed' && 'Mobile Core Web Vitals & Lighthouse lab engine'}
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>Scale: 0–100</span>
        <span>Target: 90+</span>
      </div>
    </div>
  );
}

export default function AuditOverview({ audit, onSelectTab }) {
  const [showMethodology, setShowMethodology] = useState(false);

  if (!audit) return null;

  const findings = audit.findings || [];
  const qualityIssues = findings.filter(f => f.category === 'quality');
  const seoIssues = findings.filter(f => f.category === 'seo');
  const speedIssues = findings.filter(f => f.category === 'speed');

  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  const highCount = findings.filter(f => f.severity === 'high').length;
  const mediumCount = findings.filter(f => f.severity === 'medium').length;
  const lowCount = findings.filter(f => f.severity === 'low').length;

  return (
    <div className="space-y-6">

      {/* Top Banner / Audit Metadata */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Audit for {audit.domain}
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {audit.audit_type === 'single' ? 'Single Page Inspection' : `Limited Site Crawl (${audit.pages_scanned} pages)`}
            </span>
            <span className="text-xs font-mono text-slate-400">
              ID: {audit.id}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Audited: {new Date(audit.created_at).toLocaleString()}
            </span>
            <a 
              href={audit.url} 
              target="_blank" 
              rel="noreferrer" 
              className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
            >
              <span>{audit.url}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Quick Issue Stats Badges */}
        <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>{criticalCount} Critical</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{highCount} High</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
            <span>{mediumCount + lowCount} Minor</span>
          </div>
        </div>
      </div>

      {/* 3 Main Scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <ScoreCard
          title="Website Quality"
          subtitle="Layout, Links & A11y"
          score={audit.quality_score ?? 0}
          category="quality"
          issuesCount={qualityIssues.length}
        />
        <ScoreCard
          title="Technical SEO"
          subtitle="Indexability & Metadata"
          score={audit.seo_score ?? 0}
          category="seo"
          issuesCount={seoIssues.length}
        />
        <ScoreCard
          title="Page Speed (Mobile)"
          subtitle="Lighthouse Lab Engine"
          score={audit.performance_score ?? 0}
          category="speed"
          issuesCount={speedIssues.length}
        />
      </div>

      {/* Transparent Scoring Methodology Toggle */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden text-xs">
        <button
          onClick={() => setShowMethodology(!showMethodology)}
          className="w-full px-4 py-3 flex items-center justify-between text-left font-semibold text-slate-700 hover:bg-slate-100/70 transition cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>Scoring Methodology & Calculation Disclosure (How scores are calculated)</span>
          </div>
          {showMethodology ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showMethodology && (
          <div className="px-5 py-4 bg-white border-t border-slate-200 space-y-3 text-slate-600 leading-relaxed">
            <p>
              SiteScope AI believes in 100% transparent metrics without opaque or arbitrary proprietary formulas. We clearly separate custom algorithmic quality deductions from official Google Lighthouse performance scores:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">Quality Score (0–100)</span>
                <p className="text-[11px] text-slate-500">
                  Starts at 100. Deductions based on objective UX/layout failures: Critical (-25 e.g. horizontal mobile overflow, 404 dead link), High (-12 e.g. unlabelled form fields), Medium (-6 e.g. console errors).
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">Technical SEO Score (0–100)</span>
                <p className="text-[11px] text-slate-500">
                  Starts at 100. Deductions based on crawlability and structural signals: Critical (-30 e.g. accidental noindex on live page), High (-15 e.g. missing H1, cross-domain canonical mismatch), Medium (-8 e.g. missing meta desc).
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">Speed Score (0–100)</span>
                <p className="text-[11px] text-slate-500">
                  Directly computed via Google PageSpeed Insights Lighthouse performance lab audit on mobile simulation (FCP, LCP, CLS, Speed Index, TBT) using official Google weights.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
