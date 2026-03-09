import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { PriorityBadge, StatusBadge } from '../../components/Badges';
import api from '../../api/axios';

const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

function BreachBar({ score }) {
  const pct = Math.round(score || 0);
  let color = 'var(--green)';
  if (pct >= 80) color = 'var(--red)';
  else if (pct >= 60) color = 'var(--orange)';
  else if (pct >= 40) color = 'var(--amber)';
  
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-surface2 rounded-full overflow-hidden min-w-[60px]">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[11px] font-bold" style={{ color }}>{pct}%</span>
    </div>
  );
}

export default function AllTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      if (priority) params.priority = priority;
      if (search) params.search = search;
      const res = await api.get('/tickets', { params });
      setTickets(res.data.tickets || []);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [status, priority, search]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const clearFilters = () => {
    setStatus('');
    setPriority('');
    setSearchInput('');
    setSearch('');
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Enterprise Ticket Registry" />
        <div className="page-content">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Filter bar */}
            <div className="card">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[300px]">
                  <label className="form-label text-text-muted">Search Records</label>
                  <div className="relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-text-muted rounded-full group-focus-within:border-blue transition-colors" />
                    <input 
                       className="form-input pl-10" 
                       placeholder="Filter by title, ID or description..."
                       value={searchInput} 
                       onChange={(e) => setSearchInput(e.target.value)} 
                    />
                  </div>
                </div>
                
                <div className="w-[180px]">
                  <label className="form-label text-text-muted">Status</label>
                  <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="pending_verification">Pending Verification</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="w-[180px]">
                  <label className="form-label text-text-muted">Priority</label>
                  <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                    <option value="">All Priorities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <button className="btn-secondary h-[42px] px-6" onClick={clearFilters}>
                  Reset
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="card !p-0 overflow-hidden">
              <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-surface2">
                <div>
                  <h2 className="font-heading font-bold text-[14px] text-text">Service Request Management</h2>
                  <p className="text-[11px] text-text-muted font-bold uppercase tracking-wider mt-0.5">
                    {loading ? 'Synchronizing...' : `Total Records: ${tickets.length}`}
                  </p>
                </div>
                {!loading && (
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue animate-pulse" />
                      <span className="text-[10px] font-extrabold text-blue uppercase tracking-widest">Live Updates</span>
                   </div>
                )}
              </div>

              {loading ? <div className="py-20"><LoadingSpinner /></div> : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="w-[80px]">Reference</th>
                        <th className="min-w-[200px]">Subject</th>
                        <th>Requestor</th>
                        <th>Assigned Agent</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th className="w-[120px]">Breach Risk</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.length === 0 ? (
                        <tr>
                          <td colSpan={8}>
                            <div className="py-24 text-center">
                              <div className="w-16 h-16 bg-surface2 rounded-full mx-auto flex items-center justify-center mb-4">
                                <div className="w-6 h-6 border-2 border-text-disabled rounded-full" />
                              </div>
                              <p className="text-[15px] font-bold text-text mb-1">No ticket matching filters</p>
                              <p className="text-[13px] text-text-muted">Try refining your search query or status filters</p>
                            </div>
                          </td>
                        </tr>
                      ) : tickets.map((t) => (
                        <tr 
                          key={t.id} 
                          onClick={() => navigate(`/admin/tickets/${t.id}`)}
                          className="cursor-pointer group"
                        >
                          <td className="font-mono text-[11px] font-bold text-text-disabled">#{t.id}</td>
                          <td>
                            <div className="text-[13.5px] font-bold text-text group-hover:text-blue transition-colors">
                              {t.title?.length > 45 ? t.title.slice(0, 45) + '...' : t.title}
                            </div>
                            <div className="text-[11px] text-text-muted font-medium mt-0.5">{formatDate(t.created_at)}</div>
                          </td>
                          <td className="text-[13px] font-semibold text-text-secondary">{t.user_name}</td>
                          <td>
                             {t.agent_name ? (
                               <div className="flex items-center gap-2">
                                 <div className="w-6 h-6 rounded-avatar bg-blue-soft flex items-center justify-center text-blue text-[10px] font-extrabold">
                                   {t.agent_name[0]}
                                 </div>
                                 <span className="text-[13px] font-bold text-text-secondary">{t.agent_name}</span>
                               </div>
                             ) : (
                               <span className="text-[11px] font-bold text-text-disabled uppercase tracking-tight italic">Unassigned</span>
                             )}
                          </td>
                          <td><PriorityBadge priority={t.priority} /></td>
                          <td><StatusBadge status={t.status} /></td>
                          <td><BreachBar score={t.breach_risk} /></td>
                          <td>
                            <button 
                              className="btn-secondary !px-4 !py-1.5 !text-[11px] font-bold uppercase tracking-wider"
                              onClick={(e) => { e.stopPropagation(); navigate(`/admin/tickets/${t.id}`); }}
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
