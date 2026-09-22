import React, { useEffect, useState, useRef } from 'react';
import { 
  Activity, 
  Terminal, 
  CheckCircle2, 
  Loader2, 
  AlertTriangle, 
  X, 
  Globe, 
  Smartphone, 
  Cpu, 
  Search, 
  FileCheck 
} from 'lucide-react';

const STAGES = [
  { id: 'discovery', label: 'Robots.txt & Sitemap', icon: Globe },
  { id: 'crawling', label: 'Domain Link Crawl', icon: Search },
  { id: 'browser', label: 'Chrome Layouts & Screenshots', icon: Smartphone },
  { id: 'seo', label: 'Technical SEO & Metadata', icon: FileCheck },
  { id: 'speed', label: 'Core Web Vitals & Speed', icon: Cpu },
  { id: 'ai', label: 'AI Action Plan Synthesis', icon: Activity }
];

export default function AuditProgressModal({ 
  auditId, 
  onClose, 
  onComplete, 
  onCancelAudit 
}) {
  const [currentStage, setCurrentStage] = useState('discovery');
  const [stageIndex, setStageIndex] = useState(0);
  const [logs, setLogs] = useState([]);
  const [pagesScanned, setPagesScanned] = useState(0);
  const [maxPages, setMaxPages] = useState(1);
  const [isCancelled, setIsCancelled] = useState(false);
  const [error, setError] = useState(null);
  const terminalBottomRef = useRef(null);

  useEffect(() => {
    if (!auditId) return;

    // Connect to Server-Sent Events (SSE)
    const eventSource = new EventSource(`/api/audits/${auditId}/stream`);

    eventSource.addEventListener('stage', (e) => {
      try {
        const data = JSON.parse(e.data);
        setCurrentStage(data.stage);
        const idx = STAGES.findIndex(s => s.id === data.stage);
        if (idx !== -1) setStageIndex(idx);
      } catch {}
    });

    eventSource.addEventListener('log', (e) => {
      try {
        const data = JSON.parse(e.data);
        setLogs(prev => [...prev, data]);
      } catch {}
    });

    eventSource.addEventListener('progress', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.pagesScanned) setPagesScanned(data.pagesScanned);
        if (data.maxPages) setMaxPages(data.maxPages);
      } catch {}
    });

    eventSource.addEventListener('complete', (e) => {
      try {
        const data = JSON.parse(e.data);
        eventSource.close();
        if (onComplete) {
          setTimeout(() => onComplete(data), 600);
        }
      } catch {}
    });

    eventSource.addEventListener('cancelled', () => {
      setIsCancelled(true);
      eventSource.close();
    });

    eventSource.addEventListener('error', (e) => {
      try {
        const data = JSON.parse(e.data);
        setError(data.message || 'Audit encountered an unexpected failure');
      } catch {
        // SSE connection drop / reconnect
      }
    });

    return () => {
      eventSource.close();
    };
  }, [auditId]);

  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const progressPercent = Math.min(100, Math.round(((stageIndex + 1) / STAGES.length) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-bold">Audit In Progress</h3>
              <p className="text-xs text-slate-400">Inspecting DOM, mobile layouts, SEO signals & performance</p>
            </div>
          </div>
          <button
            onClick={() => onCancelAudit(auditId)}
            className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-rose-900/60 transition cursor-pointer"
          >
            Cancel Audit
          </button>
        </div>

        {/* Progress Bar & Stage Chips */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-100 bg-slate-50/50">
          
          {/* Progress Percent Bar */}
          <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
            <span className="font-semibold text-slate-800">
              Stage {stageIndex + 1} of {STAGES.length}: {STAGES[stageIndex]?.label}
            </span>
            <span className="font-mono font-bold text-blue-600">{progressPercent}%</span>
          </div>
          
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-4">
            <div 
              className="bg-blue-600 h-full transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Stepper Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {STAGES.map((stage, idx) => {
              const Icon = stage.icon;
              const isPast = idx < stageIndex;
              const isCurrent = idx === stageIndex;

              return (
                <div 
                  key={stage.id} 
                  className={`flex flex-col items-center text-center p-2 rounded-xl transition ${
                    isCurrent 
                      ? 'bg-blue-50 border border-blue-200 text-blue-700' 
                      : isPast
                        ? 'text-emerald-700 bg-emerald-50/40 border border-emerald-100'
                        : 'text-slate-400 border border-transparent'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1 ${
                    isCurrent 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : isPast 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-slate-200 text-slate-400'
                  }`}>
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Icon className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <span className="text-[10px] font-bold leading-tight truncate w-full">{stage.label}</span>
                </div>
              );
            })}
          </div>

        </div>

        {/* Live Terminal Stream */}
        <div className="p-6 flex-1 flex flex-col min-h-0 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Terminal className="w-4 h-4 text-slate-500" />
              <span>Real-Time Inspector Log</span>
            </div>
            {pagesScanned > 0 && (
              <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Pages: {pagesScanned}/{maxPages}
              </span>
            )}
          </div>

          <div className="bg-slate-950 text-slate-200 rounded-xl p-3.5 font-mono text-xs overflow-y-auto flex-1 h-56 space-y-1.5 border border-slate-800 shadow-inner">
            {logs.length === 0 ? (
              <p className="text-slate-500 italic">Initializing headless Chrome browser and checking network permissions...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-slate-500 shrink-0 select-none">[{log.time}]</span>
                  <span className={log.message.includes('error') || log.message.includes('Failed') ? 'text-rose-400' : 'text-slate-300'}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
            <div ref={terminalBottomRef} />
          </div>

          {error && (
            <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isCancelled && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 font-medium">
              <span>Audit was cancelled by user.</span>
              <button
                onClick={onClose}
                className="px-3 py-1 bg-amber-200 text-amber-900 rounded-lg hover:bg-amber-300 font-bold"
              >
                Close
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
