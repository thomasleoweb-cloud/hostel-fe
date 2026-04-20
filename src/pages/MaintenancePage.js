import React, { useEffect, useState, useCallback } from 'react';
import { maintenanceAPI } from '../utils/api';
import { Badge, statusBadge, priorityBadge, Modal, PageHeader, EmptyState, ConfirmDialog, StatCard } from '../components/common/LoadingSpinner';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CATEGORIES = ['Electrical', 'Plumbing', 'Carpentry', 'IT/Network', 'Housekeeping', 'Appliance', 'Structural', 'Other'];
const EMPTY_FORM = { room: '', title: '', description: '', category: 'Electrical', priority: 'medium' };

export default function MaintenancePage() {
  const { canManage } = useAuth();
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [updateForm, setUpdateForm] = useState({ status: '', updateMessage: '', assignedTo: '', cost: 0 });
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      const { data } = await maintenanceAPI.getAll(params);
      setRequests(data.data || []);
      setStats(data.stats || {});
    } catch { toast.error('Failed to load requests'); }
    finally { setLoading(false); }
  }, [statusFilter, priorityFilter]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.title || !form.description || !form.room) return toast.error('Please fill required fields');
    try {
      await maintenanceAPI.create(form);
      toast.success('Request submitted'); setShowForm(false); setForm(EMPTY_FORM); load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to submit'); }
  };

  const handleUpdate = async () => {
    try {
      await maintenanceAPI.update(selected._id, updateForm);
      toast.success('Request updated'); setSelected(null); load();
    } catch (e) { toast.error('Failed to update'); }
  };

  const handleDelete = async () => {
    try {
      await maintenanceAPI.delete(confirm.id);
      toast.success('Request deleted'); setConfirm(null); load();
    } catch (e) { toast.error('Failed to delete'); }
  };

  const openDetail = (req) => {
    setSelected(req);
    setUpdateForm({ status: req.status, updateMessage: '', assignedTo: req.assignedTo?._id || '', cost: req.cost || 0 });
  };

  const priorityIcon = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Maintenance"
        subtitle="Track and manage maintenance requests"
        actions={<button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Request</button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard label="Pending" value={stats.pending || 0} color="text-amber-400" />
        <StatCard label="In Progress" value={stats.inProgress || 0} color="text-teal-400" />
        <StatCard label="Urgent" value={stats.urgent || 0} color="text-red-400" />
        <StatCard label="Completed" value={requests.filter(r => r.status === 'completed').length} color="text-green-400" />
      </div>

      <div className="card mb-5">
        <div className="flex flex-wrap gap-3">
          <div className="flex gap-2 items-center">
            <span className="text-xs text-slate-500">Status:</span>
            {['all', 'pending', 'assigned', 'in-progress', 'completed'].map(s => (
              <button key={s} className={`btn text-xs py-1.5 ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setStatusFilter(s)}>
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-slate-500">Priority:</span>
            {['all', 'urgent', 'high', 'medium', 'low'].map(p => (
              <button key={p} className={`btn text-xs py-1.5 ${priorityFilter === p ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPriorityFilter(p)}>
                {p === 'all' ? 'All' : p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center pt-10"><LoadingSpinner size="lg" /></div>
      ) : requests.length === 0 ? (
        <div className="card"><EmptyState icon="🔧" title="No maintenance requests" subtitle="All clear! No requests found." /></div>
      ) : (
        <div className="card table-wrapper">
          <table>
            <thead><tr><th>Ticket</th><th>Room</th><th>Issue</th><th>Category</th><th>Priority</th><th>Status</th><th>Assigned To</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {requests.map(req => (
                <tr key={req._id} className="cursor-pointer" onClick={() => openDetail(req)}>
                  <td><span className="font-mono text-xs text-slate-500">{req.ticketId}</span></td>
                  <td><span className="font-mono text-primary-400 font-semibold">{req.room?.roomNumber}</span></td>
                  <td>
                    <div className="font-medium text-slate-100 text-sm">{req.title}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[200px]">{req.description}</div>
                  </td>
                  <td><Badge variant="gray">{req.category}</Badge></td>
                  <td>
                    <span className="flex items-center gap-1.5">
                      <span>{priorityIcon[req.priority]}</span>
                      <Badge variant={priorityBadge(req.priority)}>{req.priority}</Badge>
                    </span>
                  </td>
                  <td><Badge variant={statusBadge(req.status)}>{req.status}</Badge></td>
                  <td className="text-xs">{req.assignedTo?.name || <span className="text-slate-600">Unassigned</span>}</td>
                  <td className="text-xs text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</td>
                  <td onClick={e => e.stopPropagation()}>
                    {canManage && <button className="btn btn-ghost text-xs py-1 px-2" onClick={() => openDetail(req)}>Update</button>}
                    {canManage && <button className="btn btn-danger text-xs py-1 px-2 ml-1" onClick={() => setConfirm({ id: req._id })}>Del</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Submit Maintenance Request">
        <div className="form-row">
          <div><label className="label">Room Number *</label><input className="input" placeholder="e.g. 203" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} /></div>
          <div><label className="label">Category *</label><select className="select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
        </div>
        <div className="form-group"><label className="label">Issue Title *</label><input className="input" placeholder="Brief description of the issue" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
        <div className="form-group"><label className="label">Detailed Description *</label><textarea className="input" rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Please describe the issue in detail..." /></div>
        <div className="form-group"><label className="label">Priority</label>
          <div className="grid grid-cols-4 gap-2">
            {['low', 'medium', 'high', 'urgent'].map(p => (
              <button key={p} onClick={() => setForm({ ...form, priority: p })} className={`btn text-xs py-2 justify-center ${form.priority === p ? (p === 'urgent' || p === 'high' ? 'btn-danger' : p === 'medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'btn-success') : 'btn-secondary'}`}>
                {priorityIcon[p]} {p}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <button className="btn btn-primary" onClick={handleCreate}>Submit Request</button>
          <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
        </div>
      </Modal>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`${selected?.ticketId} — ${selected?.title}`} width="max-w-xl">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-surface-2 rounded-lg">
                <div className="label">Room</div>
                <div className="text-sm font-mono font-bold text-primary-400">{selected.room?.roomNumber}</div>
              </div>
              <div className="p-3 bg-surface-2 rounded-lg">
                <div className="label">Category</div>
                <div className="text-sm font-medium text-slate-100">{selected.category}</div>
              </div>
            </div>
            <div className="p-3 bg-surface-2 rounded-lg">
              <div className="label">Description</div>
              <div className="text-sm text-slate-300 leading-relaxed">{selected.description}</div>
            </div>
            <div className="flex gap-3">
              <div><div className="label">Priority</div><Badge variant={priorityBadge(selected.priority)}>{priorityIcon[selected.priority]} {selected.priority}</Badge></div>
              <div><div className="label">Status</div><Badge variant={statusBadge(selected.status)}>{selected.status}</Badge></div>
              <div><div className="label">Submitted</div><div className="text-xs text-slate-400">{new Date(selected.createdAt).toLocaleDateString()}</div></div>
            </div>
            {selected.updates?.length > 0 && (
              <div>
                <div className="label mb-2">Update History</div>
                <div className="space-y-2">
                  {selected.updates.map((u, i) => (
                    <div key={i} className="p-2 bg-surface-2 rounded-lg text-xs">
                      <div className="text-slate-300">{u.message}</div>
                      <div className="text-slate-500 mt-0.5">{new Date(u.createdAt).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {canManage && (
              <div className="border-t border-dark-border pt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Update Request</p>
                <div className="form-row">
                  <div><label className="label">Update Status</label>
                    <select className="select" value={updateForm.status} onChange={e => setUpdateForm({ ...updateForm, status: e.target.value })}>
                      {['pending', 'assigned', 'in-progress', 'completed', 'on-hold', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div><label className="label">Cost (₹)</label><input type="number" className="input" value={updateForm.cost} onChange={e => setUpdateForm({ ...updateForm, cost: parseFloat(e.target.value) })} /></div>
                </div>
                <div className="form-group"><label className="label">Update Message</label><textarea className="input" rows={2} value={updateForm.updateMessage} onChange={e => setUpdateForm({ ...updateForm, updateMessage: e.target.value })} placeholder="Describe what was done or next steps..." /></div>
                <div className="flex gap-2">
                  <button className="btn btn-primary" onClick={handleUpdate}>Save Update</button>
                  <button className="btn btn-secondary" onClick={() => setSelected(null)}>Close</button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={handleDelete} title="Delete Request" message="This will permanently delete this maintenance request." confirmLabel="Delete" />
    </div>
  );
}
