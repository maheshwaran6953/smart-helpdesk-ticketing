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

export default function UserTicketDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [ticket, setTicket] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [sendingComment, setSendingComment] = useState(false);
    const [verifying, setVerifying] = useState(false);
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
            toast.error('Failed to synchronize case data');
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
            toast.success('Message dispatched');
        } catch (err) {
            toast.error('Dispatch failure');
        } finally {
            setSendingComment(false);
        }
    };

    const handleVerify = async (action) => {
        setVerifying(true);
        try {
            await api.post(`/tickets/${id}/verify`, { action });
            if (action === 'confirm') {
                toast.success('Resolution confirmed. Case archived.');
            } else {
                toast.warning('Resolution rejected. Case reopened.');
            }
            await fetchTicketData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Verification failure');
        } finally {
            setVerifying(false);
        }
    };

    if (loading) return <div className="app-layout"><Sidebar /><div className="main-content"><Navbar title="Case Detailed View" /><div className="page-content"><LoadingSpinner /></div></div></div>;
    if (!ticket) return <div className="app-layout"><Sidebar /><div className="main-content"><Navbar title="Case Detailed View" /><div className="page-content"><p>Record not found.</p></div></div></div>;

    const isPending = ticket.status === 'pending_verification';
    const isClosed = ticket.status === 'closed';

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <Navbar title={`Service Record #${id}`} />
                <div className="page-content">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex items-center justify-between mb-6">
                            <button 
                                onClick={() => navigate('/user/tickets')} 
                                className="btn-secondary !py-1.5 !px-4 text-[12.5px] font-bold"
                            >
                                ← Registry View
                            </button>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue" />
                                <span className="text-[10px] font-extrabold text-blue uppercase tracking-widest">Active Audit Session</span>
                            </div>
                        </div>

                        {/* HIGH-IMPACT VERIFICATION BANNER */}
                        {isPending && (
                            <div className="verify-box flex flex-col md:flex-row items-center justify-between gap-8 mb-8 animate-fadeIn text-indigo">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-white rounded-avatar flex items-center justify-center shadow-lg shadow-indigo/20">
                                        <div className="w-6 h-6 bg-purple rounded-full animate-ping" />
                                    </div>
                                    <div>
                                        <h2 className="font-heading font-extrabold text-[19px] tracking-tight mb-1">Resolution Verification</h2>
                                        <p className="text-[14px] text-indigo/70 font-medium">Technical staff has proposed a resolution. Please authorize case closure or request further investigation.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 w-full md:w-auto">
                                    <button 
                                        className="btn-primary !bg-white !shadow-xl !text-green hover:!bg-green-soft !border-none flex-1 md:flex-initial !px-8" 
                                        disabled={verifying} 
                                        onClick={() => handleVerify('confirm')}
                                    >
                                        Authorize Closure
                                    </button>
                                    <button 
                                        className="btn-secondary !bg-indigo !text-white !border-none !px-8 hover:!bg-indigo/90 flex-1 md:flex-initial" 
                                        disabled={verifying} 
                                        onClick={() => handleVerify('reject')}
                                    >
                                        Reject & Reopen
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
                            {/* LEFT: Central Workspace */}
                            <div className="space-y-8">
                                {/* Case Details */}
                                <div className="card">
                                   <div className="border-l-4 border-blue pl-5 py-1 mb-6">
                                      <h1 className="font-heading font-extrabold text-[22px] text-text tracking-tight mb-2">
                                        {ticket.title}
                                      </h1>
                                      <div className="flex flex-wrap gap-2">
                                        <PriorityBadge priority={ticket.priority} />
                                        <StatusBadge status={ticket.status} />
                                        {ticket.is_escalated === 1 && (
                                          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-badge bg-red-soft text-red text-[11px] font-bold">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red animate-pulse" />
                                            PROTOCOL OVERRIDE: ESCALATED
                                          </div>
                                        )}
                                      </div>
                                   </div>
                                   
                                   <div className="bg-surface2 rounded-btn p-6 mb-8 border border-border">
                                      <p className="text-[15px] leading-[1.8] text-text-secondary font-medium">
                                        {ticket.description}
                                      </p>
                                   </div>

                                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-border">
                                     <div>
                                       <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider mb-1 block">Asset Allocation</label>
                                       <p className="text-[13.5px] font-bold text-text-secondary">{ticket.agent_name || 'Pending...'}</p>
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

                                {/* Thread Section */}
                                <div className="card !p-0 overflow-hidden">
                                   <div className="px-8 py-5 border-b border-border bg-surface2/50 flex items-center justify-between">
                                      <h3 className="font-heading font-bold text-[15px] text-text">Communication Manifest</h3>
                                      <div className="flex items-center gap-2">
                                         <div className="w-1.5 h-1.5 rounded-full bg-green" />
                                         <span className="text-[10px] font-extrabold text-green shadow-sm uppercase tracking-widest">Active Link</span>
                                      </div>
                                   </div>

                                   <div className="p-8">
                                      <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar mb-8">
                                          {comments.map((c, i) => {
                                              const isMine = c.user_id === user.id;
                                              return (
                                                  <div key={i} className={`flex gap-4 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                                                      <div className={`w-10 h-10 rounded-avatar flex-shrink-0 flex items-center justify-center text-white font-extrabold text-[12px] shadow-sm ${isMine ? 'bg-indigo' : 'bg-blue'}`}>
                                                          {getInitials(c.user_name)}
                                                      </div>
                                                      <div className={`max-w-[75%] ${isMine ? 'text-right' : 'text-left'}`}>
                                                          <div className="text-[11px] font-extrabold text-text-muted uppercase tracking-tight mb-1.5">
                                                              {isMine ? 'Author (You)' : c.user_name} · {formatDateTime(c.created_at)}
                                                          </div>
                                                          <div className={`p-4 rounded-card text-[14px] leading-relaxed shadow-sh0 ${isMine ? 'bg-indigo text-white rounded-tr-none' : 'bg-surface2 text-text rounded-tl-none border border-border'}`}>
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
                                              <p className="text-[13px] text-text-disabled font-bold uppercase tracking-[2px]">Case Archived · Read Only Link</p>
                                          </div>
                                      )}
                                   </div>
                                </div>
                            </div>

                            {/* RIGHT: Metadata Hub */}
                            <div className="space-y-6">
                                {/* Case Metadata */}
                                <div className="card">
                                   <div className="flex items-center gap-2 mb-6">
                                     <div className="w-1.5 h-1.5 rounded-full bg-indigo" />
                                     <h3 className="font-heading font-bold text-[14px] text-text tracking-tight uppercase">Audit Logs</h3>
                                  </div>
                                  <div className="space-y-6">
                                      <div className="relative pl-6 border-l-2 border-border space-y-8">
                                          <div className="relative">
                                              <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-white border-2 border-blue" />
                                              <div className="text-[13px] font-bold text-text mb-0.5">Initialization</div>
                                              <div className="text-[11px] font-bold text-text-disabled uppercase">{formatDateTime(ticket.created_at)}</div>
                                          </div>
                                          {ticket.agent_name && (
                                              <div className="relative">
                                                  <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-white border-2 border-orange" />
                                                  <div className="text-[13px] font-bold text-text mb-0.5">Asset Designated</div>
                                                  <div className="text-[11px] font-bold text-text-disabled uppercase">{ticket.agent_name}</div>
                                              </div>
                                          )}
                                          {ticket.resolved_at && (
                                              <div className="relative">
                                                  <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-white border-2 border-green shadow-sm shadow-green/20" />
                                                  <div className="text-[13px] font-bold text-text mb-0.5">Resolution Logged</div>
                                                  <div className="text-[11px] font-bold text-text-disabled uppercase">{formatDateTime(ticket.resolved_at)}</div>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                                </div>

                                {/* Performance Monitor */}
                                <div className="card space-y-4">
                                   <div className="flex items-center gap-2 mb-2">
                                     <div className="w-1.5 h-1.5 rounded-full bg-red" />
                                     <h3 className="font-heading font-bold text-[14px] text-text tracking-tight uppercase">SLA Compliance</h3>
                                  </div>
                                  
                                  <div className="bg-surface2 rounded-btn p-4 border border-border">
                                      <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest block mb-2">Service Deadline</label>
                                      <div className="font-heading font-extrabold text-[16px] text-text mb-1">{formatDateTime(ticket.sla_deadline)}</div>
                                      <div className="w-full h-1.5 bg-border rounded-full overflow-hidden mt-3">
                                          <div className={`h-full rounded-full ${ticket.is_escalated ? 'bg-red' : 'bg-blue'}`} style={{ width: '100%' }} />
                                      </div>
                                  </div>

                                  {ticket.is_escalated === 1 && (
                                      <div className="p-4 bg-red-soft rounded-badge border border-red/10 flex items-center gap-3">
                                          <div className="w-2 h-2 rounded-full bg-red animate-pulse" />
                                          <span className="text-[11.5px] font-bold text-red uppercase tracking-tight leading-tight">SLA Breach protocol triggered</span>
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
