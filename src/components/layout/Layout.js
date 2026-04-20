import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationsAPI } from '../../utils/api';

const NAV = [
  { path: '/', label: 'Dashboard', exact: true, roles: ['admin','staff','resident'] },
  { path: '/rooms', label: 'Rooms', roles: ['admin','staff','resident'] },
  { path: '/residents', label: 'Residents', roles: ['admin','staff'] },
  { path: '/maintenance', label: 'Maintenance', roles: ['admin','staff','resident'] },
  { path: '/billing', label: 'Billing', roles: ['admin','staff','resident'] },
  { path: '/reports', label: 'Reports', roles: ['admin','staff'] },
  { path: '/notifications', label: 'Notifications', roles: ['admin','staff','resident'], badge: true },
  { path: '/users', label: 'Users & Roles', roles: ['admin'] },
];

const InitialsAvatar = ({ name, size = 'sm' }) => {
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  return <div className={`${sz} rounded-full bg-primary-500/20 text-primary-400 font-semibold flex items-center justify-center flex-shrink-0`}>{initials}</div>;
};

export default function Layout() {
  const { user, logout, isAdmin, canManage } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await notificationsAPI.getAll({ unreadOnly: true, limit: 1 });
        setUnreadCount(data.unreadCount || 0);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const visibleNav = NAV.filter(n => n.roles.includes(user?.role));

  return (
    <div className="flex h-screen overflow-hidden bg-dark">
     
      <aside className={`${sidebarOpen ? 'w-56' : 'w-106'} flex-shrink-0 bg-surface border-r border-dark-border flex flex-col transition-all duration-200`}>
        
        <div className="h-14 flex items-center gap-3 px-4 border-b border-dark-border flex-shrink-0">          
           <div>
            <div className="text-sm font-semibold text-slate-100 leading-tight">Hostel</div>
            <div className="text-xs text-slate-500 font-mono">Management</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          
          {
            visibleNav.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${!sidebarOpen ? 'justify-center px-0' : ''}`}
            >
               <span className="flex-1">{item.label}</span>
              {sidebarOpen && item.badge && unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white rounded-full text-xs px-1.5 py-0.5 font-semibold">{unreadCount}</span>
              )}
            </NavLink>
            ))
          }
        </nav>

        <div className="p-2 border-t border-dark-border">
          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-surface-2 transition-colors text-left"
          >
            <InitialsAvatar name={user?.name} />
            {sidebarOpen && <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-slate-200 truncate">{user?.name}</div>
              <div className="text-xs text-slate-500 capitalize">{user?.role}</div>
            </div>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-surface border-b border-dark-border flex items-center px-5 gap-4 flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-slate-200 transition-colors text-lg">
            Menu
          </button>
          <div className="flex-1" />
          <button
            onClick={() => navigate('/notifications')}
            className="relative w-20 h-9 rounded-lg hover:bg-surface-2 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
          >
            Notify
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
          </button>
          <button
            onClick={logout}
            className="btn btn-ghost text-xs px-3 py-1.5"
          >
            Sign out
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
