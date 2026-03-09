import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { PriorityBadge, StatusBadge } from '../../components/Badges';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function UserDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/tickets')
            .then((res) => {
                setTickets(res.data.tickets || []);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const stats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        in_progress: tickets.filter(t => t.status === 'in_progress').length,
        pending: tickets.filter(t => t.status === 'pending_verification').length,
        closed: tickets.filter(t => t.status === 'closed' || t.status === 'resolved').length
    };

    const recentTickets = tickets.slice(0, 5);

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <Navbar title="Personal Command Center" />
                <div className="page-content">
                    {loading ? <LoadingSpinner /> : (
                        <div className="max-w-7xl mx-auto space-y-8">
                            {/* Welcome Banner */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-blue to-indigo rounded-card p-10 text-white shadow-sh2 border border-blue-mid/20">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <div className="w-48 h-48 border-8 border-white rounded-full -mr-24 -mt-24" />
                                </div>
                                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="max-w-xl">
                                        <h2 className="font-heading font-extrabold text-[28px] tracking-tight mb-3">
                                            Operational Status: Active
                                        </h2>
                                        <p className="text-white/80 text-[15.5px] font-medium leading-relaxed">
                                            Welcome back, {user?.name?.split(' ')[0]}. You have {stats.open} active service requests requiring oversight.
                                        </p>
                                    </div>
                                    <Link to="/user/create-ticket" className="btn-secondary !bg-white !text-blue !border-none !px-8 !py-3.5 !text-[15px] font-extrabold shadow-lg hover:shadow-xl transition-all">
                                        Open New Request
                                    </Link>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {[
                                    { label: 'Total Files', value: stats.total, color: 'var(--blue)' },
                                    { label: 'Active', value: stats.open, color: 'var(--blue)' },
                                    { label: 'Processing', value: stats.in_progress, color: 'var(--orange)' },
                                    { label: 'Verification', value: stats.pending, color: 'var(--purple)' },
                                    { label: 'Resolved', value: stats.closed, color: 'var(--green)' }
                                ].map((s) => (
                                    <div key={s.label} className="card !p-5 flex flex-col items-center justify-center text-center group hover:border-blue-mid transition-all">
                                        <div className="text-[26px] font-heading font-extrabold tracking-tight mb-1" style={{ color: s.color }}>{s.value}</div>
                                        <div className="text-[10px] font-extrabold text-text-muted uppercase tracking-[1.2px]">{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Critical Action Banner */}
                            {stats.pending > 0 && (
                                <div className="verify-box flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-white rounded-avatar flex items-center justify-center shadow-sm">
                                            <div className="w-5 h-5 bg-purple rounded-full animate-bounce" />
                                        </div>
                                        <div>
                                            <h3 className="font-heading font-bold text-[16px] text-purple tracking-tight mb-1">Verification Required</h3>
                                            <p className="text-[13.5px] text-indigo/80 font-medium">You have {stats.pending} ticket(s) awaiting your final authorization to close.</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => navigate('/user/tickets')} 
                                        className="btn-primary !bg-purple !shadow-[0_4px_12px_rgba(109,49,217,0.3)] hover:!bg-indigo"
                                    >
                                        Execute Review
                                    </button>
                                </div>
                            )}

                            {/* Recent Workspace Content */}
                            <div className="card !p-0 overflow-hidden">
                                <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-surface2/50">
                                    <h3 className="font-heading font-bold text-[15px] text-text">Service Request Ledger</h3>
                                    <Link to="/user/tickets" className="text-[11px] font-extrabold text-blue uppercase tracking-widest hover:underline">Full Registry →</Link>
                                </div>
                                
                                {recentTickets.length === 0 ? (
                                    <div className="py-24 text-center">
                                        <div className="w-16 h-16 bg-surface2 rounded-full mx-auto flex items-center justify-center mb-5">
                                            <div className="w-6 h-6 border-2 border-text-disabled rounded-full" />
                                        </div>
                                        <p className="text-[15px] font-bold text-text mb-2">No active records found</p>
                                        <p className="text-[13px] text-text-muted mb-8">System is clear. Open a new request if assistance is required.</p>
                                        <Link to="/user/create-ticket" className="btn-primary !px-8">+ New Request</Link>
                                    </div>
                                ) : (
                                    <div className="table-container">
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th className="w-[100px]">Reference</th>
                                                    <th>Subject Brief</th>
                                                    <th>Assigned Asset</th>
                                                    <th>Status</th>
                                                    <th>Timestamp</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {recentTickets.map((t) => (
                                                    <tr key={t.id} onClick={() => navigate(`/user/tickets/${t.id}`)} className="cursor-pointer group">
                                                        <td className="font-mono text-[11px] font-bold text-text-disabled">#{t.id}</td>
                                                        <td>
                                                            <div className="flex items-center gap-3">
                                                                <PriorityBadge priority={t.priority} />
                                                                <span className="font-bold text-[14px] text-text group-hover:text-blue transition-colors">{t.title}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-blue-soft border border-blue-mid flex items-center justify-center text-[10px] font-bold text-blue">
                                                                    {t.agent_name ? t.agent_name[0] : '?'}
                                                                </div>
                                                                <span className="text-[13px] font-semibold text-text-secondary">{t.agent_name || 'Allocation Pending'}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="flex items-center gap-2">
                                                                <StatusBadge status={t.status} />
                                                                {t.status === 'pending_verification' && (
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-purple animate-ping" />
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="text-[12px] font-bold text-text-disabled uppercase">{formatDate(t.created_at)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
