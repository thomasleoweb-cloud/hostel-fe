import React, { useEffect, useState, useCallback } from 'react';
import { residentsAPI, roomsAPI } from '../utils/api';
import { Badge, statusBadge, Modal, PageHeader, SearchInput, EmptyState, ConfirmDialog, Avatar } from '../components/common/LoadingSpinner';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', email: '', phone: '', gender: 'Male', dateOfBirth: '', occupation: '', institution: '', permanentAddress: { street: '', city: '', state: '', pincode: '' }, emergencyContact: { name: '', relationship: '', phone: '', email: '' }, securityDeposit: 5000 };

export default function ResidentsPage() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editResident, setEditResident] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { search, limit: 50 };
      if (statusFilter !== 'all') params.status = statusFilter;
      const { data } = await residentsAPI.getAll(params);
      setResidents(data.data || []);
      setTotal(data.count || 0);
    } catch { toast.error('Failed to load residents'); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const loadAvailableRooms = async () => {
    try {
      const { data } = await roomsAPI.getAll({ status: 'available', limit: 100 });
      setAvailableRooms(data.data || []);
    } catch { setAvailableRooms([]); }
  };

  const openCreate = async () => {
    setEditResident(null);
    setForm(EMPTY_FORM);
    await loadAvailableRooms();
    setShowForm(true);
  };

  const openEdit = async (r) => {
    setEditResident(r);
    setForm({ name: r.name, email: r.email, phone: r.phone, gender: r.gender, dateOfBirth: r.dateOfBirth?.split('T')[0] || '', occupation: r.occupation || '', institution: r.institution || '', permanentAddress: r.permanentAddress || { street: '', city: '', state: '', pincode: '' }, emergencyContact: r.emergencyContact || { name: '', relationship: '', phone: '', email: '' }, securityDeposit: r.securityDeposit || 0 });
    await loadAvailableRooms();
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email || !form.phone || !form.emergencyContact.name || !form.emergencyContact.phone) {
      return toast.error('Please fill in all required fields');
    }
    try {
      if (editResident) {
        await residentsAPI.update(editResident._id, form);
        toast.success('Resident updated');
      } else {
        await residentsAPI.create(form);
        toast.success('Resident created');
      }
      setShowForm(false); load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to save'); }
  };

  const handleDelete = async () => {
    try {
      await residentsAPI.delete(confirm.id);
      toast.success('Resident deleted'); setConfirm(null); load();
    } catch (e) { toast.error(e.response?.data?.message || 'Cannot delete this resident'); }
  };

  const setField = (path, value) => {
    const keys = path.split('.');
    if (keys.length === 1) { setForm(f => ({ ...f, [path]: value })); return; }
    setForm(f => ({ ...f, [keys[0]]: { ...f[keys[0]], [keys[1]]: value } }));
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Residents"
        subtitle={`${total} residents registered`}
        actions={<button className="btn btn-primary" onClick={openCreate}>+ Add Resident</button>}
      />

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex gap-2">
          {['active', 'pending', 'checked-out', 'all'].map(s => (
            <button key={s} className={`btn text-xs py-1.5 ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setStatusFilter(s)}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="ml-auto w-64"><SearchInput value={search} onChange={setSearch} placeholder="Search by name, email..." /></div>
      </div>

      {loading ? (
        <div className="flex justify-center pt-10"><LoadingSpinner size="lg" /></div>
      ) : residents.length === 0 ? (
        <div className="card"><EmptyState icon="👥" title="No residents found" subtitle="Try adjusting your filters or add a new resident" /></div>
      ) : (
        <div className="card table-wrapper">
          <table>
            <thead><tr><th>Resident</th><th>Room</th><th>Contact</th><th>City</th><th>Check-in</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {residents.map(r => (
                <tr key={r._id} className="cursor-pointer" onClick={() => setSelected(r)}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={r.name} />
                      <div>
                        <div className="text-sm font-medium text-slate-100">{r.name}</div>
                        <div className="text-xs text-slate-500">{r.residentId}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="font-mono text-primary-400 font-semibold">{r.room?.roomNumber || '—'}</span></td>
                  <td>
                    <div className="text-xs text-slate-400">{r.phone}</div>
                    <div className="text-xs text-slate-500">{r.email}</div>
                  </td>
                  <td className="text-xs">{r.permanentAddress?.city || '—'}</td>
                  <td className="text-xs text-slate-500">{r.checkInDate ? new Date(r.checkInDate).toLocaleDateString() : '—'}</td>
                  <td>
                    <span className={`font-mono text-xs font-semibold ${r.outstandingBalance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {r.outstandingBalance > 0 ? `₹${r.outstandingBalance.toLocaleString()} due` : '✓ Clear'}
                    </span>
                  </td>
                  <td><Badge variant={statusBadge(r.status)}>{r.status}</Badge></td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button className="btn btn-ghost text-xs py-1 px-2" onClick={() => openEdit(r)}>Edit</button>
                      {r.status === 'checked-out' && <button className="btn btn-danger text-xs py-1 px-2" onClick={() => setConfirm({ id: r._id })}>Delete</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Resident Profile" width="max-w-xl">
        {selected && (
          <>
            <div className="flex items-center gap-4 mb-5 p-4 bg-surface-2 rounded-xl">
              <Avatar name={selected.name} size="lg" />
              <div>
                <div className="text-base font-semibold text-slate-100">{selected.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{selected.residentId} · {selected.gender}</div>
                <div className="mt-1"><Badge variant={statusBadge(selected.status)}>{selected.status}</Badge></div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-xs text-slate-500">Room</div>
                <div className="text-lg font-mono font-bold text-primary-400">{selected.room?.roomNumber || '—'}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4">
              {[['Phone', selected.phone], ['Email', selected.email], ['Date of Birth', selected.dateOfBirth ? new Date(selected.dateOfBirth).toLocaleDateString() : '—'], ['Check-in', selected.checkInDate ? new Date(selected.checkInDate).toLocaleDateString() : '—'], ['Security Deposit', `₹${(selected.securityDeposit || 0).toLocaleString()} (${selected.depositStatus})`], ['Outstanding', <span className={selected.outstandingBalance > 0 ? 'text-red-400' : 'text-green-400'}>₹{(selected.outstandingBalance || 0).toLocaleString()}</span>]].map(([l, v]) => (
                <div key={l}><div className="label">{l}</div><div className="text-sm text-slate-200">{v}</div></div>
              ))}
            </div>
            <div className="p-3 bg-surface-2 rounded-lg mb-4">
              <div className="label mb-1">Emergency Contact</div>
              <div className="text-sm font-medium text-slate-100">{selected.emergencyContact?.name}</div>
              <div className="text-xs text-slate-500">{selected.emergencyContact?.relationship} · {selected.emergencyContact?.phone}</div>
            </div>
            {selected.permanentAddress?.city && <div className="p-3 bg-surface-2 rounded-lg">
              <div className="label mb-1">Address</div>
              <div className="text-sm text-slate-300">{[selected.permanentAddress.street, selected.permanentAddress.city, selected.permanentAddress.state, selected.permanentAddress.pincode].filter(Boolean).join(', ')}</div>
            </div>}
            <div className="flex gap-2 mt-4">
              <button className="btn btn-primary" onClick={() => { setSelected(null); openEdit(selected); }}>Edit</button>
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>Close</button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editResident ? 'Edit Resident' : 'Add New Resident'} width="max-w-2xl">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Personal Information</p>
            <div className="form-row">
              <div><label className="label">Full Name *</label><input className="input" value={form.name} onChange={e => setField('name', e.target.value)} /></div>
              <div><label className="label">Gender *</label><select className="select" value={form.gender} onChange={e => setField('gender', e.target.value)}><option>Male</option><option>Female</option><option>Other</option></select></div>
            </div>
            <div className="form-row">
              <div><label className="label">Email *</label><input type="email" className="input" value={form.email} onChange={e => setField('email', e.target.value)} /></div>
              <div><label className="label">Phone *</label><input className="input" value={form.phone} onChange={e => setField('phone', e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div><label className="label">Date of Birth</label><input type="date" className="input" value={form.dateOfBirth} onChange={e => setField('dateOfBirth', e.target.value)} /></div>
              <div><label className="label">Security Deposit (₹)</label><input type="number" className="input" value={form.securityDeposit} onChange={e => setField('securityDeposit', parseInt(e.target.value))} /></div>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Address</p>
            <div className="form-row">
              <div><label className="label">City</label><input className="input" value={form.permanentAddress.city} onChange={e => setField('permanentAddress.city', e.target.value)} /></div>
              <div><label className="label">State</label><input className="input" value={form.permanentAddress.state} onChange={e => setField('permanentAddress.state', e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div><label className="label">Street</label><input className="input" value={form.permanentAddress.street} onChange={e => setField('permanentAddress.street', e.target.value)} /></div>
              <div><label className="label">Pincode</label><input className="input" value={form.permanentAddress.pincode} onChange={e => setField('permanentAddress.pincode', e.target.value)} /></div>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Emergency Contact</p>
            <div className="form-row">
              <div><label className="label">Name *</label><input className="input" value={form.emergencyContact.name} onChange={e => setField('emergencyContact.name', e.target.value)} /></div>
              <div><label className="label">Relationship</label><input className="input" value={form.emergencyContact.relationship} onChange={e => setField('emergencyContact.relationship', e.target.value)} /></div>
            </div>
            <div><label className="label">Phone *</label><input className="input" value={form.emergencyContact.phone} onChange={e => setField('emergencyContact.phone', e.target.value)} /></div>
          </div>
          <div className="flex gap-2 pt-2">
            <button className="btn btn-primary" onClick={handleSave}>{editResident ? 'Update' : 'Create Resident'}</button>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={handleDelete} title="Delete Resident" message="This will permanently delete the resident record." confirmLabel="Delete" />
    </div>
  );
}
