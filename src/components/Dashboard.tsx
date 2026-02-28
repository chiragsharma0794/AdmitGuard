import React, { useMemo } from 'react';
import { Users, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { AuditRecord } from '../types';

interface Props {
  data: AuditRecord[];
}

export default function Dashboard({ data }: Props) {
  const stats = useMemo(() => {
    const total = data.length;
    const flagged = data.filter(r => r.isFlagged).length;
    const withExceptions = data.filter(r => r.exceptionCount > 0).length;
    const exceptionRate = total > 0 ? ((withExceptions / total) * 100).toFixed(1) : '0';
    
    return { total, flagged, withExceptions, exceptionRate };
  }, [data]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Submissions */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
            <Users size={24} />
          </div>
          <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">+100%</span>
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold tracking-tight">{stats.total}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">Total Submissions</p>
        </div>
      </div>

      {/* Exception Rate */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
            <TrendingUp size={24} />
          </div>
          <span className="text-xs font-bold text-slate-400">Avg. 1.2/rec</span>
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold tracking-tight">{stats.exceptionRate}%</p>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">Exception Rate</p>
        </div>
      </div>

      {/* Flagged Entries */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500">
            <AlertTriangle size={24} />
          </div>
          <span className="text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-1 rounded-full">Critical</span>
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold tracking-tight">{stats.flagged}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">Flagged Entries</p>
        </div>
      </div>

      {/* Verified Clean */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 size={24} />
          </div>
          <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">Secure</span>
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold tracking-tight">{stats.total - stats.withExceptions}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">Verified Clean</p>
        </div>
      </div>
    </div>
  );
}
