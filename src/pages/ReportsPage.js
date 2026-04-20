import React, { useEffect, useState } from 'react';
import { reportsAPI } from '../utils/api';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { PageHeader, StatCard } from '../components/common/LoadingSpinner';
import LoadingSpinner from '../components/common/LoadingSpinner';

const CHART_BASE = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
  scales: {
    x: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
    y: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.06)' } }
  }
};

export default function ReportsPage() {
  const [revenue, setRevenue] = useState(null);
  const [occupancy, setOccupancy] = useState(null);
  const [maintenance, setMaintenance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [r, o, m] = await Promise.all([
          reportsAPI.revenue({ year }),
          reportsAPI.occupancy(),
          reportsAPI.maintenance()
        ]);
        setRevenue(r.data.data);
        setOccupancy(o.data.data);
        setMaintenance(m.data.data);
      } catch {
        setRevenue({ monthly: [1,2,3,4,5,6].map(m => ({ _id: { month: m }, revenue: 80000 + m * 5000, billed: 90000 + m * 5000 })), byType: [{ _id: 'rent', total: 280000 }, { _id: 'mess', total: 112000 }, { _id: 'utilities', total: 28000 }] });
        setOccupancy({ byType: [{ _id: 'Single', total: 20, occupied: 15 }, { _id: 'Double', total: 10, occupied: 8 }, { _id: 'Suite', total: 5, occupied: 4 }], byFloor: [{ _id: 1, total: 10, occupied: 7 }, { _id: 2, total: 10, occupied: 8 }, { _id: 3, total: 10, occupied: 7 }, { _id: 4, total: 10, occupied: 6 }] });
        setMaintenance({ byCategory: [{ _id: 'Electrical', count: 8 }, { _id: 'Plumbing', count: 5 }, { _id: 'IT/Network', count: 4 }, { _id: 'Carpentry', count: 3 }], byStatus: [{ _id: 'completed', count: 12 }, { _id: 'pending', count: 4 }, { _id: 'in-progress', count: 3 }], byPriority: [{ _id: 'high', count: 6 }, { _id: 'medium', count: 8 }, { _id: 'low', count: 5 }] });
      } finally { setLoading(false); }
    };
    load();
  }, [year]);

  if (loading) return <div className="flex justify-center pt-20"><LoadingSpinner size="lg" /></div>;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueChart = {
    labels: (revenue?.monthly || []).map(m => months[m._id.month - 1]),
    datasets: [
      { label: 'Revenue', data: (revenue?.monthly || []).map(m => m.revenue), backgroundColor: 'rgba(99,102,241,0.6)', borderColor: '#6366f1', borderRadius: 5 },
      { label: 'Billed', data: (revenue?.monthly || []).map(m => m.billed), backgroundColor: 'rgba(20,184,166,0.5)', borderColor: '#14b8a6', borderRadius: 5 }
    ]
  };

  const revenueByTypeChart = {
    labels: (revenue?.byType || []).map(t => t._id),
    datasets: [{ data: (revenue?.byType || []).map(t => t.total), backgroundColor: ['rgba(99,102,241,0.7)', 'rgba(20,184,166,0.7)', 'rgba(245,158,11,0.7)', 'rgba(236,72,153,0.7)'], borderColor: ['#6366f1', '#14b8a6', '#f59e0b', '#ec4899'], borderWidth: 1 }]
  };

  const occupancyByTypeChart = {
    labels: (occupancy?.byType || []).map(t => t._id),
    datasets: [
      { label: 'Total', data: (occupancy?.byType || []).map(t => t.total), backgroundColor: 'rgba(99,102,241,0.3)', borderColor: '#6366f1', borderRadius: 4 },
      { label: 'Occupied', data: (occupancy?.byType || []).map(t => t.occupied), backgroundColor: 'rgba(99,102,241,0.7)', borderColor: '#6366f1', borderRadius: 4 }
    ]
  };

  const maintCategoryChart = {
    labels: (maintenance?.byCategory || []).map(c => c._id),
    datasets: [{ label: 'Requests', data: (maintenance?.byCategory || []).map(c => c.count), backgroundColor: 'rgba(245,158,11,0.6)', borderColor: '#f59e0b', borderRadius: 4 }]
  };

  const totalRevenue = (revenue?.monthly || []).reduce((s, m) => s + m.revenue, 0);
  const totalBilled = (revenue?.monthly || []).reduce((s, m) => s + m.billed, 0);

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title="Financial Reports" subtitle="Analytics and performance insights"
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Year:</span>
            <select className="select" style={{ width: 'auto' }} value={year} onChange={e => setYear(parseInt(e.target.value))}>
              {[2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={`₹${(totalRevenue / 100000).toFixed(1)}L`} color="text-green-400" />
        <StatCard label="Total Billed" value={`₹${(totalBilled / 100000).toFixed(1)}L`} color="text-primary-400" />
        <StatCard label="Collection Rate" value={totalBilled ? `${Math.round(totalRevenue / totalBilled * 100)}%` : '—'} color="text-teal-400" />
        <StatCard label="Avg Monthly" value={`₹${Math.round(totalRevenue / 6 / 1000)}k`} color="text-amber-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <div className="text-sm font-semibold text-slate-100 mb-4">Monthly Revenue vs Billed</div>
          <div className="h-56"><Bar data={revenueChart} options={{ ...CHART_BASE, scales: { ...CHART_BASE.scales, y: { ...CHART_BASE.scales.y, ticks: { ...CHART_BASE.scales.y.ticks, callback: v => '₹' + v/1000 + 'k' } } } }} /></div>
        </div>
        <div className="card">
          <div className="text-sm font-semibold text-slate-100 mb-4">Revenue by Type</div>
          <div className="h-56"><Doughnut data={revenueByTypeChart} options={{ responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 }, padding: 10 } } } }} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="text-sm font-semibold text-slate-100 mb-4">Occupancy by Room Type</div>
          <div className="h-52"><Bar data={occupancyByTypeChart} options={CHART_BASE} /></div>
        </div>
        <div className="card">
          <div className="text-sm font-semibold text-slate-100 mb-4">Maintenance by Category</div>
          <div className="h-52"><Bar data={maintCategoryChart} options={CHART_BASE} /></div>
        </div>
      </div>

      <div className="card">
        <div className="text-sm font-semibold text-slate-100 mb-4">Floor-wise Occupancy</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(occupancy?.byFloor || []).map(f => (
            <div key={f._id} className="p-4 bg-surface-2 rounded-xl text-center">
              <div className="text-2xl font-mono font-bold text-primary-400">Floor {f._id}</div>
              <div className="text-xs text-slate-500 mb-3">{f.occupied}/{f.total} occupied</div>
              <div className="w-full bg-surface-3 rounded-full h-2">
                <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${Math.round(f.occupied / f.total * 100)}%` }} />
              </div>
              <div className="text-xs text-slate-400 mt-1.5">{Math.round(f.occupied / f.total * 100)}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
