import React from 'react';

export default function LoadingSpinner({ size = 'md' }) {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }[size];
  return (
    <div className={`${s} border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin`} />
  );
}

export function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal ${width}`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="modal-title mb-0">{title}</h3>
          <button onClick={onClose} className="btn btn-ghost px-2 py-1 text-xs">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Badge({ children, variant = 'gray' }) {
  const map = { green: 'badge-green', red: 'badge-red', amber: 'badge-amber', blue: 'badge-blue', teal: 'badge-teal', gray: 'badge-gray', pink: 'badge-pink' };
  return <span className={`badge ${map[variant] || 'badge-gray'}`}>{children}</span>;
}

export const statusBadge = (status) => {
  const map = {
    active: 'green', available: 'green', paid: 'green', completed: 'green',
    occupied: 'blue', 'in-progress': 'teal', partial: 'amber', assigned: 'blue',
    maintenance: 'amber', pending: 'amber', overdue: 'red', suspended: 'red',
    'checked-out': 'gray', cancelled: 'gray', reserved: 'pink',
  };
  return map[status] || 'gray';
};

export const priorityBadge = (p) => ({ high: 'red', urgent: 'red', medium: 'amber', low: 'green' }[p] || 'gray');

export function StatCard({ label, value, color = 'text-slate-100', change, icon }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-2">
        <div className="stat-label">{label}</div>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <div className={`stat-value ${color}`}>{value}</div>
      {change && <div className={`text-xs mt-1.5 ${change.startsWith('+') ? 'text-green-400' : change.startsWith('-') ? 'text-red-400' : 'text-slate-500'}`}>{change}</div>}
    </div>
  );
}

export function EmptyState({ title = 'No data found', subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-sm font-medium text-slate-300 mb-1">{title}</div>
      {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title = 'Are you sure?', message, confirmLabel = 'Confirm', danger = true }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-sm" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        {message && <p className="text-sm text-slate-400 mb-5">{message}</p>}
        <div className="flex gap-3">
          <button onClick={onConfirm} className={`btn flex-1 ${danger ? 'btn-danger' : 'btn-primary'}`}>{confirmLabel}</button>
          <button onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export function Avatar({ name, size = 'sm' }) {
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
  const sz = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }[size];
  return (
    <div className={`${sz} rounded-full bg-primary-500/20 text-primary-400 font-semibold flex items-center justify-center flex-shrink-0`}>
      {initials}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-100">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative">
      <input
        className="input pl-9"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 border-b border-dark-border mb-5">
      {tabs.map(t => (
        <button
          key={t.value}
          className={`tab ${active === t.value ? 'active' : ''}`}
          onClick={() => onChange(t.value)}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 text-xs opacity-60">({t.count})</span>}
        </button>
      ))}
    </div>
  );
}
