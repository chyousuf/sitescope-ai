import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import AuditsList from './components/AuditsList';
import AuditOverview from './components/AuditOverview';
import ActionQueue from './components/ActionQueue';
import QualityInspector from './components/QualityInspector';
import TechnicalSEODeepDive from './components/TechnicalSEODeepDive';
import PageSpeedViewer from './components/PageSpeedViewer';
import AuditComparison from './components/AuditComparison';
import ClientReportView from './components/ClientReportView';
import AuditLauncherModal from './components/AuditLauncherModal';
import AuditProgressModal from './components/AuditProgressModal';
import MetaGeneratorModal from './components/MetaGeneratorModal';
import SettingsModal from './components/SettingsModal';

import { 
  Activity, 
  Layers, 
  Sparkles, 
  Smartphone, 
  Search, 
  Zap, 
  FileText, 
  ArrowLeft,
  ChevronRight,
  RefreshCw,
  RotateCcw
} from 'lucide-react';

import { DEFAULT_AUDITS } from './data/defaultAudits';

export default function App() {
  const [currentTab, setCurrentTab] = useState('workspace'); // 'audits', 'workspace', 'compare', 'report'
  const [workspaceSubTab, setWorkspaceSubTab] = useState('overview'); // 'overview', 'queue', 'quality', 'seo', 'speed'
  
  const [allAudits, setAllAudits] = useState(DEFAULT_AUDITS);
  const [selectedAuditId, setSelectedAuditId] = useState(DEFAULT_AUDITS[0].id);
  const [selectedAudit, setSelectedAudit] = useState(DEFAULT_AUDITS[0]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Modals state
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeAuditId, setActiveAuditId] = useState(null);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [metaGenUrl, setMetaGenUrl] = useState(null);

  // Load audit list on mount
  useEffect(() => {
    fetchAudits();
  }, []);

  // Fetch full details of selected audit
  useEffect(() => {
    if (selectedAuditId) {
      loadAuditDetails(selectedAuditId);
    }
  }, [selectedAuditId]);

  const fetchAudits = async () => {
    try {
      const res = await fetch('/api/audits');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setAllAudits(data);
          if (!selectedAuditId) {
            setSelectedAuditId(data[0].id);
          }
        }
      }
    } catch (err) {
      console.warn('Backend API offline or serverless cold start. Using cached audits.');
    }
  };

  const loadAuditDetails = async (id) => {
    const localMatch = DEFAULT_AUDITS.find(a => a.id === id);
    if (localMatch) {
      setSelectedAudit(localMatch);
    }
    setLoadingAudit(true);
    try {
      const res = await fetch(`/api/audits/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedAudit(data);
      }
    } catch (err) {
      console.warn('Using local audit detail:', id);
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleStartAudit = async ({ url, auditType, maxPages }) => {
    setIsLauncherOpen(false);
    try {
      const apiKey = localStorage.getItem('sitescope_pagespeed_api_key') || null;
      const res = await fetch('/api/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, auditType, maxPages, apiKey })
      });

      if (res.ok) {
        const newAudit = await res.json();
        setActiveAuditId(newAudit.id);
        setIsProgressOpen(true);
        fetchAudits();
      } else {
        const err = await res.json();
        alert(`Could not start audit: ${err.error || 'Server error'}`);
      }
    } catch (err) {
      alert(`Network error starting audit: ${err.message}`);
    }
  };

  const handleQuickDemoAudit = () => {
    handleStartAudit({
      url: 'http://localhost:3001/api/demo-site',
      auditType: 'single',
      maxPages: 1
    });
  };

  const handleAuditComplete = (data) => {
    setIsProgressOpen(false);
    fetchAudits();
    setSelectedAuditId(data.auditId);
    setCurrentTab('workspace');
    setWorkspaceSubTab('overview');
  };

  const handleCancelAudit = async (id) => {
    try {
      await fetch(`/api/audits/${id}/cancel`, { method: 'POST' });
      setIsProgressOpen(false);
      fetchAudits();
    } catch (err) {
      console.error('Cancel audit error:', err);
    }
  };

  const handleDeleteAudit = async (id) => {
    if (!window.confirm('Are you sure you want to delete this saved audit?')) return;
    try {
      const res = await fetch(`/api/audits/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const remaining = allAudits.filter(a => a.id !== id);
        setAllAudits(remaining);
        if (selectedAuditId === id) {
          if (remaining.length > 0) {
            setSelectedAuditId(remaining[0].id);
          } else {
            setSelectedAudit(null);
            setCurrentTab('audits');
          }
        }
      }
    } catch (err) {
      console.error('Delete audit error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Dark Slate Navigation Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenNewAudit={() => setIsLauncherOpen(true)}
        onQuickDemoAudit={handleQuickDemoAudit}
        onOpenSettings={() => setIsSettingsOpen(true)}
        selectedAudit={selectedAudit}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* VIEW 1: ALL AUDITS DASHBOARD */}
        {currentTab === 'audits' && (
          <AuditsList
            audits={allAudits}
            onSelectAudit={(id) => {
              setSelectedAuditId(id);
              setCurrentTab('workspace');
            }}
            onDeleteAudit={handleDeleteAudit}
            onNewAudit={() => setIsLauncherOpen(true)}
            onCompareWith={(id) => {
              setCurrentTab('compare');
            }}
            onQuickDemoAudit={handleQuickDemoAudit}
          />
        )}

        {/* VIEW 2: ACTIVE AUDIT WORKSPACE */}
        {currentTab === 'workspace' && (
          <div className="space-y-6">

            {/* Back link & audit title bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTab('audits')}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition cursor-pointer"
                  title="Back to all audits"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {selectedAudit?.domain || 'Loading Audit...'}
                  </h1>
                  {selectedAudit && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {selectedAudit.pages_scanned} Page(s) Scanned
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Rerun Button for demo testing */}
              {selectedAudit && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleStartAudit({
                        url: selectedAudit.url,
                        auditType: selectedAudit.audit_type,
                        maxPages: selectedAudit.max_pages
                      });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Rerun Audit</span>
                  </button>

                  <button
                    onClick={() => setCurrentTab('report')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Client Report</span>
                  </button>
                </div>
              )}
            </div>

            {/* Workspace Navigation Subtabs */}
            <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1 overflow-x-auto text-xs font-bold">
              <button
                onClick={() => setWorkspaceSubTab('overview')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer ${
                  workspaceSubTab === 'overview'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Executive Scorecard</span>
              </button>

              <button
                onClick={() => setWorkspaceSubTab('queue')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer ${
                  workspaceSubTab === 'queue'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>AI Action Queue ({selectedAudit?.findings?.length || 0})</span>
              </button>

              <button
                onClick={() => setWorkspaceSubTab('quality')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer ${
                  workspaceSubTab === 'quality'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Smartphone className="w-4 h-4 text-purple-400" />
                <span>Website Quality &amp; Layout</span>
              </button>

              <button
                onClick={() => setWorkspaceSubTab('seo')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer ${
                  workspaceSubTab === 'seo'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Search className="w-4 h-4 text-emerald-400" />
                <span>Technical SEO Deep-Dive</span>
              </button>

              <button
                onClick={() => setWorkspaceSubTab('speed')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer ${
                  workspaceSubTab === 'speed'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Page Speed &amp; Core Web Vitals</span>
              </button>
            </div>

            {/* Subtab Views */}
            {loadingAudit ? (
              <div className="py-20 text-center text-slate-400 space-y-2">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                <p className="text-xs font-semibold">Loading audit workspace...</p>
              </div>
            ) : selectedAudit ? (
              <>
                {workspaceSubTab === 'overview' && (
                  <AuditOverview
                    audit={selectedAudit}
                    onSelectTab={setWorkspaceSubTab}
                  />
                )}

                {workspaceSubTab === 'queue' && (
                  <ActionQueue
                    findings={selectedAudit.findings || []}
                    pages={selectedAudit.pages || []}
                    onOpenMetaGenerator={(url) => setMetaGenUrl(url)}
                  />
                )}

                {workspaceSubTab === 'quality' && (
                  <QualityInspector
                    pages={selectedAudit.pages || []}
                    findings={selectedAudit.findings || []}
                  />
                )}

                {workspaceSubTab === 'seo' && (
                  <TechnicalSEODeepDive
                    audit={selectedAudit}
                    pages={selectedAudit.pages || []}
                    onOpenMetaGenerator={(url) => setMetaGenUrl(url)}
                  />
                )}

                {workspaceSubTab === 'speed' && (
                  <PageSpeedViewer
                    performanceReports={selectedAudit.performanceReports || []}
                  />
                )}
              </>
            ) : (
              <div className="py-20 text-center text-slate-500">
                <p>Audit not found or deleted.</p>
              </div>
            )}

          </div>
        )}

        {/* VIEW 3: BEFORE & AFTER COMPARISON */}
        {currentTab === 'compare' && (
          <AuditComparison
            allAudits={allAudits}
            onSelectAudit={(id) => {
              setSelectedAuditId(id);
              setCurrentTab('workspace');
            }}
          />
        )}

        {/* VIEW 4: CLIENT DELIVERABLE / PDF REPORT */}
        {currentTab === 'report' && selectedAudit && (
          <ClientReportView
            audit={selectedAudit}
            onSaveSummary={(newSummary) => {
              setSelectedAudit(prev => ({ ...prev, executive_summary: newSummary }));
            }}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="no-print bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">SiteScope AI</span>
            <span>—</span>
            <span>Website Quality, SEO &amp; Speed Inspector</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Deterministic Auditing</span>
            <span>•</span>
            <span>SSRF Protected</span>
            <span>•</span>
            <span>WCAG 2.1 AA Checks</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuditLauncherModal
        isOpen={isLauncherOpen}
        onClose={() => setIsLauncherOpen(false)}
        onStartAudit={handleStartAudit}
      />

      {isProgressOpen && activeAuditId && (
        <AuditProgressModal
          auditId={activeAuditId}
          onClose={() => setIsProgressOpen(false)}
          onComplete={handleAuditComplete}
          onCancelAudit={handleCancelAudit}
        />
      )}

      {metaGenUrl && (
        <MetaGeneratorModal
          isOpen={!!metaGenUrl}
          pageUrl={metaGenUrl}
          pages={selectedAudit?.pages || []}
          onClose={() => setMetaGenUrl(null)}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

    </div>
  );
}
