import React, { useState, useEffect, useRef } from 'react';
import { X, Settings, Database, Shield, TestTube2, Upload, Download, RotateCcw, Save, Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Rule, RuleCategory } from '../types';
import { RULE_CONFIG } from '../config/constants';
import { AppSettings, loadSettings, saveSettings, testSheetsConnection } from '../utils/settingsStore';
import {
  loadRuleOverrides,
  saveRuleOverrides,
  resetRuleOverrides,
  getEffectiveRules,
  validateConditionSyntax,
  exportRulesToJson,
  RuleOverride,
} from '../utils/rulesStore';
import { useToast } from './Toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onRulesChanged: () => void;
}

type SettingsTab = 'data' | 'rules';

export default function SettingsModal({ isOpen, onClose, isDarkMode, onRulesChanged }: Props) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('data');
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [overrides, setOverrides] = useState<Record<string, RuleOverride>>(loadRuleOverrides());
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'ok' | 'fail'>('idle');
  const [showSecret, setShowSecret] = useState(false);
  const [conditionErrors, setConditionErrors] = useState<Record<string, string>>({});
  const [editingConditions, setEditingConditions] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveRules = getEffectiveRules(overrides);
  const softRules = RULE_CONFIG.filter(r => r.category === RuleCategory.SOFT);

  useEffect(() => {
    if (isOpen) {
      setSettings(loadSettings());
      setOverrides(loadRuleOverrides());
      setTestStatus('idle');
      // init editing conditions from overrides or defaults
      const conds: Record<string, string> = {};
      softRules.forEach(r => {
        conds[r.id] = overrides[r.id]?.condition ?? r.condition;
      });
      setEditingConditions(conds);
    }
  }, [isOpen]);

  const handleSaveSettings = () => {
    saveSettings(settings);
    showToast('success', 'Settings saved.');
  };

  const handleTestConnection = async () => {
    if (!settings.dataSync.appsScriptUrl) {
      showToast('error', 'Please enter an Apps Script URL first.');
      return;
    }
    setTestStatus('loading');
    try {
      const result = await testSheetsConnection(settings.dataSync);
      setTestStatus(result.ok ? 'ok' : 'fail');
      showToast(result.ok ? 'success' : 'error', result.ok ? 'Connection successful!' : (result.error || 'Connection failed.'));
    } catch {
      setTestStatus('fail');
      showToast('error', 'Connection failed. Check URL and network.');
    }
  };

  const handleRuleOverrideChange = (ruleId: string, field: keyof RuleOverride, value: any) => {
    setOverrides(prev => ({
      ...prev,
      [ruleId]: { ...prev[ruleId], id: ruleId, [field]: value },
    }));
  };

  const handleConditionEdit = (ruleId: string, value: string) => {
    setEditingConditions(prev => ({ ...prev, [ruleId]: value }));
    const err = validateConditionSyntax(value);
    setConditionErrors(prev => ({ ...prev, [ruleId]: err || '' }));
  };

  const handleConditionSave = (ruleId: string) => {
    const cond = editingConditions[ruleId];
    const err = validateConditionSyntax(cond);
    if (err) {
      showToast('error', `Condition error: ${err}`);
      return;
    }
    handleRuleOverrideChange(ruleId, 'condition', cond);
  };

  const handleSaveRules = () => {
    // Check all conditions valid
    for (const ruleId of Object.keys(editingConditions)) {
      const err = validateConditionSyntax(editingConditions[ruleId]);
      if (err) {
        showToast('error', `Rule ${ruleId} has invalid condition: ${err}`);
        return;
      }
    }
    // Apply edited conditions into overrides
    const merged = { ...overrides };
    softRules.forEach(r => {
      merged[r.id] = {
        ...merged[r.id],
        id: r.id,
        condition: editingConditions[r.id] ?? r.condition,
      };
    });
    setOverrides(merged);
    saveRuleOverrides(merged);
    onRulesChanged();
    showToast('success', 'Soft rules saved and applied.');
  };

  const handleResetRules = () => {
    resetRuleOverrides();
    setOverrides({});
    const conds: Record<string, string> = {};
    softRules.forEach(r => { conds[r.id] = r.condition; });
    setEditingConditions(conds);
    setConditionErrors({});
    onRulesChanged();
    showToast('success', 'Soft rules reset to defaults.');
  };

  const handleExportRules = () => {
    exportRulesToJson(effectiveRules);
    showToast('success', 'Rules exported.');
  };

  const handleImportRules = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported: Rule[] = JSON.parse(ev.target?.result as string);
        const newOverrides = { ...overrides };
        let count = 0;
        imported.forEach(rule => {
          const original = RULE_CONFIG.find(r => r.id === rule.id);
          if (!original || original.category !== RuleCategory.SOFT) return;
          newOverrides[rule.id] = {
            id: rule.id,
            condition: rule.condition,
            errorMessage: rule.errorMessage,
            description: rule.description,
          };
          count++;
        });
        setOverrides(newOverrides);
        saveRuleOverrides(newOverrides);
        // update editing conditions
        const conds = { ...editingConditions };
        imported.forEach(r => { if (newOverrides[r.id]) conds[r.id] = r.condition; });
        setEditingConditions(conds);
        onRulesChanged();
        showToast('success', `Imported ${count} soft rule(s).`);
      } catch {
        showToast('error', 'Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const panel = isDarkMode
    ? 'bg-[#111] border-white/10 text-white'
    : 'bg-white border-slate-200 text-slate-900';

  const inputCls = `w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
    isDarkMode
      ? 'bg-white/5 border-white/10 focus:border-indigo-400 text-white placeholder:text-white/30'
      : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-800'
  }`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className={`fixed right-0 top-0 h-full w-full max-w-xl z-50 shadow-2xl border-l flex flex-col ${panel}`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-5 border-b ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-indigo-500" />
                <span className="font-bold text-base">Settings</span>
              </div>
              <button onClick={onClose} className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}>
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className={`flex gap-1 px-6 pt-4 pb-0`}>
              {([
                { id: 'data', label: 'Data Destination', icon: Database },
                { id: 'rules', label: 'Soft Rules', icon: Shield },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white'
                      : isDarkMode
                      ? 'text-slate-400 hover:bg-white/5'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <tab.icon size={13} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              {/* ── DATA TAB ── */}
              {activeTab === 'data' && (
                <div className="space-y-5">
                  <div className={`p-5 rounded-2xl border space-y-4 ${isDarkMode ? 'border-white/10 bg-white/3' : 'border-slate-100 bg-slate-50'}`}>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Destination Mode</p>
                    <div className="space-y-2">
                      {(['local', 'sheets'] as const).map(mode => (
                        <label key={mode} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          settings.dataSync.mode === mode
                            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10'
                            : isDarkMode ? 'border-white/10' : 'border-slate-200'
                        }`}>
                          <input
                            type="radio"
                            name="mode"
                            value={mode}
                            checked={settings.dataSync.mode === mode}
                            onChange={() => setSettings(s => ({ ...s, dataSync: { ...s.dataSync, mode } }))}
                            className="mt-0.5 accent-indigo-600"
                          />
                          <div>
                            <p className="text-sm font-bold">{mode === 'local' ? '🖥 Local Only (default)' : '📊 Google Sheets Sync (recommended)'}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {mode === 'local'
                                ? 'All data stored in browser localStorage only.'
                                : 'After each submission, append a row to Google Sheets via Apps Script.'}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {settings.dataSync.mode === 'sheets' && (
                    <div className={`p-5 rounded-2xl border space-y-4 ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Google Sheets Config</p>
                      <div className="space-y-3">
                        <label className="block space-y-1.5">
                          <span className="text-xs font-semibold text-slate-400">Apps Script Web App URL *</span>
                          <input
                            type="url"
                            value={settings.dataSync.appsScriptUrl}
                            onChange={e => setSettings(s => ({ ...s, dataSync: { ...s.dataSync, appsScriptUrl: e.target.value } }))}
                            placeholder="https://script.google.com/macros/s/.../exec"
                            className={inputCls}
                          />
                        </label>
                        <label className="block space-y-1.5">
                          <span className="text-xs font-semibold text-slate-400">Shared Secret (optional)</span>
                          <div className="relative">
                            <input
                              type={showSecret ? 'text' : 'password'}
                              value={settings.dataSync.sharedSecret}
                              onChange={e => setSettings(s => ({ ...s, dataSync: { ...s.dataSync, sharedSecret: e.target.value } }))}
                              placeholder="Leave blank if not configured"
                              className={`${inputCls} pr-10`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowSecret(v => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            >
                              {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                        </label>
                      </div>

                      <button
                        onClick={handleTestConnection}
                        disabled={testStatus === 'loading'}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                          isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {testStatus === 'loading' ? <Loader2 size={13} className="animate-spin" /> :
                         testStatus === 'ok' ? <CheckCircle2 size={13} className="text-emerald-500" /> :
                         testStatus === 'fail' ? <XCircle size={13} className="text-rose-500" /> :
                         <TestTube2 size={13} />}
                        {testStatus === 'loading' ? 'Testing...' :
                         testStatus === 'ok' ? 'Connected' :
                         testStatus === 'fail' ? 'Failed – Retry' :
                         'Test Connection'}
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleSaveSettings}
                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                  >
                    <Save size={15} /> Save Settings
                  </button>
                </div>
              )}

              {/* ── RULES TAB ── */}
              {activeTab === 'rules' && (
                <div className="space-y-5">
                  <div className={`p-4 rounded-xl border text-xs ${isDarkMode ? 'border-amber-500/20 bg-amber-500/5 text-amber-300' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                    Only <strong>SOFT</strong> rules are editable. Strict and System rules are read-only. Conditions must be valid JavaScript expressions.
                  </div>

                  {softRules.map(rule => {
                    const override = overrides[rule.id];
                    const isDisabled = !!override?.disabled;
                    const currentMsg = override?.errorMessage ?? rule.errorMessage;
                    const condErr = conditionErrors[rule.id];

                    return (
                      <div
                        key={rule.id}
                        className={`p-5 rounded-2xl border space-y-3 transition-all ${
                          isDisabled
                            ? isDarkMode ? 'border-white/5 opacity-50' : 'border-slate-100 opacity-50'
                            : isDarkMode ? 'border-white/10' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-indigo-500">{rule.id}</span>
                            <p className="font-bold text-sm mt-0.5">{rule.label}</p>
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-xs text-slate-400">{isDisabled ? 'Disabled' : 'Enabled'}</span>
                            <button
                              type="button"
                              onClick={() => handleRuleOverrideChange(rule.id, 'disabled', !isDisabled)}
                              className={`w-10 h-5 rounded-full transition-all relative ${
                                !isDisabled ? 'bg-indigo-600' : isDarkMode ? 'bg-white/10' : 'bg-slate-200'
                              }`}
                            >
                              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${!isDisabled ? 'left-5' : 'left-0.5'}`} />
                            </button>
                          </label>
                        </div>

                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold text-slate-400">Condition (JS expression)</p>
                          <textarea
                            rows={2}
                            value={editingConditions[rule.id] ?? rule.condition}
                            onChange={e => handleConditionEdit(rule.id, e.target.value)}
                            onBlur={() => handleConditionSave(rule.id)}
                            spellCheck={false}
                            className={`${inputCls} font-mono text-xs resize-y ${condErr ? 'border-rose-500' : ''}`}
                          />
                          {condErr && <p className="text-[10px] text-rose-500 font-mono">{condErr}</p>}
                        </div>

                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold text-slate-400">Error Message</p>
                          <input
                            type="text"
                            value={currentMsg}
                            onChange={e => handleRuleOverrideChange(rule.id, 'errorMessage', e.target.value)}
                            className={inputCls}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Read-only notice for strict rules */}
                  <div className={`p-4 rounded-xl border text-xs ${isDarkMode ? 'border-white/5 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
                    <Shield size={12} className="inline mr-1.5" />
                    {RULE_CONFIG.filter(r => r.category !== RuleCategory.SOFT).length} strict/system rules are read-only for compliance integrity.
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleSaveRules}
                      className="py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                    >
                      <Save size={13} /> Save Rules
                    </button>
                    <button
                      onClick={handleResetRules}
                      className={`py-2.5 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border transition-all ${
                        isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <RotateCcw size={13} /> Reset Defaults
                    </button>
                    <button
                      onClick={handleExportRules}
                      className={`py-2.5 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border transition-all ${
                        isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Download size={13} /> Export JSON
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`py-2.5 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border transition-all ${
                        isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Upload size={13} /> Import JSON
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImportRules} />
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
