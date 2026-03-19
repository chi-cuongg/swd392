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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-dark-800 border border-slate-700/50 rounded-xl p-6 w-full max-w-lg shadow-2xl mx-4" onClick={e => e.stopPropagation()}>
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
    <div className="flex-1 overflow-y-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Manage Organizations</h1>
          <p className="text-slate-400 text-sm">Create, edit, and manage all organizations in the system.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-all active:scale-[0.97] shadow-lg shadow-blue-600/20">
          <span className="text-lg">＋</span> Create Organization
        </button>
      </div>

      {/* Toast */}
      {message && (
        <div className={`mb-6 rounded-lg px-4 py-3 text-sm font-medium ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors"
          placeholder="🔍 Search by name or slug..."
        />
      </div>

      {/* Table */}
      <div className="bg-dark-800 border border-slate-700/50 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <div className="text-4xl mb-3">🏢</div>
            <div className="font-medium">No organizations found</div>
            <div className="text-sm mt-1">Try a different search or create a new one.</div>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-800/60 text-slate-300 border-b border-slate-700/50">
                <tr>
                  <th className="p-4 text-left font-semibold">Name</th>
                  <th className="p-4 text-left font-semibold">Slug</th>
                  <th className="p-4 text-left font-semibold">Domain</th>
                  <th className="p-4 text-left font-semibold">Description</th>
                  <th className="p-4 text-left font-semibold">Created</th>
                  <th className="p-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {pageOrgs.map(org => (
                  <tr key={org.id} className="text-slate-300 hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-medium text-white">{org.name}</td>
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
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => openEdit(org)}
                        className="px-3 py-1.5 bg-blue-500/15 text-blue-400 rounded-lg hover:bg-blue-500/25 text-xs font-medium transition-colors"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => openDelete(org)}
                        className="px-3 py-1.5 bg-red-500/15 text-red-400 rounded-lg hover:bg-red-500/25 text-xs font-medium transition-colors"
                      >
                        🗑️ Delete
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
        <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2"><span>🏢</span> Create Organization</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Name <span className="text-red-400">*</span></label>
            <input type="text" value={form.name} onChange={handleChange('name')} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none" placeholder="Smart Factory Org" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Slug <span className="text-red-400">*</span></label>
            <input type="text" value={form.slug} onChange={handleChange('slug')} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none" placeholder="factory (lowercase, no spaces)" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Domain <span className="text-red-400">*</span></label>
            <select value={form.domain} onChange={handleChange('domain')} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none">
              {DOMAIN_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <input type="text" value={form.description} onChange={handleChange('description')} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none" placeholder="Optional description" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors">Cancel</button>
          <button onClick={handleCreate} disabled={saving} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">{saving ? 'Creating...' : 'Create'}</button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)}>
        <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2"><span>✏️</span> Edit Organization</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Name <span className="text-red-400">*</span></label>
            <input type="text" value={form.name} onChange={handleChange('name')} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Slug <span className="text-red-400">*</span></label>
            <input type="text" value={form.slug} onChange={handleChange('slug')} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <input type="text" value={form.description} onChange={handleChange('description')} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => setShowEdit(false)} className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors">Cancel</button>
          <button onClick={handleEdit} disabled={saving} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)}>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><span>⚠️</span> Delete Organization</h2>
        <p className="text-slate-300 text-sm mb-2">
          Are you sure you want to delete <strong className="text-white">{deleteTarget?.name}</strong>?
        </p>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400 mb-6">
          ⚠️ This will permanently remove all related data including users, devices, metrics, alerts, and dashboard configurations.
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowDelete(false)} className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors">Cancel</button>
          <button onClick={handleDelete} disabled={saving} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">{saving ? 'Deleting...' : 'Delete'}</button>
        </div>
      </Modal>
    </div>
  );
};

export default ManageOrganizations;
