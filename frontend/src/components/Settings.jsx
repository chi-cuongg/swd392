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
    <div className="flex-1 overflow-y-auto p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Alert Thresholds</h1>
        <p className="text-slate-400 text-sm">Configure warning and critical limits for metrics in <span className="text-blue-400 capitalize">{domain || 'All'}</span> domain.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-8 text-center text-slate-400">Loading thresholds...</div>
        ) : thresholds.length === 0 ? (
          <div className="col-span-full p-8 text-center text-slate-400">No metrics found for this domain. Request data first.</div>
        ) : (
          thresholds.map(metric => (
            <div key={metric.metricId} className="bg-dark-800 border border-slate-700/50 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{metric.label}</h3>
                  <code className="text-xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded">{metric.key}</code>
                </div>
                {!editingId || editingId !== metric.metricId ? (
                  <button 
                    onClick={() => handleEditClick(metric)}
                    className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                    title="Edit Thresholds"
                  >
                    ✏️
                  </button>
                ) : null}
              </div>

              {editingId === metric.metricId ? (
                <div className="space-y-4 mt-6">
                  <div>
                    <label className="block text-xs font-medium text-yellow-500 mb-1">Warning Threshold ({metric.unit || 'value'})</label>
                    <input 
                      type="number" 
                      value={editForm.warn}
                      onChange={(e) => setEditForm({...editForm, warn: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none"
                      placeholder="e.g. 70"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-red-500 mb-1">Critical Threshold ({metric.unit || 'value'})</label>
                    <input 
                      type="number" 
                      value={editForm.critical}
                      onChange={(e) => setEditForm({...editForm, critical: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                      placeholder="e.g. 85"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => handleSaveClick(metric.metricId)}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => setEditingId(null)}
                      className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-slate-800/50 rounded-lg p-3 border-l-2 border-yellow-500/50">
                    <div className="text-xs text-slate-400 mb-1">Warning</div>
                    <div className="text-xl font-semibold text-yellow-500">
                      {metric.threshold?.warn !== null && metric.threshold?.warn !== undefined 
                        ? `${metric.threshold.warn} ${metric.unit || ''}` 
                        : '-'}
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 border-l-2 border-red-500/50">
                    <div className="text-xs text-slate-400 mb-1">Critical</div>
                    <div className="text-xl font-semibold text-red-500">
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
