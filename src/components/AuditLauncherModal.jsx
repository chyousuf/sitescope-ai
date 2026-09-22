import React, { useState } from 'react';
import { 
  Globe, 
  X, 
  Play, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  Smartphone, 
  Monitor, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export default function AuditLauncherModal({ isOpen, onClose, onStartAudit, isStarting }) {
  const [url, setUrl] = useState('');
  const [auditType, setAuditType] = useState('single');
  const [maxPages, setMaxPages] = useState(5);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    let trimmed = url.trim();
    if (!trimmed) {
      setError('Please enter a website URL');
      return;
    }

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      trimmed = 'https://' + trimmed;
    }

    try {
      new URL(trimmed);
    } catch {
      setError('Invalid URL format. Please enter a valid address (e.g. https://example.com)');
      return;
    }

    onStartAudit({ url: trimmed, auditType, maxPages: parseInt(maxPages, 10) });
  };

  const handleSelectDemo = (version) => {
    const demoUrl = version === 'v1' 
      ? 'http://localhost:3001/api/demo-site' 
      : 'http://localhost:3001/api/demo-site-fixed';
    
    setUrl(demoUrl);
    setAuditType('single');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-inner">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Start New Website Audit</h3>
              <p className="text-xs text-slate-400">Quality inspection, SEO diagnostics & speed profiling</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Quick Demo Pre-fill Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-900 leading-relaxed">
              <span className="font-semibold block mb-1">Testing or evaluating SiteScope AI?</span>
              Launch an audit on our built-in local sandbox website to see real layout overflow, broken links, SEO flaws, and Core Web Vitals:
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => handleSelectDemo('v1')}
                  className="px-2.5 py-1 bg-white border border-blue-300 rounded-md font-semibold text-blue-700 hover:bg-blue-100 transition shadow-xs cursor-pointer"
                >
                  ⚡ Seeded Demo (V1 - With Flaws)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectDemo('v2')}
                  className="px-2.5 py-1 bg-white border border-blue-300 rounded-md font-semibold text-emerald-700 hover:bg-emerald-50 transition shadow-xs cursor-pointer"
                >
                  ✨ Optimized Demo (V2 - Post-Fix)
                </button>
              </div>
            </div>
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Target Website URL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Globe className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>
            {error && (
              <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
          </div>

          {/* Audit Scope Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Inspection Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label 
                className={`flex flex-col p-3 rounded-xl border text-left cursor-pointer transition ${
                  auditType === 'single'
                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-slate-900">Single Page Audit</span>
                  <input
                    type="radio"
                    name="auditType"
                    checked={auditType === 'single'}
                    onChange={() => setAuditType('single')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <span className="text-xs text-slate-500">Fast, laser-focused deep dive into the provided URL.</span>
              </label>

              <label 
                className={`flex flex-col p-3 rounded-xl border text-left cursor-pointer transition ${
                  auditType === 'crawl'
                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-slate-900">Limited-Site Crawl</span>
                  <input
                    type="radio"
                    name="auditType"
                    checked={auditType === 'crawl'}
                    onChange={() => setAuditType('crawl')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <span className="text-xs text-slate-500">Discovers and crawls internal links across the domain.</span>
              </label>
            </div>
          </div>

          {/* Crawl depth / page limit (if crawl selected) */}
          {auditType === 'crawl' && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Maximum Pages to Scan</span>
                <span className="text-xs text-slate-500">Constrained to prevent server strain (1 to 10 pages).</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[3, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setMaxPages(num)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      maxPages === num
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {num} Pages
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Safety & Isolation Guarantee */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 flex items-start gap-2.5 text-xs text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Safe, Read-Only Auditing Guarantee:</span>
              SiteScope AI runs strictly passive GET inspections. It never submits forms, never creates test accounts, obeys robots.txt directives, and blocks private network SSRF vectors.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isStarting}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-600/30 transition disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isStarting ? 'Initiating Audit...' : 'Start Inspection'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
