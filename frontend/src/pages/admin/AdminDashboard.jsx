import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { NavLink } from 'react-router-dom';
import api from '../../api/axios';

const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

function KpiCard({ label, value, color, delay }) {
  return (
    <div 
      className="card relative overflow-hidden group pb-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div 
        className="absolute top-0 left-0 right-0 h-[3px]" 
        style={{ backgroundColor: color }}
      />
      <div className="mt-2">
        <div className="text-[11px] font-bold text-text-muted uppercase tracking-[0.5px] mb-1">
          {label}
        </div>
        <div 
          className="font-heading font-extrabold text-[38px] tracking-tighter leading-none mb-2"
          style={{ color }}
        >
          {value ?? '--'}
        </div>
        <div className="flex items-center gap-2">
          <div className="px-1.5 py-0.5 rounded-badge bg-green-soft text-green text-[10px] font-bold">
            +12%
          </div>
          <span className="text-[11px] text-text-muted font-medium">vs last week</span>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleExport = async (endpoint, filename) => {
    try {
      const res = await fetch(`http://localhost:5000/api${endpoint}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Export failed. Please check backend connection.');
    }
  };

  const total = data?.summary?.total || 0;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Administrator Console" />
        <div className="page-content">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Row 1 — 4 KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <KpiCard label="Total Tickets" value={data?.summary?.total} color="var(--blue)" delay={0} />
                <KpiCard label="Open Cases" value={data?.summary?.open} color="var(--orange)" delay={100} />
                <KpiCard label="Resolved" value={data?.summary?.resolved} color="var(--green)" delay={200} />
                <KpiCard label="SLA Breached" value={data?.summary?.escalated} color="var(--red)" delay={300} />
              </div>

              {/* Row 2 — Priority + Workload */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Priority bars */}
                <div className="card">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
                    <h2 className="font-heading font-bold text-[13.5px] text-text">Ticket Distribution By Priority</h2>
                    <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Live Metrics</span>
                  </div>
                  
                  <div className="space-y-6">
                    {[
                      { label: 'Critical', value: data?.summary?.escalated || 0, color: 'var(--red)', bg: 'var(--red-soft)' },
                      { label: 'High', value: (data?.status_stats?.find(s => s.priority === 'high')?.count) || 0, color: 'var(--orange)', bg: 'var(--orange-soft)' },
                      { label: 'Medium', value: (data?.status_stats?.find(s => s.priority === 'medium')?.count) || 0, color: 'var(--amber)', bg: 'var(--amber-soft)' },
                      { label: 'Low', value: (data?.status_stats?.find(s => s.priority === 'low')?.count) || 0, color: 'var(--green)', bg: 'var(--green-soft)' },
                    ].map((p) => {
                      const pct = total ? Math.round((p.value / total) * 100) : 0;
                      return (
                        <div key={p.label}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[12px] font-bold" style={{ color: p.color }}>{p.label}</span>
                            <span className="text-[12.5px] font-extrabold text-text">{p.value}</span>
                          </div>
                          <div className="h-1.5 w-full bg-surface2 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-1000" 
                              style={{ width: `${pct}%`, backgroundColor: p.color }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Agent workload */}
                <div className="card">
                   <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
                    <h2 className="font-heading font-bold text-[13.5px] text-text">Agent Resource Distribution</h2>
                    <NavLink to="/admin/users" className="text-[11px] font-bold text-blue hover:underline">Manage Team</NavLink>
                  </div>

                  {!data?.agent_stats?.length ? (
                    <div className="py-20 text-center">
                       <div className="w-12 h-12 bg-surface2 rounded-full mx-auto flex items-center justify-center mb-3">
                         <div className="w-5 h-5 border-2 border-text-disabled rounded-full" />
                       </div>
                       <p className="text-[13px] text-text-muted font-medium">No active agents reported</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {data.agent_stats.map((a) => (
                        <div key={a.agent_name} className="flex items-center gap-4 p-3 rounded-btn border border-transparent hover:border-border hover:bg-surface2 transition-all">
                          <div className="w-10 h-10 rounded-avatar bg-gradient-to-br from-blue to-indigo flex items-center justify-center text-white font-extrabold text-[13px]">
                            {getInitials(a.agent_name)}
                          </div>
                          <div className="flex-1">
                            <div className="text-[13.5px] font-bold text-text leading-none mb-1">{a.agent_name}</div>
                            <div className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-green" />
                               <span className="text-[11px] text-text-muted font-bold uppercase tracking-tight">Active Duty</span>
                            </div>
                          </div>
                          <div className="px-3 py-1 bg-blue-soft border border-blue-mid rounded-badge">
                            <span className="text-blue text-[11.5px] font-extrabold uppercase">{a.total_assigned} Tickets</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 3 — Export Console */}
              <div className="card">
                <div className="border-b border-border pb-4 mb-6">
                  <h2 className="font-heading font-bold text-[14px] text-text">Data Export Matrix</h2>
                  <p className="text-[12px] text-text-muted mt-1 font-medium">Securely download enterprise-grade datasets for auditing and reporting</p>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <button 
                    className="btn-secondary" 
                    onClick={() => handleExport('/admin/export/tickets', 'tickets.csv')}
                  >
                    <div className="w-2 h-2 rounded-full bg-blue" />
                    <span>Audit Log CSV</span>
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={() => handleExport('/admin/export/tickets/excel', 'tickets.xlsx')}
                  >
                    <div className="w-2 h-2 rounded-full bg-green" />
                    <span>Performance XLSX</span>
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={() => handleExport('/admin/export/agents', 'agents.csv')}
                  >
                    <div className="w-2 h-2 rounded-full bg-indigo" />
                    <span>Agent Metrics CSV</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
