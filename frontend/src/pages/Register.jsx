import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError('All fields are required to initialize your account.');
      return;
    }
    if (form.password.length < 6) {
      setError('Security keys must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', form);
      setSuccess('Operational identity created. Redirecting to access terminal...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Identity creation failure.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Visual Workspace (Left) */}
      <div className="auth-left">
        <div className="relative z-10 max-w-lg text-center lg:text-left">
          <div className="mb-10 inline-flex items-center justify-center w-20 h-20 rounded-[22px] bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
            <div className="w-8 h-8 rounded-full border-4 border-white opacity-40" />
          </div>
          
          <h2 className="font-heading font-extrabold text-[42px] leading-[1.1] text-white mb-6 tracking-tight">
            Join the Next <br />
            <span className="text-white/70">Support Frontier</span>
          </h2>
          
          <p className="text-[17px] text-white/60 font-medium mb-12 leading-relaxed max-w-md mx-auto lg:mx-0">
             Create your SmartDesk operative account and start managing service requests with AI-driven precision.
          </p>

          <div className="space-y-6">
            {[
              "Collaborative Case Manifests",
              "Automated Logic Routing",
              "Unified Service Audit Trails"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <div className="w-6 h-6 rounded-full border-2 border-white/20 flex items-center justify-center group-hover:border-white/50 transition-colors">
                  <div className="w-1 h-1 rounded-full bg-white" />
                </div>
                <span className="text-[15px] font-bold text-white/90 tracking-wide uppercase">{text}</span>
              </div>
            ))}
          </div>

          <div className="mt-16 pt-10 border-t border-white/10 inline-flex items-center gap-4">
             <div className="w-10 h-10 rounded-avatar bg-white/10 flex items-center justify-center font-heading font-black text-white text-[14px]">SD</div>
             <div className="text-left">
                <div className="text-[14px] font-extrabold text-white tracking-tight">SmartDesk Terminal</div>
                <div className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Enterprise Access Node</div>
             </div>
          </div>
        </div>
      </div>

      {/* Access Terminal (Right) */}
      <div className="auth-right">
        <div className="auth-form-wrapper">
          <div className="mb-10 text-center lg:text-left">
            <h1 className="font-heading font-extrabold text-[32px] text-text tracking-tight mb-2">Create Identity</h1>
            <p className="text-[15px] text-text-muted font-medium">Register as a new operative in the terminal.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="form-label">Full Legal Name</label>
              <div className="input-wrapper">
                <span className="input-icon-left text-text-disabled">
                   <div className="w-4 h-4 rounded-full border-2 border-current" />
                </span>
                <input
                  name="name"
                  type="text"
                  className="form-input input-with-icon-left"
                  placeholder="Operative Name"
                  value={form.name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="form-label">System Identity (Email)</label>
              <div className="input-wrapper">
                <span className="input-icon-left text-text-disabled">
                   <div className="w-3.5 h-3.5 border-2 border-current rounded-sm" />
                </span>
                <input
                  name="email"
                  type="email"
                  className="form-input input-with-icon-left"
                  placeholder="name@organization.com"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="form-label">Security Key (Password)</label>
              <div className="input-wrapper">
                <span className="input-icon-left text-text-disabled">
                   <div className="w-4 h-2 border-2 border-current rounded-full" />
                </span>
                <input
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  className="form-input input-with-icon-left pr-12"
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPw((p) => !p)}
                >
                  <span className="text-[10px] font-bold uppercase tracking-tighter">{showPw ? 'Hide' : 'Show'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="form-label">Operative Role</label>
              <select 
                name="role" 
                className="form-select" 
                value={form.role} 
                onChange={handleChange}
              >
                <option value="user">User — Service Requester</option>
                <option value="agent">Agent — Strategic Resolver</option>
              </select>
            </div>

            {error && (
              <div className="p-4 bg-red-soft border border-red/10 rounded-btn text-red text-[13.5px] font-bold animate-fadeIn">
                {error}
              </div>
            )}
            {success && (
              <div className="p-4 bg-green-soft border border-green/10 rounded-btn text-green text-[13.5px] font-bold animate-fadeIn">
                {success}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary !w-full !py-4 !text-[15px]"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Initalize Identity'}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-border" />
            <span className="text-[11px] font-extrabold text-text-disabled uppercase tracking-widest">or</span>
            <div className="h-[1px] flex-1 bg-border" />
          </div>

          <p className="text-center text-[14px] text-text-muted">
            Existing operative?{' '}
            <Link to="/login" className="text-blue font-bold hover:underline">Access Terminal</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
