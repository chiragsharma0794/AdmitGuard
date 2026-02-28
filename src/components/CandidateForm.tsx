import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, Mail, Phone, Calendar, GraduationCap, Trophy, MessageSquare, 
  CreditCard, Send, AlertCircle, CheckCircle2, Info, ChevronRight, 
  AlertTriangle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Candidate, RuleCategory, AuditRecord } from '../types';
import { validateCandidate } from '../utils/validationEngine';
import { getEffectiveRules } from '../utils/rulesStore';
import { loadSettings, syncToSheets } from '../utils/settingsStore';
import { useToast } from './Toast';

interface Props {
  onSuccess: (candidate: Candidate, syncedToSheets?: boolean) => void;
  rulesVersion?: number;
}

const INITIAL_CANDIDATE: Candidate = {
  id: '', fullName: '', email: '', phone: '', dob: '',
  highestQualification: 'B.Tech', graduationYear: 2024, score: 0,
  screeningScore: 0, interviewStatus: 'Pending', aadhaar: '',
  offerLetterSent: 'No', overrides: {}
};

export default function CandidateForm({ onSuccess, rulesVersion = 0 }: Props) {
  const { showToast } = useToast();
  const [candidate, setCandidate] = useState<Candidate>(INITIAL_CANDIDATE);
  const [existingEmails, setExistingEmails] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [effectiveRules, setEffectiveRules] = useState(() => getEffectiveRules());

  useEffect(() => { setEffectiveRules(getEffectiveRules()); }, [rulesVersion]);

  useEffect(() => {
    const saved = localStorage.getItem('admitguard_submissions');
    if (saved) setExistingEmails(JSON.parse(saved).map((s: any) => s.email));
  }, []);

  const validation = useMemo(
    () => validateCandidate(candidate, existingEmails, effectiveRules),
    [candidate, existingEmails, effectiveRules]
  );

  const handleChange = (field: keyof Candidate, value: any) =>
    setCandidate(prev => ({ ...prev, [field]: value }));

  const handleOverrideToggle = (ruleId: string) => {
    setCandidate(prev => {
      const newOverrides = { ...prev.overrides };
      if (newOverrides[ruleId] !== undefined) delete newOverrides[ruleId];
      else newOverrides[ruleId] = '';
      return { ...prev, overrides: newOverrides };
    });
  };

  const handleRationaleChange = (ruleId: string, value: string) =>
    setCandidate(prev => ({ ...prev, overrides: { ...prev.overrides, [ruleId]: value } }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation.isValid) return;
    setIsSubmitting(true);

    await new Promise(res => setTimeout(res, 600));

    const submission: AuditRecord = {
      ...candidate,
      id: `ADM-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      submittedAt: new Date().toISOString(),
      exceptionCount: validation.exceptionCount,
      isFlagged: validation.exceptionCount > 2
    };

    // Always save to localStorage first
    const saved = localStorage.getItem('admitguard_submissions');
    const submissions = saved ? JSON.parse(saved) : [];
    submissions.push(submission);
    localStorage.setItem('admitguard_submissions', JSON.stringify(submissions));

    // Optionally sync to Google Sheets
    let syncedToSheets = false;
    const settings = loadSettings();
    if (settings.dataSync.mode === 'sheets' && settings.dataSync.appsScriptUrl) {
      try {
        const result = await syncToSheets(settings.dataSync, {
          action: 'append',
          candidate: submission,
          meta: { source: 'AdmitGuard', version: 'v1', submittedAt: submission.submittedAt },
        });
        if (result.ok) {
          syncedToSheets = true;
        } else {
          showToast('warning', `Saved locally. Sheets sync failed: ${result.error || 'Unknown error'}`);
        }
      } catch {
        showToast('warning', 'Saved locally. Sheets sync failed – check your URL/connection.');
      }
    }

    onSuccess(submission, syncedToSheets);
    setIsSubmitting(false);
  };

  const getFieldError = (field: string) =>
    validation.errors.find(e => e.field === field && !e.isOverridden);

  const inputCls = (field: string) =>
    `w-full px-4 py-3 rounded-xl border transition-all outline-none ${
      getFieldError(field)
        ? 'border-rose-500 bg-rose-50/50'
        : 'border-slate-200 dark:border-white/10 dark:bg-white/5 focus:border-indigo-500'
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto pb-20">
      <div className="bg-white dark:bg-[#111] rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
          <h2 className="text-2xl font-bold tracking-tight ag-gradientText ag-shimmerOnHover" tabIndex={0}>Candidate Information</h2>
          <p className="text-slate-500 text-sm mt-1">Enter details exactly as they appear on official documents.</p>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { field: 'fullName', label: 'Full Name', icon: User, type: 'text', placeholder: 'e.g. John Doe' },
            { field: 'email', label: 'Email Address', icon: Mail, type: 'email', placeholder: 'john@example.com' },
            { field: 'phone', label: 'Phone Number', icon: Phone, type: 'text', placeholder: '10-digit mobile' },
            { field: 'aadhaar', label: 'Aadhaar Number', icon: CreditCard, type: 'text', placeholder: '12 digits' },
          ].map(({ field, label, icon: Icon, type, placeholder }) => (
            <div key={field} className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Icon size={14} /> {label}
              </label>
              <input
                type={type}
                value={(candidate as any)[field]}
                onChange={e => handleChange(field as keyof Candidate, e.target.value)}
                className={inputCls(field)}
                placeholder={placeholder}
              />
              {getFieldError(field) && (
                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight">{getFieldError(field)?.message}</p>
              )}
            </div>
          ))}

          {/* DOB */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Calendar size={14} /> Date of Birth
            </label>
            <input type="date" value={candidate.dob} onChange={e => handleChange('dob', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border transition-all outline-none border-slate-200 dark:border-white/10 dark:bg-white/5 focus:border-indigo-500" />
          </div>

          {/* Qualification */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <GraduationCap size={14} /> Highest Qualification
            </label>
            <select value={candidate.highestQualification} onChange={e => handleChange('highestQualification', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 dark:bg-white/5 focus:border-indigo-500 outline-none">
              {["B.Tech","B.E.","B.Sc","BCA","M.Tech","M.Sc","MCA","MBA"].map(q => <option key={q}>{q}</option>)}
            </select>
          </div>

          {/* Graduation Year */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Calendar size={14} /> Graduation Year
            </label>
            <input type="number" value={candidate.graduationYear} onChange={e => handleChange('graduationYear', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 dark:bg-white/5 focus:border-indigo-500 outline-none" />
          </div>

          {/* Score */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Trophy size={14} /> Percentage / CGPA
            </label>
            <input type="number" step="0.01" value={candidate.score} onChange={e => handleChange('score', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 dark:bg-white/5 focus:border-indigo-500 outline-none" />
          </div>

          {/* Screening Score */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Trophy size={14} /> Screening Score (0-100)
            </label>
            <input type="number" value={candidate.screeningScore} onChange={e => handleChange('screeningScore', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 dark:bg-white/5 focus:border-indigo-500 outline-none" />
          </div>

          {/* Interview Status */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <MessageSquare size={14} /> Interview Status
            </label>
            <select value={candidate.interviewStatus} onChange={e => handleChange('interviewStatus', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 dark:bg-white/5 focus:border-indigo-500 outline-none">
              {["Pending","Cleared","Waitlisted","Rejected"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Offer Letter */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Send size={14} /> Offer Letter Sent
            </label>
            <select value={candidate.offerLetterSent} onChange={e => handleChange('offerLetterSent', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 dark:bg-white/5 focus:border-indigo-500 outline-none">
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
            {getFieldError('offerLetterSent') && (
              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight">{getFieldError('offerLetterSent')?.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Soft Rules / Exceptions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-500" /> Policy Exceptions
          </h3>
          <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            validation.exceptionCount > 2 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'
          }`}>
            {validation.exceptionCount} Exceptions Applied
            {validation.exceptionCount > 2 && " (Manager Review Required)"}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {validation.errors.filter(e => e.category === RuleCategory.SOFT).map(error => (
            <div key={error.ruleId} className={`p-6 rounded-2xl border transition-all ${
              error.isOverridden
                ? 'bg-emerald-50/30 border-emerald-200 dark:bg-emerald-500/5 dark:border-emerald-500/20'
                : 'bg-white border-slate-200 dark:bg-[#111] dark:border-white/10 shadow-sm'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className={`p-3 rounded-xl ${error.isOverridden ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {error.isOverridden ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{error.field} Policy</h4>
                    <p className="text-xs text-slate-500 mt-1">{error.message}</p>
                  </div>
                </div>
                <button type="button" onClick={() => handleOverrideToggle(error.ruleId)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    error.isOverridden ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400'
                  }`}>
                  {error.isOverridden ? 'Applied' : 'Apply Exception'}
                </button>
              </div>
              <AnimatePresence>
                {candidate.overrides[error.ruleId] !== undefined && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5 space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Info size={12} /> Rationale for Exception
                      </label>
                      <textarea
                        value={candidate.overrides[error.ruleId]}
                        onChange={e => handleRationaleChange(error.ruleId, e.target.value)}
                        placeholder="e.g. Approved by Dean. Special case due to..."
                        className={`w-full p-4 rounded-xl text-sm border outline-none transition-all min-h-[100px] ${
                          error.rationaleError ? 'border-rose-500 bg-rose-50/50' : 'border-slate-200 dark:border-white/10 dark:bg-white/5 focus:border-indigo-500'
                        }`}
                      />
                      {error.rationaleError && (
                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight">{error.rationaleError}</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {validation.errors.filter(e => e.category === RuleCategory.SOFT).length === 0 && (
            <div className="p-12 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-3xl flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                <CheckCircle2 size={24} />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white">Policy Compliant</h4>
              <p className="text-sm text-slate-500 mt-1">No soft rule exceptions are required for this candidate.</p>
            </div>
          )}
        </div>
      </div>

      {/* Submit Row */}
      <div className="flex items-center justify-between pt-8">
        <div className="flex items-center gap-4">
          {!validation.isValid && (
            <div className="flex items-center gap-2 text-rose-500 text-xs font-bold uppercase tracking-wider">
              <AlertCircle size={16} />
              Submission Blocked: {validation.errors.filter(e => !e.isOverridden).length} issues
            </div>
          )}
          {validation.isValid && (
            <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 size={16} /> Ready for Submission
            </div>
          )}
        </div>
        <button
          disabled={!validation.isValid || isSubmitting}
          className={`px-8 py-4 rounded-2xl font-bold text-sm flex items-center gap-3 transition-all ${
            validation.isValid && !isSubmitting
              ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 hover:scale-105 active:scale-95'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : <>Submit Candidate <ChevronRight size={18} /></>}
        </button>
      </div>
    </form>
  );
}
