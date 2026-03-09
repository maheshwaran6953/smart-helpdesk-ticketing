import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your credentials below.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const role = await login(email, password);
      if (role === 'admin') navigate('/admin');
      else if (role === 'agent') navigate('/agent');
      else navigate('/user');
    } catch (err) {
      setError(err.response?.data?.message || 'Access denied. Please verify your credentials.');
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
            <div className="w-8 h-8 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
          </div>
          
          <h2 className="font-heading font-extrabold text-[42px] leading-[1.1] text-white mb-6 tracking-tight">
            Enterprise Support <br />
            <span className="text-white/70">Redefined by AI</span>
          </h2>
          
          <p className="text-[17px] text-white/60 font-medium mb-12 leading-relaxed max-w-md mx-auto lg:mx-0">
            SmartDesk provides high-clarity operational oversight and predictive intelligence for modern service teams.
          </p>

          <div className="space-y-6">
            {[
              "Autonomous Ticket Routing Strategies",
              "Predictive SLA Compliance Monitoring",
              "Real-time Logic & Workflow Analytics"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <div className="w-6 h-6 rounded-full border-2 border-white/20 flex items-center justify-center group-hover:border-white/50 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                <span className="text-[15px] font-bold text-white/90 tracking-wide uppercase">{text}</span>
              </div>
            ))}
          </div>

          <div className="mt-16 pt-10 border-t border-white/10 inline-flex items-center gap-4">
             <div className="w-10 h-10 rounded-avatar bg-white/10 flex items-center justify-center font-heading font-black text-white text-[14px]">SD</div>
             <div className="text-left">
                <div className="text-[14px] font-extrabold text-white tracking-tight">SmartDesk Terminal</div>
                <div className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Version 2.4.0 — Stable</div>
             </div>
          </div>
        </div>
      </div>

      {/* Access Terminal (Right) */}
      <div className="auth-right">
        <div className="auth-form-wrapper">
          <div className="mb-10 text-center lg:text-left">
            <h1 className="font-heading font-extrabold text-[32px] text-text tracking-tight mb-2">Welcome Back</h1>
            <p className="text-[15px] text-text-muted font-medium">Authenticate to access your operational workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="form-label">System Identity (Email)</label>
              <div className="input-wrapper">
                <span className="input-icon-left text-text-disabled">
                   <div className="w-4 h-4 border-2 border-current rounded-sm" />
                </span>
                <input
                  type="email"
                  className="form-input input-with-icon-left"
                  placeholder="name@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
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
                  type={showPw ? 'text' : 'password'}
                  className="form-input input-with-icon-left pr-12"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
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

            {error && (
              <div className="p-4 bg-red-soft border border-red/10 rounded-btn text-red text-[13.5px] font-bold animate-fadeIn">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary !w-full !py-4 !text-[15px]"
              disabled={loading}
            >
              {loading ? 'Initializing Session...' : 'Authenticate Identity'}
            </button>
          </form>

          <div className="my-10 flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-border" />
            <span className="text-[11px] font-extrabold text-text-disabled uppercase tracking-widest">or</span>
            <div className="h-[1px] flex-1 bg-border" />
          </div>

          <p className="text-center text-[14px] text-text-muted mb-8">
            New operative?{' '}
            <Link to="/register" className="text-blue font-bold hover:underline">Request Access</Link>
          </p>

          <div className="p-6 bg-surface2 border border-border rounded-[18px]">
            <p className="text-[10px] font-black text-text-disabled uppercase tracking-[2px] mb-4">Baseline Access Keys</p>
            <div className="space-y-2">
              {[
                { label: 'Admin', email: 'maheshwaranpalanisamy1@gmail.com', pw: 'mahesh12345678@' },
                { label: 'Agent', email: 'agent1@helpdesk.com', pw: 'agent123' },
              ].map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => { setEmail(c.email); setPassword(c.pw); }}
                  className="w-full flex items-center justify-between p-3 bg-white border border-border rounded-btn hover:border-blue-mid transition-all group"
                >
                  <div className="text-left">
                    <div className="text-[12px] font-bold text-text group-hover:text-blue">{c.label} Control</div>
                    <div className="text-[11px] text-text-disabled font-medium">{c.email}</div>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-blue" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
