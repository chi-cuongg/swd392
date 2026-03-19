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
    <div className="flex-1 overflow-y-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Device Management</h1>
          <p className="text-slate-400 text-sm">Active Domain: <span className="text-blue-400 capitalize">{domain || 'All'}</span></p>
        </div>
      </div>

      <div className="bg-dark-800 border border-slate-700/50 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            type="text"
            value={newDevice.id}
            onChange={(e) => setNewDevice({ ...newDevice, id: e.target.value })}
            className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            placeholder="Device ID (required)"
          />
          <input
            type="text"
            value={newDevice.name}
            onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
            className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            placeholder="Device Name"
          />
          <input
            type="text"
            value={newDevice.type}
            onChange={(e) => setNewDevice({ ...newDevice, type: e.target.value })}
            className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            placeholder="Device Type"
          />
          <input
            type="text"
            value={newDevice.metricKeys}
            onChange={(e) => setNewDevice({ ...newDevice, metricKeys: e.target.value })}
            className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            placeholder="metric keys: temp,smoke"
          />
          <button
            onClick={handleCreateDevice}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded px-4 py-2 text-sm font-medium transition-colors"
          >
            Add Device
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Metric keys help mapping payload metrics to the correct device (comma separated).
        </p>
      </div>

      <div className="bg-dark-800 border border-slate-700/50 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading devices...</div>
        ) : devices.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No devices found for this domain. Create devices manually before ingesting data.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/50 border-b border-slate-700/50">
              <tr>
                <th className="p-4 font-semibold text-slate-300">Device ID</th>
                <th className="p-4 font-semibold text-slate-300">Name</th>
                <th className="p-4 font-semibold text-slate-300">Description</th>
                <th className="p-4 font-semibold text-slate-300">Metric Mapping</th>
                <th className="p-4 font-semibold text-slate-300">Recent Data</th>
                <th className="p-4 font-semibold text-slate-300">Last Seen</th>
                <th className="p-4 font-semibold text-slate-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {devices.map(device => (
                <tr key={device.id} className="hover:bg-slate-800/25 transition-colors">
                  <td className="p-4 font-mono text-xs text-blue-400">{device.id}</td>
                  
                  <td className="p-4 text-slate-300 font-medium">
                    {editingDevice === device.id ? (
                      <input 
                        type="text" 
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="bg-slate-900 border border-slate-600 rounded px-2 py-1 w-full text-sm focus:border-blue-500 focus:outline-none"
                        placeholder="Device Name"
                      />
                    ) : (
                      device.name || <span className="text-slate-500 italic">Unnamed Device</span>
                    )}
                  </td>
                  
                  <td className="p-4 text-slate-400">
                    {editingDevice === device.id ? (
                      <input 
                        type="text" 
                        value={editForm.description}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        className="bg-slate-900 border border-slate-600 rounded px-2 py-1 w-full text-sm focus:border-blue-500 focus:outline-none"
                        placeholder="Description"
                      />
                    ) : (
                      device.description || '-'
                    )}
                  </td>

                  <td className="p-4 text-slate-400 text-xs">
                    {Array.isArray(device.metricKeys) && device.metricKeys.length > 0
                      ? device.metricKeys.join(', ')
                      : '-'}
                  </td>

                  <td className="p-4 text-slate-400 text-xs">
                    {formatRecentData(device)}
                  </td>
                  
                  <td className="p-4 text-slate-400">
                    {new Date(device.updatedAt).toLocaleString()}
                  </td>
                  
                  <td className="p-4 text-right">
                    {editingDevice === device.id ? (
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleSaveClick(device.id)}
                          className="px-3 py-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded text-xs font-medium transition-colors"
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => setEditingDevice(null)}
                          className="px-3 py-1 bg-slate-700/50 text-slate-300 hover:bg-slate-700 rounded text-xs font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEditClick(device)}
                          className="px-3 py-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-xs font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteDevice(device.id)}
                          className="px-3 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DeviceManager;
