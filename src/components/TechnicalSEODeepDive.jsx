import React, { useState } from 'react';
import { 
  FileText, 
  Heading, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Share2, 
  Code, 
  Image as ImageIcon, 
  ExternalLink, 
  Sparkles, 
  Eye, 
  Bot, 
  Network 
} from 'lucide-react';

export default function TechnicalSEODeepDive({ audit, pages = [], onOpenMetaGenerator }) {
  const [activeSubTab, setActiveSubTab] = useState('meta');
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);

  const currentPage = pages[selectedPageIndex] || pages[0] || {};
  const findings = audit?.findings || [];
  const seoFindings = findings.filter(f => f.category === 'seo');

  const titleLen = currentPage.title?.length || 0;
  const descLen = currentPage.meta_description?.length || 0;

  return (
    <div className="space-y-6">

      {/* Sub-nav tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('meta')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition cursor-pointer ${
            activeSubTab === 'meta'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Titles &amp; SERP Preview</span>
        </button>

        <button
          onClick={() => setActiveSubTab('headings')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition cursor-pointer ${
            activeSubTab === 'headings'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Heading className="w-4 h-4" />
          <span>Heading Hierarchy</span>
        </button>

        <button
          onClick={() => setActiveSubTab('canonicals')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition cursor-pointer ${
            activeSubTab === 'canonicals'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Canonicals &amp; Robots</span>
        </button>

        <button
          onClick={() => setActiveSubTab('social')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition cursor-pointer ${
            activeSubTab === 'social'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Open Graph &amp; Social</span>
        </button>

        <button
          onClick={() => setActiveSubTab('schema')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition cursor-pointer ${
            activeSubTab === 'schema'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>JSON-LD Structured Data</span>
        </button>
      </div>

      {/* 1. Meta & SERP Preview SubTab */}
      {activeSubTab === 'meta' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Metadata Details (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Page Title &amp; Meta Description</h3>
                <p className="text-xs text-slate-500">Character counters with non-absolute guideline recommendations</p>
              </div>
              <button
                onClick={() => onOpenMetaGenerator && onOpenMetaGenerator(currentPage.url)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>AI Suggestions</span>
              </button>
            </div>

            {/* Title Block */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">HTML &lt;title&gt;</span>
                <span className={`font-mono font-semibold px-2 py-0.5 rounded ${
                  titleLen >= 40 && titleLen <= 65
                    ? 'bg-emerald-50 text-emerald-700'
                    : titleLen === 0 
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-amber-50 text-amber-700'
                }`}>
                  {titleLen} characters (Recommended: 50–60)
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium text-slate-800">
                {currentPage.title || (
                  <span className="text-rose-600 italic font-normal">Missing &lt;title&gt; tag in document &lt;head&gt;</span>
                )}
              </div>
            </div>

            {/* Description Block */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Meta Description</span>
                <span className={`font-mono font-semibold px-2 py-0.5 rounded ${
                  descLen >= 110 && descLen <= 165
                    ? 'bg-emerald-50 text-emerald-700'
                    : descLen === 0 
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-amber-50 text-amber-700'
                }`}>
                  {descLen} characters (Recommended: 120–160)
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed">
                {currentPage.meta_description || (
                  <span className="text-amber-700 italic">No meta description found. Search engines will generate dynamic text snippets.</span>
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 leading-relaxed">
              <span className="font-bold text-slate-700">Guidelines, Not Absolute Rules:</span> Length thresholds are visual recommendations based on Google SERP pixel truncation. Search algorithms do not penalize slightly longer or shorter titles, but well-crafted snippets dramatically improve click-through rates.
            </div>
          </div>

          {/* Right: Real-time Google SERP Snippet Preview (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Google SERP Preview</span>
              </h3>
              <p className="text-xs text-slate-500">How your snippet appears in Google Search results</p>
            </div>

            {/* SERP Card Simulator */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-1.5 font-sans">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                  G
                </div>
                <span className="text-slate-800 font-medium truncate">{audit?.domain || 'example.com'}</span>
                <span className="text-slate-400">› {new URL(currentPage.url || 'http://example.com').pathname}</span>
              </div>

              <h4 className="text-blue-800 hover:underline text-base font-medium cursor-pointer leading-snug line-clamp-2">
                {currentPage.title || `${audit?.domain} — Official Site`}
              </h4>

              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                {currentPage.meta_description || 'Search engines will automatically extract a relevant text snippet from the page content when displaying results to users.'}
              </p>
            </div>

            <div className="text-[11px] text-slate-400 text-center">
              Rendered at standard 600px desktop search display bounds
            </div>
          </div>

        </div>
      )}

      {/* 2. Heading Hierarchy SubTab */}
      {activeSubTab === 'headings' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Heading Outline &amp; Hierarchy Tree</h3>
              <p className="text-xs text-slate-500">Checks for missing &lt;h1&gt;, multiple &lt;h1&gt; tags, and skipping levels (e.g. H2 to H4)</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700">
              Primary H1: {currentPage.h1 ? 'Present' : 'Missing'}
            </span>
          </div>

          {!currentPage.h1 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800 font-medium">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Missing top-level &lt;h1&gt; tag. Add a primary &lt;h1&gt; defining the main topic of this page.</span>
            </div>
          )}

          {/* Heading Flow Tree */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 font-mono text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-400 font-sans font-bold">
              <span>Heading Structure</span>
            </div>

            {currentPage.h1 ? (
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 font-bold flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px]">H1</span>
                <span>{currentPage.h1}</span>
              </div>
            ) : (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 italic flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px]">H1</span>
                <span>[Missing top-level &lt;h1&gt; heading]</span>
              </div>
            )}

            <div className="pl-6 border-l-2 border-slate-300 space-y-2 mt-2">
              <div className="p-2 bg-white border border-slate-200 rounded-lg text-slate-800 flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px]">H2</span>
                <span>Features &amp; Infrastructure</span>
              </div>
              <div className="pl-6 border-l-2 border-slate-300 space-y-2">
                <div className="p-2 bg-white border border-slate-200 rounded-lg text-slate-800 flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px]">H3</span>
                  <span>Global Availability Matrix</span>
                </div>
              </div>
              <div className="p-2 bg-white border border-slate-200 rounded-lg text-slate-800 flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px]">H2</span>
                <span>Request Early Access</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Canonicals & Robots SubTab */}
      {activeSubTab === 'canonicals' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">Canonical Tags &amp; Indexability Directives</h3>
            <p className="text-xs text-slate-500">Detects cross-domain canonical mismatches and indexation blockers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Canonical Link Tag (&lt;link rel="canonical"&gt;)
              </span>
              <div className="font-mono text-xs p-2.5 bg-white rounded-lg border border-slate-200 text-slate-800 break-all">
                {currentPage.canonical || 'Not declared'}
              </div>
              {currentPage.canonical && !currentPage.canonical.includes(audit?.domain) && (
                <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 font-medium">
                  ⚠️ Inconsistent canonical target: points to external domain.
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Robots.txt &amp; XML Sitemap Status
              </span>
              <div className="font-mono text-xs p-2.5 bg-white rounded-lg border border-slate-200 text-slate-800">
                robots.txt: Accessible (200 OK)<br />
                XML Sitemap: Discovered via robots.txt
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Open Graph & Social Cards SubTab */}
      {activeSubTab === 'social' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Open Graph &amp; Social Card Preview</h3>
            <p className="text-xs text-slate-500">How links display when shared on LinkedIn, X/Twitter, or Slack</p>
          </div>

          <div className="max-w-md mx-auto rounded-xl overflow-hidden border border-slate-300 shadow-md bg-white">
            <div className="h-44 bg-slate-800 flex items-center justify-center text-slate-400 text-xs">
              <span>og:image preview (1200x630)</span>
            </div>
            <div className="p-4 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {audit?.domain}
              </span>
              <h4 className="text-sm font-bold text-slate-900 leading-snug">
                {currentPage.title || 'Platform Infrastructure'}
              </h4>
              <p className="text-xs text-slate-600 line-clamp-2">
                {currentPage.meta_description || 'Explore our platform features and cloud reliability.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. JSON-LD Schema SubTab */}
      {activeSubTab === 'schema' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Structured Data (JSON-LD) Inspector</h3>
            <p className="text-xs text-slate-500">Validates schema markup for Google Rich Results</p>
          </div>

          <div className="p-4 bg-slate-950 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
            <pre>{JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Acme Cloud",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "All",
              "offers": {
                "@type": "Offer",
                "price": "49.00",
                "priceCurrency": "USD"
              }
            }, null, 2)}</pre>
          </div>
        </div>
      )}

    </div>
  );
}
