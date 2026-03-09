import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { PriorityBadge, StatusBadge } from '../../components/Badges';
import api from '../../api/axios';

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function AgentMyTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

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
    } catch { setTickets([]); }
    finally { setLoading(false); }
  }, [status, priority, search]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title="My Tickets" />
        <div className="page-content">
          {/* Filters */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 2, minWidth: 200 }}>
                <div className="input-wrapper">
                  <span className="input-icon-left" style={{ top: '50%', transform: 'translateY(-50%)' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  </span>
                  <input className="form-input input-with-icon-left" placeholder="Search tickets..."
                    value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
                </div>
              </div>
              <select className="form-select" style={{ flex: 1, minWidth: 150 }} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="pending_verification">Pending Verification</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <select className="form-select" style={{ flex: 1, minWidth: 130 }} value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <button className="btn-secondary" onClick={() => { setStatus(''); setPriority(''); setSearchInput(''); }}>Clear</button>
            </div>
          </div>

          {loading ? <LoadingSpinner /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tickets.length === 0 ? (
                <div className="card">
                  <div className="empty-state">
                    <div className="empty-state-icon">🎫</div>
                    <p className="empty-state-title">No tickets found</p>
                    <p className="empty-state-text">No tickets are assigned to you with the current filters.</p>
                  </div>
                </div>
              ) : tickets.map((t) => {
                const isPending = t.status === 'pending_verification';
                const pct = Math.round(t.breach_risk || 0);
                let brColor = '#10B981';
                if (pct >= 80) brColor = '#EF4444';
                else if (pct >= 60) brColor = '#EA580C';
                else if (pct >= 40) brColor = '#F59E0B';
                return (
                  <div key={t.id}
                    onClick={() => navigate(`/agent/tickets/${t.id}`)}
                    style={{
                      background: 'white', borderRadius: 16, padding: '20px 24px',
                      boxShadow: '0 4px 24px rgba(79,106,245,0.08)', cursor: 'pointer',
                      display: 'flex', gap: 20, alignItems: 'center',
                      borderLeft: isPending ? '4px solid #7C3AED' : '4px solid transparent',
                      transition: 'all 0.2s',
                      animation: isPending ? 'pulse-border 2s ease-in-out infinite' : 'none',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'monospace', color: '#9CA3AF', fontSize: 12 }}>#{t.id}</span>
                        <PriorityBadge priority={t.priority} />
                        <StatusBadge status={t.status} />
                        {isPending && (
                          <span style={{ background: '#F5F3FF', color: '#7C3AED', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
                            ⚡ Awaiting Verification
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1A1D2E', marginBottom: 6 }}>
                        {t.title}
                      </h3>
                      <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {t.description}
                      </p>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                        Submitted by: <strong style={{ color: '#6B7280' }}>{t.user_name}</strong>
                        {t.category_name && <> · Category: <strong style={{ color: '#6B7280' }}>{t.category_name}</strong></>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 64, height: 6, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: brColor, borderRadius: 99 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: brColor }}>{pct}%</span>
                      </div>
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>{formatDate(t.created_at)}</span>
                      <span style={{ fontSize: 13, color: '#4F6AF5', fontWeight: 600 }}>View →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
