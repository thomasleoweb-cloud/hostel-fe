import React, { useState } from 'react';
import { authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Badge, Avatar } from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, loadUser } = useAuth();
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSave = async () => {
    setSavingProfile(true);
    try {
      await authAPI.updateProfile(profileForm);
      await loadUser();
      toast.success('Profile updated');
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to update'); }
    finally { setSavingProfile(false); }
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) return toast.error('Fill in all password fields');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error('Passwords do not match');
    if (passwordForm.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setSavingPassword(true);
    try {
      await authAPI.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setSavingPassword(false); }
  };

  const roleColors = { admin: 'blue', staff: 'teal', resident: 'gray' };

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader title="My Profile" subtitle="Manage your account settings" />

      <div className="card mb-5">
        <div className="flex items-center gap-5 mb-6">
          <Avatar name={user?.name} size="lg" />
          <div>
            <div className="text-base font-semibold text-slate-100">{user?.name}</div>
            <div className="text-sm text-slate-400">{user?.email}</div>
            <div className="mt-1.5"><Badge variant={roleColors[user?.role] || 'gray'}>{user?.role}</Badge></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 p-4 bg-surface-2 rounded-xl">
          <div><div className="label">Member Since</div><div className="text-sm text-slate-200">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</div></div>
          <div><div className="label">Last Login</div><div className="text-sm text-slate-200">{user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : '—'}</div></div>
          <div><div className="label">Account Status</div><Badge variant="green">Active</Badge></div>
          <div><div className="label">User ID</div><div className="text-xs font-mono text-slate-400">{user?._id}</div></div>
        </div>
      </div>

      <div className="card mb-5">
        <div className="text-sm font-semibold text-slate-100 mb-4">Edit Profile</div>
        <div className="form-row">
          <div><label className="label">Full Name</label><input className="input" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} /></div>
          <div><label className="label">Phone Number</label><input className="input" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} /></div>
        </div>
        <div className="form-group"><label className="label">Email Address (cannot change)</label><input className="input opacity-50 cursor-not-allowed" value={user?.email} readOnly /></div>
        <button className="btn btn-primary" onClick={handleProfileSave} disabled={savingProfile}>
          {savingProfile ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
          {savingProfile ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="card">
        <div className="text-sm font-semibold text-slate-100 mb-4">Change Password</div>
        <div className="form-group"><label className="label">Current Password</label><input type="password" className="input" value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} /></div>
        <div className="form-row">
          <div><label className="label">New Password</label><input type="password" className="input" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} placeholder="Min 6 characters" /></div>
          <div><label className="label">Confirm Password</label><input type="password" className="input" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} /></div>
        </div>
        {passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
          <p className="text-xs text-red-400 mb-3">Passwords do not match</p>
        )}
        <button className="btn btn-primary" onClick={handlePasswordChange} disabled={savingPassword}>
          {savingPassword ? 'Changing...' : 'Change Password'}
        </button>
      </div>
    </div>
  );
}
