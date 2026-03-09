import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { PriorityBadge, StatusBadge } from '../../components/Badges';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/axios';

const getInitials = (name = '') => name.split(' ').filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 2);

const formatDateTime = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function AgentTicketDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [ticket, setTicket] = useState(null);
    const [comments, setComments] = useState([]);
    const [kbSuggestions, setKbSuggestions] = useState([]);
    const [showKb, setShowKb] = useState(false);
    const [loading, setLoading] = useState(true);
    const [fetchingKb, setFetchingKb] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [sendingComment, setSendingComment] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const commentsEndRef = useRef(null);

    const fetchTicketData = React.useCallback(async () => {
        try {
            const [tRes, cRes] = await Promise.all([
                api.get(`/tickets/${id}`),
                api.get(`/tickets/${id}/comments`)
            ]);
            setTicket(tRes.data.ticket || tRes.data);
            setComments(cRes.data.comments || cRes.data || []);
        } catch (err) {
            toast.error('Failed to synchronize case details');
        } finally {
            setLoading(false);
        }
    }, [id, toast]);

    useEffect(() => {
        fetchTicketData();
    }, [fetchTicketData]);

    useEffect(() => {
        if (commentsEndRef.current) {
            commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [comments]);

    const handleSendComment = async () => {
        if (!newComment.trim()) return;
        setSendingComment(true);
        try {
            await api.post(`/tickets/${id}/comments`, { message: newComment });
            setNewComment('');
            const res = await api.get(`/tickets/${id}/comments`);
            setComments(res.data.comments || res.data || []);
            toast.success('Communication dispatched');
        } catch (err) {
            toast.error('Dispatch failure');
        } finally {
            setSendingComment(false);
        }
    };

    const handleStatusUpdate = async (status) => {
        setActionLoading(true);
        try {
            await api.patch(`/tickets/${id}/status`, { status });
            toast.success(`Operational status adjusted to ${status.replace('_', ' ').toUpperCase()}`);
            await fetchTicketData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Status adjustment failure');
        } finally {
            setActionLoading(false);
        }
    };

    const fetchKbSuggestions = async () => {
        setFetchingKb(true);
        setShowKb(true);
        try {
            const res = await api.get(`/tickets/${id}/kb-suggestions`);
            setKbSuggestions(res.data.suggestions || res.data || []);
        } catch (err) {
            toast.error('Knowledge Base synchronization failure');
        } finally {
            setFetchingKb(false);
        }
    };

    const applySolution = async (kbId, closeTicket) => {
        setActionLoading(true);
        try {
            await api.post(`/tickets/${id}/apply-solution/${kbId}`, { close_ticket: closeTicket });
            toast.success(closeTicket ? 'Solution deployed and case resolved' : 'Solution appended to communication');
            setShowKb(false);
            await fetchTicketData();
        } catch (err) {
            toast.error('Solution deployment failure');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="app-layout"><Sidebar /><div className="main-content"><Navbar title="Asset Control Terminal" /><div className="page-content"><LoadingSpinner /></div></div></div>;
    if (!ticket) return <div className="app-layout"><Sidebar /><div className="main-content"><Navbar title="Asset Control Terminal" /><div className="page-content"><div className="card">Record not found.</div></div></div></div>;

    const isClosed = ticket.status === 'closed';

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <Navbar title={`Case Record #${id}`} />
                <div className="page-content">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <div className="flex items-center justify-between">
                            <button 
                                onClick={() => navigate('/agent/tickets')} 
                                className="btn-secondary !py-1.5 !px-4 text-[12.5px] font-bold"
                            >
                                ← Operational Registry
                            </button>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue" />
                                <span className="text-[10px] font-extrabold text-blue uppercase tracking-widest">Active Audit Session</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
                            {/* CENTRAL WORKSPACE */}
                            <div className="space-y-6">
                                {/* Case Brief */}
                                <div className="card">
                                   <div className="flex items-center justify-between mb-6">
                                      <div className="border-l-4 border-blue pl-5 py-1">
                                         <h1 className="font-heading font-extrabold text-[22px] text-text tracking-tight mb-2">{ticket.title}</h1>
                                         <div className="flex gap-2">
                                            <PriorityBadge priority={ticket.priority} />
                                            <StatusBadge status={ticket.status} />
                                         </div>
                                      </div>
                                   </div>
                                   <div className="bg-surface2 rounded-btn p-6 mb-8 border border-border">
                                      <p className="text-[15px] leading-[1.8] text-text-secondary font-medium">{ticket.description}</p>
                                   </div>
                                   
                                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-border">
                                     <div>
                                       <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider mb-1 block">Requester</label>
                                       <p className="text-[13.5px] font-bold text-text-secondary">{ticket.user_name}</p>
                                     </div>
                                     <div>
                                       <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider mb-1 block">Classification</label>
                                       <p className="text-[13.5px] font-bold text-text-secondary">{ticket.category_name || 'General'}</p>
                                     </div>
                                     <div className="col-span-2">
                                       <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider mb-1 block">System Timestamp</label>
                                       <p className="text-[12px] font-bold text-text-muted">{formatDateTime(ticket.created_at)}</p>
                                     </div>
                                   </div>
                                </div>

                                {/* AI HUB / KB SUGGESTIONS */}
                                {showKb && (
                                    <div className="card !border-blue shadow-lg shadow-blue/5 animate-fadeIn">
                                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-blue/10">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-avatar bg-blue flex items-center justify-center">
                                                    <div className="w-3 h-3 border-2 border-white rounded-full bg-indigo animate-pulse" />
                                                </div>
                                                <h3 className="font-heading font-bold text-[14px] text-text tracking-tight uppercase">AI Resource Recommendations</h3>
                                            </div>
                                            <button onClick={() => setShowKb(false)} className="text-text-muted hover:text-red transition-colors text-xl font-light">×</button>
                                        </div>
                                        
                                        {fetchingKb ? (
                                            <div className="py-12"><LoadingSpinner /></div>
                                        ) : (
                                            <div className="space-y-4">
                                                {kbSuggestions.length === 0 ? (
                                                    <div className="py-12 text-center text-text-disabled text-[13px] font-medium italic">No correlating resources identified.</div>
                                                ) : kbSuggestions.map((kb) => (
                                                    <div key={kb.id} className="p-5 bg-blue-soft/20 rounded-btn border border-blue-mid/30 hover:border-blue transition-all">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h4 className="text-[14px] font-extrabold text-text tracking-tight">{kb.title}</h4>
                                                            <div className="px-2 py-0.5 rounded-full bg-blue text-white text-[9px] font-extrabold uppercase tracking-widest">{kb.match_percentage}% Match</div>
                                                        </div>
                                                        <p className="text-[13px] text-text-secondary font-medium leading-[1.6] mb-5 line-clamp-3">{kb.content}</p>
                                                        <div className="flex gap-3 pt-4 border-t border-blue/5">
                                                            <button 
                                                                className="btn-secondary !text-[11px] !px-4 !py-2 flex-1" 
                                                                disabled={actionLoading} 
                                                                onClick={() => applySolution(kb.id, false)}
                                                            >
                                                                Append Suggestion
                                                            </button>
                                                            <button 
                                                                className="btn-primary !text-[11px] !px-4 !py-2 flex-1" 
                                                                disabled={actionLoading} 
                                                                onClick={() => applySolution(kb.id, true)}
                                                            >
                                                                Deploy & Resolve
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* COMMUNICATION CHANNEL */}
                                <div className="card !p-0 overflow-hidden">
                                   <div className="px-8 py-5 border-b border-border bg-surface2/50 flex items-center justify-between">
                                      <h3 className="font-heading font-bold text-[15px] text-text">Service Thread Manifest</h3>
                                      <div className="flex items-center gap-2">
                                         <div className="w-1.5 h-1.5 rounded-full bg-green" />
                                         <span className="text-[10px] font-extrabold text-green shadow-sm uppercase tracking-widest">Link Active</span>
                                      </div>
                                   </div>

                                   <div className="p-8">
                                      <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar mb-8">
                                          {comments.map((c, i) => {
                                              const isMe = c.user_id === user.id;
                                              return (
                                                  <div key={i} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                      <div className={`w-10 h-10 rounded-avatar flex-shrink-0 flex items-center justify-center text-white font-extrabold text-[12px] shadow-sm ${isMe ? 'bg-indigo' : 'bg-blue'}`}>
                                                          {getInitials(c.user_name)}
                                                      </div>
                                                      <div className={`max-w-[75%] ${isMe ? 'text-right' : 'text-left'}`}>
                                                          <div className="text-[11px] font-extrabold text-text-muted uppercase tracking-tight mb-1.5">
                                                              {c.user_name} · {formatDateTime(c.created_at)}
                                                          </div>
                                                          <div className={`p-4 rounded-card text-[14px] leading-relaxed shadow-sh0 ${isMe ? 'bg-indigo text-white rounded-tr-none' : 'bg-surface2 text-text rounded-tl-none border border-border'}`}>
                                                              {c.message}
                                                          </div>
                                                      </div>
                                                  </div>
                                              );
                                          })}
                                          <div ref={commentsEndRef} />
                                      </div>
                                      
                                      {!isClosed ? (
                                          <div className="flex gap-3 pt-6 border-t border-border">
                                              <input 
                                                className="form-input flex-1" 
                                                placeholder="Dispatch professional communication..." 
                                                value={newComment} 
                                                onChange={(e) => setNewComment(e.target.value)} 
                                                onKeyDown={(e) => e.key === 'Enter' && handleSendComment()} 
                                              />
                                              <button 
                                                className="btn-primary !px-10 h-[42px]" 
                                                onClick={handleSendComment} 
                                                disabled={sendingComment || !newComment.trim()}
                                              >
                                                {sendingComment ? '...' : 'Dispatch'}
                                              </button>
                                          </div>
                                      ) : (
                                          <div className="py-6 px-4 bg-surface2 rounded-btn border-2 border-dashed border-border text-center">
                                              <p className="text-[13px] text-text-disabled font-bold uppercase tracking-[2px]">Case Archived · Read Only Protocol</p>
                                          </div>
                                      )}
                                   </div>
                                </div>
                            </div>

                            {/* SIDEBAR: ACTION HUB */}
                            <div className="space-y-6">
                                {/* Workflow Controls */}
                                <div className="card">
                                   <div className="flex items-center gap-2 mb-6">
                                     <div className="w-1.5 h-1.5 rounded-full bg-blue" />
                                     <h3 className="font-heading font-bold text-[14px] text-text tracking-tight uppercase">Operational Controls</h3>
                                  </div>
                                  <div className="space-y-3">
                                      {ticket.status === 'open' && (
                                          <button 
                                            className="btn-primary !w-full !justify-center !py-3 !text-[13px]" 
                                            disabled={actionLoading} 
                                            onClick={() => handleStatusUpdate('in_progress')}
                                          >
                                            Incept Processing
                                          </button>
                                      )}
                                      {(ticket.status === 'open' || ticket.status === 'in_progress') && (
                                          <button 
                                            className="btn-success !w-full !justify-center !py-3 !text-[13px]" 
                                            disabled={actionLoading} 
                                            onClick={() => handleStatusUpdate('resolved')}
                                          >
                                            Finalize Resolution
                                          </button>
                                      )}
                                      <button 
                                        className="btn-secondary !w-full !justify-center !py-3 !text-[13px] !bg-blue-soft !text-blue !border-none hover:!bg-blue hover:!text-white" 
                                        onClick={fetchKbSuggestions}
                                      >
                                        Inquire AI Resources
                                      </button>
                                  </div>
                                </div>

                                {/* Performance Monitor */}
                                <div className="card space-y-4">
                                   <div className="flex items-center gap-2 mb-2">
                                     <div className="w-1.5 h-1.5 rounded-full bg-red" />
                                     <h3 className="font-heading font-bold text-[14px] text-text tracking-tight uppercase">Compliance Monitoring</h3>
                                  </div>
                                  
                                  <div className="bg-surface2 rounded-btn p-4 border border-border">
                                      <div className="flex justify-between items-baseline mb-3">
                                         <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest">Breach Risk Index</label>
                                         <span className={`text-[18px] font-heading font-extrabold ${ticket.breach_risk >= 80 ? 'text-red' : ticket.breach_risk >= 50 ? 'text-orange' : 'text-green'}`}>
                                            {Math.round(ticket.breach_risk)}%
                                         </span>
                                      </div>
                                      <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                                          <div 
                                            className={`h-full rounded-full transition-all duration-1000`} 
                                            style={{ 
                                                width: `${ticket.breach_risk}%`, 
                                                backgroundColor: ticket.breach_risk >= 80 ? 'var(--red)' : ticket.breach_risk >= 50 ? 'var(--orange)' : 'var(--green)' 
                                            }} 
                                          />
                                      </div>
                                      <p className="text-[11px] text-text-muted font-medium mt-3 italic">{ticket.breach_risk_reason || "Nominal operational risk."}</p>
                                  </div>

                                  <div className="bg-surface2 rounded-btn p-4 border border-border">
                                      <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest block mb-2">SLA Disruption Phase</label>
                                      <div className={`text-[13px] font-bold ${ticket.is_escalated ? 'text-red' : 'text-text-secondary'}`}>
                                          {formatDateTime(ticket.sla_deadline)}
                                      </div>
                                  </div>

                                  {ticket.is_escalated === 1 && (
                                      <div className="p-4 bg-red-soft rounded-badge border border-red/10 flex items-center gap-3">
                                          <div className="w-2 h-2 rounded-full bg-red animate-pulse" />
                                          <span className="text-[11.5px] font-bold text-red uppercase tracking-tight leading-tight">High Priority: System Override Active</span>
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
