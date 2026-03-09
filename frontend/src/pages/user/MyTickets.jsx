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

export default function UserMyTickets() {
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
                    {/* Filter Card */}
                    <div className="card" style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ flex: 2, minWidth: 200 }}>
                                <div className="input-wrapper">
                                    <span className="input-icon-left" style={{ top: '50%', transform: 'translateY(-50%)' }}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                                        </svg>
                                    </span>
                                    <input className="form-input input-with-icon-left" placeholder="Search by title or description..."
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100%, 1fr))', gap: 12 }}>
                            {tickets.length === 0 ? (
                                <div className="card">
                                    <div className="empty-state">
                                        <div className="empty-state-icon">🎫</div>
                                        <p className="empty-state-title">No tickets found</p>
                                        <p className="empty-state-text">You haven't submitted any tickets matching these filters.</p>
                                    </div>
                                </div>
                            ) : tickets.map((t) => {
                                const isPending = t.status === 'pending_verification';
                                return (
                                    <div key={t.id}
                                        onClick={() => navigate(`/user/tickets/${t.id}`)}
                                        style={{
                                            background: 'white', borderRadius: 16, padding: '20px 24px',
                                            boxShadow: '0 4px 24px rgba(79,106,245,0.08)', cursor: 'pointer',
                                            display: 'flex', gap: 20, alignItems: 'center',
                                            borderLeft: isPending ? '4px solid #7C3AED' : '4px solid transparent',
                                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                            position: 'relative',
                                            animation: isPending ? 'pulse-border 2s ease-in-out infinite' : 'none'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 8px 32px rgba(79,106,245,0.12)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'none';
                                            e.currentTarget.style.boxShadow = '0 4px 24px rgba(79,106,245,0.08)';
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                                <span style={{ fontFamily: 'monospace', color: '#9CA3AF', fontSize: 12 }}>#{t.id}</span>
                                                <PriorityBadge priority={t.priority} />
                                                <StatusBadge status={t.status} />
                                                {isPending && (
                                                    <span style={{ background: '#F5F3FF', color: '#7C3AED', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        ⚡ Action Needed
                                                    </span>
                                                )}
                                            </div>
                                            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1A1D2E', marginBottom: 6 }}>{t.title}</h3>
                                            <div style={{ display: 'flex', gap: 12, color: '#9CA3AF', fontSize: 12 }}>
                                                <span>Agent: <strong style={{ color: '#6B7280' }}>{t.agent_name || 'Unassigned'}</strong></span>
                                                <span>•</span>
                                                <span>Submitted on {formatDate(t.created_at)}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, minWidth: 100 }}>
                                            <StatusBadge status={t.status} />
                                            <span style={{ fontSize: 13, color: '#4F6AF5', fontWeight: 600 }}>View Details →</span>
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
