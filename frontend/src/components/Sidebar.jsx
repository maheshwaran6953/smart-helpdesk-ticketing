import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const roleBadgeStyle = {
  admin: { background: '#5046E4', color: 'white' },
  agent: { background: '#3563E9', color: 'white' },
  user: { background: '#0A8F64', color: 'white' },
};

const adminLinks = [
  { label: 'Dashboard', to: '/admin' },
  { label: 'All Tickets', to: '/admin/tickets' },
  { label: 'Users', to: '/admin/users' },
  { label: 'Predictive AI', to: '/admin/predictive' },
];

const agentLinks = [
  { label: 'Dashboard', to: '/agent' },
  { label: 'My Tickets', to: '/agent/tickets' },
];

const userLinks = [
  { label: 'Dashboard', to: '/user' },
  { label: 'New Ticket', to: '/user/create-ticket' },
  { label: 'My Tickets', to: '/user/tickets' },
];

const linksByRole = {
  admin: adminLinks,
  agent: agentLinks,
  user: userLinks,
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const links = linksByRole[user.role] || userLinks;
  const badgeStyle = roleBadgeStyle[user.role] || roleBadgeStyle.user;

  const isActive = (to) => {
    if (to === '/admin' || to === '/agent' || to === '/user') {
      return location.pathname === to;
    }
    return location.pathname.startsWith(to);
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-white border-r-[1.5px] border-border shadow-sh1 flex flex-col z-50">
      {/* Brand */}
      <div className="p-6 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-blue to-indigo shadow-[0_3px_10px_rgba(53,99,233,0.3)] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-heading font-extrabold text-lg tracking-tighter">SD</span>
          </div>
          <div>
            <div className="font-heading font-bold text-[17px] text-text tracking-tight leading-tight">SmartDesk</div>
            <div className="text-[10px] font-extrabold text-text-disabled uppercase tracking-[1.2px] mt-0.5">Enterprise</div>
          </div>
        </div>
      </div>

      {/* User Chip */}
      <div className="mx-4 mb-8 px-3 py-3 bg-blue-soft border-[1.5px] border-blue-mid rounded-[11px] flex items-center gap-3">
        <div className="w-9 h-9 rounded-avatar bg-gradient-to-br from-blue to-indigo flex items-center justify-center text-white font-extrabold text-[13px] shadow-sm">
          {getInitials(user.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-text truncate leading-tight mb-1">{user.name}</div>
          <span className="inline-block px-2 py-0.5 rounded-[99px] text-[9.5px] font-bold uppercase tracking-wider text-white" style={badgeStyle}>
            {user.role}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-3 mb-4 text-[9px] font-extrabold text-text-disabled uppercase tracking-[1.5px]">
        Main Navigation
      </div>
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const active = isActive(link.to);
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/admin' || link.to === '/agent' || link.to === '/user'}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-btn transition-all duration-150 group ${
                active 
                  ? 'bg-blue-soft text-blue font-bold shadow-sm' 
                  : 'text-text-secondary font-medium hover:bg-surface2 hover:text-text'
              }`}
            >
              {/* Dot indicator instead of icon */}
              <div className={`w-[7px] h-[7px] rounded-full transition-colors ${
                active ? 'bg-blue' : 'bg-border2 group-hover:bg-text-muted'
              }`} />
              <span className="text-[13.5px]">{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 mt-auto border-t border-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-btn text-text-muted font-semibold text-[13.5px] transition-all hover:bg-red-soft hover:text-red group"
        >
          <div className="w-[7px] h-[7px] rounded-full bg-border2 group-hover:bg-red" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
