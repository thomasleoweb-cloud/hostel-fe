import React, { useEffect, useState } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { reportsAPI } from '../utils/api';
import { StatCard } from '../components/common/LoadingSpinner';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const CHART_OPTS = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
  scales: {
    x: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
    y: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.06)' } }
  }
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await reportsAPI.dashboard();
        setStats(data.data);
      } catch {
        setStats({
          rooms: { total: 40, occupied: 28, available: 10, maintenance: 2, occupancyRate: 70 },
          residents: { total: 30, active: 28 },
          maintenance: { pending: 3, inProgress: 2 },
          finance: { revenueCurrent: 125000, revenueLastMonth: 102000, totalDue: 4200, revenueGrowth: 22.5 }
        });
      } finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center pt-20"><LoadingSpinner size="lg" /></div>;

  const occupancyData = {
    labels: ['Occupied', 'Available', 'Maintenance'],
    datasets: [{ data: [stats.rooms.occupied, stats.rooms.available, stats.rooms.maintenance], backgroundColor: ['rgba(99,102,241,0.8)', 'rgba(34,197,94,0.8)', 'rgba(245,158,11,0.8)'], borderColor: ['#6366f1','#22c55e','#f59e0b'], borderWidth: 1 }]
  };

  const revenueData = {
    labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    datasets: [
      { label: 'Revenue', data: [82000, 91000, 88000, 95000, 102000, 125000], backgroundColor: 'rgba(99,102,241,0.6)', borderColor: '#6366f1', borderWidth: 1, borderRadius: 5 },
      { label: 'Expenses', data: [35000, 38000, 41000, 37000, 42000, 45000], backgroundColor: 'rgba(20,184,166,0.5)', borderColor: '#14b8a6', borderWidth: 1, borderRadius: 5 }
    ]
  };

  const lineData = {
    labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    datasets: [{
      label: 'Occupancy %',
      data: [62, 65, 68, 72, 68, 70],
      borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.08)', tension: 0.4, fill: true, pointBackgroundColor: '#6366f1', pointRadius: 4
    }]
  };

  return (
    <div className="animate-fade-in space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Occupancy Rate" value={`${stats.rooms.occupancyRate}%`} color="text-primary-400" change={`+3% vs last month`}  />
        <StatCard label="Revenue (Mar)" value={`₹${(stats.finance.revenueCurrent/1000).toFixed(0)}k`} color="text-green-400" change={`+${stats.finance.revenueGrowth}% vs Feb`}  />
        <StatCard label="Outstanding" value={`₹${(stats.finance.totalDue/1000).toFixed(1)}k`} color="text-red-400" change="3 residents pending" />
        <StatCard label="Maintenance" value={stats.maintenance.pending} color="text-amber-400" change={`${stats.maintenance.inProgress} in progress`} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card cursor-pointer hover:border-dark-border2 transition-colors" onClick={() => navigate('/rooms')}>
          <div className="flex justify-between mb-3"><span className="text-xs text-slate-500">Total Rooms</span><span className="text-sm"></span></div>
          <div className="text-2xl font-mono font-semibold text-slate-100">{stats.rooms.total}</div>
          <div className="flex gap-3 mt-2 text-xs text-slate-500">
            <span className="text-green-400">{stats.rooms.available} free</span>
            <span className="text-amber-400">{stats.rooms.maintenance} maint.</span>
          </div>
        </div>
        <div className="card cursor-pointer hover:border-dark-border2 transition-colors" onClick={() => navigate('/residents')}>
          <div className="flex justify-between mb-3"><span className="text-xs text-slate-500">Active Residents</span><span className="text-sm"></span></div>
          <div className="text-2xl font-mono font-semibold text-slate-100">{stats.residents.active}</div>
          <div className="text-xs text-slate-500 mt-2">{stats.residents.total} total registered</div>
        </div>
        <div className="card">
          <div className="flex justify-between mb-3"><span className="text-xs text-slate-500">Collection Rate</span><span className="text-sm"></span></div>
          <div className="text-2xl font-mono font-semibold text-teal-400">
            {Math.round(stats.finance.revenueCurrent / (stats.finance.revenueCurrent + stats.finance.totalDue) * 100)}%
          </div>
          <div className="w-full bg-surface-3 rounded-full h-1.5 mt-3">
            <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${Math.round(stats.finance.revenueCurrent / (stats.finance.revenueCurrent + stats.finance.totalDue) * 100)}%` }} />
          </div>
        </div>
        <div className="card">
          <div className="flex justify-between mb-3"><span className="text-xs text-slate-500">Avg Room Rate</span><span className="text-sm"></span></div>
          <div className="text-2xl font-mono font-semibold text-slate-100">₹5.2k</div>
          <div className="text-xs text-slate-500 mt-2">Per month avg</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div><div className="text-sm font-semibold text-slate-100">Revenue vs Expenses</div><div className="text-xs text-slate-500">Last 6 months</div></div>
          </div>
          <div className="h-52"><Bar data={revenueData} options={{ ...CHART_OPTS, scales: { ...CHART_OPTS.scales, y: { ...CHART_OPTS.scales.y, ticks: { ...CHART_OPTS.scales.y.ticks, callback: v => '₹' + v/1000 + 'k' } } } }} /></div>
        </div>
        <div className="card">
          <div className="mb-4"><div className="text-sm font-semibold text-slate-100">Room Occupancy</div><div className="text-xs text-slate-500">{stats.rooms.total} total rooms</div></div>
          <div className="h-52"><Doughnut data={occupancyData} options={{ responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 }, padding: 14 } } } }} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <div className="mb-4"><div className="text-sm font-semibold text-slate-100">Occupancy Trend</div><div className="text-xs text-slate-500">Monthly occupancy %</div></div>
          <div className="h-44"><Line data={lineData} options={{ ...CHART_OPTS, scales: { ...CHART_OPTS.scales, y: { ...CHART_OPTS.scales.y, min: 50, max: 100 } } }} /></div>
        </div>
        <div className="card">
          <div className="text-sm font-semibold text-slate-100 mb-4">Quick Actions</div>
          <div className="space-y-2">
            {[
              { label: 'Add New Resident', path: '/residents', color: 'text-primary-400' },
              { label: 'View Pending Maintenance', path: '/maintenance', color: 'text-amber-400' },
              { label: 'Generate Invoices', path: '/billing', color: 'text-green-400' },
              { label: 'View Reports', path: '/reports', color: 'text-teal-400' },
            ].map(a => (
              <button key={a.label} onClick={() => navigate(a.path)} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-2 transition-colors text-left">
                <span className={`text-sm font-medium ${a.color}`}>{a.label}</span>
                <span className="ml-auto text-slate-600 text-xs">→</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
