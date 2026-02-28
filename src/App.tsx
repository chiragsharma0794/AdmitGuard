import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, CheckCircle2, ArrowLeft, Download, FileText,
  AlertTriangle, Info, LayoutDashboard, ClipboardList, UserPlus, X,
  Calendar, Phone, Mail, CreditCard, GraduationCap, Trophy,
  MessageSquare, Send, Settings, CheckCheck, WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Candidate, AuditRecord } from './types';
import Logo from './components/Logo';
import CandidateForm from './components/CandidateForm';
import Dashboard from './components/Dashboard';
import AuditLog from './components/AuditLog';
import SettingsModal from './components/SettingsModal';
import { ToastProvider } from './components/Toast';

type Tab = 'form' | 'audit' | 'dashboard';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('form');
  const [submittedCandidate, setSubmittedCandidate] = useState<Candidate | null>(null);
  const [lastSyncedToSheets, setLastSyncedToSheets] = useState(false);
  const [auditData, setAuditData] = useState<AuditRecord[]>([]);
  const [selectedAuditRecord, setSelectedAuditRecord] = useState<AuditRecord | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [rulesVersion, setRulesVersion] = useState(0);

  const loadAuditData = useCallback(() => {
    const saved = localStorage.getItem('admitguard_submissions');
    if (saved) {
      const data = JSON.parse(saved).map((r: any) => ({
        ...r,
        exceptionCount: r.exceptionCount ?? Object.keys(r.overrides || {}).length,
        isFlagged: r.isFlagged ?? (Object.keys(r.overrides || {}).length > 2)
      }));
      setAuditData(data);
    }
  }, []);

  useEffect(() => { loadAuditData(); }, [activeTab, submittedCandidate]);

  const toggleDarkMode = () => {
    setIsDarkMode(v => !v);
    document.documentElement.classList.toggle('dark');
  };

  const handleReset = () => { setSubmittedCandidate(null); setActiveTab('form'); };

  const handleFormSuccess = (candidate: Candidate, syncedToSheets = false) => {
    setSubmittedCandidate(candidate);
    setLastSyncedToSheets(syncedToSheets);
    loadAuditData();
  };

  const handleRulesChanged = () => { setRulesVersion(v => v + 1); };

  return (
    <ToastProvider>
      <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0A0A] text-white' : 'bg-[#F8FAFC] text-slate-900'}`}>
        {/* Header */}
        <header className={`sticky top-0 z-30 px-8 py-4 border-b backdrop-blur-md transition-colors duration-300 ${
          isDarkMode ? 'bg-[#0A0A0A]/80 border-white/10' : 'bg-white/80 border-slate-200'
        }`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo />
              <div className="hidden sm:block">
                <h1 className="font-bold text-lg tracking-tight ag-gradientText ag-shimmerOnHover" tabIndex={0}>AdmitGuard</h1>
                <p className="text-[10px] uppercase tracking-[0.2em] opacity-50 font-semibold">Compliance System</p>
              </div>
            </div>

            <nav className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10">
              {[
                { id: 'form', label: 'Entry', icon: UserPlus },
                { id: 'audit', label: 'Audit', icon: ClipboardList },
                { id: 'dashboard', label: 'Stats', icon: LayoutDashboard },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as Tab); setSubmittedCandidate(null); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <tab.icon size={14} />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className={`p-2 rounded-lg border transition-all ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50'}`}
                title="Settings"
              >
                <Settings size={16} />
              </button>
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg border transition-all ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50'}`}
              >
                {isDarkMode ? '🌙' : '☀️'}
              </button>
            </div>
          </div>
        </header>

        <main className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {submittedCandidate ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-2xl mx-auto pt-12"
              >
                <div className={`p-12 rounded-[40px] border text-center space-y-8 ${
                  isDarkMode ? 'bg-[#111] border-white/10' : 'bg-white border-slate-200 shadow-2xl'
                }`}>
                  <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto shadow-2xl shadow-emerald-500/40">
                    <CheckCircle2 size={48} />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight ag-gradientText ag-shimmerOnHover" tabIndex={0}>Submission Successful</h2>
                    <p className="text-slate-500">Candidate has been added to the audit queue.</p>
                  </div>

                  {/* Sync badge */}
                  <div className="flex justify-center">
                    {lastSyncedToSheets ? (
                      <span className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-bold">
                        <CheckCheck size={13} /> Synced to Google Sheets
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 text-xs font-medium">
                        <WifiOff size={12} /> Saved locally only
                      </span>
                    )}
                  </div>

                  <div className={`p-6 rounded-3xl border text-left space-y-4 ${
                    isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Reference ID</span>
                      <span className="font-mono font-bold text-indigo-500">{submittedCandidate.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Candidate</span>
                      <span className="font-bold">{submittedCandidate.fullName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Exceptions</span>
                      <span className={`font-bold ${Object.keys(submittedCandidate.overrides).length > 2 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {Object.keys(submittedCandidate.overrides).length} Applied
                      </span>
                    </div>
                  </div>

                  {Object.keys(submittedCandidate.overrides).length > 2 && (
                    <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-500 text-left">
                      <AlertTriangle size={20} className="shrink-0" />
                      <p className="text-xs font-bold uppercase tracking-tight">
                        Flagged for Manager Review: High exception count detected.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <button className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-500/30">
                      <Download size={18} /> Download PDF
                    </button>
                    <button
                      onClick={() => setActiveTab('audit')}
                      className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm border ${
                        isDarkMode ? 'border-white/10 text-white hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <FileText size={18} /> View Audit Log
                    </button>
                  </div>

                  <button
                    onClick={handleReset}
                    className="text-sm font-bold text-slate-400 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2 mx-auto"
                  >
                    <ArrowLeft size={16} /> Submit Another Candidate
                  </button>
                </div>
              </motion.div>
            ) : activeTab === 'form' ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                <div className="text-center max-w-2xl mx-auto space-y-4">
                  <h2 className="text-4xl font-bold tracking-tight ag-gradientText ag-shimmerOnHover" tabIndex={0}>Candidate Data Entry</h2>
                  <p className="text-slate-500">
                    AdmitGuard enforces strict IIT/IIM-style compliance rules.
                    Soft rules require a valid rationale for manual override.
                  </p>
                </div>

                <CandidateForm onSuccess={handleFormSuccess} rulesVersion={rulesVersion} />

                <div className={`p-8 rounded-3xl border ${isDarkMode ? 'bg-[#111] border-white/10' : 'bg-white border-slate-200 shadow-sm'} max-w-4xl mx-auto`}>
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Info size={20} className="text-indigo-500" />
                    How to Run & Test
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-slate-500">
                    <div className="space-y-3">
                      <p className="font-bold text-slate-900 dark:text-white">1. Strict Rules (No Override)</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Try entering a name with numbers.</li>
                        <li>Try an invalid Aadhaar (not 12 digits).</li>
                        <li>Set Interview to "Rejected" (blocks submit).</li>
                        <li>Set Offer Letter to "Yes" while Interview is "Pending".</li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <p className="font-bold text-slate-900 dark:text-white">2. Soft Rules (Rationale Required)</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Set Grad Year to 2010 (out of 2015-2025 range).</li>
                        <li>Set Score to 50% (below 60% threshold).</li>
                        <li>Toggle "Apply Exception" and try a short rationale.</li>
                        <li>Rationale must contain: "approved by", "special case", etc.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'audit' ? (
              <motion.div key="audit" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight ag-gradientText ag-shimmerOnHover" tabIndex={0}>Audit Log</h2>
                    <p className="text-slate-500 mt-1">Review all candidate submissions and compliance flags.</p>
                  </div>
                </div>
                <AuditLog data={auditData} onViewDetails={setSelectedAuditRecord} />
              </motion.div>
            ) : (
              <motion.div key="dashboard" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight ag-gradientText ag-shimmerOnHover" tabIndex={0}>Dashboard</h2>
                    <p className="text-slate-500 mt-1">System-wide compliance performance metrics.</p>
                  </div>
                </div>
                <Dashboard data={auditData} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Audit Detail Drawer */}
        <AnimatePresence>
          {selectedAuditRecord && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedAuditRecord(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
              <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`fixed right-0 top-0 h-full w-full max-w-xl z-50 shadow-2xl p-8 flex flex-col ${
                  isDarkMode ? 'bg-[#0A0A0A] border-l border-white/10' : 'bg-white border-l border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold">Audit Details</h3>
                  <button onClick={() => setSelectedAuditRecord(null)} className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}>
                    <X size={20} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-8 pr-2">
                  <div className="flex items-center gap-6">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold ${selectedAuditRecord.isFlagged ? 'bg-rose-600' : 'bg-indigo-600'}`}>
                      {selectedAuditRecord.fullName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold">{selectedAuditRecord.fullName}</h4>
                      <p className="text-sm text-slate-500 font-mono">{selectedAuditRecord.id}</p>
                      <div className="flex gap-2 mt-2">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${selectedAuditRecord.isFlagged ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          {selectedAuditRecord.isFlagged ? 'Flagged' : 'Verified'}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-slate-100 dark:bg-white/5 text-slate-500">
                          {selectedAuditRecord.highestQualification}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Email', value: selectedAuditRecord.email, icon: Mail },
                      { label: 'Phone', value: selectedAuditRecord.phone, icon: Phone },
                      { label: 'DOB', value: selectedAuditRecord.dob, icon: Calendar },
                      { label: 'Aadhaar', value: selectedAuditRecord.aadhaar, icon: CreditCard },
                      { label: 'Graduation', value: `${selectedAuditRecord.score}% (${selectedAuditRecord.graduationYear})`, icon: GraduationCap },
                      { label: 'Screening', value: selectedAuditRecord.screeningScore, icon: Trophy },
                      { label: 'Interview', value: selectedAuditRecord.interviewStatus, icon: MessageSquare },
                      { label: 'Offer Letter', value: selectedAuditRecord.offerLetterSent, icon: Send },
                    ].map(item => (
                      <div key={item.label} className={`p-4 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2"><item.icon size={10} /> {item.label}</p>
                        <p className="text-sm font-bold truncate">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <h5 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Exception Audit</h5>
                    <div className="space-y-3">
                      {selectedAuditRecord.exceptionCount === 0 ? (
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-500">
                          <CheckCircle2 size={18} />
                          <span className="text-sm font-bold">No policy exceptions were applied.</span>
                        </div>
                      ) : (
                        Object.entries(selectedAuditRecord.overrides).map(([ruleId, rationale]) => (
                          <div key={ruleId} className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Rule {ruleId}</span>
                              <AlertTriangle size={14} className="text-amber-500" />
                            </div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 italic">"{rationale}"</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="pt-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                      Submitted on {new Date(selectedAuditRecord.submittedAt || '').toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10">
                  <button onClick={() => setSelectedAuditRecord(null)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-500/30">
                    Close Audit
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Settings Drawer */}
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          isDarkMode={isDarkMode}
          onRulesChanged={handleRulesChanged}
        />

        <footer className="p-12 text-center text-slate-400 text-xs font-medium uppercase tracking-widest">
          AdmitGuard Compliance Engine v2.0 • Secure Browser-Only Mode
        </footer>
      </div>
    </ToastProvider>
  );
}
