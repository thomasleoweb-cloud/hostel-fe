import React, { useEffect, useState, useCallback } from 'react';
import { notificationsAPI } from '../utils/api';
import { PageHeader, EmptyState, Modal } from './common_exports';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export function NotificationsPage() {
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
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markAllRead = async () => {
    try { await notificationsAPI.markAllRead(); load(); toast.success('All marked as read'); } catch {}
  };

  const dismiss = async (id) => {
    try { await notificationsAPI.delete(id); setNotifications(n => n.filter(x => x._id !== id)); } catch {}
  };

  const handleCreate = async () => {
    if (!form.title || !form.message) return toast.error('Title and message required');
    try { await notificationsAPI.create(form); toast.success('Notification sent'); setShowCreate(false); load(); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const typeConfig = {
    info: { color: 'border-primary-500 bg-primary-500/5', badge: 'badge-blue' },
    warning: { color: 'border-amber-500 bg-amber-500/5', badge: 'badge-amber' },
    success: { color: 'border-green-500 bg-green-500/5', badge: 'badge-green' },
    error: { color: 'border-red-500 bg-red-500/5', badge: 'badge-red' },
    payment: { color: 'border-green-500 bg-green-500/5', badge: 'badge-green' },
    maintenance: { color: 'border-amber-500 bg-amber-500/5', badge: 'badge-amber' },
    announcement: { color: 'border-primary-500 bg-primary-500/5', badge: 'badge-blue' },
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Notifications" subtitle={`${unreadCount} unread`}
        actions={<div className="flex gap-2">
          {unreadCount > 0 && <button className="btn btn-secondary" onClick={markAllRead}>Mark all read</button>}
          {canManage && <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Send Notification</button>}
        </div>}
      />
      {loading ? <div className="flex justify-center pt-10"><LoadingSpinner size="lg" /></div>
        : notifications.length === 0 ? <div className="card"><EmptyState title="No notifications" subtitle="You're all caught up!" /></div>
        : <div className="space-y-3">
          {notifications.map(n => {
            const cfg = typeConfig[n.type] || typeConfig.info;
            const isUnread = n.recipients?.[0]?.isRead === false;
            return (
              <div key={n._id} className={`card border-l-4 ${cfg.color} flex gap-4 ${isUnread ? 'ring-1 ring-dark-border2' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-100">{n.title}</span>
                    {isUnread && <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />}
                    <span className={`badge ${cfg.badge} ml-auto`}>{n.type}</span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{n.message}</p>
                  <div className="text-xs text-slate-600 mt-1.5">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
                <button onClick={() => dismiss(n._id)} className="btn btn-ghost text-xs py-1 px-2 self-start">Dismiss</button>
              </div>
            );
          })}
        </div>}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Send Notification">
        <div className="form-group"><label className="label">Title *</label><input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
        <div className="form-group"><label className="label">Message *</label><textarea className="input" rows={3} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} /></div>
        <div className="form-row">
          <div><label className="label">Type</label><select className="select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            {['info', 'warning', 'success', 'error', 'payment', 'maintenance', 'announcement'].map(t => <option key={t}>{t}</option>)}
          </select></div>
          <div><label className="label">Send To</label><select className="select" value={form.recipientRole} onChange={e => setForm({ ...form, recipientRole: e.target.value })}>
            <option value="all">All Users</option><option value="resident">Residents Only</option><option value="staff">Staff Only</option><option value="admin">Admin Only</option>
          </select></div>
        </div>
        <div className="form-group">
          <label className="label">Channels</label>
          <div className="flex gap-4">{[['inApp', ' In-App'], ['email', ' Email'], ['sms', ' SMS']].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={form.channels[key]} onChange={e => setForm({ ...form, channels: { ...form.channels, [key]: e.target.checked } })} />
              {label}
            </label>
          ))}</div>
        </div>
        <div className="flex gap-2 mt-2">
          <button className="btn btn-primary" onClick={handleCreate}>Send Notification</button>
          <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}
