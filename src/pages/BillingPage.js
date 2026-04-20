import React, { useEffect, useState, useCallback } from 'react';
import { billingAPI, residentsAPI, roomsAPI } from '../utils/api';
import { Badge, statusBadge, Modal, PageHeader, EmptyState, StatCard, Tabs } from '../components/common/LoadingSpinner';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Bar } from 'react-chartjs-2';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = ['cash', 'upi', 'bank_transfer', 'card', 'razorpay', 'cheque'];

export default function BillingPage() {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('invoices');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [residents, setResidents] = useState([]);
  const [paymentForm, setPaymentForm] = useState({ amount: 0, method: 'cash', transactionId: '', notes: '' });
  const [bulkForm, setBulkForm] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), includeRent: true, includeMess: true, includeUtilities: true, messAmount: 2800, utilitiesAmount: 450 });
  const [invoiceForm, setInvoiceForm] = useState({ resident: '', room: '', billingPeriod: { label: '', from: '', to: '' }, dueDate: '', lineItems: [{ description: 'Room Rent', type: 'rent', amount: 0 }], discount: 0, notes: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (statusFilter !== 'all') params.status = statusFilter;
      const { data } = await billingAPI.getAll(params);
      setInvoices(data.data || []);
      setSummary(data.summary || {});
    } catch { toast.error('Failed to load invoices'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const loadResidents = async () => {
    try {
      const { data } = await residentsAPI.getAll({ status: 'active', limit: 100 });
      setResidents(data.data || []);
    } catch {}
  };

  const handleRecordPayment = async () => {
    if (!paymentForm.amount || paymentForm.amount <= 0) return toast.error('Enter a valid amount');
    try {
      await billingAPI.recordPayment(selected._id, paymentForm);
      toast.success('Payment recorded'); setShowPayment(false); setSelected(null); load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const handleBulkGenerate = async () => {
    try {
      const { data } = await billingAPI.generateBulk(bulkForm);
      toast.success(data.message); setShowBulk(false); load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to generate invoices'); }
  };

  const addLineItem = () => setInvoiceForm(f => ({ ...f, lineItems: [...f.lineItems, { description: '', type: 'other', amount: 0 }] }));
  const removeLineItem = (i) => setInvoiceForm(f => ({ ...f, lineItems: f.lineItems.filter((_, idx) => idx !== i) }));

  const handleCreateInvoice = async () => {
    try {
      await billingAPI.create(invoiceForm);
      toast.success('Invoice created'); setShowCreate(false); load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const statusColor = { paid: 'green', partial: 'amber', overdue: 'red', sent: 'blue', draft: 'gray', cancelled: 'gray' };

  const chartData = {
    labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    datasets: [
      { label: 'Billed', data: [95000, 98000, 102000, 108000, 115000, 130000], backgroundColor: 'rgba(99,102,241,0.6)', borderColor: '#6366f1', borderRadius: 4 },
      { label: 'Collected', data: [88000, 95000, 96000, 101000, 109000, 125000], backgroundColor: 'rgba(34,197,94,0.5)', borderColor: '#22c55e', borderRadius: 4 },
    ]
  };

  const handleRazorpayPayment = async (invoice) => {
  try {
    // Step 1: Create order on backend
    const { data } = await paymentsAPI.createOrder({ invoiceId: invoice._id });

    // Step 2: Open Razorpay checkout popup
    const options = {
      key: data.data.keyId,
      amount: data.data.amount,
      currency: data.data.currency,
      name: 'HostelOS',
      description: `Payment for ${data.data.invoiceNumber}`,
      order_id: data.data.orderId,
      prefill: {
        name: data.data.residentName,
        email: data.data.residentEmail,
        contact: data.data.residentPhone,
      },
      theme: { color: '#6366f1' },

      // Step 3: On success, verify on backend
      handler: async (response) => {
        try {
          await paymentsAPI.verify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            invoiceId: invoice._id,
          });
          toast.success('✅ Payment successful!');
          load(); // refresh invoices
        } catch {
          toast.error('Payment verification failed');
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();

  } catch (e) {
    toast.error(e.response?.data?.message || 'Could not initiate payment');
  }
};

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Billing & Payments"
        subtitle="Manage invoices and track payments"
        actions={
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={() => { loadResidents(); setShowBulk(true); }}>Bulk Generate</button>
            <button className="btn btn-primary" onClick={() => { loadResidents(); setShowCreate(true); }}>+ New Invoice</button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard label="Total Collected" value={`₹${((summary.totalCollected || 0)/1000).toFixed(0)}k`} color="text-green-400" />
        <StatCard label="Total Billed" value={`₹${((summary.totalBilled || 0)/1000).toFixed(0)}k`} color="text-primary-400" />
        <StatCard label="Outstanding" value={`₹${((summary.totalDue || 0)/1000).toFixed(1)}k`} color="text-red-400" />
        <StatCard label="Collection Rate" value={summary.totalBilled ? `${Math.round(summary.totalCollected / summary.totalBilled * 100)}%` : '—'} color="text-teal-400" />
      </div>

      <Tabs
        tabs={[{ value: 'invoices', label: 'Invoices' }, { value: 'reports', label: 'Revenue Report' }]}
        active={tab} onChange={setTab}
      />

      {tab === 'invoices' && <>
        <div className="flex gap-2 mb-4">
          {['all', 'sent', 'partial', 'paid', 'overdue', 'draft'].map(s => (
            <button key={s} className={`btn text-xs py-1.5 ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setStatusFilter(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="flex justify-center pt-10"><LoadingSpinner size="lg" /></div>
        ) : invoices.length === 0 ? (
          <div className="card"><EmptyState title="No invoices found" /></div>
        ) : (
          <div className="card table-wrapper">
            <table>
              <thead><tr><th>Invoice #</th><th>Resident</th><th>Room</th><th>Period</th><th>Total</th><th>Paid</th><th>Due</th><th>Due Date</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv._id} className="cursor-pointer" onClick={() => setSelected(inv)}>
                    <td><span className="font-mono text-xs text-slate-400">{inv.invoiceNumber}</span></td>
                    <td><div className="text-sm font-medium text-slate-100">{inv.resident?.name}</div><div className="text-xs text-slate-500">{inv.resident?.residentId}</div></td>
                    <td><span className="font-mono text-primary-400 font-semibold">{inv.room?.roomNumber}</span></td>
                    <td className="text-xs text-slate-400">{inv.billingPeriod?.label}</td>
                    <td><span className="font-mono text-sm">₹{(inv.total || 0).toLocaleString()}</span></td>
                    <td><span className="font-mono text-sm text-green-400">₹{(inv.amountPaid || 0).toLocaleString()}</span></td>
                    <td><span className={`font-mono text-sm ${inv.balanceDue > 0 ? 'text-red-400' : 'text-slate-500'}`}>{inv.balanceDue > 0 ? `₹${inv.balanceDue.toLocaleString()}` : '—'}</span></td>
                    <td className="text-xs text-slate-500">{new Date(inv.dueDate).toLocaleDateString()}</td>
                    <td><Badge variant={statusColor[inv.status] || 'gray'}>{inv.status}</Badge></td>
                    <td onClick={e => e.stopPropagation()}>
                      {inv.balanceDue > 0 && (
                        <button
                          className="btn btn-success text-xs py-1 px-2"
                          onClick={() => handleRazorpayPayment(inv)}
                        >
                           Pay
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>}

      {tab === 'reports' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Net Profit (Mar)" value="₹80,000" color="text-green-400" />
            <StatCard label="YoY Growth" value="+18.2%" color="text-primary-400" />
            <StatCard label="Avg Revenue/Room" value="₹3,125" color="text-teal-400" />
          </div>
          <div className="card">
            <div className="text-sm font-semibold text-slate-100 mb-4">Monthly Revenue Trend</div>
            <div className="h-64">
              <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } }, scales: { x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } }, y: { ticks: { color: '#64748b', callback: v => '₹' + v/1000 + 'k' }, grid: { color: 'rgba(255,255,255,0.06)' } } } }} />
            </div>
          </div>
        </div>
      )}

      <Modal open={!!selected && !showPayment} onClose={() => setSelected(null)} title={`Invoice ${selected?.invoiceNumber}`} width="max-w-xl">
        {selected && (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-base font-semibold text-slate-100">{selected.resident?.name}</div>
                <div className="text-sm text-slate-500">Room {selected.room?.roomNumber} · {selected.billingPeriod?.label}</div>
              </div>
              <Badge variant={statusColor[selected.status] || 'gray'}>{selected.status}</Badge>
            </div>
            <div className="border-t border-dark-border pt-3">
              {selected.lineItems?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm py-1.5">
                  <span className="text-slate-300">{item.description}</span>
                  <span className="font-mono text-slate-100">₹{item.amount?.toLocaleString()}</span>
                </div>
              ))}
              {selected.discount > 0 && <div className="flex justify-between text-sm py-1.5 text-green-400"><span>Discount</span><span className="font-mono">-₹{selected.discount.toLocaleString()}</span></div>}
              <div className="flex justify-between text-sm font-semibold pt-2 border-t border-dark-border mt-2">
                <span className="text-slate-100">Total</span>
                <span className="font-mono text-slate-100">₹{selected.total?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm py-1 text-green-400"><span>Amount Paid</span><span className="font-mono">₹{selected.amountPaid?.toLocaleString()}</span></div>
              {selected.balanceDue > 0 && <div className="flex justify-between text-sm font-semibold text-red-400"><span>Balance Due</span><span className="font-mono">₹{selected.balanceDue?.toLocaleString()}</span></div>}
            </div>
            {selected.paymentHistory?.length > 0 && (
              <div>
                <div className="label mb-2">Payment History</div>
                {selected.paymentHistory.map((p, i) => (
                  <div key={i} className="flex justify-between text-xs py-1.5 border-b border-dark-border/40">
                    <span className="text-slate-400">{new Date(p.paidAt).toLocaleDateString()} · {p.method}</span>
                    <span className="font-mono text-green-400">₹{p.amount?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
            {selected.balanceDue > 0 && (
              <button className="btn btn-success w-full justify-center" onClick={() => { setPaymentForm({ amount: selected.balanceDue, method: 'cash', transactionId: '', notes: '' }); setShowPayment(true); }}>
                💳 Record Payment
              </button>
            )}
          </div>
        )}
      </Modal>

      <Modal open={showPayment} onClose={() => setShowPayment(false)} title="Record Payment">
        <div className="form-group"><label className="label">Amount (₹) *</label><input type="number" className="input" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) })} /></div>
        <div className="form-group"><label className="label">Payment Method *</label>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map(m => (
              <button key={m} onClick={() => setPaymentForm({ ...paymentForm, method: m })} className={`btn text-xs py-2 justify-center capitalize ${paymentForm.method === m ? 'btn-primary' : 'btn-secondary'}`}>{m}</button>
            ))}
          </div>
        </div>
        <div className="form-group"><label className="label">Transaction ID</label><input className="input" placeholder="Optional" value={paymentForm.transactionId} onChange={e => setPaymentForm({ ...paymentForm, transactionId: e.target.value })} /></div>
        <div className="form-group"><label className="label">Notes</label><input className="input" value={paymentForm.notes} onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })} /></div>
        <div className="flex gap-2 mt-2">
          <button className="btn btn-success" onClick={handleRecordPayment}>Confirm Payment</button>
          <button className="btn btn-secondary" onClick={() => setShowPayment(false)}>Cancel</button>
        </div>
      </Modal>

      <Modal open={showBulk} onClose={() => setShowBulk(false)} title="Bulk Generate Invoices">
        <div className="form-row">
          <div><label className="label">Month</label><select className="select" value={bulkForm.month} onChange={e => setBulkForm({ ...bulkForm, month: parseInt(e.target.value) })}>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2025, i).toLocaleString('default', { month: 'long' })}</option>)}</select></div>
          <div><label className="label">Year</label><input type="number" className="input" value={bulkForm.year} onChange={e => setBulkForm({ ...bulkForm, year: parseInt(e.target.value) })} /></div>
        </div>
        <div className="space-y-2 mb-4">
          {[['includeRent', 'Include Rent'], ['includeMess', 'Include Mess Charges'], ['includeUtilities', 'Include Utilities']].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
              <input type="checkbox" checked={bulkForm[key]} onChange={e => setBulkForm({ ...bulkForm, [key]: e.target.checked })} />
              {label}
            </label>
          ))}
        </div>
        {bulkForm.includeMess && <div className="form-group"><label className="label">Mess Amount (₹)</label><input type="number" className="input" value={bulkForm.messAmount} onChange={e => setBulkForm({ ...bulkForm, messAmount: parseFloat(e.target.value) })} /></div>}
        {bulkForm.includeUtilities && <div className="form-group"><label className="label">Utilities Amount (₹)</label><input type="number" className="input" value={bulkForm.utilitiesAmount} onChange={e => setBulkForm({ ...bulkForm, utilitiesAmount: parseFloat(e.target.value) })} /></div>}
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-4">
          <p className="text-xs text-amber-400">⚠️ This will generate invoices for all active residents. Existing invoices for the same period will not be overwritten.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={handleBulkGenerate}>Generate Invoices</button>
          <button className="btn btn-secondary" onClick={() => setShowBulk(false)}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}
