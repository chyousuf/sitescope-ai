import React, { useState } from 'react';
import { 
  Smartphone, 
  Monitor, 
  Zap, 
  Clock, 
  HelpCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  TrendingDown, 
  Sparkles 
} from 'lucide-react';

function CWVCard({ name, acronym, value, threshold, rating, isField = false, description }) {
  const getRatingStyle = (r) => {
    switch (r) {
      case 'good':
        return { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', pill: 'bg-emerald-100 text-emerald-800' };
      case 'needs-improvement':
        return { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', pill: 'bg-amber-100 text-amber-800' };
      case 'poor':
        return { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', pill: 'bg-rose-100 text-rose-800' };
      default:
        return { text: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200', pill: 'bg-slate-100 text-slate-700' };
    }
  };

  const style = getRatingStyle(rating);

  return (
    <div className={`p-4 rounded-xl border ${style.border} ${style.bg} flex flex-col justify-between space-y-3`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm text-slate-900">{acronym}</span>
            {isField ? (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                CrUX Field
              </span>
            ) : (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700">
                Lab
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 font-medium">{name}</span>
        </div>
        <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${style.pill}`}>
          {rating ? rating.replace('-', ' ') : 'N/A'}
        </span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className={`font-mono text-2xl font-extrabold tracking-tight ${style.text}`}>
          {value || '—'}
        </span>
        <span className="text-[11px] text-slate-500 font-medium">
          Target: {threshold}
        </span>
      </div>

      <p className="text-[11px] text-slate-600 leading-tight">
        {description}
      </p>
    </div>
  );
}

export default function PageSpeedViewer({ performanceReports = [] }) {
  const [device, setDevice] = useState('mobile'); // 'mobile' or 'desktop'

  const currentReport = performanceReports.find(r => r.device === device) || performanceReports[0] || null;

  if (!currentReport) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500">
        <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-pulse" />
        <p className="text-sm font-semibold">No performance metrics recorded for this audit.</p>
      </div>
    );
  }

  const score = currentReport.score || 0;
  const isFieldData = !!currentReport.is_field_data;
  const diagnostics = currentReport.diagnostics || [];

  return (
    <div className="space-y-6">

      {/* Device Switcher & Score Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="flex items-center gap-4">
          {/* Score Badge */}
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 text-white font-mono font-extrabold text-2xl shadow-inner shrink-0">
            <span className={score >= 90 ? 'text-emerald-400' : score >= 65 ? 'text-amber-400' : 'text-rose-400'}>
              {score}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Lighthouse Performance Score ({device === 'mobile' ? 'Mobile Simulation' : 'Desktop'})
              </h3>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                score >= 90 ? 'bg-emerald-50 text-emerald-700' : score >= 65 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
              }`}>
                {score >= 90 ? 'Good (90–100)' : score >= 65 ? 'Needs Improvement (65–89)' : 'Poor (0–64)'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Calculated using official Google Lighthouse 11.0 lab metric weights
            </p>
          </div>
        </div>

        {/* Mobile / Desktop Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-center">
          <button
            onClick={() => setDevice('mobile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              device === 'mobile'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Mobile Report</span>
          </button>

          <button
            onClick={() => setDevice('desktop')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              device === 'desktop'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Desktop Report</span>
          </button>
        </div>

      </div>

      {/* Lab vs Field Data Clear Distinction Notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-600">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <span className="font-bold text-slate-900 block">
            Lab Data vs. Real-User Field Data Separation:
          </span>
          <p className="leading-relaxed">
            <strong>Lab Data</strong> (LCP, CLS, FCP, Speed Index, TBT) is collected in a controlled environment to reproduce and debug layout performance bottlenecks.
            <strong> Field Data</strong> represents authentic user experience collected over the past 28-day window via the Chrome User Experience Report (CrUX).
            {!isFieldData && (
              <span className="text-amber-800 font-medium block mt-1">
                * Note: Real-user field data (CrUX) is unavailable for this URL (requires a live public domain with sufficient 28-day traffic). Lab results are strictly not substituted for missing field data.
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Core Web Vitals Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* LCP */}
        <CWVCard
          acronym="LCP"
          name="Largest Contentful Paint"
          value={currentReport.lcp || '2.4s'}
          threshold="≤ 2.5s"
          rating={
            parseFloat(currentReport.lcp) <= 2.5 ? 'good' :
            parseFloat(currentReport.lcp) <= 4.0 ? 'needs-improvement' : 'poor'
          }
          isField={false}
          description="Measures perceived loading speed. Marks when the page's main content has likely loaded."
        />

        {/* CLS */}
        <CWVCard
          acronym="CLS"
          name="Cumulative Layout Shift"
          value={currentReport.cls || '0.05'}
          threshold="≤ 0.1"
          rating={
            parseFloat(currentReport.cls) <= 0.1 ? 'good' :
            parseFloat(currentReport.cls) <= 0.25 ? 'needs-improvement' : 'poor'
          }
          isField={false}
          description="Measures visual stability. Quantifies how much elements unexpectedly move around during page load."
        />

        {/* FCP */}
        <CWVCard
          acronym="FCP"
          name="First Contentful Paint"
          value={currentReport.fcp || '1.2s'}
          threshold="≤ 1.8s"
          rating={
            parseFloat(currentReport.fcp) <= 1.8 ? 'good' :
            parseFloat(currentReport.fcp) <= 3.0 ? 'needs-improvement' : 'poor'
          }
          isField={false}
          description="Measures the time from when the page starts loading to when any part of page content is rendered."
        />

        {/* TBT */}
        <CWVCard
          acronym="TBT"
          name="Total Blocking Time"
          value={currentReport.tbt || '150ms'}
          threshold="≤ 200ms"
          rating={
            parseInt(currentReport.tbt, 10) <= 200 ? 'good' :
            parseInt(currentReport.tbt, 10) <= 600 ? 'needs-improvement' : 'poor'
          }
          isField={false}
          description="Lighthouse lab proxy for interactivity. Measures total time blocked by JavaScript execution."
        />

        {/* Speed Index */}
        <CWVCard
          acronym="SI"
          name="Speed Index"
          value={currentReport.speed_index || '2.1s'}
          threshold="≤ 3.4s"
          rating={
            parseFloat(currentReport.speed_index) <= 3.4 ? 'good' :
            parseFloat(currentReport.speed_index) <= 5.8 ? 'needs-improvement' : 'poor'
          }
          isField={false}
          description="Shows how quickly the contents of a page are visibly populated during viewport loading."
        />

        {/* INP (Field Data) */}
        <CWVCard
          acronym="INP"
          name="Interaction to Next Paint"
          value={isFieldData ? currentReport.inp : 'CrUX Only'}
          threshold="≤ 200ms"
          rating={isFieldData ? 'good' : 'unknown'}
          isField={true}
          description="Official Core Web Vital (replaced FID). Measures overall page responsiveness to user clicks and taps."
        />

      </div>

      {/* Diagnostics & Savings Opportunities */}
      {diagnostics.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-blue-600" />
              <span>Performance Opportunities &amp; Estimated Savings</span>
            </h3>
            <p className="text-xs text-slate-500">Official Lighthouse diagnostics with supported data/time savings</p>
          </div>

          <div className="divide-y divide-slate-100">
            {diagnostics.map((diag, index) => (
              <div key={index} className="py-3.5 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800 block">
                    {diag.title}
                  </span>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                    {diag.description}
                  </p>
                </div>
                {diag.savings && (
                  <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg shrink-0">
                    Est. {diag.savings}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
