import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { RoleBadge } from '../../components/Badges';
import api from '../../api/axios';

const getInitials = (name = '') => name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
const avatarColors = ['#4F6AF5', '#6C63FF', '#10B981', '#F59E0B', '#8B5CF6'];
const getAvatarColor = (name = '') => avatarColors[name?.charCodeAt(0) % avatarColors.length];
const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/users')
      .then((r) => setUsers(r.data.users || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    admin: users.filter((u) => u.role === 'admin').length,
    agent: users.filter((u) => u.role === 'agent').length,
    user: users.filter((u) => u.role === 'user').length,
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Users" />
        <div className="page-content">
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
            {[
              { icon: '👑', label: 'Admins', count: counts.admin, color: '#8B5CF6', bg: '#F5F3FF' },
              { icon: '🔧', label: 'Agents', count: counts.agent, color: '#4F6AF5', bg: '#EFF6FF' },
              { icon: '👤', label: 'Users', count: counts.user, color: '#10B981', bg: '#ECFDF5' },
            ].map((s) => (
              <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.count}</div>
                  <div style={{ fontSize: 13, color: '#6B7280' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Search & Table */}
          <div className="card">
            <div style={{ marginBottom: 20 }}>
              <div className="input-wrapper" style={{ maxWidth: 360 }}>
                <span className="input-icon-left" style={{ top: '50%', transform: 'translateY(-50%)' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </span>
                <input className="form-input input-with-icon-left" placeholder="Search by name or email..."
                  value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>

            {loading ? <LoadingSpinner /> : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr><th>User</th><th>Email</th><th>Role</th><th>Joined</th></tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={4}><div className="empty-state"><div className="empty-state-icon">👥</div><p className="empty-state-title">No users found</p></div></td></tr>
                    ) : filtered.map((u) => (
                      <tr key={u.id} style={{ cursor: 'default' }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div className="avatar" style={{ background: getAvatarColor(u.name), width: 36, height: 36 }}>{getInitials(u.name)}</div>
                            <span style={{ fontWeight: 600, color: '#1A1D2E' }}>{u.name}</span>
                          </div>
                        </td>
                        <td style={{ color: '#6B7280', fontSize: 13 }}>{u.email}</td>
                        <td><RoleBadge role={u.role} /></td>
                        <td style={{ color: '#6B7280', fontSize: 13 }}>{formatDate(u.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
