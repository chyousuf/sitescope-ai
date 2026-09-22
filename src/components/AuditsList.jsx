import React from 'react';
import { 
  Globe, 
  Clock, 
  Trash2, 
  ArrowRight, 
  GitCompare, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink,
  Plus
} from 'lucide-react';

export default function AuditsList({ 
  audits = [], 
  onSelectAudit, 
  onDeleteAudit, 
  onNewAudit, 
  onCompareWith,
  onQuickDemoAudit
}) {
  return (
    <div className="space-y-6">

      {/* Hero Welcome / Quick Launch Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Website Quality, SEO &amp; Speed Inspector</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Trustworthy, actionable website audits powered by real headless measurements.
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Inspect layout overflow on mobile viewports, broken internal links, WCAG form accessibility, technical SEO hierarchy, and Google PageSpeed Core Web Vitals.
          </p>

          <div className="flex items-center gap-3 pt-2 flex-wrap">
            <button
              onClick={onNewAudit}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-600/30 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Audit New Website</span>
            </button>

            <button
              onClick={onQuickDemoAudit}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs sm:text-sm font-bold border border-white/20 transition cursor-pointer"
            >
              <span>⚡ Audit Built-In Demo Sandbox</span>
            </button>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Audit History Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Audit History &amp; Saved Projects</h2>
            <p className="text-xs text-slate-500">Revisit past inspection runs, compare improvements, or export client reports</p>
          </div>
          <span className="text-xs font-semibold font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            {audits.length} Audits Saved
          </span>
        </div>

        {audits.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Globe className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-sm">No Audits Saved Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Start your first inspection by entering a website URL or launching the built-in demo site.
            </p>
            <button
              onClick={onNewAudit}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-500 shadow-xs cursor-pointer"
            >
              Launch First Audit
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {audits.map((audit) => {
              const isCompleted = audit.status === 'completed';
              const isRunning = audit.status === 'running';

              return (
                <div 
                  key={audit.id} 
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition"
                >
                  {/* Left: Domain & Meta */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-900 text-base">
                        {audit.domain}
                      </span>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isRunning
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {audit.status}
                      </span>

                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {audit.audit_type === 'single' ? 'Single Page' : `Crawl (${audit.pages_scanned} pgs)`}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(audit.created_at).toLocaleString()}
                      </span>
                      <span className="text-slate-400 truncate max-w-xs">{audit.url}</span>
                    </div>
                  </div>

                  {/* Center: Score Badges */}
                  {isCompleted && (
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-center px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 min-w-[70px]">
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">Quality</span>
                        <span className={`font-mono font-extrabold text-sm ${
                          audit.quality_score >= 85 ? 'text-emerald-600' : audit.quality_score >= 60 ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {audit.quality_score}
                        </span>
                      </div>

                      <div className="text-center px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 min-w-[70px]">
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">SEO</span>
                        <span className={`font-mono font-extrabold text-sm ${
                          audit.seo_score >= 85 ? 'text-emerald-600' : audit.seo_score >= 60 ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {audit.seo_score}
                        </span>
                      </div>

                      <div className="text-center px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 min-w-[70px]">
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">Speed</span>
                        <span className={`font-mono font-extrabold text-sm ${
                          audit.performance_score >= 85 ? 'text-emerald-600' : audit.performance_score >= 60 ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {audit.performance_score}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      onClick={() => onSelectAudit(audit.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onCompareWith(audit.id)}
                      title="Compare with another audit"
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      <GitCompare className="w-4 h-4 text-emerald-600" />
                    </button>

                    <button
                      onClick={() => onDeleteAudit(audit.id)}
                      title="Delete audit"
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
