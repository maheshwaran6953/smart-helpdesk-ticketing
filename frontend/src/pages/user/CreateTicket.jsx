import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import api from '../../api/axios';

export default function CreateTicket() {
    const navigate = useNavigate();
    const toast = useToast();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    const [form, setForm] = useState({
        title: '',
        description: '',
        category_id: '',
        priority: 'medium'
    });

    const [aiSuggestion, setAiSuggestion] = useState(null);
    const [duplicates, setDuplicates] = useState([]);
    const [checkingAI, setCheckingAI] = useState(false);

    useEffect(() => {
        api.get('/categories')
            .then(res => {
                const cats = res.data.categories || res.data || [];
                setCategories(cats);
                if (cats.length > 0) setForm(f => ({ ...f, category_id: cats[0].id }));
            })
            .catch(() => toast.error('Failed to load categories'))
            .finally(() => setLoading(false));
    }, [toast]);

    const handleBlurDescription = async () => {
        if (!form.description.trim() || form.description.length < 10) return;
        
        setCheckingAI(true);
        try {
            const aiRes = await api.post('/tickets/suggest-priority', { description: form.description });
            if (aiRes.data.suggested_priority) {
                setAiSuggestion(aiRes.data.suggested_priority.toLowerCase());
            }

            const dupRes = await api.post('/tickets/check-duplicate', { description: form.description });
            if (dupRes.data.has_duplicates) {
                setDuplicates(dupRes.data.similar_tickets || []);
            } else {
                setDuplicates([]);
            }
        } catch (err) {
            console.error('AI check failed', err);
        } finally {
            setCheckingAI(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.description || !form.category_id) {
            toast.error('All required fields must be populated.');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/tickets', form);
            toast.success('Request dispatched to system');
            setTimeout(() => navigate('/user/tickets'), 1500);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Submission failure');
        } finally {
            setSubmitting(false);
        }
    };

    const applyAiPriority = () => {
        if (aiSuggestion) {
            setForm(f => ({ ...f, priority: aiSuggestion }));
            setAiSuggestion(null);
            toast.info(`Priority adjusted to ${aiSuggestion.toUpperCase()}`);
        }
    };

    if (loading) return <div className="app-layout"><Sidebar /><div className="main-content"><Navbar title="Initialization" /><div className="page-content"><LoadingSpinner /></div></div></div>;

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <Navbar title="Submit Service Request" />
                <div className="page-content">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <button onClick={() => navigate('/user')} className="text-[12px] font-bold text-text-muted hover:text-blue flex items-center gap-2">
                                <span>←</span> Return to Dashboard
                            </button>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue" />
                                <span className="text-[10px] font-extrabold text-blue uppercase tracking-widest">New Case Token</span>
                            </div>
                        </div>

                        <div className="card">
                            <div className="border-b border-border pb-6 mb-8">
                                <h2 className="font-heading font-extrabold text-[22px] text-text tracking-tight mb-2">Initialize Support Request</h2>
                                <p className="text-[13.5px] text-text-muted font-medium">Provide comprehensive details for accurate AI routing and resource allocation.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Title */}
                                <div>
                                    <label className="form-label">Case Subject</label>
                                    <input 
                                        className="form-input" 
                                        placeholder="Enter a descriptive title for this request" 
                                        value={form.title}
                                        onChange={e => setForm({...form, title: e.target.value})}
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="form-label">Issue Specification</label>
                                    <div className="relative">
                                        <textarea 
                                            className="form-textarea !min-h-[160px]" 
                                            placeholder="Provide technical details, steps to reproduce, or requirements..."
                                            value={form.description}
                                            onChange={e => setForm({...form, description: e.target.value})}
                                            onBlur={handleBlurDescription}
                                            required
                                        />
                                        {checkingAI && (
                                            <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded-full border border-blue-mid shadow-sm">
                                                <div className="w-2 h-2 rounded-full bg-blue animate-ping" />
                                                <span className="text-[10px] font-extrabold text-blue uppercase tracking-wider">AI Analysis Active</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* AI INTERCEPT BANNER */}
                                {aiSuggestion && (
                                    <div className="ai-suggestion-box flex items-center justify-between animate-fadeIn">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-avatar bg-blue flex items-center justify-center shadow-lg shadow-blue/20">
                                                <div className="w-4 h-4 border-2 border-white rounded-full bg-indigo animate-pulse" />
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-extrabold text-blue uppercase tracking-[1.5px] mb-0.5">AI Optimization</div>
                                                <div className="text-[13.5px] text-text font-bold">Recommended Priority: <span className="text-blue uppercase tracking-tight">{aiSuggestion}</span></div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <button 
                                                type="button" 
                                                onClick={applyAiPriority} 
                                                className="btn-primary !px-6 !py-2 !text-[11px]"
                                            >
                                                Apply
                                            </button>
                                            <button type="button" onClick={() => setAiSuggestion(null)} className="text-text-muted hover:text-red text-xl font-light">×</button>
                                        </div>
                                    </div>
                                )}

                                {/* DUPLICATE INTERCEPT */}
                                {duplicates.length > 0 && (
                                    <div className="duplicate-warning-box">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-5 h-5 rounded-full bg-amber flex items-center justify-center text-white text-[10px] font-bold">!</div>
                                            <h4 className="text-[14px] font-bold text-amber tracking-tight">Record Duplication Detected</h4>
                                        </div>
                                        <p className="text-[13px] text-amber/80 font-medium mb-4">The following active cases share similar characteristics. Reviewing these may resolve your issue immediately.</p>
                                        <div className="space-y-2">
                                            {duplicates.map((d, i) => (
                                                <Link 
                                                    key={i} 
                                                    to={`/user/tickets/${d.id}`} 
                                                    target="_blank" 
                                                    className="flex items-center justify-between bg-white/60 p-3 rounded-btn border border-amber/20 hover:border-amber hover:bg-white transition-all group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-mono text-[11px] text-amber/50 font-bold">#{d.id}</span>
                                                        <span className="text-[13px] font-bold text-text group-hover:text-amber">{d.title}</span>
                                                    </div>
                                                    <span className="text-[11px] font-extrabold text-blue uppercase tracking-widest">Audit Record →</span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Classification Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="form-label">Classification</label>
                                        <select 
                                            className="form-select" 
                                            value={form.category_id}
                                            onChange={e => setForm({...form, category_id: e.target.value})}
                                            required
                                        >
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label">Service Priority</label>
                                        <select 
                                            className="form-select" 
                                            value={form.priority}
                                            onChange={e => setForm({...form, priority: e.target.value})}
                                        >
                                            <option value="low">Low - Routine inquiry</option>
                                            <option value="medium">Medium - Standard Request</option>
                                            <option value="high">High - Operational Impact</option>
                                            <option value="critical">Critical - Service Disruption</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="flex items-center justify-end gap-4 pt-8 border-t border-border">
                                    <button type="button" onClick={() => navigate('/user')} className="btn-secondary !px-8">
                                        Discard
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn-primary !px-12 !h-[48px] !text-[15px]" 
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Processing Dispatch...' : 'Validate and Submit'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
