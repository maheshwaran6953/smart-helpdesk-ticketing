import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { PriorityBadge, StatusBadge, BurnoutBadge } from '../../components/Badges';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const formatDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Strategic Lead';
  if (h < 17) return 'Operational Head';
  return 'Executive Lead';
};

function AgentKpi({ label, value, color, delay }) {
  return (
    <div 
      className="card relative overflow-hidden flex flex-col items-center justify-center text-center py-6"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: color }} />
      <div className="text-[28px] font-heading font-extrabold tracking-tighter mb-1" style={{ color }}>{value}</div>
      <div className="text-[10px] font-extrabold text-text-muted uppercase tracking-[1.5px]">{label}</div>
    </div>
  );
}

export default function AgentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [burnout, setBurnout] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/tickets'),
      user?.id ? api.get(`/predictive/burnout/${user.id}`).catch(() => ({ data: null })) : Promise.resolve({ data: null }),
    ]).then(([tRes, bRes]) => {
      setTickets(tRes.data.tickets || []);
      const bData = bRes?.data?.data || bRes?.data || null;
      setBurnout(Array.isArray(bData) ? bData[0] : bData);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user?.id]);

  const stats = {
    open: tickets.filter((t) => t.status === 'open').length,
    in_progress: tickets.filter((t) => t.status === 'in_progress').length,
    pending: tickets.filter((t) => t.status === 'pending_verification').length,
    critical: tickets.filter((t) => t.priority === 'critical').length,
  };

  const recentTickets = tickets.slice(0, 5);
  const burnoutColor = burnout?.burnout_level === 'HIGH' ? 'var(--red)' : burnout?.burnout_level === 'MEDIUM' ? 'var(--orange)' : 'var(--green)';

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Asset Operational Terminal" />
        <div className="page-content">
          {loading ? <LoadingSpinner /> : (
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Executive Welcome */}
              <div className="card relative overflow-hidden bg-white border-[1.5px] border-border shadow-sh1 p-8">
                <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-blue-soft/30 to-transparent" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="w-2 h-2 rounded-full bg-blue animate-pulse" />
                     <span className="text-[10px] font-extrabold text-blue uppercase tracking-widest">Active Shift Protocol</span>
                  </div>
                  <h2 className="font-heading font-extrabold text-[26px] text-text tracking-tight mb-2">
                    {getGreeting()}, {user?.name?.split(' ')[0]}
                  </h2>
                  <p className="text-[14.5px] text-text-secondary font-medium max-w-2xl">
                    System synchronization complete. You are currently presiding over <span className="text-blue font-bold">{stats.open + stats.in_progress}</span> active service threads.
                  </p>
                </div>
              </div>

              {/* Stats Matrix */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <AgentKpi label="Active Queue" value={stats.open} color="var(--blue)" delay={0} />
                <AgentKpi label="Processing" value={stats.in_progress} color="var(--orange)" delay={100} />
                <AgentKpi label="Verifying" value={stats.pending} color="var(--purple)" delay={200} />
                <AgentKpi label="L1 Escalations" value={stats.critical} color="var(--red)" delay={300} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Burnout Analytics */}
                <div className="card">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
                    <h3 className="font-heading font-bold text-[14px] text-text tracking-tight uppercase">Operational Fatigue Metrics</h3>
                    {burnout && <BurnoutBadge level={burnout.burnout_level} />}
                  </div>
                  
                  {!burnout ? (
                    <div className="py-16 text-center text-text-disabled text-[13px] font-medium italic">
                      Insufficient data for fatigue triangulation.
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div className="flex items-end justify-between gap-4">
                        <div className="flex-1">
                          <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest block mb-3">Fatigue Coefficient</label>
                          <div className="h-2.5 w-full bg-surface2 rounded-full overflow-hidden">
                            <div 
                                className="h-full rounded-full transition-all duration-1000 shadow-sm" 
                                style={{ width: `${burnout.burnout_score}%`, backgroundColor: burnoutColor }} 
                            />
                          </div>
                        </div>
                        <span className="font-heading font-extrabold text-[32px] leading-none" style={{ color: burnoutColor }}>
                            {Math.round(burnout.burnout_score)}<span className="text-[16px] ml-0.5">%</span>
                        </span>
                      </div>

                      {burnout.burnout_level === 'HIGH' && (
                        <div className="p-4 bg-red-soft rounded-btn border border-red/10 animate-pulse">
                          <p className="text-[12.5px] text-red font-bold flex items-center gap-3">
                            <span className="text-lg">⚠️</span> ADMINISTRATIVE ADVISORY: Threshold breached. Redistribution recommended.
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: 'Active', value: burnout.breakdown?.open_tickets ?? '0' },
                          { label: 'L1 Risks', value: burnout.breakdown?.critical_tickets ?? '0' },
                          { label: 'Sync Today', value: burnout.breakdown?.resolved_today ?? '0' },
                          { label: 'Dwell Time', value: (burnout.breakdown?.hours_since_last_resolution + 'h') ?? '—' },
                        ].map((s) => (
                          <div key={s.label} className="bg-surface2 rounded-btn p-3 text-center border border-transparent hover:border-border transition-all">
                            <div className="text-[16px] font-heading font-extrabold text-text leading-none mb-1">{s.value}</div>
                            <div className="text-[9px] font-extrabold text-text-muted uppercase tracking-wider">{s.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Priority Registry */}
                <div className="card !p-0 overflow-hidden">
                  <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-surface2/50">
                    <h3 className="font-heading font-bold text-[14px] text-text tracking-tight uppercase">Thread Registry</h3>
                    <Link to="/agent/tickets" className="text-[11px] font-extrabold text-blue uppercase tracking-widest hover:underline">Full Registry →</Link>
                  </div>
                  
                  {recentTickets.length === 0 ? (
                    <div className="py-20 text-center text-text-disabled text-[13px] font-medium">
                      Queue neutralized. No active assignments.
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {recentTickets.map((t) => (
                        <div key={t.id}
                          onClick={() => navigate(`/agent/tickets/${t.id}`)}
                          className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-blue-soft/30 transition-all group"
                        >
                          <div className="flex flex-col gap-1.5 min-w-[100px]">
                            <PriorityBadge priority={t.priority} />
                            <StatusBadge status={t.status} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-bold text-text group-hover:text-blue transition-colors truncate">
                                {t.title}
                            </div>
                            <div className="text-[11px] text-text-muted font-bold uppercase tracking-tight mt-1">
                                Modified: {formatDateTime(t.created_at)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
