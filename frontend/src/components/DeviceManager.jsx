import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

const DeviceManager = ({ organizationId, domain }) => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDevice, setEditingDevice] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [newDevice, setNewDevice] = useState({ id: '', name: '', type: 'Generic', metricKeys: '' });

  const fetchDevices = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/devices`, {
        params: { organizationId, domain }
      });
      setDevices(res.data);
    } catch (err) {
      console.error('Failed to fetch devices', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId, domain]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleEditClick = (device) => {
    setEditingDevice(device.id);
    setEditForm({
      name: device.name || '',
      description: device.description || ''
    });
  };

  const handleSaveClick = async (id) => {
    try {
      await axios.put(`${API_BASE}/devices/${id}`, editForm);
      setEditingDevice(null);
      fetchDevices(); // Refresh list
    } catch (err) {
      console.error('Failed to update device', err);
      alert('Failed to update device');
    }
  };

  const handleCreateDevice = async () => {
    if (!newDevice.id || !organizationId || !domain) {
      alert('Device ID, organization and domain are required');
      return;
    }

    try {
      await axios.post(`${API_BASE}/devices`, {
        id: newDevice.id.trim(),
        name: newDevice.name.trim() || undefined,
        type: newDevice.type.trim() || 'Generic',
        metricKeys: newDevice.metricKeys
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        organizationId,
        domain
      });
      setNewDevice({ id: '', name: '', type: 'Generic', metricKeys: '' });
      fetchDevices();
    } catch (err) {
      console.error('Failed to create device', err);
      alert(err.response?.data?.error || 'Failed to create device');
    }
  };

  const handleDeleteDevice = async (id) => {
    if (!window.confirm(`Delete device ${id}?`)) return;

    try {
      await axios.delete(`${API_BASE}/devices/${id}`, {
        params: { organizationId }
      });
      fetchDevices();
    } catch (err) {
      console.error('Failed to delete device', err);
      alert(err.response?.data?.error || 'Failed to delete device');
    }
  };

  const formatRecentData = (device) => {
    const latest = (device.sensorData || []).slice(0, 3);
    if (latest.length === 0) return '-';

    return latest.map((row) => {
      const key = row.metric?.key || 'metric';
      const value = row.valueNumber !== null && row.valueNumber !== undefined ? row.valueNumber : row.valueText;
      const unit = row.metric?.unit || '';
      return `${key}: ${value}${unit ? ` ${unit}` : ''}`;
    }).join(' | ');
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="page-title">Device Management</h1>
          <p className="text-slate-400 text-sm">Active Domain: <span className="text-blue-400 capitalize font-medium px-2 py-0.5 bg-blue-500/10 rounded-md border border-blue-500/20">{domain || 'All'}</span></p>
        </div>
      </div>

      <div className="glass-card p-6 mb-8 border-slate-700/50">
        <h3 className="section-title text-base mb-4 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-400"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" /></svg> Add New Device</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="input-label text-xs">Device ID <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={newDevice.id}
              onChange={(e) => setNewDevice({ ...newDevice, id: e.target.value })}
              className="form-input"
              placeholder="e.g. sensor_01"
            />
          </div>
          <div>
            <label className="input-label text-xs">Name</label>
            <input
              type="text"
              value={newDevice.name}
              onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
              className="form-input"
              placeholder="Device Name"
            />
          </div>
          <div>
            <label className="input-label text-xs">Type</label>
            <input
              type="text"
              value={newDevice.type}
              onChange={(e) => setNewDevice({ ...newDevice, type: e.target.value })}
              className="form-input"
              placeholder="e.g. Temperature"
            />
          </div>
          <div>
            <label className="input-label text-xs">Metric Keys</label>
            <input
              type="text"
              value={newDevice.metricKeys}
              onChange={(e) => setNewDevice({ ...newDevice, metricKeys: e.target.value })}
              className="form-input"
              placeholder="temp, smoke"
            />
          </div>
          <button
            onClick={handleCreateDevice}
            className="btn-primary"
          >
            Add Device
          </button>
        </div>
        <p className="text-[11px] text-slate-500 mt-3 flex items-center gap-1.5 border-l-2 border-slate-700 pl-2">
          <span>ℹ️</span> Metric keys help map payload properties to the correct device (comma separated).
        </p>
      </div>

      <div className="glass-table-container">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading devices...</div>
        ) : devices.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
             <div className="text-4xl mb-3">🎛️</div>
             <div className="font-medium">No devices found</div>
             <div className="text-sm mt-1">Create devices manually before ingesting data.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#222e4c]/50 text-slate-300 border-b border-slate-700/40 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="p-4 px-6">Device ID</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Metric Mapping</th>
                  <th className="p-4">Recent Data</th>
                  <th className="p-4">Last Seen</th>
                  <th className="p-4 text-right px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {devices.map((device, index) => (
                  <tr key={device.id} className={`text-slate-300 hover:bg-[#222e4c]/40 transition-colors ${index % 2 === 0 ? 'bg-[#131a2b]/30' : ''}`}>
                  <td className="p-4 px-6 font-mono text-xs text-blue-400 bg-blue-500/5">{device.id}</td>
                  
                  <td className="p-4 text-slate-200 font-medium">
                    {editingDevice === device.id ? (
                      <input 
                        type="text" 
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="form-input py-1.5 px-3"
                        placeholder="Device Name"
                      />
                    ) : (
                      device.name || <span className="text-slate-500 italic font-normal">Unnamed Device</span>
                    )}
                  </td>
                  
                  <td className="p-4 text-slate-400">
                    {editingDevice === device.id ? (
                      <input 
                        type="text" 
                        value={editForm.description}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        className="form-input py-1.5 px-3"
                        placeholder="Description"
                      />
                    ) : (
                      <span className="max-w-[150px] truncate block">{device.description || '-'}</span>
                    )}
                  </td>

                  <td className="p-4 text-slate-400 text-xs">
                    {Array.isArray(device.metricKeys) && device.metricKeys.length > 0
                      ? device.metricKeys.map(k => (
                          <span key={k} className="inline-block bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-[10px] mr-1 mb-1">{k}</span>
                        ))
                      : <span className="text-slate-600">-</span>}
                  </td>

                  <td className="p-4 text-slate-400 text-xs font-mono">
                    <span className="max-w-[200px] truncate block">{formatRecentData(device)}</span>
                  </td>
                  
                  <td className="p-4 text-slate-400 text-xs">
                    {new Date(device.updatedAt).toLocaleString()}
                  </td>
                  
                  <td className="p-4 px-6 text-right">
                    {editingDevice === device.id ? (
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleSaveClick(device.id)}
                          className="px-3 py-1.5 bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg> Save
                        </button>
                        <button 
                          onClick={() => setEditingDevice(null)}
                          className="px-3 py-1.5 bg-slate-700/30 text-slate-300 border border-slate-700/50 hover:bg-slate-700/50 rounded-lg text-xs font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEditClick(device)}
                          className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1.5"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" /></svg> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteDevice(device.id)}
                          className="px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1.5"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceManager;
