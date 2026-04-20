import React, { useEffect, useState, useCallback } from 'react';
import { notificationsAPI } from '../utils/api';
import { PageHeader, EmptyState, Modal } from '../components/common/LoadingSpinner';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TYPE_CONFIG = {
  info: { border: 'border-primary-500', bg: 'bg-primary-500/5', badge: 'badge-blue' },
  warning: { border: 'border-amber-500', bg: 'bg-amber-500/5', badge: 'badge-amber' },
  success: { border: 'border-green-500', bg: 'bg-green-500/5', badge: 'badge-green' },
  error: { border: 'border-red-500', bg: 'bg-red-500/5',badge: 'badge-red' },
  payment: { border: 'border-green-500', bg: 'bg-green-500/5', badge: 'badge-green' },
  maintenance: { border: 'border-amber-500', bg: 'bg-amber-500/5',badge: 'badge-amber' },
  announcement: { border: 'border-primary-500', bg: 'bg-primary-500/5', badge: 'badge-blue' },
};

export default function NotificationsPage() {
  const { canManage } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'info', recipientRole: 'all', channels: { inApp: true, email: false, sms: false } });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await notificationsAPI.getAll({ limit: 30 });
      setNotifications(data.data || []);
      setUnreadCount(data.unreadCount || 0);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markAllRead = async () => {
    try { await notificationsAPI.markAllRead(); toast.success('All marked as read'); load(); } catch {}
  };

  const dismiss = async (id) => {
    try { await notificationsAPI.delete(id); setNotifications(n => n.filter(x => x._id !== id)); } catch {}
  };

  const handleCreate = async () => {
    if (!form.title || !form.message) return toast.error('Title and message required');
    try { await notificationsAPI.create(form); toast.success('Sent!'); setShowCreate(false); load(); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Notifications" subtitle={`${unreadCount} unread notifications`}
        actions={
          <div className="flex gap-2">
            {unreadCount > 0 && <button className="btn btn-secondary" onClick={markAllRead}>✓ Mark all read</button>}
            {canManage && <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Send Notification</button>}
          </div>
        }
      />

      {loading ? <div className="flex justify-center pt-10"><LoadingSpinner size="lg" /></div>
        : notifications.length === 0 ? <div className="card"><EmptyState title="All clear!" subtitle="No notifications to show" /></div>
        : <div className="space-y-3">
          {notifications.map(n => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
            const isUnread = n.recipients?.[0]?.isRead === false;
            return (
              <div key={n._id} className={`p-4 rounded-xl border-l-4 ${cfg.border} ${cfg.bg} border border-dark-border flex gap-4 ${isUnread ? 'ring-1 ring-primary-500/20' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-100 flex-1">{n.title}</span>
                    {isUnread && <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />}
                    <span className={`badge ${cfg.badge}`}>{n.type}</span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{n.message}</p>
                  <div className="text-xs text-slate-600 mt-2">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
                <button onClick={() => dismiss(n._id)} className="btn btn-ghost text-xs py-1 px-2 self-start flex-shrink-0">✕</button>
              </div>
            );
          })}
        </div>}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Send Notification">
        <div className="form-group"><label className="label">Title *</label><input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Notification title" /></div>
        <div className="form-group"><label className="label">Message *</label><textarea className="input" rows={3} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Notification message..." /></div>
        <div className="form-row">
          <div><label className="label">Type</label><select className="select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            {Object.keys(TYPE_CONFIG).map(t => <option key={t}>{t}</option>)}
          </select></div>
          <div><label className="label">Recipients</label><select className="select" value={form.recipientRole} onChange={e => setForm({ ...form, recipientRole: e.target.value })}>
            <option value="all">All Users</option><option value="resident">Residents</option><option value="staff">Staff</option><option value="admin">Admins</option>
          </select></div>
        </div>
        <div className="form-group">
          <label className="label">Delivery Channels</label>
          <div className="flex gap-4 flex-wrap">{[['inApp', ' In-App'], ['email', ' Email'], ['sms', ' SMS']].map(([k, label]) => (
            <label key={k} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={form.channels[k]} onChange={e => setForm({ ...form, channels: { ...form.channels, [k]: e.target.checked } })} />
              {label}
            </label>
          ))}</div>
        </div>
        <div className="flex gap-2 mt-2">
          <button className="btn btn-primary" onClick={handleCreate}>Send</button>
          <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}
