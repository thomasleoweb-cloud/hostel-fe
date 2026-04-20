import React, { useEffect, useState, useCallback } from 'react';
import { usersAPI } from '../utils/api';
import { Badge, Modal, PageHeader, EmptyState, ConfirmDialog, Avatar, SearchInput } from '../components/common/LoadingSpinner';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const ROLE_COLORS = { admin: 'blue', staff: 'teal', resident: 'gray' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'resident', phone: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (search) params.search = search;
      if (roleFilter !== 'all') params.role = roleFilter;
      const { data } = await usersAPI.getAll(params);
      setUsers(data.data || []);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.name || !form.email) return toast.error('Name and email required');
    if (!editUser && !form.password) return toast.error('Password required for new user');
    try {
      if (editUser) { await usersAPI.update(editUser._id, form); toast.success('User updated'); }
      else { await usersAPI.create(form); toast.success('User created'); }
      setShowForm(false); setEditUser(null); setForm({ name: '', email: '', password: '', role: 'resident', phone: '' }); load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const handleToggle = async (user) => {
    try {
      const { data } = await usersAPI.toggleStatus(user._id);
      toast.success(data.message); load();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async () => {
    try { await usersAPI.delete(confirm.id); toast.success('User deleted'); setConfirm(null); load(); }
    catch (e) { toast.error(e.response?.data?.message || 'Cannot delete'); }
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, phone: u.phone || '' });
    setShowForm(true);
  };

  const roleCounts = { admin: users.filter(u => u.role === 'admin').length, staff: users.filter(u => u.role === 'staff').length, resident: users.filter(u => u.role === 'resident').length };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Users & Roles" subtitle="Manage system access and permissions"
        actions={<button className="btn btn-primary" onClick={() => { setEditUser(null); setForm({ name: '', email: '', password: '', role: 'resident', phone: '' }); setShowForm(true); }}>+ Add User</button>}
      />

      {/* Role counts */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[['Administrators', roleCounts.admin, 'text-primary-400'], ['Staff Members', roleCounts.staff, 'text-teal-400'], ['Residents', roleCounts.resident, 'text-slate-300']].map(([label, count, color]) => (
          <div key={label} className="card flex items-center gap-4">
            <div><div className="stat-label">{label}</div><div className={`text-2xl font-mono font-semibold ${color}`}>{count}</div></div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex gap-2">
          {['all', 'admin', 'staff', 'resident'].map(r => (
            <button key={r} className={`btn text-xs py-1.5 ${roleFilter === r ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setRoleFilter(r)}>
              {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
        <div className="ml-auto w-64"><SearchInput value={search} onChange={setSearch} placeholder="Search users..." /></div>
      </div>

      {loading ? <div className="flex justify-center pt-10"><LoadingSpinner size="lg" /></div>
        : users.length === 0 ? <div className="card"><EmptyState title="No users found" /></div>
        : <div className="card table-wrapper">
          <table>
            <thead><tr><th>User</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td><div className="flex items-center gap-2.5"><Avatar name={u.name} /><div><div className="text-sm font-medium text-slate-100">{u.name}</div><div className="text-xs text-slate-500">{u._id.slice(-6)}</div></div></div></td>
                  <td className="text-xs text-slate-400">{u.email}</td>
                  <td className="text-xs text-slate-400">{u.phone || '—'}</td>
                  <td><Badge variant={ROLE_COLORS[u.role]}>{u.role}</Badge></td>
                  <td><Badge variant={u.isActive ? 'green' : 'red'}>{u.isActive ? 'active' : 'inactive'}</Badge></td>
                  <td className="text-xs text-slate-500">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}</td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-ghost text-xs py-1 px-2" onClick={() => openEdit(u)}>Edit</button>
                      <button className={`btn text-xs py-1 px-2 ${u.isActive ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggle(u)}>{u.isActive ? 'Disable' : 'Enable'}</button>
                      <button className="btn btn-danger text-xs py-1 px-2" onClick={() => setConfirm({ id: u._id, name: u.name })}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editUser ? 'Edit User' : 'Add New User'}>
        <div className="form-row">
          <div><label className="label">Full Name *</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Role *</label><select className="select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}><option value="admin">Administrator</option><option value="staff">Staff</option><option value="resident">Resident</option></select></div>
        </div>
        <div className="form-group"><label className="label">Email *</label><input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
        <div className="form-group"><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="form-group"><label className="label">{editUser ? 'New Password (leave blank to keep current)' : 'Password *'}</label><input type="password" className="input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" /></div>
        <div className="flex gap-2 mt-2">
          <button className="btn btn-primary" onClick={handleSave}>{editUser ? 'Update User' : 'Create User'}</button>
          <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
        </div>
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={handleDelete} title="Delete User" message={`Delete user "${confirm?.name}"? This cannot be undone.`} confirmLabel="Delete" />
    </div>
  );
}
