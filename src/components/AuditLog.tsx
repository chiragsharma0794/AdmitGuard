import React, { useState } from 'react';
import { 
  Search, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  FileJson,
  FileSpreadsheet
} from 'lucide-react';
import { AuditRecord } from '../types';
import { exportToCSV, exportToJSON } from '../utils/exportUtils';

interface Props {
  data: AuditRecord[];
  onViewDetails: (record: AuditRecord) => void;
}

export default function AuditLog({ data, onViewDetails }: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = data.filter(r => 
    r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.email.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => new Date(b.submittedAt || '').getTime() - new Date(a.submittedAt || '').getTime());

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search by ID, Name or Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 dark:bg-white/5 outline-none focus:border-indigo-500 transition-all text-sm"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => exportToCSV(data)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-sm font-bold transition-all"
          >
            <FileSpreadsheet size={16} /> Export CSV
          </button>
          <button 
            onClick={() => exportToJSON(data)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-sm font-bold transition-all"
          >
            <FileJson size={16} /> Export JSON
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111] rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] uppercase tracking-widest font-bold text-slate-400">
                <th className="px-6 py-4">ID / Candidate</th>
                <th className="px-6 py-4">Submitted At</th>
                <th className="px-6 py-4">Exceptions</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredData.map((record) => (
                <tr key={record.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer" onClick={() => onViewDetails(record)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        record.isFlagged ? 'bg-rose-500/10 text-rose-500' : 'bg-indigo-500/10 text-indigo-500'
                      }`}>
                        {record.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{record.fullName}</p>
                        <p className="text-[10px] font-mono text-slate-500">{record.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock size={14} />
                      <span className="text-xs font-medium">
                        {record.submittedAt ? new Date(record.submittedAt).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${record.exceptionCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {record.exceptionCount} Flagged
                      </span>
                      {record.isFlagged && (
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 text-[10px] font-bold uppercase tracking-wider">
                          Review Required
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {record.isFlagged ? (
                      <div className="flex items-center gap-1.5 text-rose-500 text-xs font-bold">
                        <AlertTriangle size={14} /> FLAGGED
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold">
                        <CheckCircle2 size={14} /> VERIFIED
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 group-hover:text-indigo-500 transition-colors">
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <p className="text-slate-400 font-medium">No audit records found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
