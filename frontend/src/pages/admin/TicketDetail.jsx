import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { PriorityBadge, StatusBadge } from '../../components/Badges';
import { useToast } from '../../context/ToastContext';
import api from '../../api/axios';

const getInitials = (name = '') => name.split(' ').filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 2);

const formatDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

function BreachMeter({ score }) {
  const pct = Math.round(score || 0);
  let color = 'var(--green)'; let label = 'LOW';
  if (pct >= 80) { color = 'var(--red)'; label = 'CRITICAL'; }
  else if (pct >= 60) { color = 'var(--orange)'; label = 'HIGH'; }
  else if (pct >= 40) { color = 'var(--amber)'; label = 'MEDIUM'; }
  
  return (
    <div className="text-center py-6">
      <div className="font-heading font-extrabold text-[48px] leading-none mb-4" style={{ color }}>
        {pct}%
      </div>
      <div className="h-2.5 w-full bg-surface2 rounded-full overflow-hidden mb-5">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="inline-block px-4 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-wider" style={{ color, backgroundColor: `${color}15` }}>
        {label} BREACH RISK
      </span>
    </div>
  );
}

export default function AdminTicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('comments');
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [reassignNote, setReassignNote] = useState('');
  const [reassigning, setReassigning] = useState(false);
  const commentsEndRef = useRef(null);

  const fetchAll = useCallback(async () => {
    try {
      const [tRes, cRes, lRes, aRes] = await Promise.all([
        api.get(`/tickets/${id}`),
        api.get(`/tickets/${id}/comments`),
        api.get(`/admin/tickets/${id}/logs`).catch(() => ({ data: [] })),
        api.get('/admin/users'),
      ]);
      setTicket(tRes.data.ticket || tRes.data);
      setComments(cRes.data.comments || cRes.data || []);
      setLogs(lRes.data.logs || lRes.data || []);
      const allUsers = aRes.data.users || [];
      setAgents(allUsers.filter((u) => u.role === 'agent'));
    } catch {
      toast.error('Failed to load ticket.');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const sendComment = async () => {
    if (!newComment.trim()) return;
    setSendingComment(true);
    try {
      await api.post(`/tickets/${id}/comments`, { message: newComment });
      setNewComment('');
      const res = await api.get(`/tickets/${id}/comments`);
      setComments(res.data.comments || res.data || []);
      toast.success('Comment synchronized successfully');
    } catch { toast.error('Failed to dispatch comment.'); }
    finally { setSendingComment(false); }
  };

  const updateStatus = async () => {
    if (!newStatus) return;
    setUpdatingStatus(true);
    try {
      await api.patch(`/tickets/${id}/status`, { status: newStatus, note: statusNote });
      toast.success('System record updated');
      setStatusNote('');
      await fetchAll();
    } catch (e) { toast.error(e.response?.data?.message || 'Update failed.'); }
    finally { setUpdatingStatus(false); }
  };

  const reassign = async () => {
    if (!selectedAgent) return;
    setReassigning(true);
    try {
      await api.patch(`/tickets/${id}/reassign`, { agent_id: parseInt(selectedAgent), note: reassignNote });
      toast.success('Case reassigned successfully');
      setReassignNote('');
      await fetchAll();
    } catch (e) { toast.error(e.response?.data?.message || 'Reassignment failure.'); }
    finally { setReassigning(false); }
  };

  if (loading) return (
    <div className="app-layout"><Sidebar /><div className="main-content"><Navbar title="Case Detailed View" /><div className="page-content"><LoadingSpinner /></div></div></div>
  );
  if (!ticket) return (
    <div className="app-layout"><Sidebar /><div className="main-content"><Navbar title="Case Detailed View" /><div className="page-content"><p>Record not found.</p></div></div></div>
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title={`Case #${ticket.id} Detailed Audit`} />
        <div className="page-content">
          <div className="max-w-6xl mx-auto">
            {/* Navigation Header */}
            <div className="flex items-center justify-between mb-6">
              <button 
                onClick={() => navigate('/admin/tickets')} 
                className="btn-secondary !py-1.5 !px-4 text-[12.5px] font-bold"
              >
                ← Return to Registry
              </button>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue" />
                <span className="text-[10px] font-extrabold text-blue uppercase tracking-widest">Active Audit Session</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
              {/* LEFT: Central Workspace */}
              <div className="space-y-6">
                {/* Subject Mastery Card */}
                <div className="card">
                   <div className="border-l-4 border-blue pl-5 py-2 mb-6">
                      <h1 className="font-heading font-extrabold text-[22px] text-text tracking-tight mb-2">
                        {ticket.title}
                      </h1>
                      <div className="flex flex-wrap gap-2">
                        <PriorityBadge priority={ticket.priority} />
                        <StatusBadge status={ticket.status} />
                        {ticket.is_escalated === 1 && (
                          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-badge bg-red-soft text-red text-[11px] font-bold">
                            <div className="w-1.5 h-1.5 rounded-full bg-red animate-pulse" />
                            CRITICAL ESCALATION
                          </div>
                        )}
                      </div>
                   </div>
                   
                   <div className="bg-surface2 rounded-btn p-5 mb-8 border border-border">
                      <p className="text-[14.5px] leading-[1.7] text-text-secondary font-medium">
                        {ticket.description}
                      </p>
                   </div>

                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6 border-t border-border">
                     <div>
                       <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider mb-1 block">Requestor</label>
                       <p className="text-[13.5px] font-bold text-text">{ticket.user_name || '—'}</p>
                     </div>
                     <div>
                       <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider mb-1 block">Category</label>
                       <p className="text-[13.5px] font-bold text-text-secondary">{ticket.category_name || 'General'}</p>
                     </div>
                     <div>
                       <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider mb-1 block">Timeline</label>
                       <p className="text-[12px] font-bold text-text-muted">{formatDateTime(ticket.created_at)}</p>
                     </div>
                   </div>
                </div>

                {/* Communication & Audit Workspace */}
                <div className="card !p-0 overflow-hidden">
                   <div className="bg-surface2 px-6 pt-5">
                      <div className="flex bg-white/50 p-1 rounded-btn border border-border w-max space-x-1">
                        <button 
                          onClick={() => setTab('comments')}
                          className={`px-6 py-2 rounded-btn text-[12px] font-bold transition-all ${tab === 'comments' ? 'bg-white text-blue shadow-sh1' : 'text-text-muted hover:text-text'}`}
                        >
                          Communications ({comments.length})
                        </button>
                        <button 
                          onClick={() => setTab('logs')}
                          className={`px-6 py-2 rounded-btn text-[12px] font-bold transition-all ${tab === 'logs' ? 'bg-white text-blue shadow-sh1' : 'text-text-muted hover:text-text'}`}
                        >
                          System Ledger
                        </button>
                      </div>
                   </div>

                   <div className="p-6">
                      {tab === 'comments' ? (
                        <div className="space-y-6">
                          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                            {comments.length === 0 ? (
                              <div className="py-16 text-center bg-surface2 rounded-btn border-2 border-dashed border-border">
                                <p className="text-[13px] text-text-muted font-bold uppercase tracking-wider">No communication records</p>
                              </div>
                            ) : comments.map((c, i) => {
                              const isAdmin = c.user_role === 'admin';
                              return (
                                <div key={i} className={`flex gap-4 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                                  <div className={`w-10 h-10 rounded-avatar flex-shrink-0 flex items-center justify-center text-white font-extrabold text-[12px] ${isAdmin ? 'bg-blue' : 'bg-green'}`}>
                                    {getInitials(c.user_name)}
                                  </div>
                                  <div className={`max-w-[80%] ${isAdmin ? 'text-right' : 'text-left'}`}>
                                    <div className="text-[11px] font-extrabold text-text-muted uppercase tracking-tight mb-1">
                                      {c.user_name} · {formatDateTime(c.created_at)}
                                    </div>
                                    <div className={`p-4 rounded-card text-[14px] leading-relaxed shadow-sh0 ${isAdmin ? 'bg-blue text-white rounded-tr-none' : 'bg-surface2 text-text rounded-tl-none border border-border'}`}>
                                      {c.message}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            <div ref={commentsEndRef} />
                          </div>
                          
                          <div className="flex gap-3 pt-6 border-t border-border">
                            <input 
                              className="form-input flex-1" 
                              placeholder="Type a corporate message..."
                              value={newComment} 
                              onChange={(e) => setNewComment(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendComment()} 
                            />
                            <button 
                              className="btn-primary !px-8 h-[42px]" 
                              onClick={sendComment} 
                              disabled={sendingComment || !newComment.trim()}
                            >
                              {sendingComment ? '...' : 'Dispatch'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {logs.length === 0 ? (
                             <div className="py-16 text-center bg-surface2 rounded-btn border-2 border-dashed border-border text-text-disabled">
                               No ledger entries found for this record.
                             </div>
                          ) : (
                            <div className="space-y-4 border-l-2 border-border ml-4 pl-8 pt-2">
                              {logs.map((l, i) => (
                                <div key={i} className="relative mb-8 last:mb-0">
                                  <div className="absolute -left-[41px] top-1 w-4 h-4 rounded-full bg-white border-[3px] border-blue shadow-sh1" />
                                  <div className="bg-surface2 rounded-btn p-4 border border-border group hover:border-blue-mid transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-[13px] font-extrabold text-text">{l.changed_by_name || 'System Kernel'}</span>
                                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">{formatDateTime(l.created_at)}</span>
                                    </div>
                                    <div className="text-[13.5px] text-text-secondary font-medium">
                                       <span className="text-text-muted line-through mr-2">{l.old_status || 'INIT'}</span>
                                       <span className="text-blue font-bold">→ {l.new_status}</span>
                                    </div>
                                    {l.note && (
                                       <p className="mt-2 text-[12px] italic text-text-muted bg-white p-2 rounded-sm border-l-2 border-border2">
                                          "{l.note}"
                                       </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                   </div>
                </div>
              </div>

              {/* RIGHT: Operational Controls */}
              <div className="space-y-6">
                {/* Deployment Controls */}
                <div className="card space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-indigo" />
                     <h3 className="font-heading font-bold text-[14px] text-text tracking-tight uppercase">Operational State</h3>
                  </div>
                  
                  <div>
                    <label className="form-label mb-2">Transition Status</label>
                    <select className="form-select" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                      <option value="">Select state...</option>
                      <option value="open">Open Record</option>
                      <option value="in_progress">Processing</option>
                      <option value="pending_verification">Awaiting User Confirmation</option>
                      <option value="resolved">Mark as Resolved</option>
                      <option value="closed">Archive Case</option>
                    </select>
                  </div>
                  
                  <textarea 
                    className="form-textarea" 
                    rows={3} 
                    placeholder="Provide administrative justification..."
                    value={statusNote} 
                    onChange={(e) => setStatusNote(e.target.value)} 
                  />
                  
                  <button 
                    className="btn-primary w-full h-[44px]"
                    onClick={updateStatus} 
                    disabled={updatingStatus || !newStatus}
                  >
                    {updatingStatus ? 'Updating Console...' : 'Synchronize State'}
                  </button>
                </div>

                {/* Resource Allocation */}
                <div className="card space-y-4">
                   <div className="flex items-center gap-2 mb-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-blue" />
                     <h3 className="font-heading font-bold text-[14px] text-text tracking-tight uppercase">Resource Allocation</h3>
                  </div>
                  
                  <div>
                    <label className="form-label mb-2">Designate Asset</label>
                    <select className="form-select" value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)}>
                      <option value="">Search qualified agents...</option>
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>{a.name} ({a.expertise || 'General'})</option>
                      ))}
                    </select>
                  </div>
                  
                  <input 
                    className="form-input" 
                    placeholder="Assignment brief..."
                    value={reassignNote} 
                    onChange={(e) => setReassignNote(e.target.value)} 
                  />
                  
                  <button 
                    className="btn-secondary w-full h-[44px] !bg-blue-soft !border-blue-mid !text-blue hover:!bg-blue hover:!text-white"
                    onClick={reassign} 
                    disabled={reassigning || !selectedAgent}
                  >
                    {reassigning ? 'Allocating...' : 'Confirm Assignment'}
                  </button>
                </div>

                {/* Risk Intelligence */}
                <div className="card">
                   <div className="flex items-center gap-2 mb-4">
                     <div className="w-1.5 h-1.5 rounded-full bg-red" />
                     <h3 className="font-heading font-bold text-[14px] text-text tracking-tight uppercase">Performance Analytics</h3>
                  </div>
                  <BreachMeter score={ticket.breach_risk} />
                  {ticket.breach_risk_reason && (
                    <div className="mt-4 p-4 bg-red-soft rounded-btn border border-red/10">
                      <p className="text-[12px] text-red font-bold text-center leading-relaxed">
                        INTELLIGENCE: {ticket.breach_risk_reason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
