import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

const DOMAIN_OPTIONS = [
  { value: 'home', label: 'Home' },
  { value: 'factory', label: 'Factory' },
  { value: 'farm', label: 'Farm' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'traffic', label: 'Traffic' },
];

const EMPTY_FORM = { slug: '', name: '', domain: 'home', description: '' };
const PAGE_SIZE = 8;

const Modal = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in-up" onClick={onClose}>
      <div className="glass-card bg-[#1a233a] p-8 w-full max-w-lg shadow-2xl animate-fade-scale flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

const ManageOrganizations = ({ organizations, onOrganizationsChanged }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  // modal state
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // filtered + paginated
  const filtered = useMemo(() => {
    if (!search.trim()) return organizations;
    const q = search.toLowerCase();
    return organizations.filter(
      o => o.name?.toLowerCase().includes(q) || o.slug?.toLowerCase().includes(q)
    );
  }, [organizations, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageOrgs = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => { setPage(0); }, [search]);

  const flash = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  // --- Create ---
  const openCreate = () => { setForm(EMPTY_FORM); setShowCreate(true); };
  const handleCreate = async () => {
    if (!form.slug.trim() || !form.name.trim() || !form.domain) {
      flash('error', 'Slug, Name and Domain are required.'); return;
    }
    if (!/^[a-z0-9_-]+$/.test(form.slug.trim())) {
      flash('error', 'Slug must be lowercase, no spaces (a-z, 0-9, -, _ only).'); return;
    }
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/config/organizations`, {
        slug: form.slug.trim(),
        name: form.name.trim(),
        domain: form.domain,
        description: form.description.trim() || undefined
      });
      setShowCreate(false);
      flash('success', `Organization "${form.name.trim()}" created!`);
      await onOrganizationsChanged?.();
    } catch (err) {
      flash('error', err.response?.data?.error || 'Failed to create organization.');
    } finally { setSaving(false); }
  };

  // --- Edit ---
  const openEdit = (org) => {
    setEditId(org.id);
    setForm({ slug: org.slug, name: org.name, domain: org.domains?.[0] || '', description: org.description || '' });
    setShowEdit(true);
  };
  const handleEdit = async () => {
    if (!form.slug.trim() || !form.name.trim()) {
      flash('error', 'Slug and Name are required.'); return;
    }
    setSaving(true);
    try {
      await axios.put(`${API_BASE}/config/organizations/${editId}`, {
        slug: form.slug.trim(),
        name: form.name.trim(),
        description: form.description.trim() || ''
      });
      setShowEdit(false);
      flash('success', 'Organization updated!');
      await onOrganizationsChanged?.();
    } catch (err) {
      flash('error', err.response?.data?.error || 'Failed to update organization.');
    } finally { setSaving(false); }
  };

  // --- Delete ---
  const openDelete = (org) => { setDeleteTarget(org); setShowDelete(true); };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await axios.delete(`${API_BASE}/config/organizations/${deleteTarget.id}`);
      setShowDelete(false);
      flash('success', `Organization "${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
      await onOrganizationsChanged?.();
    } catch (err) {
      flash('error', err.response?.data?.error || 'Failed to delete organization.');
    } finally { setSaving(false); }
  };
  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">Manage Organizations</h1>
          <p className="text-slate-400 text-sm">Create, edit, and manage all organizations in the system.</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
          Create Organization
        </button>
      </div>

      {/* Toast */}
      {message && (
        <div className={`mb-6 rounded-lg px-4 py-3 text-sm font-medium ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {/* Search */}
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" /></svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input max-w-md pl-10"
          placeholder="Search by name or slug..."
        />
      </div>

      {/* Table */}
      <div className="glass-table-container">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <div className="text-4xl mb-3">🏢</div>
            <div className="font-medium">No organizations found</div>
            <div className="text-sm mt-1">Try a different search or create a new one.</div>
          </div>
        ) : (
          <>
            <table className="w-full text-sm text-left">
              <thead className="bg-[#222e4c]/50 text-slate-300 border-b border-slate-700/40 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="p-4 px-6">Name</th>
                  <th className="p-4">Slug</th>
                  <th className="p-4">Domain</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Created</th>
                  <th className="p-4 text-right px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {pageOrgs.map((org, index) => (
                  <tr key={org.id} className={`text-slate-300 hover:bg-[#222e4c]/40 transition-colors ${index % 2 === 0 ? 'bg-[#131a2b]/30' : ''}`}>
                    <td className="p-4 px-6 font-medium text-white">{org.name}</td>
                    <td className="p-4">
                      <code className="text-xs bg-slate-900 px-2 py-0.5 rounded text-slate-400">{org.slug}</code>
                    </td>
                    <td className="p-4">
                      {(org.domains || []).map(d => (
                        <span key={d} className="inline-block text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 mr-1">
                          {d}
                        </span>
                      ))}
                      {(!org.domains || org.domains.length === 0) && <span className="text-slate-500">—</span>}
                    </td>
                    <td className="p-4 text-slate-400 max-w-xs truncate">{org.description || '—'}</td>
                    <td className="p-4 text-slate-400 whitespace-nowrap">
                      {org.createdAt ? new Date(org.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="p-4 text-right px-6 space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => openEdit(org)}
                        className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 hover:border-blue-500/30 text-xs font-medium transition-colors inline-flex items-center gap-1.5"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" /></svg>
                        Edit
                      </button>
                      <button
                        onClick={() => openDelete(org)}
                        className="px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/20 hover:border-red-500/30 text-xs font-medium transition-colors inline-flex items-center gap-1.5"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700/50">
                <div className="text-xs text-slate-500">
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
                </div>
                <div className="flex gap-1">
                  <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded text-xs text-slate-400 hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed">← Prev</button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button key={i} onClick={() => setPage(i)} className={`px-3 py-1 rounded text-xs font-medium ${page === i ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700/50'}`}>{i + 1}</button>
                  ))}
                  <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded text-xs text-slate-400 hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed">Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)}>
        <h2 className="text-xl font-semibold text-white mb-6">Create Organization</h2>
        <div className="space-y-5 overflow-y-auto pr-2 flex-1">
          <div>
            <label className="input-label">Name <span className="text-red-400">*</span></label>
            <input type="text" value={form.name} onChange={handleChange('name')} className="form-input" placeholder="Smart Factory Org" />
          </div>
          <div>
            <label className="input-label">Slug <span className="text-red-400">*</span></label>
            <input type="text" value={form.slug} onChange={handleChange('slug')} className="form-input" placeholder="factory" />
            <p className="text-[11px] text-slate-500 mt-1">Lowercase, no spaces (a-z, 0-9, -, _ only)</p>
          </div>
          <div>
            <label className="input-label">Domain <span className="text-red-400">*</span></label>
            <select value={form.domain} onChange={handleChange('domain')} className="form-input">
              {DOMAIN_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Description</label>
            <input type="text" value={form.description} onChange={handleChange('description')} className="form-input" placeholder="Optional description" />
          </div>
        </div>
        <div className="flex gap-3 content-end border-t border-slate-700/50 mt-8 pt-6">
          <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleCreate} disabled={saving} className="btn-primary flex-1">{saving ? 'Creating...' : 'Create'}</button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)}>
        <h2 className="text-xl font-semibold text-white mb-6">Edit Organization</h2>
        <div className="space-y-5 overflow-y-auto pr-2 flex-1">
          <div>
            <label className="input-label">Name <span className="text-red-400">*</span></label>
            <input type="text" value={form.name} onChange={handleChange('name')} className="form-input" />
          </div>
          <div>
            <label className="input-label">Slug <span className="text-red-400">*</span></label>
            <input type="text" value={form.slug} onChange={handleChange('slug')} className="form-input" />
          </div>
          <div>
            <label className="input-label">Description</label>
            <input type="text" value={form.description} onChange={handleChange('description')} className="form-input" />
          </div>
        </div>
        <div className="flex gap-3 content-end border-t border-slate-700/50 mt-8 pt-6">
          <button onClick={() => setShowEdit(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleEdit} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)}>
        <h2 className="text-xl font-semibold text-white mb-4">Delete Organization</h2>
        <p className="text-slate-300 text-sm mb-6 leading-relaxed">
          Are you sure you want to delete <strong className="text-white bg-slate-700/50 px-2 py-0.5 rounded">{deleteTarget?.name}</strong>?
        </p>
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-500 flex gap-3 items-start">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 shrink-0 mt-0.5"><path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clipRule="evenodd" /></svg>
          <div className="leading-relaxed">This will permanently remove all related data including users, devices, metrics, alerts, and dashboard configurations.</div>
        </div>
        <div className="flex gap-3 content-end border-t border-slate-700/50 mt-8 pt-6">
          <button onClick={() => setShowDelete(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleDelete} disabled={saving} className="btn-danger flex-1">{saving ? 'Deleting...' : 'Delete'}</button>
        </div>
      </Modal>
    </div>
  );
};

export default ManageOrganizations;
