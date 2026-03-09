import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { BurnoutBadge, LoadBadge } from '../../components/Badges';
import api from '../../api/axios';

const getInitials = (name = '') => name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
const avatarColors = ['#4F6AF5', '#6C63FF', '#10B981', '#F59E0B', '#8B5CF6'];
const getAvatarColor = (name = '') => avatarColors[name?.charCodeAt(0) % avatarColors.length];


export default function PredictiveInsights() {
  const [breach, setBreach] = useState([]);
  const [burnout, setBurnout] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('breach');

  useEffect(() => {
    Promise.all([
      api.get('/predictive/breach-risk').catch(() => ({ data: { data: [] } })),
      api.get('/predictive/burnout').catch(() => ({ data: { data: [] } })),
      api.get('/predictive/forecast').catch(() => ({ data: { data: null } })),
    ]).then(([bRes, buRes, fRes]) => {
      setBreach(bRes.data.data || []);
      setBurnout(buRes.data.data || []);
      setForecast(fRes.data.data || null);
    }).finally(() => setLoading(false));
  }, []);

  const riskLevelColor = (level) => {
    const map = { CRITICAL: '#EF4444', HIGH: '#EA580C', MEDIUM: '#F59E0B', LOW: '#10B981' };
    return map[level?.toUpperCase()] || '#6B7280';
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Predictive AI Insights" />
        <div className="page-content">
          {loading ? <LoadingSpinner /> : (
            <>
              {/* Tabs */}
              <div style={{ background: 'white', borderRadius: 16, padding: 6, display: 'flex', gap: 6, marginBottom: 24, boxShadow: '0 4px 24px rgba(79,106,245,0.08)' }}>
                {[
                  { key: 'breach', label: `⚠️ Breach Risk (${breach.length})` },
                  { key: 'burnout', label: `🔥 Agent Burnout (${burnout.length})` },
                  { key: 'forecast', label: '📈 Volume Forecast' },
                ].map((t) => (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    style={{
                      flex: 1, padding: '12px 16px', borderRadius: 12, border: 'none',
                      cursor: 'pointer', fontWeight: 600, fontSize: 14, transition: 'all 0.2s',
                      background: tab === t.key ? '#4F6AF5' : 'transparent',
                      color: tab === t.key ? 'white' : '#6B7280',
                      fontFamily: 'Inter, sans-serif',
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* BREACH RISK */}
              {tab === 'breach' && (
                <div>
                  <div className="card" style={{ marginBottom: 16 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1D2E', marginBottom: 4 }}>AI-Powered SLA Breach Prediction</h2>
                    <p style={{ color: '#6B7280', fontSize: 14 }}>Tickets ranked by likelihood of breaching SLA deadline</p>
                  </div>
                  {breach.length === 0 ? (
                    <div className="card">
                      <div className="empty-state">
                        <div className="empty-state-icon">✅</div>
                        <p className="empty-state-title">All tickets are within safe SLA limits</p>
                        <p className="empty-state-text">No breach risk detected at this time.</p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {[...breach].sort((a, b) => b.breach_risk_score - a.breach_risk_score).map((t) => (
                        <div key={t.ticket_id} className="card" style={{ borderLeft: `4px solid ${riskLevelColor(t.breach_risk_level)}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div>
                              <span style={{ fontFamily: 'monospace', color: '#9CA3AF', fontSize: 12, marginRight: 8 }}>#{t.ticket_id}</span>
                              <span style={{ fontWeight: 600, color: '#1A1D2E', fontSize: 15 }}>{t.title}</span>
                            </div>
                            <span style={{
                              background: `${riskLevelColor(t.breach_risk_level)}15`,
                              color: riskLevelColor(t.breach_risk_level),
                              fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 99
                            }}>
                              {t.breach_risk_level}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ flex: 1 }}>
                              <div className="progress-bar-container" style={{ height: 8 }}>
                                <div className="progress-bar-fill" style={{ width: `${t.breach_risk_score}%`, background: riskLevelColor(t.breach_risk_level) }} />
                              </div>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: riskLevelColor(t.breach_risk_level), minWidth: 40 }}>
                              {Math.round(t.breach_risk_score)}%
                            </span>
                          </div>
                          {t.breach_risk_reason && (
                            <p style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic', marginTop: 8 }}>{t.breach_risk_reason}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* BURNOUT */}
              {tab === 'burnout' && (
                <div>
                  <div className="card" style={{ marginBottom: 16 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1D2E', marginBottom: 4 }}>Agent Wellbeing Monitor</h2>
                    <p style={{ color: '#6B7280', fontSize: 14 }}>AI-powered analysis of agent workload and burnout risk</p>
                  </div>
                  {burnout.length === 0 ? (
                    <div className="card"><div className="empty-state"><p className="empty-state-text">No agent data available.</p></div></div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {burnout.map((a) => {
                        const burnoutColor = a.burnout_level === 'HIGH' ? '#EF4444' : a.burnout_level === 'MEDIUM' ? '#F59E0B' : '#10B981';
                        return (
                          <div key={a.agent_id} className="card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                              <div className="avatar" style={{ background: getAvatarColor(a.agent_name), width: 52, height: 52, fontSize: 18 }}>
                                {getInitials(a.agent_name)}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 16, color: '#1A1D2E' }}>{a.agent_name}</div>
                                <div style={{ fontSize: 13, color: '#9CA3AF' }}>{a.agent_email}</div>
                              </div>
                              <BurnoutBadge level={a.burnout_level} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                              <div style={{ flex: 1 }}>
                                <div className="progress-bar-container" style={{ height: 10 }}>
                                  <div className="progress-bar-fill" style={{ width: `${a.burnout_score}%`, background: burnoutColor }} />
                                </div>
                              </div>
                              <span style={{ fontSize: 14, fontWeight: 700, color: burnoutColor, minWidth: 44 }}>{Math.round(a.burnout_score)}%</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                              {[
                                { label: 'Open Tickets', value: a.breakdown?.open_tickets ?? '—' },
                                { label: 'Critical Tickets', value: a.breakdown?.critical_tickets ?? '—' },
                                { label: 'Resolved Today', value: a.breakdown?.resolved_today ?? '—' },
                                { label: 'Hrs Since Last', value: a.breakdown?.hours_since_last_resolution ?? '—' },
                              ].map((s) => (
                                <div key={s.label} className="mini-stat">
                                  <div className="mini-stat-value">{s.value}</div>
                                  <div className="mini-stat-label">{s.label}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* FORECAST */}
              {tab === 'forecast' && (
                <div>
                  <div className="card" style={{ marginBottom: 16 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1D2E', marginBottom: 4 }}>Intelligent Volume Prediction</h2>
                    <p style={{ color: '#6B7280', fontSize: 14 }}>Based on 7-day moving average analysis</p>
                  </div>
                  {!forecast ? (
                    <div className="card">
                      <div className="empty-state">
                        <div className="empty-state-icon">📈</div>
                        <p className="empty-state-title">Not enough historical data yet</p>
                        <p className="empty-state-text">Need at least 3 days of tickets to generate forecasts.</p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      {/* Tomorrow forecast */}
                      <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Tomorrow's Forecast
                        </p>
                        <div style={{ fontSize: 72, fontWeight: 800, color: '#4F6AF5', lineHeight: 1 }}>
                          {forecast.forecast_tickets_tomorrow ?? '—'}
                        </div>
                        <p style={{ color: '#6B7280', fontSize: 14 }}>Expected tickets tomorrow</p>
                        <LoadBadge level={forecast.load_level} />
                        <p style={{ fontSize: 12, color: '#9CA3AF' }}>Today: {forecast.today_count ?? 0} tickets</p>
                      </div>

                      {/* Capacity analysis */}
                      <div className="card">
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Capacity Analysis</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                          {[
                            { label: 'Agent Count', value: forecast.agent_count ?? '—' },
                            { label: 'Total Capacity', value: forecast.agent_capacity ?? '—' },
                            { label: "Today's Count", value: forecast.today_count ?? '—' },
                            { label: 'Forecast vs Capacity', value: `${forecast.forecast_tickets_tomorrow ?? 0} / ${forecast.agent_capacity ?? 0}` },
                          ].map((r) => (
                            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F9FAFB', borderRadius: 10 }}>
                              <span style={{ fontSize: 14, color: '#6B7280' }}>{r.label}</span>
                              <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1D2E' }}>{r.value}</span>
                            </div>
                          ))}
                        </div>
                        {forecast.recommendation && (
                          <div style={{
                            padding: '14px 16px', borderRadius: 12,
                            background: forecast.load_level === 'HIGH' ? '#FEF2F2' : forecast.load_level === 'MEDIUM' ? '#FFFBEB' : '#ECFDF5',
                            border: `1px solid ${forecast.load_level === 'HIGH' ? '#FECACA' : forecast.load_level === 'MEDIUM' ? '#FDE68A' : '#A7F3D0'}`,
                            color: forecast.load_level === 'HIGH' ? '#DC2626' : forecast.load_level === 'MEDIUM' ? '#92400E' : '#065F46',
                            fontSize: 13,
                          }}>
                            {forecast.recommendation}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
