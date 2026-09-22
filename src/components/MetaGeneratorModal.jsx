import React, { useState, useEffect } from 'react';
import { Sparkles, X, Copy, Check, Eye, AlertCircle, RefreshCw } from 'lucide-react';

export default function MetaGeneratorModal({ isOpen, onClose, pageUrl, pages = [] }) {
  const [targetUrl, setTargetUrl] = useState(pageUrl || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    if (pageUrl) {
      setTargetUrl(pageUrl);
      fetchSuggestion(pageUrl);
    }
  }, [pageUrl]);

  const fetchSuggestion = async (url) => {
    const page = pages.find(p => p.url === url) || pages[0] || {};
    setLoading(true);
    try {
      const res = await fetch('/api/ai/suggest-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: page.title || '',
          metaDescription: page.meta_description || '',
          headings: page.h1 ? [{ tag: 'h1', text: page.h1 }] : [],
          sampleText: page.title || ''
        })
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setCustomTitle(data.suggestedTitle);
        setCustomDesc(data.suggestedDescription);
      }
    } catch (err) {
      console.error('Meta suggestion error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">Grounded SEO Copy Generator</h3>
              <p className="text-xs text-slate-400">Grounded strictly in verified on-page headings</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs text-indigo-900 leading-relaxed">
            <span className="font-bold block mb-0.5">Strict Grounding Guarantee:</span>
            Suggestions are derived directly from observed page headings without hallucinating non-existent services, offers, or locations.
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
              <p className="text-xs font-semibold">Synthesizing grounded SEO metadata...</p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Suggested Title */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-700">Suggested Page Title (&lt;title&gt;):</label>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[11px] font-semibold ${
                      customTitle.length >= 50 && customTitle.length <= 60 ? 'text-emerald-600' : 'text-slate-500'
                    }`}>
                      {customTitle.length} chars (Target: 50–60)
                    </span>
                    <button
                      onClick={() => handleCopy(customTitle, 'title')}
                      className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === 'title' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === 'title' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Suggested Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-700">Suggested Meta Description:</label>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[11px] font-semibold ${
                      customDesc.length >= 120 && customDesc.length <= 160 ? 'text-emerald-600' : 'text-slate-500'
                    }`}>
                      {customDesc.length} chars (Target: 120–160)
                    </span>
                    <button
                      onClick={() => handleCopy(customDesc, 'desc')}
                      className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === 'desc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === 'desc' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
                <textarea
                  rows={3}
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Live Preview */}
              <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Simulated SERP Display:
                </span>
                <h4 className="text-blue-700 font-medium text-sm hover:underline cursor-pointer leading-tight line-clamp-1">
                  {customTitle}
                </h4>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {customDesc}
                </p>
              </div>

            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Done
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
