import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

const Settings = ({ organizationId, domain }) => {
  const [thresholds, setThresholds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ warn: '', critical: '' });

  const fetchThresholds = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/thresholds`, {
        params: { organizationId, domain }
      });
      setThresholds(res.data);
    } catch (err) {
      console.error('Failed to fetch thresholds', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId, domain]);

  useEffect(() => {
    fetchThresholds();
  }, [fetchThresholds]);

  const handleEditClick = (metric) => {
    setEditingId(metric.metricId);
    setEditForm({
      warn: metric.threshold?.warn ?? '',
      critical: metric.threshold?.critical ?? ''
    });
  };

  const handleSaveClick = async (metricId) => {
    try {
      await axios.put(`${API_BASE}/thresholds/${metricId}`, {
        warn: editForm.warn === '' ? null : Number(editForm.warn),
        critical: editForm.critical === '' ? null : Number(editForm.critical)
      });
      setEditingId(null);
      fetchThresholds(); // Refresh list
    } catch (err) {
      console.error('Failed to update threshold', err);
      alert('Failed to update threshold');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="page-title">Alert Thresholds</h1>
        <p className="text-slate-400 text-sm">Configure warning and critical limits for metrics in <span className="text-blue-400 capitalize font-medium px-2 py-0.5 bg-blue-500/10 rounded-md border border-blue-500/20">{domain || 'All'}</span> domain.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-8 text-center text-slate-400">Loading thresholds...</div>
        ) : thresholds.length === 0 ? (
          <div className="col-span-full p-8 text-center text-slate-400">No metrics found for this domain. Request data first.</div>
        ) : (
          thresholds.map(metric => (
            <div key={metric.metricId} className="glass-card p-6 shadow-sm relative group overflow-hidden border-slate-700/50">
                {/* Background glow on hover */}
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <h3 className="text-lg font-semibold text-white tracking-tight">{metric.label}</h3>
                  <code className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 bg-slate-800/80 px-2 py-1 rounded mt-1 inline-block border border-slate-700/50">{metric.key}</code>
                </div>
                {!editingId || editingId !== metric.metricId ? (
                  <button 
                    onClick={() => handleEditClick(metric)}
                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors border border-transparent hover:border-blue-500/20"
                    title="Edit Thresholds"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" /></svg>
                  </button>
                ) : null}
              </div>

              {editingId === metric.metricId ? (
                <div className="space-y-4 mt-6 relative z-10">
                  <div>
                    <label className="input-label text-yellow-500 mb-1.5 flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div> Warning ({metric.unit || 'value'})
                    </label>
                    <input 
                      type="number" 
                      value={editForm.warn}
                      onChange={(e) => setEditForm({...editForm, warn: e.target.value})}
                      className="form-input focus:border-yellow-500 focus:ring-yellow-500/20"
                      placeholder="e.g. 70"
                    />
                  </div>
                  <div>
                    <label className="input-label text-red-500 mb-1.5 flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> Critical ({metric.unit || 'value'})
                    </label>
                    <input 
                      type="number" 
                      value={editForm.critical}
                      onChange={(e) => setEditForm({...editForm, critical: e.target.value})}
                      className="form-input focus:border-red-500 focus:ring-red-500/20"
                      placeholder="e.g. 85"
                    />
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-slate-700/50 mt-4">
                    <button 
                      onClick={() => setEditingId(null)}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleSaveClick(metric.metricId)}
                      className="btn-primary flex-1"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
                  <div className="bg-[#1a233a] rounded-xl p-4 border-l-2 border-yellow-500/50 shadow-inner">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Warning</div>
                    <div className="text-2xl font-bold text-yellow-500 tracking-tight" style={{ textShadow: '0 0 10px rgba(234, 179, 8, 0.3)' }}>
                      {metric.threshold?.warn !== null && metric.threshold?.warn !== undefined 
                        ? `${metric.threshold.warn} ${metric.unit || ''}` 
                        : '-'}
                    </div>
                  </div>
                  <div className="bg-[#1a233a] rounded-xl p-4 border-l-2 border-red-500/50 shadow-inner">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Critical</div>
                    <div className="text-2xl font-bold text-red-500 tracking-tight" style={{ textShadow: '0 0 10px rgba(239, 68, 68, 0.3)' }}>
                      {metric.threshold?.critical !== null && metric.threshold?.critical !== undefined 
                        ? `${metric.threshold.critical} ${metric.unit || ''}` 
                        : '-'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Settings;
