import React, { useState } from 'react';
import { 
  Monitor, 
  Smartphone, 
  AlertTriangle, 
  CheckCircle2, 
  Link2, 
  FormInput, 
  Terminal, 
  Maximize2,
  X,
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function QualityInspector({ pages = [], findings = [] }) {
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [viewportMode, setViewportMode] = useState('mobile'); // 'mobile' or 'desktop'
  const [zoomImg, setZoomImg] = useState(null);

  const currentPage = pages[selectedPageIndex] || pages[0] || null;

  // Filter quality findings
  const qualityFindings = findings.filter(f => f.category === 'quality');
  const overflowFindings = qualityFindings.filter(f => f.dedupe_key === 'horizontal-mobile-overflow');
  const brokenLinkFindings = qualityFindings.filter(f => f.dedupe_key?.startsWith('broken-link'));
  const formFindings = qualityFindings.filter(f => f.dedupe_key === 'missing-form-labels');
  const consoleFindings = qualityFindings.filter(f => f.dedupe_key === 'console-js-errors');

  return (
    <div className="space-y-6">

      {/* Page Selector if multiple pages */}
      {pages.length > 1 && (
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2">Audited Pages:</span>
          {pages.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setSelectedPageIndex(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedPageIndex === idx
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {new URL(p.url).pathname || '/'}
            </button>
          ))}
        </div>
      )}

      {/* Main Dual-Column Quality Card: Screenshots & Viewport Emulation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Headless Chrome Visual Rendering (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Headless Chrome Visual Inspector</h3>
              <p className="text-xs text-slate-500">Authentic browser render captured during automated audit</p>
            </div>

            {/* Viewport Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewportMode('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewportMode === 'mobile'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile (390px)</span>
              </button>
              <button
                onClick={() => setViewportMode('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewportMode === 'desktop'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop (1280px)</span>
              </button>
            </div>
          </div>

          {/* Screenshot Display Frame */}
          <div className="relative bg-slate-900 rounded-xl p-4 flex items-center justify-center min-h-[380px] overflow-hidden border border-slate-800">
            {currentPage ? (
              viewportMode === 'mobile' ? (
                // Mobile Frame Mockup
                <div className="relative w-[280px] h-[480px] rounded-[36px] border-4 border-slate-700 bg-slate-950 p-2 shadow-2xl flex flex-col">
                  {/* Speaker notch */}
                  <div className="w-20 h-3 bg-slate-800 rounded-full mx-auto mb-2 shrink-0" />
                  <div className="relative flex-1 rounded-[24px] overflow-hidden bg-white">
                    <img
                      src={currentPage.mobile_screenshot || '/screenshots/demo_mobile_v1.png'}
                      alt="Mobile screenshot"
                      className="w-full h-full object-cover object-top cursor-pointer hover:opacity-95 transition"
                      onClick={() => setZoomImg(currentPage.mobile_screenshot)}
                    />
                    <button
                      onClick={() => setZoomImg(currentPage.mobile_screenshot)}
                      className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-slate-900/70 text-white hover:bg-slate-900 transition"
                      title="Enlarge screenshot"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                // Desktop Frame Mockup
                <div className="w-full rounded-lg overflow-hidden border border-slate-700 shadow-xl bg-slate-950 flex flex-col">
                  <div className="bg-slate-800 px-3 py-2 flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-mono text-slate-400 ml-2 truncate">{currentPage.url}</span>
                  </div>
                  <div className="relative max-h-[420px] overflow-y-auto bg-white">
                    <img
                      src={currentPage.desktop_screenshot || '/screenshots/demo_desktop_v1.png'}
                      alt="Desktop screenshot"
                      className="w-full h-auto cursor-pointer"
                      onClick={() => setZoomImg(currentPage.desktop_screenshot)}
                    />
                    <button
                      onClick={() => setZoomImg(currentPage.desktop_screenshot)}
                      className="absolute bottom-3 right-3 p-2 rounded-lg bg-slate-900/80 text-white hover:bg-slate-900 transition shadow"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            ) : (
              <p className="text-xs text-slate-400">No screenshot recorded for this page.</p>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Captured via Headless Chrome Engine</span>
            <span>Click screenshot to open full inspection view</span>
          </div>
        </div>

        {/* Right Col: Quality Checks Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* 1. Horizontal Overflow Status */}
          <div className={`p-5 rounded-2xl border ${
            overflowFindings.length > 0 
              ? 'bg-rose-50 border-rose-200 text-rose-900' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {overflowFindings.length > 0 ? (
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              )}
              <h4 className="font-bold text-sm">
                {overflowFindings.length > 0 ? 'Horizontal Layout Overflow Detected' : 'Mobile Layout Fits Viewport'}
              </h4>
            </div>
            <p className="text-xs leading-relaxed">
              {overflowFindings.length > 0 ? (
                overflowFindings[0].description
              ) : (
                'No elements exceed the standard 390px mobile viewport. Content wraps cleanly without unwanted horizontal scrollbars.'
              )}
            </p>
            {overflowFindings.length > 0 && (
              <div className="mt-3 p-2.5 bg-white/80 rounded-xl border border-rose-200 text-[11px] font-mono">
                <span className="font-bold block text-rose-900 mb-1">Recommended Fix:</span>
                <code>max-width: 100%; box-sizing: border-box; overflow-x: auto;</code>
              </div>
            )}
          </div>

          {/* 2. Form Accessibility Check */}
          <div className={`p-5 rounded-2xl border ${
            formFindings.length > 0 
              ? 'bg-amber-50 border-amber-200 text-amber-900' 
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <FormInput className={`w-5 h-5 ${formFindings.length > 0 ? 'text-amber-600' : 'text-slate-600'}`} />
              <h4 className="font-bold text-sm">
                Form Inputs &amp; Accessibility ({formFindings.length > 0 ? 'Action Needed' : 'Passed'})
              </h4>
            </div>
            <p className="text-xs leading-relaxed">
              {formFindings.length > 0 ? (
                formFindings[0].description
              ) : (
                'All interactive form controls are properly associated with visible labels or aria attributes for screen readers.'
              )}
            </p>
          </div>

          {/* 3. Broken Links Check */}
          <div className={`p-5 rounded-2xl border ${
            brokenLinkFindings.length > 0 
              ? 'bg-rose-50 border-rose-200 text-rose-900' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Link2 className={`w-5 h-5 ${brokenLinkFindings.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`} />
              <h4 className="font-bold text-sm">
                Broken Links ({brokenLinkFindings.length} Detected)
              </h4>
            </div>
            <p className="text-xs leading-relaxed">
              {brokenLinkFindings.length > 0 ? (
                brokenLinkFindings.map(b => b.title).join(', ')
              ) : (
                'All internal navigation links and anchor elements returned valid HTTP status codes.'
              )}
            </p>
          </div>

          {/* 4. Browser Console Errors */}
          <div className={`p-5 rounded-2xl border ${
            consoleFindings.length > 0 
              ? 'bg-amber-50 border-amber-200 text-amber-900' 
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Terminal className={`w-5 h-5 ${consoleFindings.length > 0 ? 'text-amber-600' : 'text-slate-600'}`} />
              <h4 className="font-bold text-sm">
                Browser Console Logs ({consoleFindings.length > 0 ? 'Errors Logged' : 'Clean'})
              </h4>
            </div>
            <p className="text-xs leading-relaxed">
              {consoleFindings.length > 0 ? (
                consoleFindings[0].description
              ) : (
                'Zero JavaScript runtime exceptions or unhandled promise rejections detected during automated page rendering.'
              )}
            </p>
          </div>

        </div>

      </div>

      {/* Zoom Modal */}
      {zoomImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col">
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-xs font-bold">Screenshot Inspector</span>
              <button onClick={() => setZoomImg(null)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 overflow-auto max-h-[80vh] bg-slate-100 flex items-center justify-center">
              <img src={zoomImg} alt="Enlarged screenshot" className="max-w-full h-auto rounded shadow" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
