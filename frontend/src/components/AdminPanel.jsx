import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

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
  currentUser
}) => {
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userForm, setUserForm] = useState(DEFAULT_USER_FORM);
  const [editingUser, setEditingUser] = useState(null);

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

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      email: user.email,
      password: '',
      name: user.name || '',
      role: user.role || 'ORG_USER'
    });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setUserForm(DEFAULT_USER_FORM);
  };

  const handleUpdateUser = async () => {
    if (!activeOrganizationId || !editingUser) return;
    try {
      await axios.put(`${API_BASE}/config/organizations/${activeOrganizationId}/users/${editingUser.id}`, {
        name: userForm.name.trim() || undefined,
        role: userForm.role
      });
      handleCancelEdit();
      fetchUsers();
    } catch (err) {
      console.error('Failed to update user', err);
      alert(err.response?.data?.error || 'Failed to update user');
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
    <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full space-y-8">
      <div>
        <h1 className="page-title">Manage Users</h1>
        <p className="text-slate-400 text-sm">Add, remove, and manage users within an organization.</p>
      </div>

      <div className="glass-card p-6 border-slate-700/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 border-b border-slate-700/50 pb-4">
          <h3 className="section-title mb-0 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-400">
              <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
            </svg>
            Organization Users
          </h3>
          <select
            value={activeOrganizationId || ''}
            onChange={(e) => onOrganizationChange?.(e.target.value)}
            className="form-input md:w-64"
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-slate-900/30 p-4 rounded-xl border border-slate-700/30">
            <div>
                 <label className="input-label text-xs">Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  disabled={!!editingUser}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className={`form-input ${editingUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="user@example.com"
                />
            </div>
            <div>
                 <label className="input-label text-xs">Password</label>
                <input
                  type="password"
                  value={userForm.password}
                  disabled={!!editingUser}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className={`form-input ${editingUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder={editingUser ? "Unchanged" : "••••••"}
                />
            </div>
            <div>
                 <label className="input-label text-xs">Name</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="form-input"
                  placeholder="Optional"
                />
            </div>
            <div>
                 <label className="input-label text-xs">Role & Action</label>
                <div className="flex gap-2">
                <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="flex-1 form-input w-32"
                >
                    <option value="ORG_USER">USER</option>
                    <option value="SYSTEM_ADMIN">ADMIN</option>
                </select>
                {editingUser ? (
                  <>
                    <button onClick={handleUpdateUser} className="btn-primary text-sm px-4">
                        Update
                    </button>
                    <button onClick={handleCancelEdit} className="px-3 py-1.5 bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors">
                        Cancel
                    </button>
                  </>
                ) : (
                    <button onClick={handleAddUser} className="btn-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                        Add
                    </button>
                )}
                </div>
            </div>
        </div>

        <div className="glass-table-container">
          {usersLoading ? (
            <div className="p-12 text-center text-slate-400">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
               <div className="text-4xl mb-3">👥</div>
               <div className="font-medium text-sm">No users found in this organization.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-[#222e4c]/50 text-slate-300 border-b border-slate-700/40 uppercase tracking-wider text-[11px] font-bold">
                  <tr>
                    <th className="p-4 px-6">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4 text-right px-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {users.map((user, index) => {
                    const isCurrentUser = currentUser?.id === user.id;
                    return (
                      <tr key={user.id} className={`text-slate-300 hover:bg-[#222e4c]/40 transition-colors ${index % 2 === 0 ? 'bg-[#131a2b]/30' : ''}`}>
                        <td className="p-4 px-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs uppercase shadow-inner border border-blue-500/30">
                                    {user.name ? user.name.charAt(0) : user.email.charAt(0)}
                                </div>
                                <span className={user.name ? 'font-medium text-slate-200' : 'text-slate-500 italic'}>{user.name || 'Unnamed'}</span>
                            </div>
                        </td>
                        <td className="p-4 text-slate-400">{user.email}</td>
                        <td className="p-4">
                            <span className={`inline-block border px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider ${user.role === 'SYSTEM_ADMIN' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-slate-700/40 text-slate-300 border-slate-600/50'}`}>
                                {user.role}
                            </span>
                        </td>
                        <td className="p-4 text-right px-6 space-x-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 rounded-lg text-xs font-medium transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleAdminResetPassword(user.id)}
                            className="px-3 py-1.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500/20 rounded-lg text-xs font-medium transition-colors"
                          >
                            Reset Password
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={isCurrentUser}
                            className="px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;