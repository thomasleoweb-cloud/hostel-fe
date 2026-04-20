import React, { useEffect, useState, useCallback } from 'react';
import { roomsAPI, residentsAPI } from '../utils/api';
import { Badge, statusBadge, Modal, StatCard, PageHeader, SearchInput, EmptyState, ConfirmDialog } from '../components/common/LoadingSpinner';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ROOM_TYPES = ['Single', 'Double', 'Triple', 'Suite'];
const AMENITIES = ['AC', 'WiFi', 'Geyser', 'TV', 'Attached Bathroom', 'Balcony', 'Study Table', 'Wardrobe'];

export default function RoomsPage() {
  const { canManage, isAdmin } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('grid');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [checkinRoom, setCheckinRoom] = useState(null);
  const [residents, setResidents] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const [editRoom, setEditRoom] = useState(null);
  const [form, setForm] = useState({ roomNumber: '', floor: 1, type: 'Single', capacity: 1, monthlyRate: 3500, amenities: [], description: '' });
  const [checkinForm, setCheckinForm] = useState({ residentId: '', checkInDate: new Date().toISOString().split('T')[0], expectedCheckOut: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;
      const { data } = await roomsAPI.getAll(params);
      setRooms(data.data || []);
      setStats(data.stats || {});
    } catch { toast.error('Failed to load rooms'); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const filtered = rooms.filter(r =>
    r.roomNumber?.toLowerCase().includes(search.toLowerCase()) ||
    r.type?.toLowerCase().includes(search.toLowerCase()) ||
    r.currentResident?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateOrUpdate = async () => {
    try {
      if (editRoom) {
        await roomsAPI.update(editRoom._id, form);
        toast.success('Room updated');
      } else {
        await roomsAPI.create(form);
        toast.success('Room created');
      }
      setShowForm(false); setEditRoom(null);
      setForm({ roomNumber: '', floor: 1, type: 'Single', capacity: 1, monthlyRate: 3500, amenities: [], description: '' });
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to save room'); }
  };

  const openCheckin = async (room) => {
    setCheckinRoom(room);
    try {
      const { data } = await residentsAPI.getAll({ status: 'active', limit: 100 });
      const unassigned = (data.data || []).filter(r => !r.room);
      setResidents(unassigned);
    } catch { setResidents([]); }
    setShowCheckin(true);
  };

  const handleCheckin = async () => {
    try {
      await roomsAPI.checkIn(checkinRoom._id, checkinForm);
      toast.success('Check-in successful');
      setShowCheckin(false); setCheckinRoom(null);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Check-in failed'); }
  };

  const handleCheckout = async (roomId) => {
    try {
      await roomsAPI.checkOut(roomId, {});
      toast.success('Check-out successful'); setConfirm(null); load();
    } catch (e) { toast.error(e.response?.data?.message || 'Check-out failed'); }
  };

  const openEdit = (room) => {
    setEditRoom(room);
    setForm({ roomNumber: room.roomNumber, floor: room.floor, type: room.type, capacity: room.capacity, monthlyRate: room.monthlyRate, amenities: room.amenities || [], description: room.description || '' });
    setShowForm(true);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Room Management"
        subtitle={`${stats.total || 0} total rooms • ${stats.occupancyRate || 0}% occupied`}
        actions={canManage && <button className="btn btn-primary" onClick={() => { setEditRoom(null); setShowForm(true); }}>+ Add Room</button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard label="Total Rooms" value={stats.total || 0} />
        <StatCard label="Available" value={stats.available || 0} color="text-green-400" />
        <StatCard label="Occupied" value={stats.occupied || 0} color="text-primary-400" />
        <StatCard label="Maintenance" value={stats.maintenance || 0} color="text-amber-400" />
      </div>

      <div className="card mb-5">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-2">
            {['all', 'available', 'occupied', 'maintenance', 'reserved'].map(f => (
              <button key={f} className={`btn text-xs py-1.5 ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="ml-auto flex gap-2 items-center">
            <SearchInput value={search} onChange={setSearch} placeholder="Search rooms..." />
            <button className={`btn ${view === 'grid' ? 'btn-primary' : 'btn-secondary'} text-xs`} onClick={() => setView('grid')}> Grid</button>
            <button className={`btn ${view === 'list' ? 'btn-primary' : 'btn-secondary'} text-xs`} onClick={() => setView('list')}> List</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center pt-10"><LoadingSpinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="card"><EmptyState icon="🏠" title="No rooms found" /></div>
      ) : view === 'grid' ? (
        <div className="card">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {filtered.map(room => (
              <div
                key={room._id}
                onClick={() => setSelected(room)}
                className={`p-3 rounded-xl border cursor-pointer transition-all text-center hover:scale-105
                  ${room.status === 'available' ? 'bg-green-500/10 border-green-500/25' :
                    room.status === 'occupied' ? 'bg-primary-500/10 border-primary-500/25' :
                    room.status === 'maintenance' ? 'bg-amber-500/10 border-amber-500/25' :
                    'bg-surface-2 border-dark-border'}`}
              >
                <div className="text-lg font-mono font-bold text-slate-100 leading-tight">{room.roomNumber}</div>
                <div className="text-xs text-slate-500 mt-0.5">{room.type}</div>
                <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-1.5 ${room.status === 'available' ? 'bg-green-400' : room.status === 'occupied' ? 'bg-primary-400' : 'bg-amber-400'}`} />
                <div className="text-xs font-mono text-slate-400 mt-1">₹{(room.monthlyRate/1000).toFixed(1)}k</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card table-wrapper">
          <table>
            <thead><tr><th>Room</th><th>Floor</th><th>Type</th><th>Status</th><th>Resident</th><th>Rate/mo</th><th>Amenities</th>{canManage && <th>Actions</th>}</tr></thead>
            <tbody>
              {filtered.map(room => (
                <tr key={room._id}>
                  <td><span className="font-mono font-bold text-slate-100">{room.roomNumber}</span></td>
                  <td>Floor {room.floor}</td>
                  <td>{room.type}</td>
                  <td><Badge variant={statusBadge(room.status)}>{room.status}</Badge></td>
                  <td>{room.currentResident?.name || <span className="text-slate-600">Vacant</span>}</td>
                  <td><span className="font-mono text-green-400">₹{room.monthlyRate.toLocaleString()}</span></td>
                  <td><div className="flex flex-wrap gap-1">{(room.amenities || []).slice(0, 3).map(a => <span key={a} className="badge badge-gray text-xs">{a}</span>)}{(room.amenities || []).length > 3 && <span className="text-xs text-slate-500">+{room.amenities.length - 3}</span>}</div></td>
                  {canManage && <td>
                    <div className="flex gap-1">
                      <button className="btn btn-ghost text-xs py-1 px-2" onClick={() => openEdit(room)}>Edit</button>
                      {room.status === 'available' && <button className="btn btn-success text-xs py-1 px-2" onClick={() => openCheckin(room)}>Check-in</button>}
                      {room.status === 'occupied' && <button className="btn btn-danger text-xs py-1 px-2" onClick={() => setConfirm({ type: 'checkout', id: room._id })}>Check-out</button>}
                    </div>
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Room ${selected?.roomNumber}`}>
        {selected && <>
          <div className="grid grid-cols-2 gap-4 mb-5">
            {[['Type', selected.type], ['Floor', `Floor ${selected.floor}`], ['Capacity', `${selected.capacity} person(s)`], ['Monthly Rate', `₹${selected.monthlyRate.toLocaleString()}`], ['Status', selected.status], ['Resident', selected.currentResident?.name || 'Vacant']].map(([l, v]) => (
              <div key={l}><div className="label">{l}</div><div className="text-sm font-medium text-slate-100">{v}</div></div>
            ))}
          </div>
          {selected.amenities?.length > 0 && <div className="mb-4">
            <div className="label mb-2">Amenities</div>
            <div className="flex flex-wrap gap-1.5">{selected.amenities.map(a => <span key={a} className="badge badge-blue">{a}</span>)}</div>
          </div>}
          {canManage && <div className="flex gap-2 mt-2">
            <button className="btn btn-secondary" onClick={() => { openEdit(selected); setSelected(null); }}>Edit</button>
            {selected.status === 'available' && <button className="btn btn-success" onClick={() => { setSelected(null); openCheckin(selected); }}>Check-in Resident</button>}
            {selected.status === 'occupied' && <button className="btn btn-danger" onClick={() => { setSelected(null); setConfirm({ type: 'checkout', id: selected._id }); }}>Process Check-out</button>}
          </div>}
        </>}
      </Modal>

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditRoom(null); }} title={editRoom ? 'Edit Room' : 'Add New Room'}>
        <div className="form-row">
          <div className="form-group"><label className="label">Room Number</label><input className="input" value={form.roomNumber} onChange={e => setForm({ ...form, roomNumber: e.target.value })} placeholder="e.g. 101" /></div>
          <div className="form-group"><label className="label">Floor</label><input type="number" className="input" value={form.floor} onChange={e => setForm({ ...form, floor: parseInt(e.target.value) })} min="1" /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="label">Room Type</label><select className="select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{ROOM_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
          <div className="form-group"><label className="label">Capacity</label><input type="number" className="input" value={form.capacity} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) })} min="1" max="10" /></div>
        </div>
        <div className="form-group"><label className="label">Monthly Rate (₹)</label><input type="number" className="input" value={form.monthlyRate} onChange={e => setForm({ ...form, monthlyRate: parseInt(e.target.value) })} /></div>
        <div className="form-group">
          <label className="label">Amenities</label>
          <div className="grid grid-cols-2 gap-2">{AMENITIES.map(a => (
            <label key={a} className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
              <input type="checkbox" checked={form.amenities.includes(a)} onChange={e => setForm({ ...form, amenities: e.target.checked ? [...form.amenities, a] : form.amenities.filter(x => x !== a) })} className="rounded" />
              {a}
            </label>
          ))}</div>
        </div>
        <div className="form-group"><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional notes..." /></div>
        <div className="flex gap-2 mt-2">
          <button className="btn btn-primary" onClick={handleCreateOrUpdate}>{editRoom ? 'Update Room' : 'Create Room'}</button>
          <button className="btn btn-secondary" onClick={() => { setShowForm(false); setEditRoom(null); }}>Cancel</button>
        </div>
      </Modal>

      <Modal open={showCheckin} onClose={() => setShowCheckin(false)} title={`Check-in to Room ${checkinRoom?.roomNumber}`}>
        <div className="form-group">
          <label className="label">Select Resident</label>
          <select className="select" value={checkinForm.residentId} onChange={e => setCheckinForm({ ...checkinForm, residentId: e.target.value })}>
            <option value="">-- Select Resident --</option>
            {residents.map(r => <option key={r._id} value={r._id}>{r.name} ({r.residentId || r.email})</option>)}
          </select>
          {residents.length === 0 && <p className="text-xs text-amber-400 mt-1">No unassigned active residents found.</p>}
        </div>
        <div className="form-row">
          <div className="form-group"><label className="label">Check-in Date</label><input type="date" className="input" value={checkinForm.checkInDate} onChange={e => setCheckinForm({ ...checkinForm, checkInDate: e.target.value })} /></div>
          <div className="form-group"><label className="label">Expected Check-out</label><input type="date" className="input" value={checkinForm.expectedCheckOut} onChange={e => setCheckinForm({ ...checkinForm, expectedCheckOut: e.target.value })} /></div>
        </div>
        <div className="flex gap-2 mt-2">
          <button className="btn btn-success" onClick={handleCheckin} disabled={!checkinForm.residentId}>Confirm Check-in</button>
          <button className="btn btn-secondary" onClick={() => setShowCheckin(false)}>Cancel</button>
        </div>
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => handleCheckout(confirm?.id)} title="Confirm Check-out" message="Are you sure you want to check out this resident? This action cannot be undone." confirmLabel="Process Check-out" />
    </div>
  );
}
