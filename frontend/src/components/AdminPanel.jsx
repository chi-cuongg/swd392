import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

const DEFAULT_ORG_FORM = {
  slug: '',
  name: '',
  domain: 'home',
  description: ''
};

const DEFAULT_ORG_EDIT_FORM = {
  slug: '',
  name: '',
  description: ''
};

const DEFAULT_USER_FORM = {
  email: '',
  password: '',
  name: '',
  role: 'ORG_USER'
};

const AdminPanel = ({
  organizations,
  activeOrganizationId,
  onOrganizationChange,
  onOrganizationsChanged,
  currentUser
}) => {
  const [orgForm, setOrgForm] = useState(DEFAULT_ORG_FORM);
  const [orgSaving, setOrgSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userForm, setUserForm] = useState(DEFAULT_USER_FORM);
  const [orgEditForm, setOrgEditForm] = useState(DEFAULT_ORG_EDIT_FORM);
  const [orgUpdating, setOrgUpdating] = useState(false);

  useEffect(() => {
    const selected = organizations.find((org) => org.id === activeOrganizationId);
    if (!selected) {
      setOrgEditForm(DEFAULT_ORG_EDIT_FORM);
      return;
    }
    setOrgEditForm({
      slug: selected.slug || '',
      name: selected.name || '',
      description: selected.description || ''
    });
  }, [organizations, activeOrganizationId]);

  const fetchUsers = async () => {
    if (!activeOrganizationId) {
      setUsers([]);
      return;
    }

    setUsersLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/config/organizations/${activeOrganizationId}/users`);
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch organization users', err);
      alert(err.response?.data?.error || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [activeOrganizationId]);

  const handleCreateOrganization = async () => {
    if (!orgForm.slug.trim() || !orgForm.name.trim() || !orgForm.domain.trim()) {
      alert('slug, name and domain are required');
      return;
    }

    setOrgSaving(true);
    try {
      const payload = {
        slug: orgForm.slug.trim(),
        name: orgForm.name.trim(),
        domain: orgForm.domain.trim(),
        description: orgForm.description.trim() || undefined
      };

      const res = await axios.post(`${API_BASE}/config/organizations`, payload);
      const created = res.data;
      setOrgForm(DEFAULT_ORG_FORM);
      await onOrganizationsChanged?.(created?.id);
      if (created?.id) {
        onOrganizationChange?.(created.id);
      }
      alert(`Organization created: ${created?.name || created?.id}`);
    } catch (err) {
      console.error('Failed to create organization', err);
      alert(err.response?.data?.error || 'Failed to create organization');
    } finally {
      setOrgSaving(false);
    }
  };

  const handleAddUser = async () => {
    if (!activeOrganizationId) {
      alert('Please select an organization first');
      return;
    }

    if (!userForm.email.trim() || !userForm.password.trim()) {
      alert('email and password are required');
      return;
    }

    try {
      await axios.post(`${API_BASE}/config/organizations/${activeOrganizationId}/users`, {
        email: userForm.email.trim(),
        password: userForm.password,
        name: userForm.name.trim() || undefined,
        role: userForm.role
      });
      setUserForm(DEFAULT_USER_FORM);
      fetchUsers();
    } catch (err) {
      console.error('Failed to add user', err);
      alert(err.response?.data?.error || 'Failed to add user');
    }
  };

  const handleUpdateOrganization = async () => {
    if (!activeOrganizationId) {
      alert('Please select an organization first');
      return;
    }

    if (!orgEditForm.slug.trim() || !orgEditForm.name.trim()) {
      alert('slug and name are required');
      return;
    }

    setOrgUpdating(true);
    try {
      await axios.put(`${API_BASE}/config/organizations/${activeOrganizationId}`, {
        slug: orgEditForm.slug.trim(),
        name: orgEditForm.name.trim(),
        description: orgEditForm.description.trim() || ''
      });

      await onOrganizationsChanged?.(activeOrganizationId);
      alert('Organization updated');
    } catch (err) {
      console.error('Failed to update organization', err);
      alert(err.response?.data?.error || 'Failed to update organization');
    } finally {
      setOrgUpdating(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!activeOrganizationId) return;
    if (!window.confirm('Remove this user from organization?')) return;

    try {
      await axios.delete(`${API_BASE}/config/organizations/${activeOrganizationId}/users/${userId}`);
      fetchUsers();
    } catch (err) {
      console.error('Failed to remove user', err);
      alert(err.response?.data?.error || 'Failed to remove user');
    }
  };

  const handleAdminResetPassword = async (userId) => {
    const newPassword = window.prompt('Enter new password (min 6 chars):');
    if (!newPassword) return;

    try {
      await axios.post(`${API_BASE}/auth/users/${userId}/reset-password`, { newPassword });
      alert('Password reset successful');
    } catch (err) {
      console.error('Failed to reset password', err);
      alert(err.response?.data?.error || 'Failed to reset password');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Administration</h1>
        <p className="text-slate-400 text-sm">Create organizations and manage organization users.</p>
      </div>

      <div className="bg-dark-800 border border-slate-700/50 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Edit Organization</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={activeOrganizationId || ''}
            onChange={(e) => onOrganizationChange?.(e.target.value)}
            className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white"
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
          <input
            type="text"
            value={orgEditForm.slug}
            onChange={(e) => setOrgEditForm({ ...orgEditForm, slug: e.target.value })}
            className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            placeholder="slug"
          />
          <input
            type="text"
            value={orgEditForm.name}
            onChange={(e) => setOrgEditForm({ ...orgEditForm, name: e.target.value })}
            className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            placeholder="name"
          />
          <input
            type="text"
            value={orgEditForm.description}
            onChange={(e) => setOrgEditForm({ ...orgEditForm, description: e.target.value })}
            className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            placeholder="description"
          />
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={handleUpdateOrganization}
            disabled={orgUpdating}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded px-4 py-2 text-sm font-medium transition-colors"
          >
            {orgUpdating ? 'Saving...' : 'Save Organization'}
          </button>
        </div>
      </div>

      <div className="bg-dark-800 border border-slate-700/50 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Create Organization</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            value={orgForm.slug}
            onChange={(e) => setOrgForm({ ...orgForm, slug: e.target.value })}
            className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            placeholder="slug (ex: retail)"
          />
          <input
            type="text"
            value={orgForm.name}
            onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
            className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            placeholder="name"
          />
          <select
            value={orgForm.domain}
            onChange={(e) => setOrgForm({ ...orgForm, domain: e.target.value })}
            className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="home">home</option>
            <option value="factory">factory</option>
            <option value="farm">farm</option>
            <option value="hospital">hospital</option>
            <option value="traffic">traffic</option>
          </select>
          <input
            type="text"
            value={orgForm.description}
            onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })}
            className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            placeholder="description (optional)"
          />
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={handleCreateOrganization}
            disabled={orgSaving}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded px-4 py-2 text-sm font-medium transition-colors"
          >
            {orgSaving ? 'Creating...' : 'Create Organization'}
          </button>
        </div>
      </div>

      <div className="bg-dark-800 border border-slate-700/50 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-white">Manage Users</h2>
          <select
            value={activeOrganizationId || ''}
            onChange={(e) => onOrganizationChange?.(e.target.value)}
            className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white"
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <input
            type="email"
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
            className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            placeholder="email"
          />
          <input
            type="password"
            value={userForm.password}
            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
            className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            placeholder="password"
          />
          <input
            type="text"
            value={userForm.name}
            onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
            className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            placeholder="name (optional)"
          />
          <div className="flex gap-2">
            <select
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
              className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white"
            >
              <option value="ORG_USER">ORG_USER</option>
              <option value="SYSTEM_ADMIN">SYSTEM_ADMIN</option>
            </select>
            <button
              onClick={handleAddUser}
              className="bg-green-600 hover:bg-green-500 text-white rounded px-4 py-2 text-sm font-medium transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        <div className="bg-dark-900 border border-slate-700/50 rounded-lg overflow-hidden">
          {usersLoading ? (
            <div className="p-5 text-slate-400 text-sm">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="p-5 text-slate-400 text-sm">No users found in this organization.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-800/60 text-slate-300">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Role</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {users.map((user) => {
                  const isCurrentUser = currentUser?.id === user.id;
                  return (
                    <tr key={user.id} className="text-slate-300">
                      <td className="p-3">{user.name || '-'}</td>
                      <td className="p-3">{user.email}</td>
                      <td className="p-3">{user.role}</td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => handleAdminResetPassword(user.id)}
                          className="px-3 py-1 bg-blue-500/15 text-blue-400 rounded hover:bg-blue-500/25"
                        >
                          Reset Password
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={isCurrentUser}
                          className="px-3 py-1 bg-red-500/15 text-red-400 rounded hover:bg-red-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;